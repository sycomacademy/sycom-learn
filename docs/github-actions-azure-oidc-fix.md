# Fix: GitHub Actions “Deploy Azure” fails at Azure login

## Symptom

Every run of the **Deploy Azure** workflow (`.github/workflows/deploy.yml`) fails in ~15s at the
**Azure login** step:

```
Login failed with Error: The process '/usr/bin/az' failed with exit code 1.
The subscription of '***' doesn't exist in cloud 'AzureCloud'.
```

Nothing after login runs, so no image is built or deployed — which is why pushes to `main` never
auto-deploy and deploys have been done by hand.

## Root cause

The workflow logs in with **OIDC** (federated, no client secret):

```yaml
permissions:
  id-token: write          # ✅ correct
environment: production     # ✅ token subject will be scoped to this environment
- uses: azure/login@v2
  with:
    client-id:       ${{ secrets.AZURE_CLIENT_ID }}
    tenant-id:       ${{ secrets.AZURE_TENANT_ID }}
    subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```

The workflow file is fine. The problem is on the Azure side:

1. **No federated credential exists.** The only app registration with access to the production
   subscription is **`sycomail-github-actions`** (appId `7d1bb1db-fc59-48e6-9ee3-79f3a113f2e6`),
   and it has **zero federated credentials**. With no federated credential whose _subject_ matches
   this repo/environment, GitHub’s OIDC token is rejected and `azure/login` fails. (It also appears
   to belong to a different project — “sycomail”, not “sycomlearn”.)
2. The `AZURE_*` secrets must point at the right identity/subscription. They were last updated
   2026‑06‑13 but the next run still failed, so at least one value is wrong **and/or** the trust
   above is missing.

## What an admin needs to do

You need someone with **both**:

- **Microsoft Entra ID**: permission to create an app registration and add federated credentials
  (Application Administrator, or Owner of an existing app).
- **Azure subscription**: **Owner** or **User Access Administrator** on subscription
  `de0b9977-4b54-468c-8346-c27f06a416ed` (to assign a role to the app).
- **GitHub**: repo admin on `sycomacademy/sycom-learn` (to set secrets/environment).

### Reference values

| Thing                                                 | Value                                                  |
| ----------------------------------------------------- | ------------------------------------------------------ |
| Tenant ID                                             | `f1f481c9-3958-4fcd-a611-189d6d325c24`                 |
| Subscription ID                                       | `de0b9977-4b54-468c-8346-c27f06a416ed`                 |
| Resource group                                        | `sycomlearn-prod-rg`                                   |
| GitHub repo                                           | `sycomacademy/sycom-learn`                             |
| GitHub environment                                    | `production`                                           |
| Federated credential **subject** (must match exactly) | `repo:sycomacademy/sycom-learn:environment:production` |
| OIDC issuer                                           | `https://token.actions.githubusercontent.com`          |
| OIDC audience                                         | `api://AzureADTokenExchange`                           |

---

## Part A — Azure (Portal)

### A1. Create (or pick) the app registration

> Fastest alternative: **reuse** the existing `sycomail-github-actions` app — it already has
> Contributor on the subscription, so you can skip to **A2** and use its appId
> `7d1bb1db-fc59-48e6-9ee3-79f3a113f2e6`. The clean option (recommended) is a dedicated app:

1. **Entra ID → App registrations → New registration.**
2. Name: `sycomlearn-github-actions`. Supported account types: **Single tenant**. **Register.**
3. On the overview page copy the **Application (client) ID** — this is your `AZURE_CLIENT_ID`.

### A2. Add the federated credential (the missing trust)

1. Open the app → **Certificates & secrets → Federated credentials → Add credential.**
2. Scenario: **GitHub Actions deploying Azure resources.**
3. Fill in:
   - Organization: `sycomacademy`
   - Repository: `sycom-learn`
   - Entity type: **Environment**
   - Environment name: `production`
4. Save. This creates subject `repo:sycomacademy/sycom-learn:environment:production`. It **must**
   match exactly, because the workflow uses `environment: production`.
5. _(Optional)_ Add a second credential with Entity type **Branch** = `main` if you later run the
   workflow outside the `production` environment.

### A3. Grant the app access to the subscription

1. **Subscriptions →** subscription `de0b9977-...` **→ Access control (IAM) → Add role assignment.**
2. Role: **Contributor**. _(Least‑privilege alternative: scope this to the resource group
   `sycomlearn-prod-rg` instead — the RG already exists, and Contributor there covers ACR build,
   Container Apps, Key Vault, and Postgres.)_
3. Members: **User, group, or service principal →** select the app (`sycomlearn-github-actions`).
4. Review + assign.

### Part A — CLI equivalent (optional, instead of the portal)

```bash
SUB=de0b9977-4b54-468c-8346-c27f06a416ed
RG=sycomlearn-prod-rg

# A1: create app + service principal
APP_ID=$(az ad app create --display-name sycomlearn-github-actions --query appId -o tsv)
az ad sp create --id "$APP_ID"

# A2: federated credential for the production environment
az ad app federated-credential create --id "$APP_ID" --parameters '{
  "name": "github-sycom-learn-production",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:sycomacademy/sycom-learn:environment:production",
  "audiences": ["api://AzureADTokenExchange"]
}'

# A3: grant Contributor (scope to the RG for least privilege)
az role assignment create --assignee "$APP_ID" --role Contributor \
  --scope "/subscriptions/$SUB/resourceGroups/$RG"

echo "AZURE_CLIENT_ID = $APP_ID"
```

---

## Part B — GitHub (repo settings)

The `AZURE_*` secrets currently live on the **`production` environment**, which is correct (keep
them there). Set/verify all three:

1. **Repo → Settings → Environments → `production`** (create it if missing; the federated
   credential subject depends on this name).
2. Under **Environment secrets**, set:
   | Secret | Value |
   |---|---|
   | `AZURE_CLIENT_ID` | the app’s Application (client) ID from A1/A3 |
   | `AZURE_TENANT_ID` | `f1f481c9-3958-4fcd-a611-189d6d325c24` |
   | `AZURE_SUBSCRIPTION_ID` | `de0b9977-4b54-468c-8346-c27f06a416ed` |
3. If the `production` environment has **required reviewers**, either approve the run when it pauses
   or remove the protection — otherwise the job waits.

### Part B — CLI equivalent (optional)

```bash
gh secret set AZURE_CLIENT_ID       --env production --repo sycomacademy/sycom-learn --body "<app-client-id>"
gh secret set AZURE_TENANT_ID       --env production --repo sycomacademy/sycom-learn --body "f1f481c9-3958-4fcd-a611-189d6d325c24"
gh secret set AZURE_SUBSCRIPTION_ID --env production --repo sycomacademy/sycom-learn --body "de0b9977-4b54-468c-8346-c27f06a416ed"
```

> The other deploy inputs are already configured and don’t need changes: environment **variables**
> (`AZURE_RESOURCE_GROUP`, `AZURE_LOCATION`, `KEY_VAULT_ADMIN_OBJECT_ID`, `DASHBOARD_URL`,
> `WEBSITE_URL`, `CLOUDINARY_CLOUD_NAME`) and the app **secrets** (`POSTGRES_ADMIN_PASSWORD`,
> `BETTER_AUTH_SECRET`, OAuth/Cloudinary/Resend keys, etc.).

---

## Verify

1. **Re-run the workflow:** Actions → Deploy Azure → most recent run → **Re-run jobs** (or push a
   trivial commit to `main`).
2. The **Azure login** step should now pass and the run should proceed through _Bootstrap → Build
   dashboard → Build server → Deploy production apps_.
3. Quick sanity from the CLI that the trust is in place:
   ```bash
   az ad app federated-credential list --id <app-client-id> \
     --query "[].{name:name, subject:subject}" -o table
   # expect subject: repo:sycomacademy/sycom-learn:environment:production
   az role assignment list --assignee <app-client-id> \
     --query "[].{role:roleDefinitionName, scope:scope}" -o table
   # expect Contributor on the subscription or sycomlearn-prod-rg
   ```
4. End-to-end: the final step logs `App default URL: ...`, and `https://learn.sycom.academy` serves
   the new revision.

## Troubleshooting

- **`No matching federated identity record found`** → the subject doesn’t match. Confirm the GitHub
  environment is exactly `production` and the credential subject is
  `repo:sycomacademy/sycom-learn:environment:production`.
- **`subscription ... doesn't exist in cloud`** (the original error) → wrong `AZURE_SUBSCRIPTION_ID`
  or the app has no role on that subscription. Recheck B step 2 and A3.
- **`AuthorizationFailed` later in the run** → the app authenticated but lacks rights for an action;
  widen the role scope to the subscription (A3) or add the specific role.

---

## Database migrations (production)

**CI does not run migrations.** The `Deploy Azure` workflow only builds and deploys the app images —
it never touches the schema. After any schema change you must run Drizzle migrations against Azure
Postgres yourself, **after** the new app image is live (or alongside it for additive changes).

Per repo rule, schema changes use **generate + migrate**, never `db:push` against production.

| Thing           | Value                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Resource group  | `sycomlearn-prod-rg`                                                                             |
| Postgres server | `sycomlearn-prod-postgres`                                                                       |
| Database        | `sycom`                                                                                          |
| Admin login     | `sycomadmin`                                                                                     |
| Admin password  | GitHub `production` secret `POSTGRES_ADMIN_PASSWORD` (the value Bicep used to create the server) |

The production server has **no standing public firewall opening**. Container Apps reach it via the
`AllowAllAzureServices` (`0.0.0.0`) rule; your laptop does not. The helper script opens a temporary
rule for your current public IP, migrates, then removes it on exit.

### 1. Generate the migration (in the repo, before deploying)

```bash
bun run db:generate     # writes SQL into packages/db/drizzle — commit these files
```

### 2. Apply it against production (recommended: helper script)

```bash
POSTGRES_ADMIN_PASSWORD='<prod POSTGRES_ADMIN_PASSWORD secret>' \
  scripts/run-azure-db-migrate.sh
```

The script ([`scripts/run-azure-db-migrate.sh`](../scripts/run-azure-db-migrate.sh)) resolves the
server FQDN, opens a temp firewall rule for your IP, builds a URL-encoded `DATABASE_URL`, runs
`bun run db:migrate`, and **always** removes the firewall rule via a cleanup trap — even on failure.
Overridable via `RESOURCE_GROUP` / `POSTGRES_SERVER` / `POSTGRES_DB` / `POSTGRES_LOGIN` env vars.

### Manual equivalent

```bash
MY_IP=$(curl -fsS https://api.ipify.org)
az postgres flexible-server firewall-rule create \
  --resource-group sycomlearn-prod-rg --name sycomlearn-prod-postgres \
  --rule-name tmp-migrate --start-ip-address "$MY_IP" --end-ip-address "$MY_IP"

DATABASE_URL='postgresql://sycomadmin:<url-encoded-password>@sycomlearn-prod-postgres.postgres.database.azure.com:5432/sycom?sslmode=require' \
  bun run db:migrate

az postgres flexible-server firewall-rule delete \
  --resource-group sycomlearn-prod-rg --name sycomlearn-prod-postgres \
  --rule-name tmp-migrate --yes
```

> URL-encode the password (e.g. `python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1],safe=''))" '<pw>'`)
> — the script does this for you.

**Take a backup before destructive migrations** (drops/renames/type changes) — see below.

---

## Database backups & restore

### Automated backups (Azure-managed, default)

Azure Database for PostgreSQL Flexible Server takes continuous backups with **point-in-time restore
(PITR)**. Current production settings:

| Setting              | Value                                                |
| -------------------- | ---------------------------------------------------- |
| Retention            | **7 days**                                           |
| Geo-redundant backup | **Disabled** (region-local only)                     |
| Earliest restore     | rolling — `backup.earliestRestoreDate` on the server |

Check live settings:

```bash
az postgres flexible-server show -g sycomlearn-prod-rg -n sycomlearn-prod-postgres \
  --query "{retentionDays:backup.backupRetentionDays, geo:backup.geoRedundantBackup, earliest:backup.earliestRestoreDate}" -o json
```

Change retention (1–35 days):

```bash
az postgres flexible-server update -g sycomlearn-prod-rg -n sycomlearn-prod-postgres \
  --backup-retention 14
```

**PITR never overwrites the live server** — it provisions a _new_ server from the chosen point. Use
it to recover from a bad migration or data loss:

```bash
az postgres flexible-server restore \
  --resource-group sycomlearn-prod-rg \
  --name sycomlearn-prod-postgres-restored \
  --source-server sycomlearn-prod-postgres \
  --restore-time "2026-06-16T09:00:00Z"
```

Verify the restored server, then cut over by repointing the app at it (the production `DATABASE_URL`
is assembled by Bicep from `postgresServerName`; update `infra/params/prod.bicepparam` and redeploy,
or temporarily override the Container App `database-url` secret and force a new revision).

### Manual logical backup (`pg_dump`)

Take an on-demand snapshot before risky changes, or to move data between environments. Same
temp-firewall pattern as migrations; dump the three app schemas (`auth`, `public`, `storage`) the way
[`scripts/promote-dev-to-prod.sh`](../scripts/promote-dev-to-prod.sh) does:

```bash
MY_IP=$(curl -fsS https://api.ipify.org)
az postgres flexible-server firewall-rule create \
  --resource-group sycomlearn-prod-rg --name sycomlearn-prod-postgres \
  --rule-name tmp-backup --start-ip-address "$MY_IP" --end-ip-address "$MY_IP"

DATABASE_URL='postgresql://sycomadmin:<url-encoded-password>@sycomlearn-prod-postgres.postgres.database.azure.com:5432/sycom?sslmode=require'

pg_dump "$DATABASE_URL" \
  --no-owner --no-privileges \
  -n auth -n public -n storage \
  -Fc -f "sycom-prod-$(date +%Y%m%d%H%M%S).dump"   # -Fc = compressed custom format

az postgres flexible-server firewall-rule delete \
  --resource-group sycomlearn-prod-rg --name sycomlearn-prod-postgres \
  --rule-name tmp-backup --yes
```

### Restore a logical dump

`pg_restore --clean --if-exists` **drops existing objects** before recreating them. Always restore
into a scratch database/server and verify before pointing the app at it.

```bash
pg_restore --no-owner --no-privileges --clean --if-exists \
  -d 'postgresql://sycomadmin:<pw>@<target-server>.postgres.database.azure.com:5432/sycom?sslmode=require' \
  sycom-prod-<timestamp>.dump
```

For a full cross-environment copy (dev → prod) inside a single transaction, use
[`scripts/promote-dev-to-prod.sh`](../scripts/promote-dev-to-prod.sh).
