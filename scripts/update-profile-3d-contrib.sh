#!/usr/bin/env bash
set -euo pipefail

git add -- 'profile-3d-contrib/*.svg'
if git diff --cached --quiet -- 'profile-3d-contrib/*.svg'; then
  echo "No 3D contribution changes."
  exit 0
fi

git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
git commit -m 'chore: update profile-3d-contrib' -- 'profile-3d-contrib/*.svg'

# Preserve commits pushed to main while the images were being generated.
# cspell:ignore autostash
git fetch origin main
git rebase --autostash origin/main
git push origin HEAD:main
