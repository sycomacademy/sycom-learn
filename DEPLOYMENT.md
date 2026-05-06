# Azure Deployment

This repo is set up to deploy two Bun containers to Azure Container Apps:

- `dashboard` on `app.domain.com`
- `server` on `api.domain.com`

The same stack is defined twice through Bicep parameter files:

- `infra/params/staging.bicepparam`
- `infra/params/prod.bicepparam`

`staging` is intended to use your Neon staging branch `DATABASE_URL`.

## What This Deploys

- Azure Container Registry
- Azure Key Vault
- Azure Log Analytics Workspace
- Azure Container Apps Environment
- One Container App for `dashboard`
- One Container App for `server`
- One user-assigned managed identity per app
- RBAC so the apps can pull images and the server can read Key Vault secrets

## Files Added

- `Dockerfile.dashboard`
- `Dockerfile.server`
- `.dockerignore`
- `infra/main.bicep`
- `infra/params/staging.bicepparam`
- `infra/params/prod.bicepparam`
- `.github/workflows/deploy.yml`

## Before First Deploy

1. Update `infra/params/staging.bicepparam`.
2. Update `infra/params/prod.bicepparam`.
3. Replace the placeholder resource names with names you actually want.
4. Replace the example URLs with your real URLs.
5. Make sure the ACR and Key Vault names are globally unique.

## Recommended Azure Layout

- Resource group for staging: `sycom-staging-rg`
- Resource group for prod: `sycom-prod-rg`
- GitHub environment: `staging`
- GitHub environment: `production`

## Key Vault Secrets

The server app expects these Key Vault secret names by default:

- `database-url`
- `better-auth-secret`
- `better-auth-api-key`
- `google-client-id`
- `google-client-secret`
- `linkedin-client-id`
- `linkedin-client-secret`
- `cloudinary-cloud-name`
- `cloudinary-api-key`
- `cloudinary-api-secret`
- `resend-api-key`
- `resend-email-from`
- `resend-email-reply-to`
- `ai-gateway-api-key`

If you want different secret names, change `keyVaultSecretNames` in `infra/main.bicep` or override that object in the parameter files.

## Populate Staging Secrets

Use the staging Key Vault created by the staging deployment and load the staging values into it.

Important staging note:

- `database-url` should be your Neon staging branch connection string.

Example:

```bash
az keyvault secret set --vault-name <staging-key-vault-name> --name database-url --value '<neon-staging-branch-url>'
az keyvault secret set --vault-name <staging-key-vault-name> --name better-auth-secret --value '<secret>'
az keyvault secret set --vault-name <staging-key-vault-name> --name better-auth-api-key --value '<secret>'
az keyvault secret set --vault-name <staging-key-vault-name> --name google-client-id --value '<secret>'
az keyvault secret set --vault-name <staging-key-vault-name> --name google-client-secret --value '<secret>'
az keyvault secret set --vault-name <staging-key-vault-name> --name linkedin-client-id --value '<secret>'
az keyvault secret set --vault-name <staging-key-vault-name> --name linkedin-client-secret --value '<secret>'
az keyvault secret set --vault-name <staging-key-vault-name> --name cloudinary-cloud-name --value '<secret>'
az keyvault secret set --vault-name <staging-key-vault-name> --name cloudinary-api-key --value '<secret>'
az keyvault secret set --vault-name <staging-key-vault-name> --name cloudinary-api-secret --value '<secret>'
az keyvault secret set --vault-name <staging-key-vault-name> --name resend-api-key --value '<secret>'
az keyvault secret set --vault-name <staging-key-vault-name> --name resend-email-from --value '<secret>'
az keyvault secret set --vault-name <staging-key-vault-name> --name resend-email-reply-to --value '<secret>'
az keyvault secret set --vault-name <staging-key-vault-name> --name ai-gateway-api-key --value '<secret>'
```

Repeat the same process for prod with the prod Key Vault.

## GitHub Environments

Create two GitHub environments:

- `staging`
- `production`

Add these secrets to each environment:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

Add these variables to each environment:

- `AZURE_RESOURCE_GROUP`
- `AZURE_LOCATION`
- `DASHBOARD_URL`
- `SERVER_URL`
- `WEBSITE_URL`
- `CLOUDINARY_CLOUD_NAME`

Notes:

- `staging` should point at the staging domains and staging resource group.
- `production` should point at the production domains and production resource group.
- `DASHBOARD_URL`, `SERVER_URL`, and `WEBSITE_URL` should match the values in the matching Bicep parameter file.

## Azure Login for GitHub Actions

Use OIDC instead of a client secret if possible.

High-level setup:

1. Create one Azure AD app registration for GitHub Actions.
2. Add a federated credential for your GitHub repo.
3. Grant that app enough access to the subscription or the two resource groups.
4. Put the app and tenant identifiers into the GitHub environment secrets.

## Branch Behavior

The workflow at `.github/workflows/deploy.yml` does this:

- Push to `staging` deploys the staging environment.
- Push to `main` deploys the production environment.

Each deployment:

1. Ensures the resource group exists.
2. Deploys shared Azure infrastructure with `deployApps=false`.
3. Builds and pushes the dashboard image.
4. Builds and pushes the server image.
5. Deploys the Container Apps with the new image tags.

## Custom Domains on Hostinger

Because your DNS is on Hostinger, the DNS part is manual.

Recommended production domains:

- `app.domain.com` for dashboard
- `api.domain.com` for server

Recommended staging domains:

- `staging-app.domain.com`
- `staging-api.domain.com`

Typical flow:

1. Run the first deployment and note the default Azure Container App URLs.
2. In the Azure portal, add the custom hostname to each Container App.
3. Azure will show the DNS verification records it needs.
4. Add those records in Hostinger.
5. Wait for DNS propagation.
6. Complete the hostname binding in Azure.
7. Confirm Azure-managed certificates are issued.
8. Verify the apps respond on the final domains.

Do this separately for staging and prod.

## OAuth Provider Updates

Update Google and LinkedIn OAuth settings to include the correct callback and allowed origin values for:

- staging domains
- production domains

Also check:

- Better Auth base URL
- any email links generated by the app
- any third-party provider allowlists

## First-Time Deployment Checklist

1. Update both Bicep parameter files.
2. Create the `staging` and `production` GitHub environments.
3. Configure Azure OIDC for GitHub Actions.
4. Push staging secrets into the staging Key Vault.
5. Push prod secrets into the prod Key Vault.
6. Create the `staging` branch if it does not already exist.
7. Push to `staging` and let the workflow deploy staging.
8. Set up Hostinger DNS for the staging custom domains.
9. Test staging end to end.
10. Push to `main` when you are ready for prod.
11. Set up Hostinger DNS for the production custom domains.

## Bootstrap With Azure Default URLs First

You can absolutely bring the app up on the Azure-generated Container Apps URLs first, then switch to `app.domain.com` and `api.domain.com` later.

Because the dashboard bakes `VITE_SERVER_URL` into the image at build time, the clean way to do this is a two-pass bootstrap.

### Why Two Passes Are Needed

- The server URL is needed by the dashboard image build.
- Azure only gives you the default Container App FQDN after the app exists.
- So you create the apps once, read the Azure URLs, then redeploy with those URLs wired in.

### Bootstrap Flow

1. Pick temporary Azure URLs as your first public endpoints.
2. In both Bicep param files, set `dashboardUrl` and `serverUrl` to temporary placeholder URLs just for the first deploy.
3. Run the first deployment.
4. Read the generated Azure FQDNs for the dashboard and server.
5. Update the Bicep params and GitHub environment variables to use those Azure URLs.
6. Redeploy staging.
7. Test everything on the Azure URLs.
8. Later, change the values again to your final Hostinger domains and redeploy.

### First Bootstrap Deploy

For the first pass, use any valid temporary HTTPS URLs in the parameter files, for example:

```bicep
param dashboardUrl = 'https://bootstrap-dashboard.example.com'
param serverUrl = 'https://bootstrap-server.example.com'
```

These are only there to satisfy configuration on the first deploy.

Then deploy staging once.

### Get The Azure-Generated URLs

After the first deploy, get the Azure default FQDNs:

```bash
az containerapp show \
  --resource-group <staging-rg> \
  --name <staging-dashboard-app-name> \
  --query properties.configuration.ingress.fqdn \
  --output tsv

az containerapp show \
  --resource-group <staging-rg> \
  --name <staging-server-app-name> \
  --query properties.configuration.ingress.fqdn \
  --output tsv
```

Those will return values like:

```text
my-dashboard.orangeflower-123456.uksouth.azurecontainerapps.io
my-server.orangeflower-123456.uksouth.azurecontainerapps.io
```

Convert them to full URLs:

```text
https://my-dashboard.orangeflower-123456.uksouth.azurecontainerapps.io
https://my-server.orangeflower-123456.uksouth.azurecontainerapps.io
```

### Redeploy Using The Azure URLs

Update these places with the Azure URLs:

- `infra/params/staging.bicepparam`
- GitHub `staging` environment variables:
  - `DASHBOARD_URL`
  - `SERVER_URL`
  - `WEBSITE_URL` if needed

For staging, that means setting:

- `dashboardUrl` to the Azure dashboard URL
- `serverUrl` to the Azure server URL
- `corsOrigins` to the Azure dashboard URL
- `VITE_DASHBOARD_URL` from GitHub vars to the Azure dashboard URL
- `VITE_SERVER_URL` from GitHub vars to the Azure server URL

Then push to `staging` again.

After that second deploy, the app should work fully on the Azure-generated URLs.

### Move To Live Domains Later

When you are ready to move from Azure URLs to Hostinger domains:

1. Bind the custom domains in Azure Container Apps.
2. Add the required Hostinger DNS records.
3. Update:
   - `infra/params/staging.bicepparam` or `infra/params/prod.bicepparam`
   - GitHub environment variables for that environment
   - OAuth provider callback/origin settings
4. Redeploy.

That final redeploy rebuilds the dashboard with the live API URL and updates the server runtime URLs to match.

## Demo Steps

Use staging for demos.

1. Confirm the staging Key Vault contains the Neon staging branch `database-url`.
2. Push the latest demo-ready code to the `staging` branch.
3. Wait for the GitHub Actions workflow to finish.
4. Open `staging-app.domain.com`.
5. Verify sign-in, sign-up, and any OAuth flows you plan to show.
6. Verify the dashboard is talking to `staging-api.domain.com`.
7. Verify email actions if they are part of the demo.
8. Verify storage and uploads if they are part of the demo.
9. Keep a rollback point by noting the previous successful staging deployment commit SHA.

## Client Handoff Steps

1. Transfer or grant the client access to the Azure subscription, resource groups, and GitHub repository.
2. Give the client the list of GitHub environment variables and secrets required by `.github/workflows/deploy.yml`.
3. Move ownership of the DNS records in Hostinger or get the client to recreate them.
4. Move or rotate all production secrets in Key Vault.
5. Move or rotate all third-party provider credentials:
   - Google OAuth
   - LinkedIn OAuth
   - Resend
   - Cloudinary
   - Neon or the database provider
6. Show the client how staging deploys from `staging` and prod deploys from `main`.
7. Hand over the exact Bicep parameter files used in production.
8. Have the client run one deployment themselves before final sign-off.

## Recreate in a Fresh Azure Subscription

1. Create new resource groups for staging and prod.
2. Update the Bicep parameter files with new globally unique names.
3. Configure GitHub OIDC against the new subscription.
4. Populate the new Key Vaults with secrets.
5. Push to `staging`.
6. Validate staging.
7. Push to `main`.

## Rollback

Fast rollback path:

1. Find the last known good commit SHA.
2. Re-run the deployment workflow from that commit, or revert the bad commit and push again.
3. Confirm both Container Apps are healthy.

Because the deployment is image-tagged by commit SHA, every deployment is traceable to a Git commit.

## Operational Notes

- The dashboard image is environment-specific because `VITE_*` values are baked in at build time.
- The server image is the same shape across environments, but runtime secrets and URLs come from Azure.
- `dashboard` health checks use `/health`.
- `server` health checks use `/health`.
- The server binds to `0.0.0.0` and respects `PORT` for container hosting.

## Commands You May Still Run Manually

Deploy staging infrastructure from your machine:

```bash
az group create --name <staging-rg> --location <location>
az deployment group create --resource-group <staging-rg> --template-file infra/main.bicep --parameters @infra/params/staging.bicepparam deployApps=false
```

Deploy prod infrastructure from your machine:

```bash
az group create --name <prod-rg> --location <location>
az deployment group create --resource-group <prod-rg> --template-file infra/main.bicep --parameters @infra/params/prod.bicepparam deployApps=false
```
