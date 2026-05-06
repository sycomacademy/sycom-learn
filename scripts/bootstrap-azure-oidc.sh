#!/usr/bin/env bash
#
# Create (or update) the Entra ID app registration GitHub Actions uses to
# deploy to Azure via OIDC. Adds federated credentials for the `staging` and
# `production` GitHub environments and grants the app Contributor on both
# resource groups.
#
# Run this once per Azure subscription. It is idempotent.
#
# Required env vars:
#   GITHUB_OWNER   GitHub org or user that owns the repo (e.g. sycom)
#   GITHUB_REPO    Repo name (e.g. sycom)
#   APP_NAME       Display name for the app registration (e.g. sycom-deploy)
#   STAGING_RG     Staging resource group name
#   PROD_RG        Production resource group name
#
# Outputs the values you need to paste into GitHub:
#   AZURE_CLIENT_ID
#   AZURE_TENANT_ID
#   AZURE_SUBSCRIPTION_ID

set -euo pipefail

: "${GITHUB_OWNER:?set GITHUB_OWNER}"
: "${GITHUB_REPO:?set GITHUB_REPO}"
: "${APP_NAME:?set APP_NAME}"
: "${STAGING_RG:?set STAGING_RG}"
: "${PROD_RG:?set PROD_RG}"

SUBSCRIPTION_ID="$(az account show --query id --output tsv)"
TENANT_ID="$(az account show --query tenantId --output tsv)"

echo "subscription: $SUBSCRIPTION_ID"
echo "tenant:       $TENANT_ID"

# 1. App registration + service principal.
APP_ID="$(az ad app list --display-name "$APP_NAME" --query '[0].appId' --output tsv)"
if [[ -z "$APP_ID" ]]; then
  echo "creating app registration '$APP_NAME'"
  APP_ID="$(az ad app create --display-name "$APP_NAME" --query appId --output tsv)"
else
  echo "reusing app registration '$APP_NAME' ($APP_ID)"
fi

if ! az ad sp show --id "$APP_ID" >/dev/null 2>&1; then
  echo "creating service principal"
  az ad sp create --id "$APP_ID" --output none
fi

# 2. Federated credentials per GitHub environment.
add_federated_credential() {
  local environment="$1"
  local cred_name="github-${environment}"
  local subject="repo:${GITHUB_OWNER}/${GITHUB_REPO}:environment:${environment}"

  local existing
  existing="$(az ad app federated-credential list --id "$APP_ID" --query "[?name=='${cred_name}'].name | [0]" --output tsv)"
  if [[ -n "$existing" ]]; then
    echo "federated credential '$cred_name' already exists"
    return
  fi
  echo "adding federated credential '$cred_name' (subject=$subject)"
  az ad app federated-credential create \
    --id "$APP_ID" \
    --parameters "$(jq -n \
      --arg name "$cred_name" \
      --arg subject "$subject" \
      '{name: $name, issuer: "https://token.actions.githubusercontent.com", subject: $subject, audiences: ["api://AzureADTokenExchange"]}')" \
    --output none
}

add_federated_credential staging
add_federated_credential production

# 3. RBAC: Owner on both resource groups.
#
# We need Owner (not just Contributor) because main.bicep creates role
# assignments (AcrPull for both apps + Key Vault Secrets User for the
# server). Contributor excludes Microsoft.Authorization/*/write, so the
# Bicep deploy fails when it hits those role assignments.
#
# If the client's security policy disallows Owner service principals,
# replace the ROLES list with ('Contributor' 'User Access Administrator')
# — same effect at slightly more setup cost.
ROLES=('Owner')

SP_OBJECT_ID="$(az ad sp show --id "$APP_ID" --query id --output tsv)"

assign_role() {
  local rg="$1"
  local role="$2"
  local scope="/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${rg}"
  if az role assignment list --assignee "$SP_OBJECT_ID" --scope "$scope" --role "$role" --query '[0].id' --output tsv | grep -q .; then
    echo "$role on $rg already assigned"
    return
  fi
  echo "assigning $role on $rg"
  az role assignment create \
    --assignee-object-id "$SP_OBJECT_ID" \
    --assignee-principal-type ServicePrincipal \
    --role "$role" \
    --scope "$scope" \
    --output none
}

# Resource groups must exist before role assignment.
az group show --name "$STAGING_RG" >/dev/null 2>&1 || az group create --name "$STAGING_RG" --location "$(az group show --name "$PROD_RG" --query location --output tsv 2>/dev/null || echo uksouth)" --output none
az group show --name "$PROD_RG"    >/dev/null 2>&1 || az group create --name "$PROD_RG"    --location uksouth --output none

for rg in "$STAGING_RG" "$PROD_RG"; do
  for role in "${ROLES[@]}"; do
    assign_role "$rg" "$role"
  done
done

cat <<EOF

Paste these into GitHub > Settings > Environments > {staging, production} > Secrets:

  AZURE_CLIENT_ID        = $APP_ID
  AZURE_TENANT_ID        = $TENANT_ID
  AZURE_SUBSCRIPTION_ID  = $SUBSCRIPTION_ID
EOF
