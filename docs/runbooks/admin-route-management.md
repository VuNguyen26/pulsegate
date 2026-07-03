# Admin Route Management Runbook

This runbook contains manual commands for validating PulseGate internal/admin route management APIs.

## Admin Auth

Current local admin header:

```txt
x-admin-api-key
```

Current local admin key:

```txt
local-admin-key
```

Optional actor header:

```txt
x-admin-actor
```

## List Route Configs

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } |
  ConvertTo-Json -Depth 10
```

## Runtime Registry Status

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes/runtime `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } |
  ConvertTo-Json -Depth 10
```

Expected response includes:

```txt
version
loadedAt
routeCount
routes
```

## Create Route Config

```powershell
$body = @{
  serviceName = "product-service"
  gatewayPath = "/api/product-service/health-copy"
  downstreamUrl = "http://product-service:3001/health"
  method = "GET"
  enabled = $true
  priority = 300
  policies = @{
    auth = @{
      requireApiKey = $false
      requireJwt = $false
    }
    timeout = @{
      enabled = $true
      timeoutMs = 3000
    }
    cache = @{
      enabled = $false
      ttlSeconds = 0
    }
    rateLimit = @{
      enabled = $false
      limit = 0
      windowMs = 0
    }
    requestTransform = @{
      enabled = $false
    }
    responseTransform = @{
      enabled = $false
    }
    retry = @{
      enabled = $false
      attempts = 0
      retryOnStatuses = @(502, 503, 504)
    }
  }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod http://localhost:3000/internal/admin/routes `
  -Method POST `
  -Headers @{
    "x-admin-api-key" = "local-admin-key"
    "x-admin-actor" = "local-admin"
    "content-type" = "application/json"
  } `
  -Body $body |
  ConvertTo-Json -Depth 10
```

Expected:

```txt
201 Created
createdBy = local-admin
updatedBy = local-admin
```

## Update Route Config

```powershell
$patchBody = @{
  enabled = $false
  priority = 350
} | ConvertTo-Json -Depth 10

Invoke-RestMethod http://localhost:3000/internal/admin/routes/<route-id> `
  -Method PATCH `
  -Headers @{
    "x-admin-api-key" = "local-admin-key"
    "x-admin-actor" = "local-admin"
    "content-type" = "application/json"
  } `
  -Body $patchBody |
  ConvertTo-Json -Depth 10
```

## Soft Delete Route Config

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes/<route-id> `
  -Method DELETE `
  -Headers @{
    "x-admin-api-key" = "local-admin-key"
    "x-admin-actor" = "local-admin"
  } |
  ConvertTo-Json -Depth 10
```

Expected:

```txt
Route remains stored in gateway.gateway_routes.
Route is hidden from GET /internal/admin/routes.
Route detail returns 404 ROUTE_CONFIG_NOT_FOUND.
Runtime loader ignores the route.
A new route can reuse the same method + gatewayPath because uniqueness applies only to active routes.
```

## Reload Runtime Registry

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes/reload `
  -Method POST `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } `
  -ContentType "application/json" `
  -Body "{}" |
  ConvertTo-Json -Depth 10
```

Expected:

```txt
mode = runtime-registry-refresh
registryAvailable = true
registryApplied = true
runtimeApplied = true
runtimeScope = dynamic-router
newRoutesRequireRestart = false
requiresRestart = false
```
