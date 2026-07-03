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

Sprint 12 - Catch-All Dynamic Router Foundation

## Current Version

v0.13.0

## Sprint Status

Sprint 12 technical implementation is complete.

Sprint 12 final documentation update is in progress.

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

## Sprint 12 Summary

Sprint 12 completed the catch-all dynamic router foundation.

Before Sprint 12:

```txt
POST /internal/admin/routes/reload
  -> refreshed runtime route registry
  -> existing registered Fastify paths could use updated route config
  -> brand-new gateway paths still required API Gateway restart
```

After Sprint 12:

```txt
POST /internal/admin/routes/reload
  -> reads active non-deleted DB route configs
  -> maps records to DownstreamRouteConfig[]
  -> validates mapped configs
  -> replaces runtime route registry snapshot
  -> catch-all dynamic router can dispatch brand-new /api/* gateway paths
  -> brand-new DB-backed API paths can work without API Gateway restart
```

Current runtime reload scope:

```txt
dynamic-router
```

Meaning:

```txt
Existing gateway paths:
  -> enable/disable changes can apply after reload
  -> route policy changes can apply after reload
  -> downstreamUrl changes can apply after reload

Brand-new DB-backed gateway paths under /api/*:
  -> can be created through Admin API
  -> can be applied through POST /internal/admin/routes/reload
  -> can be served without API Gateway restart
```

Sprint 12 still avoids unsafe Fastify hot unregister/register behavior.

Instead, it uses:

```txt
Startup registered routes
  -> keep working as before

Catch-all dynamic route /api/*
  -> resolves request method + path from runtime registry per request
  -> dispatches brand-new DB-backed routes safely
```

---

## Sprint 12 Completed Work

1. Extracted downstream proxy request handling into a shared proxy handler.
2. Added `apps/api-gateway/src/proxy/downstream-proxy-handler.ts`.
3. Kept `apps/api-gateway/src/routes/product-proxy.route.ts` focused on Fastify route registration.
4. Added route resolver support for downstream proxy handling.
5. Preserved existing registered route behavior.
6. Added catch-all dynamic proxy route for `/api/*`.
7. Dynamic proxy route supports `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`.
8. Dynamic proxy route resolves route config using request method + request path.
9. Dynamic proxy route uses the existing runtime route registry.
10. Dynamic proxy route uses the shared proxy pipeline.
11. Dynamic proxy route applies the same API key, rate limit, JWT, cache, timeout, retry, request transform, and response transform behavior.
12. Dynamic proxy route returns `404 ROUTE_NOT_FOUND` when no runtime route exists.
13. Existing registered route tests still pass.
14. Added `dynamic-proxy.route.test.ts`.
15. Added test proving brand-new API path works after runtime registry replacement without app restart.
16. Updated reload metadata to report `runtimeScope: dynamic-router`.
17. Updated reload metadata to return `newRoutesRequireRestart: false` when registry replacement succeeds.
18. Updated reload metadata to return `requiresRestart: false` when registry replacement succeeds.
19. Updated admin route tests for the new dynamic router reload metadata.
20. Ran focused API Gateway test validation.
21. Ran full monorepo test validation.
22. Ran typecheck validation.
23. Ran build validation.
24. Ran Docker runtime validation.
25. Validated create route -> reload -> call brand-new route without restart.
26. Cleaned up Docker validation route through soft delete and reload.
27. Committed and pushed all Sprint 12 technical checkpoints.

---

## Current Automated Test Status

```txt
29 test files passed
190 tests passed
```

Latest local validation:

```txt
npm run test       -> passed
npm run typecheck  -> passed
npm run build      -> passed
```

Latest Docker validation:

```txt
docker compose up -d --build -> passed
docker compose ps -> passed

GET /health -> 200 OK
GET /internal/admin/routes/runtime -> returned runtime registry snapshot

Created brand-new route:
  GET /api/sprint12-dynamic-health-1783062215
  -> http://product-service:3001/health

Before reload:
  GET /api/sprint12-dynamic-health-1783062215
  -> 404 ROUTE_NOT_FOUND

POST /internal/admin/routes/reload:
  -> runtimeApplied: true
  -> runtimeScope: dynamic-router
  -> newRoutesRequireRestart: false
  -> requiresRestart: false
  -> routeCount changed from 2 to 3

After reload, without API Gateway restart:
  GET /api/sprint12-dynamic-health-1783062215
  -> 200 OK
  -> Product Service health response

Cleanup:
  DELETE /internal/admin/routes/:id -> soft deleted validation route
  POST /internal/admin/routes/reload -> routeCount returned to 2
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
```

Current API Gateway migrations:

```txt
apps/api-gateway/prisma/migrations/20260701063629_add_gateway_routes/migration.sql
apps/api-gateway/prisma/migrations/20260702090000_add_gateway_route_soft_delete/migration.sql
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

---

## Current Redis State

Redis is used for:

```txt
rate-limit:*
response-cache:*
```

Example Redis rate limit key:

```txt
rate-limit:api-key:dev-api-key:route:GET:/api/products
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
       call configured downstreamUrl
       return downstream response
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

Expected reload result after Sprint 12:

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
29 test files passed
190 tests passed
```

Important test areas:

```txt
Request ID middleware
Access log middleware
API key auth middleware
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
Dynamic proxy route
Timeout policy
Cache policy
Rate limit policy
Request transform policy
Response transform policy
Retry policy
API Gateway app integration tests
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

### Sprint 12

```txt
285fbf7 refactor(gateway): extract downstream proxy handler
32289cc refactor(gateway): support downstream route resolver
4eac32e feat(gateway): add catch-all dynamic proxy route
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

---

## Documentation Status

Current Sprint 12 final documentation update is in progress.

Documentation files being updated for Sprint 12:

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

PulseGate currently has a stable local-first API Gateway, infrastructure foundation, traffic protection layer, PostgreSQL-backed Product Service, PostgreSQL-backed API Gateway route config, internal/admin route management API, route management hardening with soft delete and audit metadata, Redis-backed rate limiting, Redis response caching, observability foundation with structured logs, Prometheus metrics, Prometheus scraping, Grafana provisioning, advanced Gateway route policy foundation, GitHub Actions CI/CD foundation, multi-route Gateway routing, database-backed dynamic route config, runtime route registry, runtime reload through a catch-all dynamic router, no-restart apply for brand-new DB-backed `/api/*` paths, and safe static route config fallback.

Current key limitation:

```txt
The catch-all dynamic router is a foundation.
It supports exact method + path matching through the runtime registry.
It does not yet implement advanced route matching such as path parameters, wildcard upstream mapping, host-based routing, weighted upstreams, or service discovery.
```

Important safety rule:

```txt
PulseGate still does not use unsafe Fastify hot unregister/register behavior.
Dynamic runtime routing is implemented through a stable /api/* catch-all route and runtime registry lookup.
```

---

## Recommended Next Step

Recommended next step:

```txt
Sprint 12 - Final Documentation Update
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

After all Sprint 12 docs are updated, run:

```powershell
npm run test
npm run typecheck
npm run build
git status
```

Then commit documentation with:

```txt
docs: finalize sprint 12 documentation
```

Possible Sprint 13 direction:

```txt
Sprint 13 - API Consumer and API Key Lifecycle Foundation
```

Alternative Sprint 13 direction:

```txt
Sprint 13 - Admin Auth / RBAC Hardening
```

Recommended decision:

```txt
Prefer API Consumer and API Key Lifecycle Foundation next,
because PulseGate now has dynamic route management and should start managing real API consumers, issued API keys, and usage ownership before building a full Admin Dashboard.
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