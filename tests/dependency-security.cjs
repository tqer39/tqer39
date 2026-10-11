// cspell:ignore vsprintf
const assert = require("node:assert/strict");
const { createRequire } = require("node:module");

// Follow the real dependency chains used by the linters.
function dependency(chain) {
  let resolveFrom = createRequire(__filename);
  for (const name of chain) {
    const entry = resolveFrom.resolve(name);
    resolveFrom = createRequire(entry);
  }
  return resolveFrom(chain[chain.length - 1]);
}

const { sprintf, vsprintf } = dependency([
  "textlint-rule-preset-ja-technical-writing",
  "textlint-rule-ja-no-abusage",
  "textlint-rule-prh",
  "prh",
  "js-yaml",
  "argparse",
  "sprintf-js",
]);
{
  assert.equal(sprintf("%.2f", 1.25), "1.25");
  assert.equal(vsprintf("%s: %d", ["count", 3]), "count: 3");
  for (const type of ["e", "f", "g"]) {
    for (const precision of ["101", "999999999999999999999999999999999999"]) {
      const result = sprintf(`%.${precision}${type}`, 1.25);
      assert.equal(result, sprintf(`%.100${type}`, 1.25));
    }
  }
  assert.equal(sprintf("%.0g", 1.25), "1");
}

const braces = dependency(["markdownlint-cli2", "micromatch", "braces"]);
{
  assert.deepEqual(braces.expand("file.{js,{ts,tsx}}"), ["file.js", "file.ts", "file.tsx"]);
  for (const [open, close] of [["{", "}"], ["(", ")"]]) {
    const pattern = open.repeat(4000) + "a,b" + close.repeat(4000);
    assert.throws(() => braces(pattern), {
      name: "SyntaxError",
      message: "Pattern nesting exceeds the maximum depth of 64",
    });
  }
  assert.doesNotThrow(() => braces("{".repeat(64) + "a,b" + "}".repeat(64)));
}

console.log("Dependency security regression tests passed.");
