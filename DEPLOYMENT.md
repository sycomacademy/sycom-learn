# Deployment

End-to-end guide for standing up Sycom on Azure. Following it top-to-bottom in a fresh subscription will produce a working staging *and* production deployment.

## Architecture at a glance

A single Container App with two containers sharing a network namespace:

| Container   | Port | Reachable from   | Image                 |
| ----------- | ---- | ---------------- | --------------------- |
| `dashboard` | 3000 | Public ingress   | `Dockerfile.dashboard` |
| `server`    | 3001 | Loopback only    | `Dockerfile.server`    |

The dashboard is a TanStack Start app whose Bun entry (`apps/dashboard/start.ts`) reverse-proxies `/api/auth/*` and `/trpc/*` to `http://localhost:3001` (the server container in the same pod). Browsers see only one URL — the dashboard's. This sidesteps Azure Container Apps' env-internal hairpin/TLS quirks that make two-app intra-env communication unreliable on the Consumption tier.

Per environment, the Bicep template ([`infra/main.bicep`](infra/main.bicep)) creates:

- Azure Container Registry (ACR)
- Azure Key Vault
- Azure Log Analytics workspace
- Azure Container Apps environment
- One Container App with two containers (`dashboard` + `server`)
- One user-assigned managed identity (shared by both containers)
- Role assignments: `AcrPull` on the registry, `Key Vault Secrets User` on the vault

Two Bicep parameter files drive it:

- [`infra/params/staging.bicepparam`](infra/params/staging.bicepparam) — staging stack
- [`infra/params/prod.bicepparam`](infra/params/prod.bicepparam) — production stack

The GitHub Actions workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) deploys on push:
- Push to `staging` → staging environment
- Push to `main` → production environment

## Repository layout

```
infra/
  main.bicep                # the entire Azure stack
  params/
    staging.bicepparam      # staging values
    prod.bicepparam         # prod values
  secrets/
    secrets.env.example     # template for the Key Vault seed file
    .gitignore              # keeps real .env files out of git
scripts/
  bootstrap-azure-oidc.sh   # one-shot: AAD app + federated creds + RBAC
  seed-keyvault.sh          # bulk-load secrets into a Key Vault
  get-deployed-urls.sh      # print Container App FQDNs
.github/workflows/
  deploy.yml                # CI/CD
Dockerfile.dashboard
Dockerfile.server
.dockerignore
```

## Prerequisites

On the operator's machine:
- Azure CLI ≥ 2.60 (`az --version`)
- `jq` (`brew install jq` / `apt install jq`)
- `bash` ≥ 4
- `gh` if you want to set GitHub secrets/vars from the terminal (optional)

In Azure:
- An empty subscription, or one where you have **Owner** at the subscription scope (needed to create role assignments).

In GitHub:
- Repository admin to create Environments and add secrets/variables.

## Required configuration values

You will need values for everything in this table before starting. Put placeholders for any URL columns — they get rewritten in the bootstrap pass.

### Per-environment Bicep parameters
Edited in `infra/params/<env>.bicepparam`.

| Parameter               | Example                            | Notes                                      |
| ----------------------- | ---------------------------------- | ------------------------------------------ |
| `location`              | `uksouth`                          | Any Azure region                           |
| `projectName`           | `sycom`                            | Drives default resource names              |
| `environmentName`       | `staging` / `prod`                 |                                            |
| `containerRegistryName` | `sycomprodacr`                     | **Globally unique**, alphanumeric, 5-50 ch |
| `keyVaultName`          | `sycom-prod-uks-kv`                | **Globally unique**, 3-24 ch               |
| `appName`               | `sycom-prod-app`                   | Container App name (single app)            |
| `appIdentityName`       | `sycom-prod-app-id`                | Shared managed identity                    |
| `dashboardUrl`          | `https://app.sycom.com`            | Single public URL — UI + `/api/auth` + `/trpc` |
| `websiteUrl`            | `https://sycom.com`                | Optional marketing site                    |
| `corsOrigins`           | `['https://app.sycom.com']`        | Browsers allowed to call the API           |
| `debugPerformance`      | `'false'`                          | `'true'` only in staging                   |

### GitHub environment secrets (per environment)

OIDC handles auth — no client secrets to rotate.

| Secret                  | Source                            |
| ----------------------- | --------------------------------- |
| `AZURE_CLIENT_ID`       | Output of `bootstrap-azure-oidc.sh` |
| `AZURE_TENANT_ID`       | Output of `bootstrap-azure-oidc.sh` |
| `AZURE_SUBSCRIPTION_ID` | Output of `bootstrap-azure-oidc.sh` |

### GitHub environment variables (per environment)

These are **not secret** — they're public URLs and resource names baked into the dashboard image at build time.

| Variable                | Example                          |
| ----------------------- | -------------------------------- |
| `AZURE_RESOURCE_GROUP`  | `sycom-prod-rg`                  |
| `AZURE_LOCATION`        | `uksouth`                        |
| `DASHBOARD_URL`         | `https://app.sycom.com`          |
| `WEBSITE_URL`           | `https://sycom.com`              |
| `CLOUDINARY_CLOUD_NAME` | `sycom`                          |

`SERVER_URL` is no longer needed — the workflow bakes the dashboard URL into both `VITE_SERVER_URL` and `VITE_DASHBOARD_URL` because the browser only ever hits the dashboard ingress.

### Runtime secrets (per environment)

The server reads these from Key Vault. Names below match `keyVaultSecretNames` in `infra/main.bicep` and the keys in `infra/secrets/secrets.env.example`.

| Env var (runtime)         | Key Vault secret name     | Source                                       |
| ------------------------- | ------------------------- | -------------------------------------------- |
| `DATABASE_URL`            | `database-url`            | Neon connection string (use staging branch for staging) |
| `BETTER_AUTH_SECRET`      | `better-auth-secret`      | `openssl rand -base64 32`                    |
| `BETTER_AUTH_API_KEY`     | `better-auth-api-key`     | Better Auth dashboard                        |
| `GOOGLE_CLIENT_ID`        | `google-client-id`        | Google Cloud Console → OAuth                 |
| `GOOGLE_CLIENT_SECRET`    | `google-client-secret`    | Google Cloud Console → OAuth                 |
| `LINKEDIN_CLIENT_ID`      | `linkedin-client-id`      | LinkedIn Developers → app                    |
| `LINKEDIN_CLIENT_SECRET`  | `linkedin-client-secret`  | LinkedIn Developers → app                    |
| `CLOUDINARY_CLOUD_NAME`   | `cloudinary-cloud-name`   | Cloudinary dashboard                         |
| `CLOUDINARY_API_KEY`      | `cloudinary-api-key`      | Cloudinary dashboard                         |
| `CLOUDINARY_API_SECRET`   | `cloudinary-api-secret`   | Cloudinary dashboard                         |
| `RESEND_API_KEY`          | `resend-api-key`          | Resend dashboard                             |
| `RESEND_EMAIL_FROM`       | `resend-email-from`       | e.g. `Sycom <noreply@sycom.com>`             |
| `RESEND_EMAIL_REPLY_TO`   | `resend-email-reply-to`   | e.g. `support@sycom.com`                     |
| `AI_GATEWAY_API_KEY`      | `ai-gateway-api-key`      | Vercel AI Gateway                            |

## First-time deploy: step by step

The first deploy is **two passes**: pass 1 brings the apps up on Azure-generated URLs so you can see them work; pass 2 (after DNS) switches them to your real domains. The dashboard image bakes `VITE_*` URLs at build time, which is why you need two passes.

### 1. Edit the Bicep param files

Open `infra/params/staging.bicepparam` and `infra/params/prod.bicepparam`. Replace placeholder names. For the URL params you have two choices:
- Use throwaway placeholders like `https://bootstrap.example.com` for now — pass 2 will rewrite them. Pick this if you don't yet know the Azure FQDNs.
- Use your final domains right away. Pick this if DNS is already prepared.

`containerRegistryName` and `keyVaultName` must be globally unique — make them obviously yours (`sycomprodacr`, `sycom-prod-kv`).

### 2. Bootstrap GitHub OIDC

```bash
az login

GITHUB_OWNER=sycom \
GITHUB_REPO=sycom \
APP_NAME=sycom-deploy \
STAGING_RG=sycom-staging-rg \
PROD_RG=sycom-prod-rg \
scripts/bootstrap-azure-oidc.sh
```

This creates one Entra ID app, registers federated credentials for the `staging` and `production` GitHub environments, and grants **Owner** on both resource groups. It prints the three IDs you need next.

> **Why Owner, not Contributor?** `main.bicep` creates three role assignments (`AcrPull` for both apps, `Key Vault Secrets User` for the server). `Contributor` explicitly excludes `Microsoft.Authorization/*/write`, so a Contributor-only principal fails on the first Bicep deploy. If the client requires least privilege, change `ROLES` in the script to `('Contributor' 'User Access Administrator')` — same effect.

### 3. Configure GitHub Environments

Repo → Settings → Environments → create `staging` and `production`.

For each, add the secrets and variables from the tables above. Using `gh` from the terminal:

```bash
gh secret set AZURE_CLIENT_ID       --env staging --body "<from script output>"
gh secret set AZURE_TENANT_ID       --env staging --body "<from script output>"
gh secret set AZURE_SUBSCRIPTION_ID --env staging --body "<from script output>"

gh variable set AZURE_RESOURCE_GROUP  --env staging --body "sycom-staging-rg"
gh variable set AZURE_LOCATION        --env staging --body "uksouth"
gh variable set DASHBOARD_URL         --env staging --body "https://bootstrap-dashboard.example.com"
gh variable set SERVER_URL            --env staging --body "https://bootstrap-server.example.com"
gh variable set WEBSITE_URL           --env staging --body "https://bootstrap-www.example.com"
gh variable set CLOUDINARY_CLOUD_NAME --env staging --body "<your-cloud>"
```

Repeat for `production`.

### 4. Seed Key Vault secrets

For each environment:

```bash
cp infra/secrets/secrets.env.example infra/secrets/staging.env
$EDITOR infra/secrets/staging.env

# After step 5 below the vault exists. Run:
scripts/seed-keyvault.sh sycom-staging-ukwest-kv infra/secrets/staging.env
```

The file is gitignored. Same flow for prod with `prod.env` and the prod vault name. Re-running the script just creates new secret versions.

### 5. Trigger pass 1 (deploys infra + apps with placeholder URLs)

```bash
git checkout staging
git push origin staging
```

The workflow:
1. `az group create` — idempotent
2. Deploys `main.bicep` with `deployApps=false` → creates ACR, Key Vault, Container Apps environment, identities, RBAC
3. (Now run step 4 above to populate the new vault, then re-trigger by pushing again or rerunning the workflow.)
4. Builds and pushes the dashboard + server images to ACR (with registry-cached layers)
5. Deploys `main.bicep` with `deployApps=true` and the new image tags

For the very first run, step 3 is unavoidable: the vault has to exist before you can put secrets in it. Either rerun the workflow after seeding, or run `az deployment group create ... deployApps=false` from your machine first.

### 6. Read the Azure-generated FQDNs

```bash
scripts/get-deployed-urls.sh sycom-staging-rg staging
```

Output looks like:

```
dashboardUrl = https://sycom-staging-dashboard.orangeflower-123.uksouth.azurecontainerapps.io
serverUrl    = https://sycom-staging-server.orangeflower-123.uksouth.azurecontainerapps.io
```

### 7. Pass 2: rebuild with the real URLs baked in

Decide whether to point at the Azure FQDNs (instant) or your real domains (requires DNS first — see next section).

Update the values in two places:
- `infra/params/<env>.bicepparam` (`dashboardUrl`, `serverUrl`, `corsOrigins`)
- GitHub environment variables (`DASHBOARD_URL`, `SERVER_URL`, `WEBSITE_URL`)

Push again. The workflow rebuilds the dashboard image with the new `VITE_*` values and rolls out a new revision.

### 8. Push to main → production

After staging looks good, merge / fast-forward to `main` and push.

```bash
git checkout main
git merge staging
git push origin main
```

Repeat steps 4–7 against production values.

## Custom domains (Hostinger or any DNS provider)

Recommended subdomains:

| Use         | Domain                  |
| ----------- | ----------------------- |
| Dashboard   | `app.sycom.com`         |
| API         | `api.sycom.com`         |
| Marketing   | `sycom.com`             |
| Staging app | `staging-app.sycom.com` |
| Staging api | `staging-api.sycom.com` |

Per Container App:

1. Azure Portal → Container Apps → `<app>` → Custom domains → Add
2. Azure shows the verification records — typically a `TXT` (`asuid.<sub>`) plus a `CNAME` to the default FQDN, or an `A` record to the environment IP for apex domains
3. Add those records in your DNS provider
4. Wait for propagation (`dig <domain>`)
5. Complete the binding in Azure → it issues a managed certificate
6. Update `dashboardUrl` / `serverUrl` / `corsOrigins` and the GitHub `*_URL` vars; push to redeploy

## OAuth provider configuration

After domains are settled, update each provider's allowed callback / redirect URLs:

- **Google**: `<dashboardUrl>/api/auth/callback/google` (and the staging equivalent)
- **LinkedIn**: same shape
- **Better Auth**: `BETTER_AUTH_URL` env var is set automatically from `serverUrl` in Bicep
- **Resend**: verify the sending domain in the Resend dashboard if `RESEND_EMAIL_FROM` is on a custom domain
- **Cloudinary**: optional — restrict allowed origins in Console → Settings → Security if you want

## Branch & deploy behavior

| Push to    | Triggers                       |
| ---------- | ------------------------------ |
| `staging`  | `deploy-staging` job           |
| `main`     | `deploy-production` job        |
| any other  | nothing                        |

Each deployment is image-tagged with `${GITHUB_SHA}`, so every revision in Container Apps maps to a single git commit.

## Rollback

```bash
# Find the desired SHA (or use the Container Apps revision history).
git revert <bad-sha>
git push origin main
```

Or, with no rebuild, point the Container App at a previous image:

```bash
az containerapp update \
  --resource-group sycom-prod-rg \
  --name sycom-prod-dashboard \
  --image <acr>.azurecr.io/dashboard:<good-sha>
```

## Operational notes

- Dashboard image is environment-specific because `VITE_*` values are baked at build time. Re-tagging across environments will not work.
- Server image is the same shape across environments; runtime values come from Bicep + Key Vault.
- Both containers share a network namespace, so the dashboard reaches the server at `http://127.0.0.1:3001` (set via `INTERNAL_SERVER_URL` env var in Bicep). The server has no external ingress.
- Secrets in Container Apps are referenced by Key Vault URL, so rotating a secret's value in Key Vault is picked up on the next revision (force one with `az containerapp update --revision-suffix`).
- Logs land in the Log Analytics workspace tied to the Container Apps environment. Query them in Azure Portal → Log Analytics → `ContainerAppConsoleLogs_CL`. Use the `ContainerName_s` column to filter `dashboard` vs `server`.

## Client handoff checklist

When the project transfers to the client:

1. Add the client's Entra ID account as **Owner** on both resource groups (or the subscription).
2. Transfer the GitHub repository to the client's org — federated credentials are tied to the repo path, so re-run `bootstrap-azure-oidc.sh` with the new `GITHUB_OWNER` if the org changes.
3. Move DNS ownership: client recreates records at their registrar.
4. Rotate every value in `infra/secrets/<env>.env`:
   - Neon: rotate the connection password (or hand over the project)
   - `BETTER_AUTH_SECRET`: regenerate and re-seed the vault
   - Google / LinkedIn / Resend / Cloudinary / AI Gateway: client creates their own apps/keys and reseeds
5. Re-run `scripts/seed-keyvault.sh` for both environments with the rotated values.
6. Force a redeploy by pushing an empty commit; verify both apps come up healthy.
7. Walk the client through one full deploy end-to-end (push to `staging` → verify → merge to `main`).
8. Hand over this file plus the populated `infra/params/*.bicepparam` files.

## Recreating in a fresh subscription

Same path as the first-time deploy:

1. Edit both bicepparam files with new globally-unique names
2. `scripts/bootstrap-azure-oidc.sh`
3. Configure GitHub environment secrets/vars
4. `scripts/seed-keyvault.sh` (after the first `deployApps=false` pass creates the vaults)
5. Push to `staging`, then `main`

## Troubleshooting

| Symptom                                          | Likely cause                                                                                        |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `staging` deploy job shows "Skipped"             | You pushed to `main`, not `staging`. The `if: github.ref_name == 'staging'` guard is by design.    |
| Container exits with `Module not found .output/server/index.mjs` | Stale image. Rebuild — the dashboard now serves from `start.ts`.                       |
| Container App shows `ImagePullBackOff`           | Managed identity missing `AcrPull` on the registry. Re-run the Bicep deploy.                       |
| `/api/auth/*` returns 500 immediately            | Server container hasn't started yet (cold-start race) or crashed. Check logs for the `server` container in the same Container App. |
| `/api/auth/*` returns 502 from ingress           | Server container not listening on `127.0.0.1:3001`. Confirm `PORT=3001` and `HOST=127.0.0.1` env vars (set by Bicep).         |
| Dashboard hits CORS errors against `/api/auth`   | Should never happen now (same origin). If it does, check that `VITE_SERVER_URL` was built with the **dashboard** URL, not a separate API URL. |
| OAuth redirect loops or "redirect_uri_mismatch"  | Provider allowed-callbacks list still points at the old Azure FQDN; update it to the live domain.  |
| Build job takes 25+ min                          | Someone re-added the standalone `nitro()` plugin. Remove it; TanStack Start already bundles Nitro. |

## Manual operations

Deploy infrastructure only (no apps) from your machine — useful when seeding Key Vault before the first CI run:

```bash
az group create --name sycom-staging-rg --location uksouth
az deployment group create \
  --resource-group sycom-staging-rg \
  --parameters infra/params/staging.bicepparam \
  --parameters deployApps=false
```

Stream logs from a Container App:

```bash
az containerapp logs show \
  --resource-group sycom-prod-rg \
  --name sycom-prod-server \
  --follow
```

Force a new revision (e.g. after rotating a Key Vault secret):

```bash
az containerapp update \
  --resource-group sycom-prod-rg \
  --name sycom-prod-server \
  --revision-suffix "$(date +%s)"
```
