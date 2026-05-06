using '../main.bicep'

param location = 'uksouth'
param projectName = 'sycom'
param environmentName = 'prod'

// Update globally unique names before the first deployment.
param containerRegistryName = 'changesycomprodacr'
param keyVaultName = 'sycom-prod-kv'
param logAnalyticsWorkspaceName = 'sycom-prod-logs'
param containerAppsEnvironmentName = 'sycom-prod-cae'
param dashboardIdentityName = 'sycom-prod-dashboard-id'
param serverIdentityName = 'sycom-prod-server-id'
param dashboardAppName = 'sycom-prod-dashboard'
param serverAppName = 'sycom-prod-server'

param dashboardUrl = 'https://app.example.com'
param serverUrl = 'https://api.example.com'
param websiteUrl = 'https://www.example.com'
param corsOrigins = [
  'https://app.example.com'
]

param debugPerformance = 'false'

param tags = {
  owner: 'sycom'
  workload: 'lms'
}
