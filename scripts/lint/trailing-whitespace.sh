#!/usr/bin/env bash
# Remove trailing whitespace from text files. Modifies in place.
set -euo pipefail

# shellcheck source=scripts/lint/text-file.sh
source "$(dirname "${BASH_SOURCE[0]}")/text-file.sh"

for f in "$@"; do
  rewrite_text_file "$f" sed -E 's/[[:space:]]+$//'
done
