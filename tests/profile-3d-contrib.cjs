const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const script = path.resolve(__dirname, "../scripts/update-profile-3d-contrib.sh");
const root = fs.mkdtempSync(path.join(os.tmpdir(), "profile-3d-test-"));
const remote = path.join(root, "remote.git");
const work = path.join(root, "work");
const peer = path.join(root, "peer");

function git(cwd, ...args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function update(expected = 0) {
  const result = spawnSync("bash", [script], { cwd: work, encoding: "utf8" });
  if (expected === 0) assert.equal(result.status, 0, result.stderr);
  else assert.notEqual(result.status, 0, "Conflicting updates must fail.");
}

try {
  git(root, "init", "--bare", "--initial-branch=main", remote);
  git(root, "clone", remote, work);
  git(work, "config", "user.name", "Test");
  git(work, "config", "user.email", "test@example.com");
  fs.mkdirSync(path.join(work, "profile-3d-contrib"));
  fs.writeFileSync(path.join(work, "profile-3d-contrib/image.svg"), "original\n");
  fs.writeFileSync(path.join(work, "other.txt"), "original\n");
  git(work, "add", ".");
  git(work, "commit", "-m", "initial");
  git(work, "push", "origin", "main");
  const initial = git(work, "rev-parse", "HEAD");

  // Unchanged images must not create a commit.
  update();
  assert.equal(git(remote, "rev-parse", "main"), initial);

  // Only SVGs are committed, including newly generated files.
  fs.writeFileSync(path.join(work, "profile-3d-contrib/image.svg"), "updated\n");
  fs.writeFileSync(path.join(work, "profile-3d-contrib/new.svg"), "new\n");
  fs.writeFileSync(path.join(work, "other.txt"), "unrelated local change\n");
  git(work, "add", "other.txt");
  update();
  assert.equal(git(remote, "show", "main:profile-3d-contrib/image.svg"), "updated");
  assert.equal(git(remote, "show", "main:profile-3d-contrib/new.svg"), "new");
  assert.equal(git(remote, "show", "main:other.txt"), "original");
  assert.equal(fs.readFileSync(path.join(work, "other.txt"), "utf8"), "unrelated local change\n");
  git(work, "restore", "--staged", "other.txt");
  git(work, "restore", "other.txt");

  // Preserve a concurrent main update when pushing generated images.
  git(root, "clone", remote, peer);
  git(peer, "config", "user.name", "Test");
  git(peer, "config", "user.email", "test@example.com");
  fs.writeFileSync(path.join(peer, "other.txt"), "concurrent\n");
  git(peer, "add", "other.txt");
  git(peer, "commit", "-m", "concurrent main update");
  git(peer, "push", "origin", "main");
  const concurrent = git(peer, "rev-parse", "HEAD");
  fs.writeFileSync(path.join(work, "profile-3d-contrib/image.svg"), "second update\n");
  update();
  git(remote, "merge-base", "--is-ancestor", concurrent, "main");
  assert.equal(git(remote, "show", "main:other.txt"), "concurrent");

  // A conflicting image update must fail without overwriting remote main.
  git(peer, "pull", "--ff-only");
  fs.writeFileSync(path.join(peer, "profile-3d-contrib/image.svg"), "remote conflict\n");
  git(peer, "add", ".");
  git(peer, "commit", "-m", "remote image update");
  git(peer, "push", "origin", "main");
  const conflict = git(peer, "rev-parse", "HEAD");
  fs.writeFileSync(path.join(work, "profile-3d-contrib/image.svg"), "local conflict\n");
  update(1);
  assert.equal(git(remote, "rev-parse", "main"), conflict);
  console.log("3D contribution push tests passed.");
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
