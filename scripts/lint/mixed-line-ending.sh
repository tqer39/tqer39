#!/usr/bin/env bash
# Normalize line endings to LF. --fix=lf is required.
set -euo pipefail

# shellcheck source=scripts/lint/text-file.sh
source "$(dirname "${BASH_SOURCE[0]}")/text-file.sh"

mode=""
files=()
for arg in "$@"; do
  case "$arg" in
    --fix=*) mode="${arg#--fix=}" ;;
    *) files+=("$arg") ;;
  esac
done

if [[ "$mode" != "lf" ]]; then
  echo "mixed-line-ending.sh: only --fix=lf is supported" >&2
  exit 2
fi

for f in "${files[@]}"; do
  is_text_file "$f" || continue
  if grep -q $'\r' "$f"; then
    rewrite_text_file "$f" tr -d '\r'
  fi
done
