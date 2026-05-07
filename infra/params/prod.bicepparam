using '../main.bicep'

param location = 'uksouth'
param projectName = 'sycom'
param environmentName = 'prod'

// Update globally unique names before the first deployment.
param containerRegistryName = 'changesycomprodacr'
param keyVaultName = 'sycom-prod-kv'
param logAnalyticsWorkspaceName = 'sycom-prod-logs'
param containerAppsEnvironmentName = 'sycom-prod-cae'
param appIdentityName = 'sycom-prod-app-id'
param appName = 'sycom-prod-app'

// Single public URL — both UI and /api/auth, /trpc traffic come in here.
param dashboardUrl = 'https://sycom-prod-app.ambitiousgrass-33894738.uksouth.azurecontainerapps.io'
param websiteUrl = 'https://sycomsolutions.com'
param corsOrigins = [
  'https://sycom-prod-app.ambitiousgrass-33894738.uksouth.azurecontainerapps.io'
  'https://sycomsolutions.com'
]

param debugPerformance = 'false'

param tags = {
  owner: 'sycom'
  workload: 'lms'
}
