const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const scripts = path.resolve(__dirname, "../scripts/lint");
const root = fs.mkdtempSync(path.join(os.tmpdir(), "lint-fixes-test-"));
const temporary = path.join(root, "temporary");
fs.mkdirSync(temporary);

function run(name, files, extra = {}) {
  const args = name === "mixed-line-ending" ? ["--fix=lf", ...files] : files;
  return spawnSync("bash", [path.join(scripts, `${name}.sh`), ...args], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, TMPDIR: temporary, ...extra },
  });
}

try {
  for (const [name, before, after] of [
    ["trailing-whitespace", "hello \t\nworld\t", "hello\nworld"],
    ["mixed-line-ending", "hello\r\nworld\r\n", "hello\nworld\n"],
    ["end-of-file-fixer", "hello", "hello\n"],
    ["end-of-file-fixer", "hello\n", "hello\n"],
  ]) {
    const file = path.join(root, "space in name.txt");
    fs.writeFileSync(file, before, { mode: 0o755 });
    const sentinel = `${file}.tmp`;
    fs.writeFileSync(sentinel, "keep me\n");
    const empty = path.join(root, "empty");
    const binary = path.join(root, "binary");
    fs.writeFileSync(empty, "");
    const bytes = Buffer.from([0, 13, 10, 32]);
    fs.writeFileSync(binary, bytes);
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = run(name, [file, empty, binary, path.join(root, "missing"), root]);
      assert.equal(result.status, 0, result.stderr);
      assert.equal(fs.readFileSync(file, "utf8"), after);
      assert.equal(fs.statSync(file).mode & 0o777, 0o755);
      assert.equal(fs.readFileSync(sentinel, "utf8"), "keep me\n");
      assert.equal(fs.readFileSync(empty, "utf8"), "");
      assert.deepEqual(fs.readFileSync(binary), bytes);
      assert.deepEqual(fs.readdirSync(temporary), []);
    }
  }

  const target = path.join(root, "target");
  const link = path.join(root, "link");
  fs.writeFileSync(target, "hello \n");
  fs.symlinkSync(target, link);
  assert.equal(run("trailing-whitespace", [link]).status, 0);
  assert.ok(fs.lstatSync(link).isSymbolicLink());
  assert.equal(fs.readFileSync(target, "utf8"), "hello\n");

  // Simulate a converter that emits partial output before failing.
  const bin = path.join(root, "bin");
  fs.mkdirSync(bin);
  for (const tool of ["sed", "tr"]) {
    fs.writeFileSync(path.join(bin, tool), '#!/bin/sh\nprintf "partial"\nexit 7\n', {
      mode: 0o755,
    });
  }
  for (const name of ["trailing-whitespace", "mixed-line-ending"]) {
    fs.writeFileSync(target, "original \r\n");
    const result = run(name, [target], { PATH: `${bin}:${process.env.PATH}` });
    assert.equal(result.status, 7, result.stderr);
    assert.equal(fs.readFileSync(target, "utf8"), "original \r\n");
    assert.deepEqual(fs.readdirSync(temporary), []);
  }
  fs.writeFileSync(path.join(bin, "sed"), '#!/bin/sh\nprintf "partial"\nkill -TERM "$PPID"\n', {
    mode: 0o755,
  });
  fs.writeFileSync(target, "original \n");
  assert.equal(
    run("trailing-whitespace", [target], { PATH: `${bin}:${process.env.PATH}` }).status,
    143,
  );
  assert.equal(fs.readFileSync(target, "utf8"), "original \n");
  assert.deepEqual(fs.readdirSync(temporary), []);

  const invalid = spawnSync("bash", [path.join(scripts, "mixed-line-ending.sh"), target]);
  assert.equal(invalid.status, 2);
  console.log("Lint file fix regression tests passed.");
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
