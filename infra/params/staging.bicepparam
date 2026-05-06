using '../main.bicep'

param location = 'ukwest'
param projectName = 'sycom'
param environmentName = 'staging'

// Update globally unique names before the first deployment.
param containerRegistryName = 'changesycomstagingacr'
param keyVaultName = 'sycom-staging-ukwest-kv'
param logAnalyticsWorkspaceName = 'sycom-staging-logs'
param containerAppsEnvironmentName = 'sycom-staging-cae'
param dashboardIdentityName = 'sycom-staging-dashboard-id'
param serverIdentityName = 'sycom-staging-server-id'
param dashboardAppName = 'sycom-staging-dashboard'
param serverAppName = 'sycom-staging-server'

param dashboardUrl = 'https://staging-app.example.com'
param serverUrl = 'https://staging-api.example.com'
param websiteUrl = 'https://staging-www.example.com'
param corsOrigins = [
  'https://staging-app.example.com'
]

param debugPerformance = 'true'

param tags = {
  owner: 'sycom'
  workload: 'lms'
}
