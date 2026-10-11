const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const repo = path.resolve(__dirname, "..");
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "test-runner-"));
const env = { ...process.env };
const variables = spawnSync("git", ["rev-parse", "--local-env-vars"], { encoding: "utf8" });
assert.equal(variables.status, 0, variables.stderr);
for (const name of variables.stdout.trim().split("\n")) delete env[name];
delete env.LEFTHOOK_EXCLUDE;

try {
  fs.mkdirSync(path.join(fixture, "scripts"));
  const tests = path.join(fixture, "tests");
  fs.mkdirSync(tests);
  fs.copyFileSync(
    path.join(repo, "scripts/run-tests.cjs"),
    path.join(fixture, "scripts/run-tests.cjs"),
  );
  const run = (command, args, extra = {}) =>
    spawnSync(command, args, {
      cwd: fixture,
      encoding: "utf8",
      env: { ...env, ...extra },
    });
  const runner = () => run(process.execPath, ["scripts/run-tests.cjs"]);
  assert.equal(runner().status, 1, "An empty suite must fail");

  const log = path.join(fixture, "executed");
  fs.writeFileSync(
    path.join(tests, "a.cjs"),
    'require("node:fs").appendFileSync("executed", "node\\n");\n',
  );
  fs.writeFileSync(path.join(tests, "b.sh"), 'printf "bash\\n" >> executed\n');
  fs.writeFileSync(path.join(tests, "ignored.txt"), "invalid script\n");
  fs.mkdirSync(path.join(tests, "directory.cjs"));
  assert.equal(runner().status, 0);
  assert.equal(fs.readFileSync(log, "utf8"), "node\nbash\n");

  // New test files are picked up without editing the runner or hooks.
  fs.writeFileSync(
    path.join(tests, "c.cjs"),
    'require("node:fs").appendFileSync("executed", "new\\n");\n',
  );
  fs.writeFileSync(log, "");
  assert.equal(runner().status, 0);
  assert.equal(fs.readFileSync(log, "utf8"), "node\nbash\nnew\n");

  fs.writeFileSync(path.join(tests, "a.cjs"), "process.exit(7);\n");
  fs.writeFileSync(log, "");
  assert.equal(runner().status, 7);
  assert.equal(fs.readFileSync(log, "utf8"), "", "Stop before subsequent tests after a failure");
  fs.writeFileSync(path.join(tests, "a.cjs"), 'process.kill(process.pid, "SIGTERM");\n');
  assert.equal(runner().status, 1, "A terminated test must fail the runner");

  // The actual Git hook delegates to the same suite, and lint can exclude it.
  fs.writeFileSync(path.join(tests, "a.cjs"), "process.exit(0);\n");
  const config = fs.readFileSync(path.join(repo, "lefthook.yml"), "utf8");
  const command = config.match(/    regression-tests:\n(?:      .*\n)+/)[0];
  fs.writeFileSync(path.join(fixture, "lefthook.yml"), `pre-commit:\n  commands:\n${command}`);
  fs.writeFileSync(
    path.join(fixture, "package.json"),
    JSON.stringify({
      private: true,
      scripts: { test: "node scripts/run-tests.cjs" },
    }),
  );
  assert.equal(run("git", ["init"]).status, 0);
  assert.equal(run("git", ["add", "."]).status, 0);
  const hook = ["run", "pre-commit", "--all-files", "--no-auto-install"];
  fs.writeFileSync(log, "");
  const hooked = run("lefthook", hook);
  assert.equal(hooked.status, 0, hooked.stdout + hooked.stderr);
  assert.equal(fs.readFileSync(log, "utf8"), "bash\nnew\n");
  fs.writeFileSync(log, "");
  assert.equal(run("lefthook", hook, { LEFTHOOK_EXCLUDE: "tests" }).status, 0);
  assert.equal(fs.readFileSync(log, "utf8"), "");
  fs.writeFileSync(path.join(tests, "a.cjs"), "process.exit(7);\n");
  assert.notEqual(run("lefthook", hook).status, 0, "The hook must propagate test failures");
  console.log("Test runner regression tests passed.");
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}
