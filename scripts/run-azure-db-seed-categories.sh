#!/usr/bin/env bash
#
# Seed default cybersecurity categories on production Azure Postgres.
# Opens a temporary firewall rule for your public IP, seeds, then removes it.
#
# Usage:
#   POSTGRES_ADMIN_PASSWORD='<url-safe password>' \
#   scripts/run-azure-db-seed-categories.sh
#
# Optional overrides: RESOURCE_GROUP, POSTGRES_SERVER, POSTGRES_DB, POSTGRES_LOGIN
# (same defaults as run-azure-db-migrate.sh)

set -euo pipefail

: "${POSTGRES_ADMIN_PASSWORD:?set POSTGRES_ADMIN_PASSWORD}"

RESOURCE_GROUP="${RESOURCE_GROUP:-sycomlearn-prod-rg}"
POSTGRES_SERVER="${POSTGRES_SERVER:-sycomlearn-prod-postgres}"
POSTGRES_DB="${POSTGRES_DB:-sycom}"
POSTGRES_LOGIN="${POSTGRES_LOGIN:-sycomadmin}"
RULE_NAME="tmp-seed-categories-$(date +%s)"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

MY_IP="$(curl -fsS https://api.ipify.org)"
FQDN="$(az postgres flexible-server show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$POSTGRES_SERVER" \
  --query fullyQualifiedDomainName \
  --output tsv)"

echo "Opening firewall for $MY_IP on $POSTGRES_SERVER ..."
az postgres flexible-server firewall-rule create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$POSTGRES_SERVER" \
  --rule-name "$RULE_NAME" \
  --start-ip-address "$MY_IP" \
  --end-ip-address "$MY_IP" \
  --output none

cleanup() {
  echo "Removing firewall rule $RULE_NAME ..."
  az postgres flexible-server firewall-rule delete \
    --resource-group "$RESOURCE_GROUP" \
    --name "$POSTGRES_SERVER" \
    --rule-name "$RULE_NAME" \
    --yes \
    --output none 2>/dev/null || true
}
trap cleanup EXIT

ENCODED_PW="$(python3 -c "import urllib.parse; print(urllib.parse.quote('''${POSTGRES_ADMIN_PASSWORD}''', safe=''))")"
export DATABASE_URL="postgresql://${POSTGRES_LOGIN}:${ENCODED_PW}@${FQDN}:5432/${POSTGRES_DB}?sslmode=require"

echo "Seeding categories on ${FQDN}/${POSTGRES_DB} ..."
cd "$REPO_ROOT/packages/db"
bun run db:seed:categories

echo "Done."
