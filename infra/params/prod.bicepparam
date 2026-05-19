using '../main.bicep'

param location = 'uksouth'
param projectName = 'sycomlearn'
param environmentName = 'prod'

// Production resource names.
param containerRegistryName = 'sycomlearnprodacr01'
param keyVaultName = 'sycomlearnprodkv01'
param logAnalyticsWorkspaceName = 'sycomlearn-prod-logs'
param containerAppsEnvironmentName = 'sycomlearn-prod-cae'
param appIdentityName = 'sycomlearn-prod-app-id'
param appName = 'sycomlearn-prod-app'

// Single public URL — both UI and /api/auth, /trpc traffic come in here.
param dashboardUrl = 'https://learn.sycom.academy'
param websiteUrl = 'https://sycomsolutions.com'
param corsOrigins = [
  'https://learn.sycom.academy'
  'https://sycomsolutions.com'
]

param debugPerformance = 'false'

param tags = {
  owner: 'sycom'
  workload: 'lms'
}
