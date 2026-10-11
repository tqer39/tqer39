#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
check_script="$repo_root/scripts/check-workflow-result.sh"

LINT_RESULT=success bash "$check_script"

for result in failure cancelled skipped ""; do
  if LINT_RESULT="$result" bash "$check_script"; then
    echo "Expected workflow result to fail for: $result" >&2
    exit 1
  fi
done

if (unset LINT_RESULT; bash "$check_script"); then
  echo "Expected workflow result to fail for a missing result" >&2
  exit 1
fi

echo "Workflow result tests passed."
