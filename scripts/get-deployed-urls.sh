#!/usr/bin/env bash
#
# Print the public FQDNs of the dashboard and server Container Apps in a
# given resource group. Useful after the first deploy to wire DNS / the
# bicepparam files for a second pass.
#
# Usage:
#   scripts/get-deployed-urls.sh <resource-group> [<environment-name>]
#
# Environment-name defaults to "prod".

set -euo pipefail

RG="${1:?usage: $0 <resource-group> [environment-name]}"
ENV_NAME="${2:-prod}"
PROJECT="${PROJECT:-sycom}"

DASHBOARD_NAME="${PROJECT}-${ENV_NAME}-dashboard"
SERVER_NAME="${PROJECT}-${ENV_NAME}-server"

dashboard_fqdn="$(az containerapp show -g "$RG" -n "$DASHBOARD_NAME" --query properties.configuration.ingress.fqdn -o tsv)"
server_fqdn="$(az containerapp show    -g "$RG" -n "$SERVER_NAME"    --query properties.configuration.ingress.fqdn -o tsv)"

cat <<EOF
dashboardUrl = https://${dashboard_fqdn}
serverUrl    = https://${server_fqdn}
EOF
