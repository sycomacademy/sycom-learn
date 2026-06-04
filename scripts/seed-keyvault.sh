#!/usr/bin/env bash
#
# Seed an Azure Key Vault with every secret the server expects.
#
# Usage:
#   scripts/seed-keyvault.sh <vault-name> <env-file>
#
# The env file is a plain KEY=VALUE list. Lines starting with # are ignored.
# Each KEY is mapped to its kebab-case Key Vault secret name (the same names
# used in infra/main.bicep -> keyVaultSecretNames).
#
# Example:
#   scripts/seed-keyvault.sh sycomlearnprodkv01 infra/secrets/prod.env
#
# The script is idempotent: re-running it just creates a new secret version.

set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: $0 <vault-name> <env-file>" >&2
  exit 64
fi

VAULT="$1"
ENV_FILE="$2"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "env file not found: $ENV_FILE" >&2
  exit 66
fi

# Required keys, in the order Bicep expects them. Update this list AND
# infra/main.bicep -> keyVaultSecretNames if you add a new secret.
REQUIRED_KEYS=(
  DATABASE_URL
  BETTER_AUTH_SECRET
  BETTER_AUTH_API_KEY
  GOOGLE_CLIENT_ID
  GOOGLE_CLIENT_SECRET
  LINKEDIN_CLIENT_ID
  LINKEDIN_CLIENT_SECRET
  CLOUDINARY_CLOUD_NAME
  CLOUDINARY_API_KEY
  CLOUDINARY_API_SECRET
  RESEND_API_KEY
  RESEND_EMAIL_FROM
  RESEND_EMAIL_REPLY_TO
  AI_GATEWAY_API_KEY
)

# KEY -> kebab-case secret name (lowercase, _ -> -).
to_secret_name() {
  echo "$1" | tr '[:upper:]_' '[:lower:]-'
}

# Load env file into the current shell, skipping comments/blanks.
set -a
# shellcheck disable=SC1090
source <(grep -Ev '^[[:space:]]*(#|$)' "$ENV_FILE")
set +a

missing=()
for key in "${REQUIRED_KEYS[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    missing+=("$key")
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "missing keys in $ENV_FILE:" >&2
  printf '  %s\n' "${missing[@]}" >&2
  exit 65
fi

echo "seeding ${#REQUIRED_KEYS[@]} secrets into vault '$VAULT' from $ENV_FILE"
for key in "${REQUIRED_KEYS[@]}"; do
  secret_name="$(to_secret_name "$key")"
  printf '  %-22s -> %s\n' "$key" "$secret_name"
  az keyvault secret set \
    --vault-name "$VAULT" \
    --name "$secret_name" \
    --value "${!key}" \
    --output none
done

echo "done."
