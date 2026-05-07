#!/usr/bin/env bash
#
# Phase 4: promote the validated sycom/development branch onto sycom/production.
#
# Uses pg_dump --clean --if-exists from dev, restores into prod inside a
# single transaction. If anything fails, prod stays as it was.
#
# Usage:
#   DEV_URL=postgres://...  PROD_URL=postgres://... scripts/promote-dev-to-prod.sh
#
# After this completes, run:
#   az keyvault secret set --vault-name sycom-prod-kv \
#     --name database-url --value "$PROD_URL"
#   az containerapp update -g sycom-prod-rg -n sycom-prod-app \
#     --revision-suffix "db-cutover-$(date +%s)"

set -euo pipefail
: "${DEV_URL:?set DEV_URL}"
: "${PROD_URL:?set PROD_URL}"

DUMP="/tmp/sycom-dev-to-prod-$(date +%s).sql"

echo "==> 1/2 dumping dev -> $DUMP"
pg_dump "$DEV_URL" \
  --no-owner --no-privileges \
  --clean --if-exists \
  -n auth -n public -n storage \
  > "$DUMP"

bytes=$(wc -c < "$DUMP")
printf '    dump size: %s bytes\n' "$bytes"

echo "==> 2/2 restoring into prod (single transaction)"
psql "$PROD_URL" --set ON_ERROR_STOP=1 -1 -f "$DUMP"

echo
echo "Promote done. Now flip Key Vault and force a Container App revision."
