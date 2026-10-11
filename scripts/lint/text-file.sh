#!/usr/bin/env bash
# Shared text-file selection and safe temporary output for lint fixes.

is_text_file() {
  [[ -f "$1" ]] && grep -Iq . "$1"
}

rewrite_text_file() (
  set -euo pipefail
  local file="$1" temporary
  shift
  is_text_file "$file" || exit 0
  temporary=$(mktemp "${TMPDIR:-/tmp}/lint-rewrite.XXXXXX")
  trap 'rm -f -- "$temporary"' EXIT
  trap 'exit 129' HUP
  trap 'exit 130' INT
  trap 'exit 143' TERM
  # Finish conversion before opening the original file for writing.
  "$@" <"$file" >"$temporary"
  if ! cmp -s -- "$file" "$temporary"; then
    # Write through symlinks and retain the original inode and permissions.
    cat "$temporary" >"$file"
  fi
)
