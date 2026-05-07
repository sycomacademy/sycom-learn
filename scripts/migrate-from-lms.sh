#!/usr/bin/env bash
#
# One-shot migration: sycom-lms (old prod) -> sycom (new prod, dev branch).
#
# Reads from $LMS_URL, writes to $NEW_URL. Both are full Postgres connection
# strings (postgres://user:pass@host/db).
#
# Steps:
#   1. Apply staging schema (drops + recreates _lms on the destination)
#   2. pg_dump each old table as INSERT statements, sed-rewrite schema
#      prefix to _lms, pipe into psql on the destination
#   3. Run the transform script in a single transaction
#   4. Print row-count summary (handled inside the transform)
#
# Idempotent: re-running drops _lms and TRUNCATEs destination tables.
#
# Usage:
#   LMS_URL=postgres://... NEW_URL=postgres://... scripts/migrate-from-lms.sh

set -euo pipefail

: "${LMS_URL:?set LMS_URL — connection string for sycom-lms/production}"
: "${NEW_URL:?set NEW_URL — connection string for sycom/development (or target)}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGING_SQL="$REPO_ROOT/packages/db/migrations-data/01-staging-schema.sql"
TRANSFORM_SQL="$REPO_ROOT/packages/db/migrations-data/02-transform.sql"

for f in "$STAGING_SQL" "$TRANSFORM_SQL"; do
  [[ -f "$f" ]] || { echo "missing: $f" >&2; exit 66; }
done

# Tables to lift, in safe load order (parents before children). Schema-qualified.
TABLES=(
  auth.user
  auth.account
  auth.organization
  auth.member
  auth.cohort
  auth.cohort_member
  auth.invitation
  public.profile
  public.category
  public.course
  public.course_category
  public.course_instructor
  public.section
  public.lesson
  public.enrollment
  public.lesson_progress
)

echo "==> 1/3 apply staging schema on destination"
psql "$NEW_URL" --set ON_ERROR_STOP=1 -f "$STAGING_SQL"

echo "==> 2/3 dump from sycom-lms, restore into _lms"
for t in "${TABLES[@]}"; do
  src="$t"                     # auth.user
  schema="${t%%.*}"            # auth
  base="${t#*.}"               # user
  dst="_lms.${base}"           # _lms.user
  echo "    - $src -> $dst"

  # --column-inserts emits one INSERT per row, no COPY blocks. Easier to
  # rewrite: replace the schema-qualified table name with the staging name.
  # pg_dump may emit either "schema.tbl" or "\"schema\".\"tbl\"" depending
  # on identifier quoting rules; we cover both with perl alternation.
  pg_dump "$LMS_URL" \
    --data-only --column-inserts --no-owner --no-privileges \
    --table="$src" \
  | S="$schema" B="$base" D="$dst" perl -pe '
      BEGIN { ($s,$b,$d) = ($ENV{S}, $ENV{B}, $ENV{D}); }
      # rewrite the table identifier in the INSERT target. pg_dump may quote
      # either part (e.g. INSERT INTO auth."user") because "user" is a
      # reserved word; cover all four quoting combinations.
      s/INSERT INTO "?\Q$s\E"?\."?\Q$b\E"?/INSERT INTO $d/g;
      # strip ::schema.typename casts that reference the OLD prod enums
      # which do not exist on the destination. Staging columns are TEXT
      # so the literal value coerces fine without the explicit cast.
      s/::(?:"?[\w]+"?\.)?"?(?:platform_role|organization_role|storage_folder|storage_resource_type|storage_entity_type)"?//g;
    ' \
  | psql "$NEW_URL" --set ON_ERROR_STOP=1 --quiet --no-psqlrc \
    --output=/dev/null
done

echo "==> 3/3 run transform (single transaction)"
psql "$NEW_URL" --set ON_ERROR_STOP=1 -1 -f "$TRANSFORM_SQL"

echo
echo "Migration done. Spot-check by signing in with a known migrated user."
