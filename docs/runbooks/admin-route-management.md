# Admin Route Management Runbook

This runbook contains manual commands for validating PulseGate internal/admin route management APIs.

## Admin Auth

Current local admin header:

```txt
x-admin-api-key
```

Current local full-access key:

```txt
local-admin-key
```

Optional read-only configuration:

```txt
ADMIN_READ_ONLY_API_KEY=<separate-read-only-key>
```

When `ADMIN_READ_ONLY_API_KEY` is absent or blank, the existing full-access-only behavior is preserved.

Access matrix:

| Credential | GET / HEAD / OPTIONS | POST / PUT / PATCH / DELETE |
| --- | --- | --- |
| `ADMIN_API_KEY` | Allowed | Allowed |
| `ADMIN_READ_ONLY_API_KEY` | Allowed | `403 ADMIN_API_KEY_READ_ONLY` |
| Missing key | `401 ADMIN_API_KEY_MISSING` | `401 ADMIN_API_KEY_MISSING` |
| Invalid key | `403 ADMIN_API_KEY_INVALID` | `403 ADMIN_API_KEY_INVALID` |

The full-access and read-only values must be different. Identical configuration causes admin middleware creation to fail.

Admin credentials are verified through the API key hashing helper and Node.js timing-safe comparison rather than direct raw secret equality.

Optional actor attribution header:

```txt
x-admin-actor
```

Actor attribution rules:

- Leading and trailing whitespace is removed.
- Maximum length is 64 characters.
- The first character must be a letter or digit.
- Remaining characters may contain letters, digits, `.`, `_`, `:`, `@`, or `-`.
- Missing, blank, duplicated, oversized, or unsafe values fall back to `admin-api-key`.
- The header is audit attribution metadata and must not be treated as cryptographically authenticated administrator identity.

Full-access read example:

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes `
  -Headers @{
    "x-admin-api-key" = "local-admin-key"
  } |
  ConvertTo-Json -Depth 10
```

Read-only read example:

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes `
  -Headers @{
    "x-admin-api-key" = "<read-only-key>"
  } |
  ConvertTo-Json -Depth 10
```

Read-only mutation rejection example:

```powershell
try {
  Invoke-RestMethod http://localhost:3000/internal/admin/consumers `
    -Method POST `
    -Headers @{
      "x-admin-api-key" = "<read-only-key>"
      "content-type" = "application/json"
    } `
    -Body "{}"
} catch {
  $_.ErrorDetails.Message
}
```

Expected error code:

```txt
ADMIN_API_KEY_READ_ONLY
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

<!-- SPRINT-69-ADMIN-ROUTE-START -->
## Service discovery route fields

Admin route create and update payloads may include:

```json
{
  "serviceName": "product-service",
  "downstreamUrl": "http://product-a:3001/products",
  "serviceInstances": [
    {
      "baseUrl": "http://product-a:3001"
    },
    {
      "baseUrl": "http://product-b:3001"
    }
  ]
}
```

Rules:

- `serviceName` uses canonical lowercase kebab-case and is at most 64 characters.
- `serviceInstances` contains 1-8 unique canonical HTTP or HTTPS origins.
- Base URLs contain no credentials, path, query, fragment, or trailing slash.
- The primary `downstreamUrl` origin exists in the set.
- Routes sharing a service name expose the same instance set.
- Weighted routes require weighted origins to exactly match service instances and to preserve the primary path/query.

Persistence semantics:

- Create omission or `null`: persist SQL `NULL`.
- Update omission: preserve the current value.
- Update `null`: clear with `Prisma.DbNull`.
- Update array: replace the full set.
- Soft-deleted routes do not participate in the active runtime snapshot.
- Candidate-set validation runs before writes so a conflicting service definition is rejected without partial persistence.

After an approved write, use the existing runtime reload endpoint. Reload validates the complete active route and service snapshot before atomic replacement.
<!-- SPRINT-69-ADMIN-ROUTE-END -->
