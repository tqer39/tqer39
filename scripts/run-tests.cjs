const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const directory = path.join(root, "tests");
const tests = fs
  .readdirSync(directory, { withFileTypes: true })
  .filter((entry) => entry.isFile() && /\.(cjs|sh)$/.test(entry.name))
  .map((entry) => entry.name)
  .sort();

if (tests.length === 0) {
  console.error("No regression tests found.");
  process.exit(1);
}

for (const test of tests) {
  console.log(`Running ${test}`);
  const command = test.endsWith(".cjs") ? process.execPath : "bash";
  const result = spawnSync(command, [path.join(directory, test)], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.error || result.signal || result.status !== 0) {
    console.error(`Failed: ${test}`, result.error || result.signal || result.status);
    process.exit(result.status || 1);
  }
}
