const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const repo = path.resolve(__dirname, "..");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "mise-tasks-test-"));
const mise = spawnSync("sh", ["-c", "command -v mise"], { encoding: "utf8" }).stdout.trim();
assert.ok(mise, "mise must be installed");

try {
  // Exercise the real task definitions without installing tools or changing the host.
  const config = fs.readFileSync(path.join(repo, "mise.toml"), "utf8");
  fs.writeFileSync(path.join(temp, "mise.toml"), config.slice(config.indexOf("[tasks.help]")));
  fs.writeFileSync(path.join(temp, "global.toml"), "");
  fs.mkdirSync(path.join(temp, "scripts"));
  const shellHome = path.join(temp, "shell-home");
  fs.mkdirSync(shellHome);
  const linuxbrew = path.join(temp, "linuxbrew", "bin", "brew");
  fs.mkdirSync(path.dirname(linuxbrew), { recursive: true });
  fs.writeFileSync(linuxbrew, "#!/bin/sh\necho fake-brew\n", { mode: 0o755 });
  const installScript = fs
    .readFileSync(path.join(repo, "scripts/install-brew.sh"), "utf8")
    .replaceAll("$HOME", "$TEST_SHELL_HOME")
    .replaceAll("/home/linuxbrew/.linuxbrew/bin/brew", linuxbrew)
    .replaceAll("/opt/homebrew/bin/brew", path.join(temp, "absent-mac-brew"))
    .replaceAll("/usr/local/bin/brew", path.join(temp, "absent-intel-brew"));
  fs.writeFileSync(path.join(temp, "scripts/install-brew.sh"), installScript);
  const bin = path.join(temp, "bin");
  fs.mkdirSync(bin);
  const log = path.join(temp, "commands.log");
  const stub = (name, script) =>
    fs.writeFileSync(path.join(bin, name), `#!/bin/sh\n${script}\n`, { mode: 0o755 });
  stub("uname", 'echo "${TEST_OS:-Linux}"');
  stub(
    "brew",
    'printf "brew" >> "$TEST_LOG"; printf " <%s>" "$@" >> "$TEST_LOG"; echo >> "$TEST_LOG"; exit "${TEST_FAIL:-0}"',
  );
  stub(
    "lefthook",
    'printf "lefthook" >> "$TEST_LOG"; printf " <%s>" "$@" >> "$TEST_LOG"; echo >> "$TEST_LOG"; exit "${TEST_FAIL:-0}"',
  );
  stub(
    "pnpm",
    'printf "pnpm" >> "$TEST_LOG"; printf " <%s>" "$@" >> "$TEST_LOG"; echo >> "$TEST_LOG"; exit "${TEST_FAIL:-0}"',
  );
  stub(
    "mise",
    'if [ "$1" = install ]; then echo "mise install" >> "$TEST_LOG"; exit "${TEST_FAIL:-0}"; fi\nexec "$TEST_MISE" "$@"',
  );
  const run = (task, args = [], extra = {}) => {
    fs.writeFileSync(log, "");
    return spawnSync(mise, ["run", task, ...args], {
      cwd: temp,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        MISE_GLOBAL_CONFIG_FILE: path.join(temp, "global.toml"),
        MISE_TRUSTED_CONFIG_PATHS: temp,
        MISE_TASK_CACHE: "off",
        TEST_LOG: log,
        TEST_MISE: mise,
        TEST_SHELL_HOME: shellHome,
        TEST_FAIL: "0",
        ...extra,
      },
    });
  };
  const commands = () => fs.readFileSync(log, "utf8").trim().split("\n").filter(Boolean);
  const success = (result) => assert.equal(result.status, 0, result.stdout + result.stderr);

  for (const platform of ["Darwin", "Linux"]) {
    success(run("bootstrap", [], { TEST_OS: platform }));
    assert.deepEqual(commands(), ["brew <bundle> <install>"]);
  }
  assert.notEqual(run("bootstrap", [], { TEST_OS: "Unsupported" }).status, 0);
  assert.deepEqual(commands(), [], "Unsupported OS must stop before Homebrew runs");
  const failedBootstrap = run("bootstrap", [], { TEST_FAIL: "7" });
  assert.notEqual(failedBootstrap.status, 0);
  assert.ok(!failedBootstrap.stdout.includes("Bootstrap complete"));

  success(run("setup"));
  assert.deepEqual(commands(), [
    "mise install",
    "pnpm <install> <--frozen-lockfile>",
    "pnpm <run> <rules:generate>",
    "lefthook <install>",
  ]);
  assert.notEqual(run("setup", [], { TEST_FAIL: "7" }).status, 0);
  assert.deepEqual(commands(), ["mise install"], "Setup must stop at the first failure");

  success(run("lint"));
  assert.deepEqual(commands(), ["pnpm <run> <lint>"]);
  assert.notEqual(run("lint", [], { TEST_FAIL: "7" }).status, 0);
  success(run("test"));
  assert.deepEqual(commands(), ["pnpm <test>"]);
  assert.notEqual(run("test", [], { TEST_FAIL: "7" }).status, 0);
  success(run("check"));
  assert.deepEqual(commands(), ["pnpm <run> <check>"]);
  assert.notEqual(run("check", [], { TEST_FAIL: "7" }).status, 0);
  assert.notEqual(run("lint-hook").status, 0);
  assert.deepEqual(commands(), []);
  const hook = "markdownlint; touch injected";
  success(run("lint-hook", [hook]));
  assert.deepEqual(commands(), [`lefthook <run> <pre-commit> <--command> <${hook}> <--all-files>`]);
  assert.ok(
    !fs.existsSync(path.join(temp, "injected")),
    "Arguments must not execute as shell code",
  );

  success(run("fix"));
  assert.equal(commands().length, 4);
  assert.notEqual(run("fix", [], { TEST_FAIL: "7" }).status, 0);
  assert.equal(commands().length, 1, "Fix must stop at the first failed command");
  success(run("format"));
  assert.deepEqual(commands(), ["pnpm <run> <format>"]);
  success(run("rules"));
  assert.deepEqual(commands(), ["pnpm <run> <rules:generate>"]);
  success(run("rules-check"));
  assert.deepEqual(commands(), ["pnpm <run> <rules:check>"]);

  // An existing Linuxbrew outside PATH must configure shells without reinstalling.
  const profiles = [".zshrc", ".bashrc"].map((name) => path.join(shellHome, name));
  for (const profile of profiles) fs.writeFileSync(profile, "# existing config\n");
  fs.renameSync(path.join(bin, "brew"), path.join(bin, "brew-disabled"));
  const shellEnv = `eval "$(${linuxbrew} shellenv)"`;
  for (let attempt = 0; attempt < 2; attempt++) {
    success(run("install-brew", [], { TEST_OS: "Linux", PATH: `${bin}:/usr/bin:/bin` }));
    for (const profile of profiles) {
      assert.equal(fs.readFileSync(profile, "utf8"), `# existing config\n${shellEnv}\n`);
    }
  }
  success(run("help"));
  console.log("Mise task regression tests passed.");
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
