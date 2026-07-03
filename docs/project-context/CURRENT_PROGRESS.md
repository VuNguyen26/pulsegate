# Current Progress

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

## Document Scope

This file is intentionally compact.

From Sprint 11 onward, `CURRENT_PROGRESS.md` focuses on:

* Current project state.
* Latest sprint status.
* Current architecture and runtime behavior.
* Latest validation status.
* Known limitations.
* Recommended next step.

Detailed historical logs from older sprints are summarized instead of repeated in full.
Long architectural decisions should live in `docs/project-context/DECISION_LOG.md`.
Chat handoff context should live in `docs/project-context/AI_HANDOFF.md`.
Broad architecture should live in `docs/architecture/overview.md`.

---

## Current Sprint

Sprint 13 - API Consumer and API Key Lifecycle Foundation

## Current Version

v0.14.0

## Sprint Status

Sprint 13 technical implementation is complete.

Sprint 13 final documentation update is in progress.

Sprint 12 is complete.

Sprint 11 is complete.

Sprint 10 is complete.

Sprint 9 is complete.

Sprint 8 is complete.

Sprint 7 is complete.

Sprint 6 is complete.

Sprint 5 is complete.

Sprint 4 is complete.

Sprint 3 is complete.

Sprint 2 is complete.

Sprint 1 is complete.

Sprint 0 is complete.

---

## Sprint 13 Summary

Sprint 13 added the API consumer and API key lifecycle foundation.

Before Sprint 13:

```txt
Consumer x-api-key authentication was based on static env API_KEYS only.
Default local key:
  dev-api-key
```

After Sprint 13:

```txt
API Gateway supports API consumers.
API Gateway supports issued API keys.
Issued API keys are stored hashed in PostgreSQL.
Raw API keys are returned only once when issued.
Runtime x-api-key auth can verify DB-backed issued API keys.
Revoked API keys are rejected.
Disabled consumers are rejected.
Expired API keys are rejected.
Static env API_KEYS fallback is preserved for local/dev safety.
```

Sprint 13 keeps the API Gateway product-like but controlled:

```txt
Added backend API Management foundation.
Did not add Admin Dashboard yet.
Did not add Developer Portal yet.
Did not add usage plans or quotas yet.
Did not remove local dev-api-key fallback.
```

---

## Sprint 13 Completed Work

1. Added API consumer and API key Prisma schema.
2. Added `ApiConsumerStatus` enum.
3. Added `ApiKeyStatus` enum.
4. Added `gateway.api_consumers` table.
5. Added `gateway.api_keys` table.
6. Added API key hash uniqueness.
7. Added API key prefix indexing.
8. Added consumer/key status indexing.
9. Added API key expiry and last-used metadata.
10. Added API key revocation metadata.
11. Added API key hashing foundation.
12. Added raw API key generation.
13. Added SHA-256 API key hashing.
14. Added timing-safe hash verification helper.
15. Added API key prefix extraction.
16. Added API consumer management repository.
17. Added API consumer request/response mapper.
18. Added Admin Consumer API.
19. Added API key management repository.
20. Added API key request/response mapper.
21. Added Admin API Key lifecycle API.
22. Added DB-backed API key verifier foundation.
23. Added injectable API key auth middleware factory.
24. Kept legacy `apiKeyAuthMiddleware` env fallback behavior for compatibility.
25. Added request API key context fields:
    * `request.apiKey`
    * `request.apiKeyId`
    * `request.apiConsumerId`
    * `request.apiKeyAuthSource`
26. Wired DB-backed API key verifier into downstream proxy runtime auth.
27. Preserved env `API_KEYS` fallback.
28. Added tests for API key hashing.
29. Added tests for API consumer mapper.
30. Added tests for Admin Consumer API.
31. Added tests for API key management mapper.
32. Added tests for Admin API Key lifecycle API.
33. Added tests for DB-backed API key verifier.
34. Added tests for injected API key middleware.
35. Added downstream proxy integration test proving injected API key middleware is used.
36. Ran focused API Gateway validation.
37. Ran full monorepo test validation.
38. Ran typecheck validation.
39. Ran build validation.
40. Ran Docker runtime validation.
41. Validated issued DB-backed API key can call protected `/api/products`.
42. Validated revoked DB-backed API key returns 403.
43. Validated legacy `dev-api-key` still works through env fallback.
44. Committed and pushed all Sprint 13 technical checkpoints.

---

## Current Automated Test Status

```txt
36 test files passed
256 tests passed
```

Latest local validation:

```txt
npm run test       -> passed
npm run typecheck  -> passed
npm run build      -> passed
git status         -> working tree clean
```

Latest Docker validation:

```txt
docker compose up -d --build -> passed
docker compose ps -> passed

Created API consumer:
  Sprint 13 Runtime Consumer

Issued API key:
  Sprint 13 Runtime Key

Generated runtime JWT:
  issuer: pulsegate-api-gateway
  audience: pulsegate-clients

Called protected route with issued DB-backed API key:
  GET /api/products
  -> 200 OK
  -> returned product list

Revoked issued API key:
  PATCH /internal/admin/api-keys/:id/revoke
  -> status changed to REVOKED
  -> revokedAt populated
  -> revokedBy populated

Called protected route again with revoked key:
  GET /api/products
  -> 403

Validated local env fallback:
  x-api-key: dev-api-key
  GET /api/products
  -> 200 OK
```

---

## Current Infrastructure

Current local infrastructure is managed through Docker Compose.

Implemented services:

```txt
api-gateway
product-service
postgres
redis
prometheus
grafana
```

Current exposed ports:

```txt
API Gateway      -> 3000
Product Service  -> 3001
Grafana          -> 3002
PostgreSQL       -> 5432
Redis            -> 6379
Prometheus       -> 9090
```

Expected Docker services:

```txt
pulsegate-postgres         healthy
pulsegate-redis            healthy
pulsegate-product-service  healthy
pulsegate-api-gateway      up
pulsegate-prometheus       up
pulsegate-grafana          up
```

Main infrastructure command:

```powershell
docker compose up -d --build
docker compose ps
```

---

## Current CI/CD

Workflow file:

```txt
.github/workflows/ci.yml
```

Workflow name:

```txt
CI
```

Current triggers:

```txt
push to main
pull_request to main
```

Current CI validates:

```txt
npm ci
Product Service Prisma Client generation
API Gateway Prisma Client generation
npm run test
npm run typecheck
npm run build
API Gateway Docker image build
Product Service Docker image build
```

Current CI status:

```txt
CI -> passing
```

---

## Current Database State

Database:

```txt
PostgreSQL
```

Database name:

```txt
pulsegate
```

Schemas:

```txt
public
gateway
```

Product Service tables:

```txt
public._prisma_migrations
public.products
```

API Gateway tables:

```txt
gateway._prisma_migrations
gateway.gateway_routes
gateway.api_consumers
gateway.api_keys
```

Current API Gateway migrations:

```txt
apps/api-gateway/prisma/migrations/20260701063629_add_gateway_routes/migration.sql
apps/api-gateway/prisma/migrations/20260702090000_add_gateway_route_soft_delete/migration.sql
apps/api-gateway/prisma/migrations/20260703093332_add_api_consumers_and_api_keys/migration.sql
```

Current API consumer statuses:

```txt
ACTIVE
DISABLED
```

Current API key statuses:

```txt
ACTIVE
REVOKED
```

Current seeded products:

```txt
prod_001 - Mechanical Keyboard - 120
prod_002 - Gaming Mouse - 45
```

Current seeded active Gateway routes:

```txt
GET /api/products
GET /api/product-service/health
```

Current active route definition:

```txt
enabled = true
deleted_at IS NULL
```

Current route identity rule:

```txt
Active routes are unique by method + gateway_path.
Soft-deleted historical rows may keep the same method + gateway_path.
```

Active route partial unique index:

```txt
gateway_routes_method_gateway_path_active_key
```

Index definition:

```sql
CREATE UNIQUE INDEX gateway_routes_method_gateway_path_active_key
ON gateway.gateway_routes(method, gateway_path)
WHERE deleted_at IS NULL;
```

Current API key storage rule:

```txt
Raw API keys are never persisted.
Only keyHash and keyPrefix are stored.
Raw API key is returned only once when issued.
```

Current API key lookup rule:

```txt
Runtime auth hashes the incoming raw x-api-key.
Gateway looks up gateway.api_keys by keyHash.
If DB key is valid, request is authenticated as a database-backed API key.
If DB key does not exist, Gateway falls back to env API_KEYS.
```

---

## Current Redis State

Redis is used for:

```txt
rate-limit:*
response-cache:*
```

Example Redis rate limit keys:

```txt
rate-limit:api-key:dev-api-key:route:GET:/api/products
rate-limit:api-key:<issued-api-key>:route:GET:/api/products
```

Example Redis response cache key:

```txt
response-cache:GET:/api/products
```

Validate Redis:

```powershell
docker compose exec redis redis-cli ping
```

Expected:

```txt
PONG
```

---

## Current Observability

Implemented:

```txt
Structured access logs
Request ID propagation
x-response-time-ms response header
Prometheus-compatible metrics endpoint
Prometheus Docker service
Grafana Docker service
Grafana Prometheus datasource provisioning
Grafana API Gateway overview dashboard
```

Current metrics endpoint:

```txt
GET /metrics
```

Current Prometheus metrics:

```txt
http_requests_total
http_request_duration_seconds
http_response_cache_total
```

Prometheus URL:

```txt
http://localhost:9090
```

Grafana URL:

```txt
http://localhost:3002
```

Grafana local login:

```txt
username: admin
password: admin
```

Current Grafana dashboard:

```txt
PulseGate API Gateway Overview
```

Current dashboard panels:

```txt
Request Rate
Request Count by Route
Latency p95 by Route
Cache Outcomes
```

---

## Current API Gateway Capabilities

Location:

```txt
apps/api-gateway
```

Port:

```txt
3000
```

Implemented capabilities:

```txt
Fastify API Gateway
Health endpoint
Metrics endpoint
Product proxy endpoint
Product Service health proxy endpoint
Catch-all dynamic proxy route for /api/*
Request ID generation
Request ID forwarding
Structured access logs
Response time header
Prometheus metrics
Basic security headers
Request size limit
API key authentication
DB-backed issued API key authentication
Static env API_KEYS fallback
JWT authentication
Admin API key authentication
Redis-backed rate limiting
Redis-backed response caching
Route-level policy model
Per-route timeout policy
Per-route cache policy
Per-route rate limit policy
Request transform policy foundation
Response transform policy foundation
Retry policy foundation
PostgreSQL-backed route config
Static route config fallback
Route management API
Route config create/update/soft delete
Route enable/disable
Route audit metadata
Runtime route registry
Runtime route status endpoint
Runtime reload through dynamic router
No-restart apply for brand-new DB-backed /api/* paths
API consumer schema
API consumer management foundation
Admin Consumer API
API key schema
API key hashing foundation
API key lifecycle management foundation
Admin API Key lifecycle API
API key revocation
API key last-used metadata
```

Current API Gateway endpoints:

```txt
GET /health
GET /metrics
GET /api/products
GET /api/product-service/health
GET /api/* through catch-all dynamic router

GET /internal/admin/routes
GET /internal/admin/routes/runtime
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload

GET /internal/admin/consumers
POST /internal/admin/consumers
GET /internal/admin/consumers/:id
PATCH /internal/admin/consumers/:id

GET /internal/admin/consumers/:consumerId/api-keys
POST /internal/admin/consumers/:consumerId/api-keys
PATCH /internal/admin/api-keys/:id/revoke
```

---

## Current API Consumer and API Key Behavior

Current API consumer model:

```txt
id
name
description
status
createdAt
updatedAt
createdBy
updatedBy
apiKeys[]
```

Current API consumer statuses:

```txt
ACTIVE
DISABLED
```

Current API key model:

```txt
id
consumerId
name
keyPrefix
keyHash
status
expiresAt
lastUsedAt
createdAt
updatedAt
createdBy
revokedAt
revokedBy
```

Current API key statuses:

```txt
ACTIVE
REVOKED
```

Current Admin Consumer API behavior:

```txt
GET /internal/admin/consumers
  -> list API consumers

POST /internal/admin/consumers
  -> create API consumer
  -> requires name
  -> status defaults to ACTIVE

GET /internal/admin/consumers/:id
  -> get API consumer detail
  -> 404 when missing

PATCH /internal/admin/consumers/:id
  -> update name, description, or status
  -> 404 when missing
```

Current Admin API Key API behavior:

```txt
GET /internal/admin/consumers/:consumerId/api-keys
  -> list keys for consumer
  -> does not expose keyHash
  -> does not expose rawKey

POST /internal/admin/consumers/:consumerId/api-keys
  -> issue new API key
  -> stores keyHash and keyPrefix
  -> returns rawKey once
  -> does not expose keyHash

PATCH /internal/admin/api-keys/:id/revoke
  -> revokes API key
  -> sets status=REVOKED
  -> sets revokedAt
  -> sets revokedBy
```

Runtime DB-backed API key auth behavior:

```txt
Incoming request with x-api-key
  -> hash raw API key
  -> lookup gateway.api_keys by keyHash
  -> if key exists and status=ACTIVE:
       check consumer status
       check expiresAt
       update lastUsedAt best-effort
       attach API key context to request
  -> if key exists but revoked:
       reject 403 API_KEY_INVALID
  -> if consumer disabled:
       reject 403 API_KEY_INVALID
  -> if key expired:
       reject 403 API_KEY_INVALID
  -> if DB key does not exist:
       fallback to env API_KEYS
```

Request context after successful API key auth:

```txt
request.apiKey
request.apiKeyId
request.apiConsumerId
request.apiKeyAuthSource
```

Possible `request.apiKeyAuthSource` values:

```txt
database
env
```

---

## Current Route Protection

```txt
GET /health
  -> Public

GET /metrics
  -> Public for local Docker observability

GET /api/products
  -> Requires x-api-key
  -> Accepts DB-backed issued API key when valid
  -> Accepts env dev-api-key through fallback
  -> Redis-backed rate limited by API key and route
  -> Requires JWT Bearer token
  -> Uses Redis response cache
  -> Uses latest route config from runtime registry
  -> Proxies to Product Service GET /products on cache MISS

GET /api/product-service/health
  -> Public
  -> Does not require API key
  -> Does not require JWT
  -> Does not use Redis-backed rate limiting
  -> Does not use Redis response cache
  -> Uses latest route config from runtime registry
  -> Proxies to Product Service GET /health

Brand-new DB-backed /api/* routes
  -> Use policy config stored in gateway.gateway_routes
  -> Use latest route config after reload
  -> Can require API key/JWT/rate limit/cache depending on route policy
  -> When API key is required, can use DB-backed issued keys or env fallback keys

Internal/admin routes
  -> Require x-admin-api-key
  -> May use x-admin-actor for metadata
  -> Do not use consumer x-api-key
  -> Do not use consumer JWT
```

Current API key header:

```txt
x-api-key
```

Default local API key:

```txt
dev-api-key
```

Current admin API key header:

```txt
x-admin-api-key
```

Default local admin API key:

```txt
local-admin-key
```

Current optional admin actor header:

```txt
x-admin-actor
```

Default admin actor:

```txt
admin-api-key
```

Current JWT header:

```txt
Authorization: Bearer <jwt-token>
```

Default local JWT configuration:

```txt
JWT_SECRET=local-dev-jwt-secret-change-me
JWT_ISSUER=pulsegate-api-gateway
JWT_AUDIENCE=pulsegate-clients
JWT_EXPIRES_IN_SECONDS=900
```

---

## Current Runtime Route Registry

Runtime registry files:

```txt
apps/api-gateway/src/runtime/route-runtime-registry.ts
apps/api-gateway/src/runtime/route-runtime-registry.test.ts
```

Runtime registry capabilities:

```txt
getSnapshot()
replaceRoutes(routes)
findRoute(method, gatewayPath)
```

Runtime snapshot fields:

```txt
version
loadedAt
routeCount
routes
```

Runtime registry startup flow:

```txt
API Gateway startup
  -> loadRuntimeDownstreamRouteConfigs()
  -> resolve startup route configs
  -> createRouteRuntimeRegistry({ initialRoutes: resolvedRouteConfigs })
  -> pass registry to downstreamProxyRoute()
  -> pass registry to adminRouteConfigRoute()
```

Runtime lookup flow:

```txt
Client request to an existing registered Fastify path
  -> downstream proxy preHandler
  -> routeRuntimeRegistry.findRoute(method, gatewayPath)
  -> if route exists:
       apply latest auth/rate-limit/JWT policies
  -> if route does not exist:
       return 404 ROUTE_NOT_FOUND

Client request to a brand-new DB-backed /api/* path
  -> catch-all dynamic router
  -> parse request method + path
  -> routeRuntimeRegistry.findRoute(method, requestPath)
  -> if route exists:
       apply latest route policy and proxy downstream
  -> if route does not exist:
       return 404 ROUTE_NOT_FOUND
```

Runtime status endpoint:

```txt
GET /internal/admin/routes/runtime
```

Successful runtime status response includes:

```txt
mode: runtime-registry
available: true
version: number
loadedAt: ISO timestamp
routeCount: number
routes: lightweight route summaries
```

---

## Current Reload Behavior

Reload endpoint:

```txt
POST /internal/admin/routes/reload
```

Current behavior:

```txt
Requires x-admin-api-key
Reads non-deleted route configs from PostgreSQL
Filters active runtime routes with enabled=true and deletedAt=null
Maps records to DownstreamRouteConfig[]
Validates mapped route configs
Replaces runtime registry snapshot when valid
Returns registry replacement metadata
```

Successful reload response metadata:

```txt
mode: runtime-registry-refresh
registryAvailable: true
registryApplied: true
runtimeApplied: true
runtimeScope: dynamic-router
newRoutesRequireRestart: false
requiresRestart: false
previousVersion: number
currentVersion: number
loadedAt: ISO timestamp
routeCount: number
routes: lightweight route summaries
```

Current runtime apply scope:

```txt
dynamic-router
```

Existing registered route behavior after reload:

```txt
Update enabled=false
  -> route removed from runtime registry
  -> client receives 404 ROUTE_NOT_FOUND without restart

Update enabled=true
  -> route restored in runtime registry
  -> client receives normal proxy response without restart

Update policy/downstreamUrl
  -> existing registered route uses latest runtime route config after reload
```

Brand-new DB-backed route behavior after reload:

```txt
POST /internal/admin/routes
  -> create brand-new /api/* gateway path

POST /internal/admin/routes/reload
  -> route loaded into runtime registry

Client request to new path
  -> catch-all dynamic router dispatches route
  -> no API Gateway restart required
```

---

## Current Route Management API Behavior

Current admin route management endpoints:

```txt
GET /internal/admin/routes
GET /internal/admin/routes/runtime
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
```

Current repository behavior:

```txt
listRoutes()
  -> returns non-deleted routes, including disabled non-deleted routes

findRouteById(id)
  -> returns one non-deleted route or null

findRouteByMethodAndGatewayPath(method, gatewayPath)
  -> checks conflicts against non-deleted routes

createRoute(data)
  -> inserts route into gateway.gateway_routes
  -> can set createdBy and updatedBy

updateRoute(id, data)
  -> updates existing route
  -> can set updatedBy

softDeleteRoute(id, actor)
  -> sets enabled=false
  -> sets deletedAt
  -> sets deletedBy
  -> sets updatedBy
```

Create flow:

```txt
POST /internal/admin/routes
  -> check x-admin-api-key
  -> resolve actor from x-admin-actor or default
  -> validate request body
  -> map to DownstreamRouteConfig
  -> validateDownstreamRoutes()
  -> reject duplicate active method + gatewayPath
  -> insert into gateway.gateway_routes
  -> return 201 Created
```

Update flow:

```txt
PATCH /internal/admin/routes/:id
  -> check x-admin-api-key
  -> resolve actor
  -> find existing non-deleted route
  -> merge patch with existing route
  -> validate merged route config
  -> reject conflict with another active route
  -> update gateway.gateway_routes
  -> return 200 OK
```

Soft delete flow:

```txt
DELETE /internal/admin/routes/:id
  -> check x-admin-api-key
  -> resolve actor
  -> find existing non-deleted route
  -> set enabled=false
  -> set deleted_at
  -> set deleted_by
  -> set updated_by
  -> return soft-deleted route response
```

---

## Current Route Policy Model

Route policy model:

```txt
auth
timeout
cache
rateLimit
requestTransform
responseTransform
retry
```

Current product route policy:

```txt
GET /api/products
  -> requireApiKey: true
  -> requireJwt: true
  -> timeout: enabled, 3000ms
  -> cache: enabled, 30 seconds
  -> rateLimit: enabled, 5 requests / 60000ms
  -> requestTransform: disabled
  -> responseTransform: disabled
  -> retry: disabled
```

Current Product Service health proxy route policy:

```txt
GET /api/product-service/health
  -> requireApiKey: false
  -> requireJwt: false
  -> timeout: enabled, 3000ms
  -> cache: disabled
  -> rateLimit: disabled
  -> requestTransform: disabled
  -> responseTransform: disabled
  -> retry: disabled
```

Current route validation checks:

```txt
serviceName must be present
gatewayPath must start with /
method must be supported
downstreamUrl must be valid http or https URL
timeoutMs must be positive when timeout is enabled
cache ttlSeconds must be positive when cache is enabled
rate limit limit/windowMs must be positive when rate limit is enabled
request transform header names must be valid
response transform header names must be valid
retry attempts must be non-negative
retry attempts must be greater than 0 when retry is enabled
retryOnStatuses must not be empty when retry is enabled
retryOnStatuses must contain valid HTTP status codes
duplicate active method + gatewayPath routes are rejected
```

---

## Current Product Service

Location:

```txt
apps/product-service
```

Port:

```txt
3001
```

Implemented:

```txt
Fastify server
Health check endpoint
Products endpoint
PostgreSQL-backed products
Prisma Client
Product repository
Database connection helper
Request ID generation and reuse
JSON logger
Basic 404 handler
Basic 500 error handler
Docker image build validation in CI
```

Current endpoints:

```txt
GET /health
GET /products
```

---

## Current Request Flow

Main product request flow:

```txt
Client
  -> GET /api/products
  -> API Gateway
  -> runtime registry route lookup
  -> x-api-key validation
       -> DB-backed issued key check
       -> env API_KEYS fallback when DB key is not found
  -> Redis-backed rate limit
  -> JWT validation
  -> route cache policy
  -> Redis response cache lookup
  -> if HIT:
       return cached response
  -> if MISS:
       apply request transform
       call Product Service /products
       apply timeout/retry helpers
       store response in Redis cache
       apply response transform
       return response
```

Dynamic route request flow:

```txt
Client
  -> GET /api/new-runtime-path
  -> API Gateway catch-all dynamic router /api/*
  -> parse request method + request path
  -> runtime registry route lookup
  -> if route does not exist:
       return 404 ROUTE_NOT_FOUND
  -> if route exists:
       apply route policies
       validate x-api-key if required
       validate JWT if required
       call configured downstreamUrl
       return downstream response
```

Admin API key lifecycle flow:

```txt
Admin Client
  -> POST /internal/admin/consumers
  -> create API consumer

Admin Client
  -> POST /internal/admin/consumers/:consumerId/api-keys
  -> issue API key
  -> store keyHash/keyPrefix only
  -> return rawKey once

Client
  -> call protected route with raw API key
  -> Gateway hashes raw key
  -> Gateway verifies DB-backed key

Admin Client
  -> PATCH /internal/admin/api-keys/:id/revoke
  -> revoke key

Client
  -> call protected route with revoked key
  -> Gateway rejects 403 API_KEY_INVALID
```

Admin reload flow:

```txt
Admin Client
  -> POST /internal/admin/routes/reload
  -> x-admin-api-key
  -> read active DB routes
  -> validate route configs
  -> replace runtime registry snapshot
  -> return dynamic-router runtime apply metadata
```

---

## Current Error Behavior

Consumer auth errors:

```txt
Missing API key -> 401 API_KEY_MISSING
Invalid API key -> 403 API_KEY_INVALID
Missing JWT     -> 401 JWT_TOKEN_MISSING
Invalid JWT     -> 403 JWT_TOKEN_INVALID
```

Admin auth errors:

```txt
Missing admin API key -> 401 ADMIN_API_KEY_MISSING
Invalid admin API key -> 403 ADMIN_API_KEY_INVALID
```

Route management errors:

```txt
Route config not found             -> 404 ROUTE_CONFIG_NOT_FOUND
Invalid route config               -> 400 ROUTE_CONFIG_INVALID
Duplicate active method + path     -> 409 ROUTE_CONFIG_ALREADY_EXISTS
Reload validation failed           -> 400 ROUTE_CONFIG_RELOAD_VALIDATION_FAILED
Runtime route not found            -> 404 ROUTE_NOT_FOUND
```

API consumer errors:

```txt
API consumer not found -> 404 API_CONSUMER_NOT_FOUND
Invalid API consumer   -> 400 API_CONSUMER_INVALID
```

API key lifecycle errors:

```txt
API key not found -> 404 API_KEY_NOT_FOUND
Invalid API key   -> 400 API_KEY_INVALID
```

Downstream errors:

```txt
Product Service unavailable -> 503 DOWNSTREAM_SERVICE_UNAVAILABLE
Product Service timeout     -> 504 DOWNSTREAM_TIMEOUT
Product Service 5xx         -> 502 DOWNSTREAM_HTTP_ERROR
Invalid downstream JSON      -> 502 DOWNSTREAM_INVALID_RESPONSE
```

Traffic protection errors:

```txt
Rate limit exceeded -> 429 TOO_MANY_REQUESTS
Request too large   -> 413 REQUEST_BODY_TOO_LARGE
```

---

## Main Test Commands

Run automated tests:

```powershell
npm run test
```

Typecheck:

```powershell
npm run typecheck
```

Build:

```powershell
npm run build
```

Run full Docker stack:

```powershell
docker compose up -d --build
docker compose ps
```

Validate API Gateway health:

```powershell
Invoke-RestMethod http://localhost:3000/health | ConvertTo-Json -Depth 10
```

Validate Product Service health through Gateway:

```powershell
Invoke-WebRequest http://localhost:3000/api/product-service/health -UseBasicParsing
```

Validate runtime registry status:

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes/runtime `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } |
  ConvertTo-Json -Depth 10
```

Validate route reload:

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes/reload `
  -Method POST `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } `
  -ContentType "application/json" `
  -Body "{}" |
  ConvertTo-Json -Depth 10
```

Validate API consumer creation:

```powershell
$consumerBody = @{
  name = "Local Test Consumer"
  description = "Local validation consumer"
} | ConvertTo-Json -Depth 10

Invoke-RestMethod http://localhost:3000/internal/admin/consumers `
  -Method POST `
  -Headers @{
    "x-admin-api-key" = "local-admin-key"
    "x-admin-actor" = "local-validation"
    "content-type" = "application/json"
  } `
  -Body $consumerBody |
  ConvertTo-Json -Depth 10
```

Expected reload result:

```txt
mode: runtime-registry-refresh
registryAvailable: true
registryApplied: true
runtimeApplied: true
runtimeScope: dynamic-router
newRoutesRequireRestart: false
requiresRestart: false
```

Important PowerShell note:

```txt
For POST /internal/admin/routes/reload, send Content-Type application/json and Body "{}".
Without Content-Type and body, Fastify may reject the request before the handler.
```

---

## Current Test Coverage Summary

Current test command:

```powershell
npm run test
```

Current result:

```txt
36 test files passed
256 tests passed
```

Important test areas:

```txt
Request ID middleware
Access log middleware
API key auth middleware
DB-backed API key auth verifier
JWT auth middleware
Metrics middleware
Rate limit middleware
Redis rate limit store
Redis response cache store
Request size limit middleware
Security headers middleware
Downstream service error behavior
Environment parsing
Static downstream route config
Database route config mapper
Runtime downstream route loader
Route config validation
Runtime route registry
Metrics route
Admin route config route
Admin consumer route
Admin API key lifecycle route
Dynamic proxy route
Downstream proxy API key auth integration
Timeout policy
Cache policy
Rate limit policy
Request transform policy
Response transform policy
Retry policy
API Gateway app integration tests
```

Sprint 13-specific coverage:

```txt
api-key-hashing.test.ts
  -> raw API key generation
  -> hash generation
  -> timing-safe verification
  -> prefix extraction

api-consumer-management.mapper.test.ts
  -> create/update validation
  -> status normalization
  -> response mapping

admin-consumer.route.test.ts
  -> list/create/detail/update consumers
  -> admin API key protection
  -> not found and invalid request handling

api-key-management.mapper.test.ts
  -> issue request validation
  -> expiresAt parsing
  -> response mapping without keyHash
  -> issued response with rawKey only when issuing

admin-api-key.route.test.ts
  -> list API keys by consumer
  -> issue API key
  -> revoke API key
  -> no keyHash exposure
  -> rawKey only in issue response
  -> admin API key protection

api-key-auth-verifier.test.ts
  -> verify active DB-backed key
  -> reject revoked key
  -> reject disabled consumer
  -> reject expired key
  -> fallback to env API_KEYS when DB key is not found
  -> fallback to env API_KEYS when DB lookup fails

downstream-proxy-api-key-auth.test.ts
  -> downstream proxy uses injected API key middleware
  -> proxy stops when injected API key middleware rejects request
```

Sprint 12-specific coverage:

```txt
dynamic-proxy.route.test.ts
  -> brand-new API path returns 404 before runtime registry replacement
  -> same API path returns 200 after runtime registry replacement
  -> test proves no app restart is needed for the new path

admin-route-config.route.test.ts
  -> reload response reports dynamic-router runtime scope
  -> reload response reports newRoutesRequireRestart=false
  -> reload response reports requiresRestart=false

app.test.ts
  -> existing registered downstream proxy still reads runtime registry snapshot
```

---

## Latest Stable Commits

### Sprint 13

```txt
24217ac feat(gateway): add api consumer key schema
229c9be feat(gateway): add api key hashing foundation
5ef8ed0 feat(gateway): add api consumer management foundation
abea27c feat(gateway): add admin consumer api
13faa44 feat(gateway): add api key management foundation
595435a feat(gateway): add admin api key lifecycle api
2c53ff1 feat(gateway): add db backed api key verifier foundation
b7bd095 feat(gateway): wire db backed api key auth
```

### Sprint 12

```txt
285fbf7 refactor(gateway): extract downstream proxy handler
32289cc refactor(gateway): support downstream route resolver
4eac32e feat(gateway): add catch-all dynamic proxy route
e9ddde9 docs: finalize sprint 12 documentation
```

### Sprint 11

```txt
83c8f62 feat(gateway): add route runtime registry foundation
5c55c08 feat(gateway): expose route runtime registry status
1c759bf feat(gateway): refresh route runtime registry on reload
d96914a feat(gateway): resolve downstream routes from runtime registry
6ee93e0 feat(gateway): report partial runtime reload scope
4d19e56 docs: finalize sprint 11 documentation
9f65286 docs: restore readme architecture diagram
```

### Sprint 10

```txt
8052742 feat(gateway): add route config soft delete
1f7443d feat(gateway): add route config reload validation
b0ec387 docs: finalize sprint 10 documentation
```

### Sprint 9

```txt
2e0faee feat(gateway): add admin route config read api
0d6aa66 feat(gateway): add route config create api
7a828ba feat(gateway): add route config update api
4f660d6 chore(gateway): document admin route config env
67f88e7 docs: finalize sprint 9 documentation
```

Older detailed commit history is available in Git.

---

## Historical Sprint Summary

### Sprint 0

Project foundation, repository setup, monorepo structure, README, environment example, and project docs.

### Sprint 1

Gateway foundation with downstream proxying, normalized downstream errors, timeout behavior, route config foundation, and API key auth.

### Sprint 2

Vitest test foundation, API key unit tests, downstream error tests, env tests, app integration tests, JWT auth, in-memory rate limiting, request size limit, security headers, and route-level auth config.

### Sprint 3

Docker Compose foundation, PostgreSQL service, Product Service Prisma foundation, database-backed products, Redis service, Redis-backed rate limiting, Redis response cache, and cache write failure isolation.

### Sprint 4

Structured access logs, response time header, Prometheus metrics endpoint, Prometheus service, Grafana service, and Grafana dashboard foundation.

### Sprint 5

Advanced gateway policy foundation: route policy types, policy validation, timeout/cache/rate-limit helpers, request/response transform foundation, retry foundation, and policy integration coverage.

### Sprint 6

GitHub Actions CI/CD foundation, Docker image build validation in CI, README CI badge, and CI documentation.

### Sprint 7

Generic downstream proxy route foundation, Product Service health route config, multi-route downstream registration, and health proxy route integration coverage.

### Sprint 8

PostgreSQL-backed API Gateway route config schema, seed data, database route mapper, runtime route config loader with fallback, and DB route config runtime wiring.

### Sprint 9

Internal/admin route management API foundation: list, detail, create, update, admin API key protection, route validation reuse, and duplicate conflict handling.

### Sprint 10

Route management hardening: soft delete, audit metadata, active-only uniqueness, partial unique index, reload validation endpoint, and Docker validation of soft delete/recreate/reload behavior.

### Sprint 11

Runtime route registry foundation, runtime status endpoint, reload registry refresh, downstream proxy runtime registry lookup, and honest partial runtime reload metadata for existing registered routes.

### Sprint 12

Catch-all dynamic router foundation, shared downstream proxy handler, route resolver support, dynamic `/api/*` dispatch, and no-restart runtime apply for brand-new DB-backed API paths.

### Sprint 13

API consumer and API key lifecycle foundation, hashed issued API keys, Admin Consumer API, Admin API Key lifecycle API, DB-backed API key verifier, runtime DB-backed API key auth, revocation handling, last-used metadata, and env API_KEYS fallback.

---

## Documentation Status

Current Sprint 13 final documentation update is in progress.

Documentation files being updated for Sprint 13:

```txt
docs/project-context/CURRENT_PROGRESS.md
docs/project-context/AI_HANDOFF.md
docs/project-context/DECISION_LOG.md
docs/architecture/overview.md
docs/sdlc/requirements.md
README.md
```

Documentation strategy from Sprint 11 onward:

```txt
CURRENT_PROGRESS.md
  -> current state and latest sprint summary only

AI_HANDOFF.md
  -> concise context for continuing work in a new chat

DECISION_LOG.md
  -> durable architecture and product decisions

overview.md
  -> system architecture and request flows

requirements.md
  -> product requirements and sprint scope

README.md
  -> public-facing project summary and quick start
```

---

## Current Status

PulseGate currently has a stable local-first API Gateway, infrastructure foundation, traffic protection layer, PostgreSQL-backed Product Service, PostgreSQL-backed API Gateway route config, internal/admin route management API, route management hardening with soft delete and audit metadata, Redis-backed rate limiting, Redis response caching, observability foundation with structured logs, Prometheus metrics, Prometheus scraping, Grafana provisioning, advanced Gateway route policy foundation, GitHub Actions CI/CD foundation, multi-route Gateway routing, database-backed dynamic route config, runtime route registry, runtime reload through a catch-all dynamic router, no-restart apply for brand-new DB-backed `/api/*` paths, API consumer management foundation, issued API key lifecycle management, DB-backed API key runtime authentication, API key revocation, API key last-used metadata, and safe static env API key fallback.

Current key limitations:

```txt
API consumer and API key lifecycle is backend/admin API foundation only.
There is no Admin Dashboard yet.
There is no Developer Portal yet.
There is no self-service API key request flow yet.
There are no usage plans, quotas, billing, or per-consumer analytics yet.
The catch-all dynamic router supports exact method + path matching only.
It does not yet implement advanced route matching such as path parameters, wildcard upstream mapping, host-based routing, weighted upstreams, or service discovery.
```

Important safety rule:

```txt
PulseGate still does not use unsafe Fastify hot unregister/register behavior.
Dynamic runtime routing is implemented through a stable /api/* catch-all route and runtime registry lookup.
Runtime API key authentication now supports DB-backed issued keys while preserving env API_KEYS fallback.
```

---

## Recommended Next Step

Recommended next step:

```txt
Sprint 13 - Final Documentation Update
```

Current documentation update order:

```txt
1. docs/project-context/CURRENT_PROGRESS.md
2. docs/project-context/AI_HANDOFF.md
3. docs/project-context/DECISION_LOG.md
4. docs/architecture/overview.md
5. docs/sdlc/requirements.md
6. README.md
```

After all Sprint 13 docs are updated, run:

```powershell
npm run test
npm run typecheck
npm run build
git status
```

Then commit documentation with:

```txt
docs: finalize sprint 13 documentation
```

Possible Sprint 14 direction:

```txt
Sprint 14 - API Key Usage Tracking and Consumer Analytics Foundation
```

Alternative Sprint 14 direction:

```txt
Sprint 14 - Admin Auth / RBAC Hardening
```

Alternative Sprint 14 direction:

```txt
Sprint 14 - Developer Portal Foundation
```

Recommended decision:

```txt
Prefer API Key Usage Tracking and Consumer Analytics Foundation next,
because Sprint 13 added real API consumers and issued API keys.
The next product-like step is to record usage ownership, request counts, last used data, and per-consumer analytics before building a full Admin Dashboard or Developer Portal.
```

---

## Do Not Add Yet

Do not add these before they are explicitly selected as a sprint:

* Kafka
* RabbitMQ
* Kubernetes
* Admin Dashboard
* Developer Portal
* Advanced OpenTelemetry tracing
* Complex service discovery
* Production cloud deployment
* k6 load testing
* Loki centralized logs
* Docker image registry push
* Automatic deployment
* Billing
* Paid plans
* Multi-tenant organization model

---

## Working Style

Continue using small, stable checkpoints.

Each feature should follow this workflow:

1. Implement one small technical checkpoint.
2. Explain changed files and request flow.
3. Run focused tests when useful.
4. Run `npm run test`.
5. Run `npm run typecheck`.
6. Run `npm run build`.
7. Run Docker/runtime validation when runtime behavior changes.
8. Commit after the checkpoint is stable.
9. Push after each stable commit.
10. Update project docs at the end of the sprint.

Preferred development style:

* Code sample first.
* Explain each file.
* Explain the request flow.
* Validate with automated tests.
* Validate Docker runtime when needed.
* Commit only after stable checkpoint.
* Push after each stable commit.
