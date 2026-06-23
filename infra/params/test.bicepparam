using '../main.local-deploy.bicep'

param location = 'uksouth'
param projectName = 'sycomlearn'
param environmentName = 'test'

// Test resource names (mirror prod pattern with test).
param containerRegistryName = 'sycomlearntestacr01'
param keyVaultName = 'sycomlearntestkv01'
param logAnalyticsWorkspaceName = 'sycomlearn-test-logs'
param containerAppsEnvironmentName = 'sycomlearn-test-cae'
param appName = 'sycomlearn-test-app'
param keyVaultAdminObjectId = 'edee4978-903c-44c1-8ff4-590a926e1d82'

// Neon Postgres — no Azure flexible server in test (placeholder name satisfies ARM if()-branch validation).
param deployPostgres = false
param postgresServerName = 'sycomlearn-test-postgres-unused'

// Public URL — Azure-generated FQDN until a custom domain is bound.
param dashboardUrl = 'https://sycomlearn-test-app.ambitiousdesert-b93b7668.uksouth.azurecontainerapps.io'
param websiteUrl = 'https://sycomsolutions.com'
param corsOrigins = [
  'https://sycomlearn-test-app.ambitiousdesert-b93b7668.uksouth.azurecontainerapps.io'
  'https://sycomsolutions.com'
]

param debugPerformance = 'false'

param tags = {
  owner: 'sycom'
  workload: 'lms'
  environment: 'test'
  managedBy: 'az-cli'
}
