const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const repository = path.resolve(__dirname, "..");
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "tooling-test-"));

function run(tool, ...args) {
  return spawnSync(path.join(repository, "node_modules/.bin", tool), args, {
    cwd: fixture,
    encoding: "utf8",
  });
}

function succeeds(result) {
  assert.equal(result.status, 0, result.stdout + result.stderr);
}

function fails(result) {
  assert.equal(result.status, 1, result.stdout + result.stderr);
}

try {
  fs.cpSync(path.join(repository, ".rulesync"), path.join(fixture, ".rulesync"), {
    recursive: true,
  });
  for (const file of ["rulesync.jsonc", ".oxlintrc.json", ".oxfmtrc.json"]) {
    fs.copyFileSync(path.join(repository, file), path.join(fixture, file));
  }

  // Generation must produce instructions for all four configured consumers.
  succeeds(run("rulesync", "generate"));
  const outputs = ["CLAUDE.md", "AGENTS.md", ".github/copilot-instructions.md"];
  const source = fs.readFileSync(path.join(fixture, ".rulesync/rules/overview.md"), "utf8");
  const body = source.replace(/^---\n[\s\S]*?\n---\n\n/, "");
  for (const file of outputs) {
    assert.equal(fs.readFileSync(path.join(fixture, file), "utf8"), body);
  }
  succeeds(run("rulesync", "generate", "--check"));

  // A changed or missing generated file must fail without repairing it.
  for (const file of outputs) {
    const output = path.join(fixture, file);
    fs.appendFileSync(output, "\nUnwanted instruction.\n");
    fails(run("rulesync", "generate", "--check"));
    assert.ok(fs.readFileSync(output, "utf8").includes("Unwanted instruction."));
    succeeds(run("rulesync", "generate"));
    fs.unlinkSync(output);
    fails(run("rulesync", "generate", "--check"));
    assert.equal(fs.existsSync(output), false);
    succeeds(run("rulesync", "generate"));
  }

  const code = path.join(fixture, "example.cjs");
  fs.writeFileSync(code, "const unused = 1;\n");
  fails(run("oxlint", "--deny-warnings", "example.cjs"));
  fs.writeFileSync(code, 'console.log("valid");\n');
  succeeds(run("oxlint", "--deny-warnings", "example.cjs"));

  const json = path.join(fixture, "example.json");
  const unformatted = '{"hello":   "world"}\n';
  fs.writeFileSync(json, unformatted);
  fails(run("oxfmt", "--check", "example.json"));
  assert.equal(fs.readFileSync(json, "utf8"), unformatted);
  succeeds(run("oxfmt", "--write", "example.json"));
  succeeds(run("oxfmt", "--check", "example.json"));
  assert.deepEqual(JSON.parse(fs.readFileSync(json, "utf8")), { hello: "world" });
  console.log("Tooling regression tests passed.");
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}
