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

param dashboardUrl = 'https://sycom-prod-dashboard.ambitiousgrass-33894738.uksouth.azurecontainerapps.io'
param serverUrl = 'https://sycom-prod-server.ambitiousgrass-33894738.uksouth.azurecontainerapps.io'
param websiteUrl = 'https://sycom-prod-dashboard.ambitiousgrass-33894738.uksouth.azurecontainerapps.io'
param corsOrigins = [
  'https://sycom-prod-dashboard.ambitiousgrass-33894738.uksouth.azurecontainerapps.io'
]

param debugPerformance = 'false'

param tags = {
  owner: 'sycom'
  workload: 'lms'
}
