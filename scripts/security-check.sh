#!/usr/bin/env bash
set -euo pipefail

FORBIDDEN_PATTERNS=(
  'dangerouslySetInnerHTML'
  'innerHTML'
  'outerHTML'
  'insertAdjacentHTML'
  'document\.write'
  'eval\('
  'new Function'
  'setTimeout\("'
  'setInterval\("'
  'http://'
  'window\.open'
)

EXIT_CODE=0
for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
  if grep -rnE --include='*.ts' --include='*.tsx' "$pattern" src/; then
    echo "SECURITY: Forbidden pattern found: $pattern"
    EXIT_CODE=1
  fi
done

exit "$EXIT_CODE"
