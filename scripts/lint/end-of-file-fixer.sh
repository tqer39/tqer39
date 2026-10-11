#!/usr/bin/env bash
# Append a trailing newline if the file does not already end with one. Modifies in place.
set -euo pipefail

# shellcheck source=scripts/lint/text-file.sh
source "$(dirname "${BASH_SOURCE[0]}")/text-file.sh"

for f in "$@"; do
  is_text_file "$f" || continue
  if [[ -n "$(tail -c 1 "$f")" ]]; then
    printf '\n' >>"$f"
  fi
done
