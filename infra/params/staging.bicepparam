using '../main.bicep'

param location = 'ukwest'
param projectName = 'sycom'
param environmentName = 'staging'

// Update globally unique names before the first deployment.
param containerRegistryName = 'changesycomstagingacr'
param keyVaultName = 'sycom-staging-ukwest-kv'
param logAnalyticsWorkspaceName = 'sycom-staging-logs'
param containerAppsEnvironmentName = 'sycom-staging-cae'
param appIdentityName = 'sycom-staging-app-id'
param appName = 'sycom-staging-app'

// Single public URL — both UI and /api/auth, /trpc traffic come in here.
param dashboardUrl = 'https://staging-app.example.com'
param websiteUrl = 'https://staging-www.example.com'
param corsOrigins = [
  'https://staging-app.example.com'
]

param debugPerformance = 'true'

param tags = {
  owner: 'sycom'
  workload: 'lms'
}
