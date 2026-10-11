#!/usr/bin/env bash
set -euo pipefail

if [ "${LINT_RESULT:-}" != "success" ]; then
  echo "Lint did not succeed: ${LINT_RESULT:-missing}"
  exit 1
fi
