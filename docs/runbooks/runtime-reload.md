# Runtime Reload Runbook

This runbook contains manual commands for validating PulseGate runtime route reload behavior.

## Reload Runtime Registry

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes/reload `
  -Method POST `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } `
  -ContentType "application/json" `
  -Body "{}" |
  ConvertTo-Json -Depth 10
```

Expected reload metadata:

```txt
mode = runtime-registry-refresh
registryAvailable = true
registryApplied = true
runtimeApplied = true
runtimeScope = dynamic-router
newRoutesRequireRestart = false
requiresRestart = false
```

## Validate Existing Registered Route Reload

This validates runtime registry behavior for an already registered route.

```powershell
$routes = Invoke-RestMethod http://localhost:3000/internal/admin/routes `
  -Headers @{ "x-admin-api-key" = "local-admin-key" }

$healthRoute = $routes.data | Where-Object { $_.gatewayPath -eq "/api/product-service/health" }

$patchBody = @{ enabled = $false } | ConvertTo-Json -Depth 10

Invoke-RestMethod "http://localhost:3000/internal/admin/routes/$($healthRoute.id)" `
  -Method PATCH `
  -Headers @{
    "x-admin-api-key" = "local-admin-key"
    "x-admin-actor" = "local-admin"
    "content-type" = "application/json"
  } `
  -Body $patchBody |
  ConvertTo-Json -Depth 10

Invoke-RestMethod http://localhost:3000/internal/admin/routes/reload `
  -Method POST `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } `
  -ContentType "application/json" `
  -Body "{}" |
  ConvertTo-Json -Depth 10

try {
  Invoke-WebRequest http://localhost:3000/api/product-service/health -UseBasicParsing
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}
```

Expected:

```txt
404
ROUTE_NOT_FOUND
```

Re-enable after validation:

```powershell
$patchBody = @{ enabled = $true } | ConvertTo-Json -Depth 10

Invoke-RestMethod "http://localhost:3000/internal/admin/routes/$($healthRoute.id)" `
  -Method PATCH `
  -Headers @{
    "x-admin-api-key" = "local-admin-key"
    "x-admin-actor" = "local-admin"
    "content-type" = "application/json"
  } `
  -Body $patchBody |
  ConvertTo-Json -Depth 10

Invoke-RestMethod http://localhost:3000/internal/admin/routes/reload `
  -Method POST `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } `
  -ContentType "application/json" `
  -Body "{}" |
  ConvertTo-Json -Depth 10
```

## Validate Brand-New Dynamic Route

```powershell
$dynamicPath = "/api/manual-dynamic-health-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"

$body = @{
  serviceName = "product-service"
  gatewayPath = $dynamicPath
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
    }
    rateLimit = @{
      enabled = $false
    }
  }
} | ConvertTo-Json -Depth 10

$createResponse = Invoke-RestMethod http://localhost:3000/internal/admin/routes `
  -Method POST `
  -Headers @{
    "x-admin-api-key" = "local-admin-key"
    "x-admin-actor" = "manual-dynamic-validation"
    "content-type" = "application/json"
  } `
  -Body $body

$createdRouteId = $createResponse.data.id

try {
  Invoke-RestMethod "http://localhost:3000$dynamicPath" |
    ConvertTo-Json -Depth 10
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}

Invoke-RestMethod http://localhost:3000/internal/admin/routes/reload `
  -Method POST `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } `
  -ContentType "application/json" `
  -Body "{}" |
  ConvertTo-Json -Depth 10

Invoke-RestMethod "http://localhost:3000$dynamicPath" |
  ConvertTo-Json -Depth 10
```

Expected before reload:

```txt
404
ROUTE_NOT_FOUND
```

Expected after reload:

```txt
200 OK
Product Service health response
```

Cleanup:

```powershell
Invoke-RestMethod "http://localhost:3000/internal/admin/routes/$createdRouteId" `
  -Method DELETE `
  -Headers @{
    "x-admin-api-key" = "local-admin-key"
    "x-admin-actor" = "manual-dynamic-validation"
  } |
  ConvertTo-Json -Depth 10

Invoke-RestMethod http://localhost:3000/internal/admin/routes/reload `
  -Method POST `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } `
  -ContentType "application/json" `
  -Body "{}" |
  ConvertTo-Json -Depth 10
```

<!-- SPRINT-69-RUNTIME-RELOAD-START -->
## Service discovery reload behavior

Runtime reload includes the service discovery snapshot.

Before replacement, the Gateway validates:

- canonical service names
- 1-8 canonical unique origins per service
- primary downstream origin membership
- exact equality for routes sharing a service name
- weighted-origin equality and primary path/query consistency
- maximum 64 configured services

The route registry and service snapshot are replaced together only after the candidate configuration is valid. Invalid or conflicting discovery configuration fails closed and does not partially replace the active runtime state.

Legacy routes with absent or SQL `NULL` discovery metadata remain outside the discovery snapshot and preserve their direct or weighted behavior.
<!-- SPRINT-69-RUNTIME-RELOAD-END -->

<!-- SPRINT-70-RUNTIME-RELOAD-START -->
## Sprint 70 health-state reload semantics

On a valid reload:

- unchanged `serviceName + baseUrl` identities preserve health
- new identities start healthy
- removed identities are pruned
- routing and service discovery are applied atomically

On an invalid reload:

- the previous route snapshot remains active
- the previous health state remains active
- no partial health reconciliation is published

Process restart resets health. Reload does not poll external registries, perform active probes, distribute health across replicas, or expose health mutation through Admin or Dashboard APIs.
<!-- SPRINT-70-RUNTIME-RELOAD-END -->
