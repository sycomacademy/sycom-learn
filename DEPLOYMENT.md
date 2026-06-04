# Deployment

End-to-end guide for standing up Sycom on Azure. Following it top-to-bottom in a fresh subscription will produce a working production deployment.

## Architecture at a glance

A single Container App with two containers sharing a network namespace:

| Container   | Port | Reachable from | Image                  |
| ----------- | ---- | -------------- | ---------------------- |
| `dashboard` | 3000 | Public ingress | `Dockerfile.dashboard` |
| `server`    | 3001 | Loopback only  | `Dockerfile.server`    |

The dashboard is a TanStack Start app whose Bun entry (`apps/dashboard/start.ts`) reverse-proxies `/api/auth/*` and `/trpc/*` to `http://localhost:3001` (the server container in the same pod). Browsers see only one URL — the dashboard's. This sidesteps Azure Container Apps' env-internal hairpin/TLS quirks that make two-app intra-env communication unreliable on the Consumption tier.

The Bicep template ([`infra/main.local-deploy.bicep`](infra/main.local-deploy.bicep), used by CI) creates:

- Azure Container Registry (ACR)
- Azure Key Vault
- Azure Log Analytics workspace
- Azure Container Apps environment
- One Container App with two containers (`dashboard` + `server`)
- Role assignments: `AcrPull` on the registry, Key Vault access for deploy

Production values live in [`infra/params/prod.bicepparam`](infra/params/prod.bicepparam).

The GitHub Actions workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) deploys on push to `main` → the `production` GitHub environment.

## Repository layout

```
infra/
  main.bicep                # Azure stack (Key Vault secret refs)
  main.local-deploy.bicep   # CI stack (secrets passed at deploy time)
  params/
    prod.bicepparam         # production values
  secrets/
    secrets.env.example     # template for the Key Vault seed file
    .gitignore              # keeps real .env files out of git
scripts/
  bootstrap-azure-oidc.sh   # one-shot: AAD app + federated cred + RBAC
  seed-keyvault.sh          # bulk-load secrets into a Key Vault
  get-deployed-urls.sh      # print Container App FQDN
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

- Repository admin to create the `production` environment and add secrets/variables.

## Required configuration values

### Bicep parameters

Edited in `infra/params/prod.bicepparam`.

| Parameter               | Example                           | Notes                                          |
| ----------------------- | --------------------------------- | ---------------------------------------------- |
| `location`              | `uksouth`                         | Azure region (production is UK South)          |
| `projectName`           | `sycomlearn`                      | Drives default resource names                  |
| `environmentName`       | `prod`                            |                                                |
| `containerRegistryName` | `sycomlearnprodacr01`             | **Globally unique**, alphanumeric, 5-50 ch     |
| `keyVaultName`          | `sycomlearnprodkv01`              | **Globally unique**, 3-24 ch                   |
| `appName`               | `sycomlearn-prod-app`             | Container App name (single app)                |
| `dashboardUrl`          | `https://learn.sycom.academy`     | Single public URL — UI + `/api/auth` + `/trpc` |
| `websiteUrl`            | `https://sycomsolutions.com`      | Optional marketing site                        |
| `corsOrigins`           | `['https://learn.sycom.academy']` | Browsers allowed to call the API               |
| `debugPerformance`      | `'false'`                         |                                                |

### GitHub environment secrets (`production`)

OIDC handles auth — no client secrets to rotate.

| Secret                  | Source                              |
| ----------------------- | ----------------------------------- |
| `AZURE_CLIENT_ID`       | Output of `bootstrap-azure-oidc.sh` |
| `AZURE_TENANT_ID`       | Output of `bootstrap-azure-oidc.sh` |
| `AZURE_SUBSCRIPTION_ID` | Output of `bootstrap-azure-oidc.sh` |

Runtime app secrets are also stored as GitHub environment secrets and passed into Bicep at deploy time (see workflow).

### GitHub environment variables (`production`)

These are **not secret** — public URLs and resource names baked into the dashboard image at build time.

| Variable                | Example                       |
| ----------------------- | ----------------------------- |
| `AZURE_RESOURCE_GROUP`  | `sycomlearn-prod-rg`          |
| `AZURE_LOCATION`        | `uksouth`                     |
| `DASHBOARD_URL`         | `https://learn.sycom.academy` |
| `WEBSITE_URL`           | `https://sycomsolutions.com`  |
| `CLOUDINARY_CLOUD_NAME` | `sycom`                       |

The workflow bakes `DASHBOARD_URL` into both `VITE_SERVER_URL` and `VITE_DASHBOARD_URL` because the browser only hits the dashboard ingress.

### Runtime secrets

Passed from GitHub secrets into Bicep at deploy. Names match `infra/secrets/secrets.env.example` (for manual `seed-keyvault.sh` use).

| Env var (runtime)        | Source                       |
| ------------------------ | ---------------------------- |
| `DATABASE_URL`           | Neon production connection   |
| `BETTER_AUTH_SECRET`     | `openssl rand -base64 32`    |
| `BETTER_AUTH_API_KEY`    | Better Auth dashboard        |
| `GOOGLE_CLIENT_ID`       | Google Cloud Console → OAuth |
| `GOOGLE_CLIENT_SECRET`   | Google Cloud Console → OAuth |
| `LINKEDIN_CLIENT_ID`     | LinkedIn Developers → app    |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn Developers → app    |
| `CLOUDINARY_*`           | Cloudinary dashboard         |
| `RESEND_*`               | Resend dashboard             |
| `AI_GATEWAY_API_KEY`     | Vercel AI Gateway            |

## First-time deploy: step by step

The first deploy is **two passes** if you start with placeholder URLs: pass 1 uses Azure-generated FQDNs; pass 2 switches to your real domain after DNS. The dashboard image bakes `VITE_*` URLs at build time.

### 1. Edit the Bicep param file

Open `infra/params/prod.bicepparam`. Set globally unique `containerRegistryName` and `keyVaultName`, and your `dashboardUrl` / `corsOrigins`.

### 2. Bootstrap GitHub OIDC

```bash
az login

GITHUB_OWNER=sycom \
GITHUB_REPO=sycom \
APP_NAME=sycom-deploy \
PROD_RG=sycomlearn-prod-rg \
scripts/bootstrap-azure-oidc.sh
```

This creates one Entra ID app, a federated credential for the `production` GitHub environment, and grants **Owner** on the production resource group.

> **Why Owner, not Contributor?** Bicep creates role assignments (`AcrPull`, Key Vault access). `Contributor` excludes `Microsoft.Authorization/*/write`, so deploy fails without Owner or Contributor + User Access Administrator.

### 3. Configure GitHub `production` environment

Repo → Settings → Environments → `production`. Add secrets and variables from the tables above.

```bash
gh secret set AZURE_CLIENT_ID       --env production --body "<from script output>"
gh secret set AZURE_TENANT_ID       --env production --body "<from script output>"
gh secret set AZURE_SUBSCRIPTION_ID --env production --body "<from script output>"

gh variable set AZURE_RESOURCE_GROUP  --env production --body "sycomlearn-prod-rg"
gh variable set AZURE_LOCATION        --env production --body "uksouth"
gh variable set DASHBOARD_URL         --env production --body "https://learn.sycom.academy"
gh variable set WEBSITE_URL           --env production --body "https://sycomsolutions.com"
gh variable set CLOUDINARY_CLOUD_NAME --env production --body "<your-cloud>"
```

### 4. Deploy

```bash
git push origin main
```

The workflow creates the resource group, bootstraps infra, builds images in ACR, and deploys the Container App.

### 5. Read the Azure-generated FQDN (if needed)

```bash
az containerapp show -g sycomlearn-prod-rg -n sycomlearn-prod-app \
  --query properties.configuration.ingress.fqdn -o tsv
```

Update `dashboardUrl`, `DASHBOARD_URL`, and DNS; push again to rebuild with final URLs.

## Custom domains

1. Azure Portal → Container Apps → `<app>` → Custom domains → Add
2. Add verification `TXT` / `CNAME` (or apex `A`) records in your DNS provider
3. Complete binding in Azure for the managed certificate
4. Update `dashboardUrl` / `corsOrigins` and GitHub `DASHBOARD_URL`; push to redeploy

## OAuth provider configuration

- **Google / LinkedIn**: `<dashboardUrl>/api/auth/callback/<provider>`
- **Better Auth**: `BETTER_AUTH_URL` is set from `dashboardUrl` in Bicep
- **Resend**: verify sending domain if using a custom `RESEND_EMAIL_FROM`

## Branch & deploy behavior

| Push to   | Triggers                |
| --------- | ----------------------- |
| `main`    | `deploy-production` job |
| any other | nothing                 |

Each deployment is image-tagged with the git SHA and run metadata.

## Rollback

```bash
git revert <bad-sha>
git push origin main
```

Or point the Container App at a previous image:

```bash
az containerapp update \
  --resource-group sycomlearn-prod-rg \
  --name sycomlearn-prod-app \
  --container-name dashboard \
  --image <acr>.azurecr.io/dashboard:<good-tag>
```

## Operational notes

- Dashboard image is environment-specific because `VITE_*` values are baked at build time.
- Both containers share a network namespace; the dashboard reaches the server at `http://127.0.0.1:3001`. The server has no external ingress.
- Logs: Azure Portal → Log Analytics → `ContainerAppConsoleLogs_CL`. Filter `ContainerName_s` for `dashboard` vs `server`.

## Removing a legacy staging stack

If you previously deployed staging in Azure (e.g. `sycom-staging-rg` in UK West), delete the resource group:

```bash
az group delete --name sycom-staging-rg --yes --no-wait
```

Also remove manually in GitHub: Settings → Environments → delete the `staging` environment, and in Entra ID remove the `github-staging` federated credential from the deploy app registration if it still exists.

## Client handoff checklist

1. Add the client's Entra ID account as **Owner** on the production resource group (or subscription).
2. Transfer the GitHub repo — re-run `bootstrap-azure-oidc.sh` with the new `GITHUB_OWNER` if the org changes.
3. Rotate secrets and re-deploy.
4. Hand over this file and `infra/params/prod.bicepparam`.

## Troubleshooting

| Symptom                                                          | Likely cause                                                                  |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Container exits with `Module not found .output/server/index.mjs` | Stale image. Rebuild from current `Dockerfile.dashboard`.                     |
| Container App shows `ImagePullBackOff`                           | Managed identity missing `AcrPull`. Re-run the Bicep deploy.                  |
| `/api/auth/*` returns 500                                        | Server container cold-start or crash. Check `server` container logs.          |
| OAuth `redirect_uri_mismatch`                                    | Provider callbacks still point at an old FQDN; update to live `dashboardUrl`. |
| Build job takes 25+ min                                          | Standalone `nitro()` plugin re-added; remove it.                              |

## Manual operations

Deploy infrastructure only (no apps):

```bash
az group create --name sycomlearn-prod-rg --location uksouth
az deployment group create \
  --resource-group sycomlearn-prod-rg \
  --template-file infra/main.local-deploy.bicep \
  --parameters infra/params/prod.bicepparam \
  --parameters deployApps=false
```

Stream logs:

```bash
az containerapp logs show \
  --resource-group sycomlearn-prod-rg \
  --name sycomlearn-prod-app \
  --follow
```

Force a new revision after secret rotation:

```bash
az containerapp update \
  --resource-group sycomlearn-prod-rg \
  --name sycomlearn-prod-app \
  --revision-suffix "$(date +%s)"
```
