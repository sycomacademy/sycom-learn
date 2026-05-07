#!/usr/bin/env bash
#
# Post-migration sanity checks. Asserts row counts + a few content invariants
# against $NEW_URL. Exits non-zero if any expectation fails.
#
# Usage:
#   NEW_URL=postgres://... scripts/smoke-migration.sh

set -euo pipefail
: "${NEW_URL:?set NEW_URL}"

fail=0
# Expected row counts after migrating sycom-lms (snapshot taken 2026-05-07).
# If the source data shifts between snapshot and migration, update these.
while read -r t expected; do
  [[ -n "$t" ]] || continue
  schema="${t%%.*}"
  name="${t#*.}"
  actual=$(psql "$NEW_URL" -tA -c "SELECT COUNT(*) FROM ${schema}.\"${name}\"")
  if [[ "$actual" == "$expected" ]]; then
    printf '  ✓ %-26s %5s rows\n' "$t" "$actual"
  else
    printf '  ✗ %-26s expected %s, got %s\n' "$t" "$expected" "$actual" >&2
    fail=1
  fi
done <<'EOF'
auth.user 119
auth.account 119
auth.member 119
auth.cohort_member 119
public.profile 119
public.course 3
public.section 8
public.lesson 58
public.enrollment 112
public.lesson_progress 1201
public.category 12
EOF

# Invariants beyond row counts
echo
echo "==> invariants:"

check() {
  local label="$1"; shift
  local expected="$1"; shift
  local sql="$1"; shift
  local got
  got=$(psql "$NEW_URL" -tA -c "$sql")
  if [[ "$got" == "$expected" ]]; then
    printf '  ✓ %s\n' "$label"
  else
    printf '  ✗ %s: expected %s, got %s\n' "$label" "$expected" "$got" >&2
    fail=1
  fi
}

check "every user has exactly one profile" 0 \
  "SELECT COUNT(*) FROM auth.\"user\" u LEFT JOIN public.profile p ON p.user_id = u.id WHERE p.user_id IS NULL"

check "every member belongs to the migrated org" 0 \
  "SELECT COUNT(*) FROM auth.member WHERE organization_id <> 'org_lms_migration'"

check "every course belongs to the migrated org" 0 \
  "SELECT COUNT(*) FROM public.course WHERE organization_id <> 'org_lms_migration'"

check "every account has a non-null password (email-provider rows)" 0 \
  "SELECT COUNT(*) FROM auth.account WHERE provider_id = 'credential' AND password IS NULL"

check "no orphaned enrolments (course gone)" 0 \
  "SELECT COUNT(*) FROM public.enrollment e LEFT JOIN public.course c ON c.id = e.course_id WHERE c.id IS NULL"

check "no orphaned enrolments (user gone)" 0 \
  "SELECT COUNT(*) FROM public.enrollment e LEFT JOIN auth.\"user\" u ON u.id = e.user_id WHERE u.id IS NULL"

check "no orphaned lesson_progress" 0 \
  "SELECT COUNT(*) FROM public.lesson_progress lp LEFT JOIN public.enrollment e ON e.id = lp.enrollment_id WHERE e.id IS NULL"

if [[ $fail -ne 0 ]]; then
  echo
  echo "FAILED — see ✗ above" >&2
  exit 1
fi

echo
echo "All checks passed."
