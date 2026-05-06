targetScope = 'resourceGroup'

@description('Azure region for this environment.')
param location string = resourceGroup().location

@description('Project name prefix used in resource naming.')
param projectName string = 'sycom'

@description('Environment name, usually staging or prod.')
param environmentName string

@description('Deploy only the shared infrastructure when false, or infrastructure plus apps when true.')
param deployApps bool = true

@description('Globally unique Azure Container Registry name.')
param containerRegistryName string

@description('Globally unique Azure Key Vault name.')
param keyVaultName string

@description('Log Analytics workspace name.')
param logAnalyticsWorkspaceName string = '${projectName}-${environmentName}-logs'

@description('Container Apps environment name.')
param containerAppsEnvironmentName string = '${projectName}-${environmentName}-cae'

@description('Dashboard user-assigned managed identity name.')
param dashboardIdentityName string = '${projectName}-${environmentName}-dashboard-id'

@description('Server user-assigned managed identity name.')
param serverIdentityName string = '${projectName}-${environmentName}-server-id'

@description('Dashboard Container App name.')
param dashboardAppName string = '${projectName}-${environmentName}-dashboard'

@description('Server Container App name.')
param serverAppName string = '${projectName}-${environmentName}-server'

@description('Dashboard image reference in ACR.')
param dashboardImage string = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'

@description('Server image reference in ACR.')
param serverImage string = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'

@description('Public dashboard URL for this environment.')
param dashboardUrl string

@description('Public server URL for this environment.')
param serverUrl string

@description('Optional public website URL used by server-side links.')
param websiteUrl string = ''

@description('Allowed browser origins for the server. Defaults to dashboardUrl plus websiteUrl when omitted.')
param corsOrigins array = []

@description('Dashboard container port.')
param dashboardTargetPort int = 3000

@description('Server container port.')
param serverTargetPort int = 3001

@description('Minimum dashboard replicas.')
param dashboardMinReplicas int = 1

@description('Maximum dashboard replicas.')
param dashboardMaxReplicas int = 2

@description('Minimum server replicas.')
param serverMinReplicas int = 1

@description('Maximum server replicas.')
param serverMaxReplicas int = 2

@description('DEBUG_PERFORMANCE value passed to the server app.')
@allowed([
  'true'
  'false'
])
param debugPerformance string = 'false'

@description('Key Vault secret names expected by the server container app.')
param keyVaultSecretNames object = {
  databaseUrl: 'database-url'
  betterAuthSecret: 'better-auth-secret'
  betterAuthApiKey: 'better-auth-api-key'
  googleClientId: 'google-client-id'
  googleClientSecret: 'google-client-secret'
  linkedinClientId: 'linkedin-client-id'
  linkedinClientSecret: 'linkedin-client-secret'
  cloudinaryCloudName: 'cloudinary-cloud-name'
  cloudinaryApiKey: 'cloudinary-api-key'
  cloudinaryApiSecret: 'cloudinary-api-secret'
  resendApiKey: 'resend-api-key'
  resendEmailFrom: 'resend-email-from'
  resendEmailReplyTo: 'resend-email-reply-to'
  aiGatewayApiKey: 'ai-gateway-api-key'
}

@description('Common tags applied to created resources.')
param tags object = {}

var mergedTags = union(tags, {
  environment: environmentName
  project: projectName
  managedBy: 'bicep'
})

var defaultCorsOrigins = empty(websiteUrl) ? [dashboardUrl] : [dashboardUrl, websiteUrl]
var effectiveCorsOrigins = length(corsOrigins) > 0 ? corsOrigins : defaultCorsOrigins
var corsOriginValue = join(effectiveCorsOrigins, ',')
var keyVaultBaseUrl = '${keyVault.properties.vaultUri}secrets'
// In Container Apps, two apps in the same env must call each other via the
// internal FQDN — the public FQDN hairpins through Envoy and hangs.
var internalServerUrl = deployApps ? 'https://${serverAppName}.internal.${containerAppsEnvironment.properties.defaultDomain}' : ''
var acrPullRoleDefinitionId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
var keyVaultSecretsUserRoleDefinitionId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
var dashboardIdentityMap = {
  '${dashboardIdentity.id}': {}
}
var serverIdentityMap = {
  '${serverIdentity.id}': {}
}

resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsWorkspaceName
  location: location
  properties: {
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
  sku: {
    name: 'PerGB2018'
  }
  tags: mergedTags
}

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: containerRegistryName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
  }
  tags: mergedTags
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: keyVaultName
  location: location
  properties: {
    enableRbacAuthorization: true
    enablePurgeProtection: true
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: false
    publicNetworkAccess: 'Enabled'
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    softDeleteRetentionInDays: 90
  }
  tags: mergedTags
}

resource dashboardIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: dashboardIdentityName
  location: location
  tags: mergedTags
}

resource serverIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: serverIdentityName
  location: location
  tags: mergedTags
}

resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: containerAppsEnvironmentName
  location: location
  properties: {
    appLogsConfiguration: {
        destination: 'log-analytics'
        logAnalyticsConfiguration: {
          customerId: logAnalyticsWorkspace.properties.customerId
          sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
        }
      }
    }
  tags: mergedTags
}

resource dashboardAcrPullRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(containerRegistry.id, dashboardIdentity.id, 'acr-pull')
  scope: containerRegistry
  properties: {
    principalId: dashboardIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: acrPullRoleDefinitionId
  }
}

resource serverAcrPullRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(containerRegistry.id, serverIdentity.id, 'acr-pull')
  scope: containerRegistry
  properties: {
    principalId: serverIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: acrPullRoleDefinitionId
  }
}

resource serverKeyVaultSecretsUserRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, serverIdentity.id, 'key-vault-secrets-user')
  scope: keyVault
  properties: {
    principalId: serverIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: keyVaultSecretsUserRoleDefinitionId
  }
}

resource dashboardApp 'Microsoft.App/containerApps@2024-03-01' = if (deployApps) {
  name: dashboardAppName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: dashboardIdentityMap
  }
  properties: {
    managedEnvironmentId: containerAppsEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        allowInsecure: false
        external: true
        targetPort: dashboardTargetPort
        transport: 'auto'
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      }
      registries: [
        {
          server: containerRegistry.properties.loginServer
          identity: dashboardIdentity.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'dashboard'
          image: dashboardImage
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'INTERNAL_SERVER_URL'
              value: internalServerUrl
            }
          ]
          probes: [
            {
              type: 'Startup'
              httpGet: {
                path: '/health'
                port: dashboardTargetPort
              }
              initialDelaySeconds: 10
              periodSeconds: 10
              timeoutSeconds: 5
              failureThreshold: 12
            }
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: dashboardTargetPort
              }
              initialDelaySeconds: 15
              periodSeconds: 30
              timeoutSeconds: 5
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: dashboardMinReplicas
        maxReplicas: dashboardMaxReplicas
      }
    }
  }
  dependsOn: [
    dashboardAcrPullRole
  ]
  tags: mergedTags
}

resource serverApp 'Microsoft.App/containerApps@2024-03-01' = if (deployApps) {
  name: serverAppName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: serverIdentityMap
  }
  properties: {
    managedEnvironmentId: containerAppsEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        allowInsecure: false
        external: true
        targetPort: serverTargetPort
        transport: 'auto'
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      }
      registries: [
        {
          server: containerRegistry.properties.loginServer
          identity: serverIdentity.id
        }
      ]
      secrets: [
        {
          name: 'database-url'
          identity: serverIdentity.id
          keyVaultUrl: '${keyVaultBaseUrl}/${keyVaultSecretNames.databaseUrl}'
        }
        {
          name: 'better-auth-secret'
          identity: serverIdentity.id
          keyVaultUrl: '${keyVaultBaseUrl}/${keyVaultSecretNames.betterAuthSecret}'
        }
        {
          name: 'better-auth-api-key'
          identity: serverIdentity.id
          keyVaultUrl: '${keyVaultBaseUrl}/${keyVaultSecretNames.betterAuthApiKey}'
        }
        {
          name: 'google-client-id'
          identity: serverIdentity.id
          keyVaultUrl: '${keyVaultBaseUrl}/${keyVaultSecretNames.googleClientId}'
        }
        {
          name: 'google-client-secret'
          identity: serverIdentity.id
          keyVaultUrl: '${keyVaultBaseUrl}/${keyVaultSecretNames.googleClientSecret}'
        }
        {
          name: 'linkedin-client-id'
          identity: serverIdentity.id
          keyVaultUrl: '${keyVaultBaseUrl}/${keyVaultSecretNames.linkedinClientId}'
        }
        {
          name: 'linkedin-client-secret'
          identity: serverIdentity.id
          keyVaultUrl: '${keyVaultBaseUrl}/${keyVaultSecretNames.linkedinClientSecret}'
        }
        {
          name: 'cloudinary-cloud-name'
          identity: serverIdentity.id
          keyVaultUrl: '${keyVaultBaseUrl}/${keyVaultSecretNames.cloudinaryCloudName}'
        }
        {
          name: 'cloudinary-api-key'
          identity: serverIdentity.id
          keyVaultUrl: '${keyVaultBaseUrl}/${keyVaultSecretNames.cloudinaryApiKey}'
        }
        {
          name: 'cloudinary-api-secret'
          identity: serverIdentity.id
          keyVaultUrl: '${keyVaultBaseUrl}/${keyVaultSecretNames.cloudinaryApiSecret}'
        }
        {
          name: 'resend-api-key'
          identity: serverIdentity.id
          keyVaultUrl: '${keyVaultBaseUrl}/${keyVaultSecretNames.resendApiKey}'
        }
        {
          name: 'resend-email-from'
          identity: serverIdentity.id
          keyVaultUrl: '${keyVaultBaseUrl}/${keyVaultSecretNames.resendEmailFrom}'
        }
        {
          name: 'resend-email-reply-to'
          identity: serverIdentity.id
          keyVaultUrl: '${keyVaultBaseUrl}/${keyVaultSecretNames.resendEmailReplyTo}'
        }
        {
          name: 'ai-gateway-api-key'
          identity: serverIdentity.id
          keyVaultUrl: '${keyVaultBaseUrl}/${keyVaultSecretNames.aiGatewayApiKey}'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'server'
          image: serverImage
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'BETTER_AUTH_URL'
              value: serverUrl
            }
            {
              name: 'DASHBOARD_URL'
              value: dashboardUrl
            }
            {
              name: 'SERVER_URL'
              value: serverUrl
            }
            {
              name: 'WEBSITE_URL'
              value: websiteUrl
            }
            {
              name: 'CORS_ORIGIN'
              value: corsOriginValue
            }
            {
              name: 'DEBUG_PERFORMANCE'
              value: debugPerformance
            }
            {
              name: 'DATABASE_URL'
              secretRef: 'database-url'
            }
            {
              name: 'BETTER_AUTH_SECRET'
              secretRef: 'better-auth-secret'
            }
            {
              name: 'BETTER_AUTH_API_KEY'
              secretRef: 'better-auth-api-key'
            }
            {
              name: 'GOOGLE_CLIENT_ID'
              secretRef: 'google-client-id'
            }
            {
              name: 'GOOGLE_CLIENT_SECRET'
              secretRef: 'google-client-secret'
            }
            {
              name: 'LINKEDIN_CLIENT_ID'
              secretRef: 'linkedin-client-id'
            }
            {
              name: 'LINKEDIN_CLIENT_SECRET'
              secretRef: 'linkedin-client-secret'
            }
            {
              name: 'CLOUDINARY_CLOUD_NAME'
              secretRef: 'cloudinary-cloud-name'
            }
            {
              name: 'CLOUDINARY_API_KEY'
              secretRef: 'cloudinary-api-key'
            }
            {
              name: 'CLOUDINARY_API_SECRET'
              secretRef: 'cloudinary-api-secret'
            }
            {
              name: 'RESEND_API_KEY'
              secretRef: 'resend-api-key'
            }
            {
              name: 'RESEND_EMAIL_FROM'
              secretRef: 'resend-email-from'
            }
            {
              name: 'RESEND_EMAIL_REPLY_TO'
              secretRef: 'resend-email-reply-to'
            }
            {
              name: 'AI_GATEWAY_API_KEY'
              secretRef: 'ai-gateway-api-key'
            }
          ]
          probes: [
            {
              type: 'Startup'
              httpGet: {
                path: '/health'
                port: serverTargetPort
              }
              initialDelaySeconds: 10
              periodSeconds: 10
              timeoutSeconds: 5
              failureThreshold: 12
            }
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: serverTargetPort
              }
              initialDelaySeconds: 15
              periodSeconds: 30
              timeoutSeconds: 5
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: serverMinReplicas
        maxReplicas: serverMaxReplicas
      }
    }
  }
  dependsOn: [
    serverAcrPullRole
    serverKeyVaultSecretsUserRole
  ]
  tags: mergedTags
}

output containerRegistryName string = containerRegistry.name
output containerRegistryLoginServer string = containerRegistry.properties.loginServer
output keyVaultName string = keyVault.name
output containerAppsEnvironmentId string = containerAppsEnvironment.id
output dashboardContainerAppName string = dashboardAppName
output serverContainerAppName string = serverAppName
output dashboardDefaultUrl string = deployApps ? 'https://${dashboardApp!.properties.configuration.ingress.fqdn}' : ''
output serverDefaultUrl string = deployApps ? 'https://${serverApp!.properties.configuration.ingress.fqdn}' : ''
