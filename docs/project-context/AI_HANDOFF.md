# AI Handoff

## Project Name

PulseGate - High-Traffic API Gateway & Observability Platform

## Current Version

v0.12.0

## Current Sprint

Sprint 11 - Route Runtime Reload / Admin Hardening Foundation

## Current Status

Sprint 0 is complete.

Sprint 1 is complete.

Sprint 2 is complete.

Sprint 3 is complete.

Sprint 4 is complete.

Sprint 5 is complete.

Sprint 6 is complete.

Sprint 7 is complete.

Sprint 8 is complete.

Sprint 9 is complete.

Sprint 10 is complete.

Sprint 11 technical implementation is complete.

Sprint 11 final documentation update is in progress.

Current automated test status:

```txt
28 test files passed
189 tests passed
```

Latest validation status:

```txt
npm run test       -> passed
npm run typecheck  -> passed
npm run build      -> passed
docker compose up -d --build -> passed
docker compose ps -> passed
GET /internal/admin/routes/runtime with x-admin-api-key -> returned runtime registry snapshot
POST /internal/admin/routes/reload with x-admin-api-key -> refreshed runtime registry snapshot
POST /internal/admin/routes/reload -> returned runtimeApplied: true
POST /internal/admin/routes/reload -> returned runtimeScope: registered-routes-only
POST /internal/admin/routes/reload -> returned newRoutesRequireRestart: true
POST /internal/admin/routes/reload -> returned requiresRestart: true
PATCH /internal/admin/routes/:id enabled=false -> disabled existing health route
POST /internal/admin/routes/reload -> refreshed runtime registry routeCount from 2 to 1
GET /api/product-service/health after reload without restart -> 404 ROUTE_NOT_FOUND
PATCH /internal/admin/routes/:id enabled=true -> re-enabled existing health route
POST /internal/admin/routes/reload -> refreshed runtime registry routeCount from 1 to 2
GET /api/product-service/health after reload without restart -> 200 OK
git status -> clean after Sprint 11 technical commits
```

Current Sprint 11 technical commits:

```txt
83c8f62 feat(gateway): add route runtime registry foundation
5c55c08 feat(gateway): expose route runtime registry status
1c759bf feat(gateway): refresh route runtime registry on reload
d96914a feat(gateway): resolve downstream routes from runtime registry
6ee93e0 feat(gateway): report partial runtime reload scope
```

Current stable meaning:

```txt
Admin can update, enable, disable, or soft-delete an existing registered route.
Admin can call POST /internal/admin/routes/reload.
Runtime registry snapshot is refreshed without restarting API Gateway.
Existing registered Fastify paths use the latest route policy/downstream config from the runtime registry.
Brand-new gateway paths still require API Gateway restart because Fastify does not yet have a catch-all dynamic router.
```

---

## Purpose of This File

This file is the main continuation document for future AI chats.

When continuing PulseGate in a new chat, provide this file first so the assistant understands:

* What PulseGate is.
* What has already been completed.
* What the current architecture is.
* What behavior is stable.
* What technical decisions have been made.
* What the current sprint status is.
* How to continue safely.
* What must not be added too early.
* How the user prefers to work and learn.
* How Docker, PostgreSQL, Prisma, Redis, route config, route management, runtime reload, Prometheus, Grafana, and CI/CD currently work.

This file should stay focused on handoff context.

`CURRENT_PROGRESS.md` should be kept more compact from Sprint 11 onward and should focus on current state, current sprint, validation, and next step.

`AI_HANDOFF.md` should carry enough context for a new AI chat to continue accurately without needing the entire old chat.

---

## User Workflow and Response Style

The user wants the assistant to work like a careful senior backend reviewer.

Preferred response language:

```txt
Vietnamese
```

Preferred workflow:

1. Explain the goal of the current checkpoint.
2. Change a small number of files at a time.
3. Provide copy/paste-ready code or full file replacements when useful.
4. Explain the purpose of each changed file.
5. Explain the request/runtime flow after implementation.
6. Ask the user to run commands.
7. Review terminal output carefully before moving forward.
8. Run `npm run test`.
9. Run `npm run typecheck`.
10. Run `npm run build`.
11. Run Docker/runtime validation when runtime behavior changes.
12. Commit only after a stable checkpoint.
13. Push after each stable commit.
14. Update documentation at the end of each sprint.
15. Avoid jumping into large features without planning.

Important style notes:

* Do not generate too much code at once.
* Do not overbuild.
* Do not silently skip tests.
* Do not claim a feature is production-ready if it is only a foundation.
* Keep sprint scope controlled.
* Prefer small, stable checkpoints.
* Be direct and practical.
* When updating documentation, preserve context and avoid accidentally deleting important sections.
* When reducing long docs, do it intentionally and keep the important current-state context.

---

## Project Goal

PulseGate is a mini API Gateway + API Management + Observability Platform.

It is inspired by:

* Kong.
* Apache APISIX.
* Tyk.
* Apigee.
* AWS API Gateway.

Long-term target users:

* Backend Developers.
* DevOps Engineers.
* SREs.
* Tech Leads.
* Teams with many APIs or microservices.

The user's long-term goal is to complete PulseGate at **"Mức 2"**:

```txt
A 100% product-like API Gateway / API Management platform,
not just a simple portfolio backend project.
```

Long-term product direction:

* API Gateway.
* API Management.
* Admin Dashboard.
* Developer Portal.
* API key request flow.
* Dynamic route configuration.
* Service discovery foundation.
* Observability stack.
* Kubernetes/cloud deployment later.
* CI/CD.
* Event streaming later.
* Background jobs later.

Long-term problems PulseGate should solve:

* Provide one entry point for many backend services.
* Route requests to the correct downstream service.
* Apply authentication and authorization policy.
* Apply API key and JWT validation.
* Apply rate limiting.
* Add request size protection.
* Add security headers.
* Add Redis response caching.
* Add request logging.
* Add Prometheus metrics.
* Add Grafana dashboard visibility.
* Store Gateway route configuration in PostgreSQL.
* Manage Gateway route configuration through internal/admin APIs.
* Validate route config before persistence and before runtime reload.
* Support runtime route policy changes safely.
* Add API consumer management later.
* Add API key lifecycle later.
* Add usage plans and quotas later.
* Add distributed tracing later.
* Add Kafka/RabbitMQ later only when the core Gateway is stable.
* Add Kubernetes/cloud deployment later only when local product behavior is stable.

---

## Current Tech Stack

Currently used:

* Node.js.
* TypeScript.
* Fastify.
* npm workspaces.
* Vitest.
* jose.
* Docker.
* Docker Compose.
* PostgreSQL.
* Prisma.
* Redis.
* prom-client.
* Prometheus.
* Grafana.
* GitHub Actions.

Current monorepo apps:

```txt
apps/api-gateway
apps/product-service
```

Current infrastructure services:

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

Current Docker containers:

```txt
pulsegate-api-gateway
pulsegate-product-service
pulsegate-postgres
pulsegate-redis
pulsegate-prometheus
pulsegate-grafana
```

---

## Current Architecture After Sprint 11

Current stable architecture:

```txt
Client
  -> API Gateway :3000
    -> Request ID handling
    -> Basic security headers
    -> Request size limit
    -> Structured access log timer
    -> Metrics timer
    -> Startup route config loading
       -> Try PostgreSQL gateway.gateway_routes active records
       -> enabled=true
       -> deleted_at IS NULL
       -> Map DB records to DownstreamRouteConfig[]
       -> Validate mapped configs
       -> Fall back to static downstreamRouteConfigs if DB fails or empty
    -> Runtime route registry
       -> Snapshot created from resolved startup routes
       -> version
       -> loadedAt
       -> routeCount
       -> routes
    -> Fastify routes registered from startup route configs
    -> Downstream proxy route
       -> For already registered paths:
          -> preHandler resolves latest route from runtime registry
          -> handler resolves latest route from runtime registry
          -> latest auth/rate-limit/cache/timeout/retry/transform policies are used
       -> If route is not in runtime registry:
          -> 404 ROUTE_NOT_FOUND
    -> Protected Product route:
       -> GET /api/products
       -> API key
       -> Redis rate limit
       -> JWT
       -> Redis response cache
       -> Product Service /products on cache MISS
    -> Public Product Service health proxy:
       -> GET /api/product-service/health
       -> No API key
       -> No JWT
       -> No Redis rate limit
       -> No Redis cache
       -> Product Service /health
    -> Internal/admin route management APIs:
       -> x-admin-api-key
       -> optional x-admin-actor
       -> CRUD route config records
       -> soft delete
       -> reload runtime registry snapshot
       -> runtime registry status
    -> /metrics

Product Service :3001
  -> Fastify
  -> Prisma
  -> PostgreSQL public.products

PostgreSQL :5432
  -> public schema
     -> Product Service data
  -> gateway schema
     -> API Gateway route config

Redis :6379
  -> rate-limit:*
  -> response-cache:*

Prometheus :9090
  -> Scrapes API Gateway /metrics

Grafana :3002
  -> Reads Prometheus datasource
  -> Displays PulseGate API Gateway Overview dashboard

GitHub Actions
  -> npm ci
  -> Prisma generate
  -> test
  -> typecheck
  -> build
  -> Docker image build validation
```

Important Sprint 11 limitation:

```txt
Runtime registry reload applies to existing registered Fastify paths only.
Brand-new gatewayPath values still require API Gateway restart.
```

Why the limitation exists:

```txt
Fastify route registration still happens at startup.
Sprint 11 intentionally avoided dynamic Fastify unregister/register at runtime.
A future sprint can add a catch-all dynamic router if full no-restart new-path support is required.
```

---

## Current API Gateway Endpoints

Current public endpoints:

```txt
GET /health
GET /metrics
GET /api/product-service/health
```

Current protected consumer endpoint:

```txt
GET /api/products
```

Current internal/admin endpoints:

```txt
GET /internal/admin/routes
GET /internal/admin/routes/runtime
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
```

Important endpoint ordering:

```txt
GET /internal/admin/routes/runtime must be registered before GET /internal/admin/routes/:id.
```

Current route protection:

```txt
GET /health
  -> Public

GET /metrics
  -> Public for local Docker observability

GET /api/product-service/health
  -> Public
  -> No x-api-key
  -> No JWT
  -> No Redis rate limit
  -> No Redis response cache

GET /api/products
  -> Requires x-api-key
  -> Requires JWT Bearer token
  -> Redis-backed rate limited by API key and route
  -> Redis response cache enabled

Internal/admin routes
  -> Require x-admin-api-key
  -> Do not use consumer x-api-key
  -> Do not use consumer JWT
  -> May use x-admin-actor for audit metadata
```

Default local keys:

```txt
x-api-key: dev-api-key
x-admin-api-key: local-admin-key
x-admin-actor: optional
```

---

## Current Runtime Route Registry

Sprint 11 added a safe runtime route registry.

Runtime registry file:

```txt
apps/api-gateway/src/runtime/route-runtime-registry.ts
```

Runtime registry test file:

```txt
apps/api-gateway/src/runtime/route-runtime-registry.test.ts
```

Current registry public API:

```txt
getSnapshot()
replaceRoutes(routes)
findRoute(method, gatewayPath)
```

Current snapshot fields:

```txt
version
loadedAt
routeCount
routes
```

Current registry behavior:

```txt
createRouteRuntimeRegistry({ initialRoutes })
  -> validates initial routes
  -> stores immutable-ish cloned snapshot
  -> version starts at 1

getSnapshot()
  -> returns cloned snapshot
  -> protects internal state from external mutation

replaceRoutes(routes)
  -> validates new route configs first
  -> if validation passes:
       -> replaces snapshot
       -> increments version
       -> sets loadedAt
       -> updates routeCount
  -> if validation fails:
       -> throws validation error
       -> keeps old snapshot unchanged

findRoute(method, gatewayPath)
  -> finds route by HTTP method and gatewayPath
  -> returns cloned route config or null
```

Why this design matters:

* Runtime config updates become safer.
* Invalid reload cannot corrupt current runtime state.
* Proxy can read latest route policy per request.
* The system avoids unsafe Fastify route unregister/register.
* It creates a foundation for more dynamic routing later.

---

## Current Runtime Status Endpoint

Sprint 11 added:

```txt
GET /internal/admin/routes/runtime
```

Authentication:

```txt
x-admin-api-key required
```

Successful response shape:

```json
{
  "data": {
    "mode": "runtime-registry",
    "available": true,
    "version": 1,
    "loadedAt": "2026-07-02T00:00:00.000Z",
    "routeCount": 2,
    "routes": [
      {
        "method": "GET",
        "gatewayPath": "/api/products",
        "serviceName": "product-service"
      },
      {
        "method": "GET",
        "gatewayPath": "/api/product-service/health",
        "serviceName": "product-service"
      }
    ]
  }
}
```

Unavailable response shape:

```json
{
  "data": {
    "mode": "runtime-registry",
    "available": false,
    "version": null,
    "loadedAt": null,
    "routeCount": 0,
    "routes": []
  }
}
```

Current tests cover:

```txt
GET /internal/admin/routes/runtime with admin key -> 200
GET /internal/admin/routes/runtime without admin key -> 401 ADMIN_API_KEY_MISSING
```

---

## Current Reload Behavior After Sprint 11

Endpoint:

```txt
POST /internal/admin/routes/reload
```

Authentication:

```txt
x-admin-api-key required
```

Required PowerShell body note:

```txt
Use Content-Type application/json and Body "{}".
Without Content-Type and body, Fastify may reject the request before the handler.
```

Current reload flow:

```txt
Admin Client
  -> POST /internal/admin/routes/reload
  -> API Gateway checks x-admin-api-key
  -> Repository reads route configs from PostgreSQL
  -> Filters active runtime routes:
       -> enabled=true
       -> deletedAt=null
  -> Maps DB route records to DownstreamRouteConfig[]
  -> Validates mapped configs
  -> Replaces runtime registry snapshot
  -> Returns reload metadata
```

Successful reload response metadata:

```txt
mode: runtime-registry-refresh
registryAvailable: true
registryApplied: true
runtimeApplied: true
runtimeScope: registered-routes-only
newRoutesRequireRestart: true
requiresRestart: true
previousVersion: number
currentVersion: number
loadedAt: ISO timestamp
routeCount: number
routes: lightweight route summaries
```

Example successful response:

```json
{
  "data": {
    "mode": "runtime-registry-refresh",
    "registryAvailable": true,
    "registryApplied": true,
    "runtimeApplied": true,
    "runtimeScope": "registered-routes-only",
    "newRoutesRequireRestart": true,
    "requiresRestart": true,
    "previousVersion": 1,
    "currentVersion": 2,
    "loadedAt": "2026-07-02T13:57:53.353Z",
    "routeCount": 2,
    "routes": [
      {
        "method": "GET",
        "gatewayPath": "/api/products",
        "serviceName": "product-service"
      },
      {
        "method": "GET",
        "gatewayPath": "/api/product-service/health",
        "serviceName": "product-service"
      }
    ]
  }
}
```

Important semantic correction from Sprint 10 to Sprint 11:

```txt
Sprint 10 reload:
  -> validation-only
  -> runtimeApplied=false
  -> requiresRestart=true

Sprint 11 reload:
  -> runtime registry refresh
  -> runtimeApplied=true for existing registered routes
  -> runtimeScope=registered-routes-only
  -> newRoutesRequireRestart=true
  -> requiresRestart=true because brand-new gateway paths still require restart
```

Current Docker validation proved:

```txt
Disable existing health route
  -> PATCH /internal/admin/routes/:id { "enabled": false }
  -> POST /internal/admin/routes/reload
  -> routeCount changed from 2 to 1
  -> GET /api/product-service/health returned 404 ROUTE_NOT_FOUND without restart

Re-enable existing health route
  -> PATCH /internal/admin/routes/:id { "enabled": true }
  -> POST /internal/admin/routes/reload
  -> routeCount changed from 1 to 2
  -> GET /api/product-service/health returned 200 OK without restart
```

Known limitation:

```txt
Creating a completely new gatewayPath can be saved to DB and validated,
but Fastify will not match it until API Gateway restart.

Reason:
  Fastify does not know that path unless it was registered at startup.

Future solution:
  Add a controlled catch-all dynamic route dispatcher,
  or redesign route registration lifecycle carefully.
```

---

## Current Downstream Proxy Runtime Behavior

Main proxy file:

```txt
apps/api-gateway/src/routes/product-proxy.route.ts
```

Important naming note:

```txt
The file name is still product-proxy.route.ts.
Sprint 7 refactored internals to include a generic downstreamProxyRoute().
productProxyRoute() remains as a compatibility wrapper.
A future cleanup sprint may rename this file to downstream-proxy.route.ts.
```

Sprint 11 change:

```txt
Downstream proxy now receives routeRuntimeRegistry.
Pre-handler and handler resolve latest route config from runtime registry per request.
```

Why both pre-handler and handler must use registry:

```txt
Auth, rateLimit, JWT, and cache behavior depend on route policy.
Before Sprint 11, preHandler closed over startup route config.
If only the handler used the registry, auth/rateLimit/JWT policies could become stale.
Sprint 11 changed both preHandler and handler to lookup runtime route config.
```

Current runtime route lookup behavior:

```txt
Request to registered Fastify path
  -> resolve route from runtime registry by method + gatewayPath
  -> if found:
       -> apply latest runtime auth policy
       -> apply latest runtime rate limit policy
       -> apply latest runtime JWT policy
       -> apply latest runtime cache policy
       -> use latest downstreamUrl
       -> use latest timeout/retry/transform policy
  -> if not found:
       -> 404 ROUTE_NOT_FOUND
```

Current test coverage:

```txt
app.test.ts
  -> should use runtime registry snapshot when handling product route traffic
  -> first GET /api/products succeeds with route in registry
  -> registry is replaced without product route
  -> second GET /api/products returns 404 ROUTE_NOT_FOUND
  -> downstream fetch mock is only called once
```

---

## Current Database Route Config Behavior

Database table:

```txt
gateway.gateway_routes
```

Current PostgreSQL schemas:

```txt
public
gateway
```

Product Service owns:

```txt
public.products
public._prisma_migrations
```

API Gateway owns:

```txt
gateway.gateway_routes
gateway._prisma_migrations
```

Current API Gateway migrations:

```txt
apps/api-gateway/prisma/migrations/20260701063629_add_gateway_routes/migration.sql
apps/api-gateway/prisma/migrations/20260702090000_add_gateway_route_soft_delete/migration.sql
```

Current important route config columns:

```txt
id
service_name
gateway_path
downstream_url
method
enabled
priority
require_api_key
require_jwt
timeout_enabled
timeout_ms
cache_enabled
cache_ttl_seconds
rate_limit_enabled
rate_limit_limit
rate_limit_window_ms
request_transform_enabled
request_add_headers
request_remove_headers
response_transform_enabled
response_add_headers
response_remove_headers
retry_enabled
retry_attempts
retry_on_statuses
created_at
updated_at
created_by
updated_by
deleted_at
deleted_by
```

Current important indexes:

```txt
gateway_routes_enabled_priority_idx
gateway_routes_deleted_at_idx
gateway_routes_enabled_deleted_at_priority_idx
gateway_routes_method_gateway_path_active_key
```

Current active route uniqueness:

```sql
CREATE UNIQUE INDEX gateway_routes_method_gateway_path_active_key
ON gateway.gateway_routes(method, gateway_path)
WHERE deleted_at IS NULL;
```

Design meaning:

```txt
Only active/non-deleted routes must be unique by method + gateway_path.
Soft-deleted historical rows can keep the same method + gateway_path.
A route can be recreated after the previous active record has been soft-deleted.
```

Current active runtime route definition:

```txt
enabled = true
deleted_at IS NULL
```

Current admin-visible route definition:

```txt
deleted_at IS NULL
```

Meaning:

```txt
Enabled routes and disabled routes are visible to admin if not deleted.
Soft-deleted routes are hidden from admin list/detail APIs.
Only enabled + non-deleted routes are loaded into runtime.
```

Current seeded active routes:

```txt
GET /api/products
GET /api/product-service/health
```

Current route config source priority:

```txt
1. PostgreSQL gateway.gateway_routes active records
2. Static downstreamRouteConfigs fallback
```

Fallback scenarios:

```txt
DATABASE_URL missing
PostgreSQL unavailable
Prisma Client initialization error
gateway.gateway_routes unavailable
DB query error
DB route mapping error
DB route validation error
DB returns zero active routes
```

Fallback result:

```txt
API Gateway uses static downstreamRouteConfigs.
```

Important DB design decision:

```txt
API Gateway uses PostgreSQL schema gateway instead of public.
This avoids Prisma migration drift with Product Service,
because Product Service already owns public migration history.
```

---

## Current Route Management API Behavior

Route management files:

```txt
apps/api-gateway/src/middlewares/admin-api-key-auth.middleware.ts
apps/api-gateway/src/routes/admin-route-config.route.ts
apps/api-gateway/src/routes/admin-route-config.route.test.ts
apps/api-gateway/src/route-management/route-management.types.ts
apps/api-gateway/src/route-management/route-management.mapper.ts
apps/api-gateway/src/route-management/route-management.repository.ts
```

Current admin auth:

```txt
Header: x-admin-api-key
Default local value: local-admin-key
```

Current admin actor:

```txt
Header: x-admin-actor
Default fallback: admin-api-key
```

Current repository behavior:

```txt
listRoutes()
  -> returns non-deleted routes ordered by priority and gatewayPath
  -> includes disabled non-deleted routes

findRouteById(id)
  -> returns one non-deleted route or null

findRouteByMethodAndGatewayPath(method, gatewayPath)
  -> returns one conflicting non-deleted route or null

createRoute(data)
  -> inserts route config into gateway.gateway_routes
  -> stores createdBy and updatedBy

updateRoute(id, data)
  -> updates non-deleted route config
  -> stores updatedBy

softDeleteRoute(id, actor)
  -> sets enabled=false
  -> sets deletedAt
  -> sets deletedBy
  -> sets updatedBy
```

Current create flow:

```txt
POST /internal/admin/routes
  -> x-admin-api-key
  -> optional x-admin-actor
  -> parse request body
  -> map to DownstreamRouteConfig
  -> validateDownstreamRoutes()
  -> check duplicate active method + gatewayPath
  -> insert route
  -> return 201 Created
```

Current update flow:

```txt
PATCH /internal/admin/routes/:id
  -> x-admin-api-key
  -> optional x-admin-actor
  -> find existing non-deleted route
  -> merge patch body with existing route
  -> map merged data to DownstreamRouteConfig
  -> validateDownstreamRoutes()
  -> check conflict with another active route
  -> update route
  -> return 200 OK
```

Current soft delete flow:

```txt
DELETE /internal/admin/routes/:id
  -> x-admin-api-key
  -> optional x-admin-actor
  -> find existing non-deleted route
  -> set enabled=false
  -> set deleted_at
  -> set deleted_by
  -> set updated_by
  -> return 200 OK
```

Current error responses:

```txt
Missing admin API key
  -> 401 ADMIN_API_KEY_MISSING

Invalid admin API key
  -> 403 ADMIN_API_KEY_INVALID

Route config not found
  -> 404 ROUTE_CONFIG_NOT_FOUND

Runtime route not found
  -> 404 ROUTE_NOT_FOUND

Invalid route config
  -> 400 ROUTE_CONFIG_INVALID

Duplicate active method + gatewayPath
  -> 409 ROUTE_CONFIG_ALREADY_EXISTS

Reload validation failed
  -> 400 ROUTE_CONFIG_RELOAD_VALIDATION_FAILED
```

---

## Current Product Route Behavior

Protected route:

```txt
GET /api/products
```

Requires:

```txt
x-api-key: dev-api-key
Authorization: Bearer <jwt-token>
```

Runtime flow:

```txt
Client
  -> GET /api/products
  -> API Gateway creates/reuses x-request-id
  -> security headers
  -> request size limit
  -> runtime registry lookup
  -> API key auth
  -> Redis-backed rate limit
  -> JWT auth
  -> Redis response cache
     -> HIT:
        -> response transform
        -> return cached products
        -> x-cache: HIT
     -> MISS:
        -> request transform
        -> timeout policy
        -> retry policy foundation
        -> Product Service /products
        -> Prisma
        -> PostgreSQL public.products
        -> cache write
        -> response transform
        -> x-cache: MISS
  -> x-response-time-ms
  -> metrics
  -> structured access log
```

Current expected product response:

```json
{
  "data": [
    {
      "id": "prod_001",
      "name": "Mechanical Keyboard",
      "price": 120
    },
    {
      "id": "prod_002",
      "name": "Gaming Mouse",
      "price": 45
    }
  ]
}
```

Current response cache behavior:

```txt
Request 1 after cache clear -> 200, x-cache: MISS
Request 2 within TTL -> 200, x-cache: HIT
```

Current rate limit default:

```txt
5 requests per 60 seconds
```

Current rate limit identity:

```txt
API key + HTTP method + route path
```

Example Redis rate limit key:

```txt
rate-limit:api-key:dev-api-key:route:GET:/api/products
```

Example Redis response cache key:

```txt
response-cache:GET:/api/products
```

---

## Current Public Health Proxy Behavior

Public route:

```txt
GET /api/product-service/health
```

Does not require:

```txt
x-api-key
JWT
Redis rate limit
Redis response cache
```

Runtime flow:

```txt
Client
  -> GET /api/product-service/health
  -> API Gateway creates/reuses x-request-id
  -> security headers
  -> request size limit
  -> runtime registry lookup
  -> no consumer auth
  -> no consumer rate limit
  -> no JWT
  -> no response cache
  -> Product Service /health
  -> x-cache: BYPASS
  -> x-response-time-ms
  -> metrics
  -> structured access log
```

Expected response:

```json
{
  "service": "product-service",
  "status": "ok",
  "timestamp": "2026-07-02T13:57:59.786Z"
}
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

Current endpoints:

```txt
GET /health
GET /products
```

Current responsibilities:

* Provide Product Service health check.
* Return database-backed product list.
* Use Prisma Client.
* Read from PostgreSQL `public.products`.
* Generate/reuse request ID.
* Reuse `x-request-id` forwarded by API Gateway.
* Handle 404 and 500.
* Log requests in JSON format.
* Disconnect Prisma on server close.
* Support Docker and CI build validation.

Current product database table:

```txt
public.products
```

Current seeded products:

```txt
prod_001 - Mechanical Keyboard - 120
prod_002 - Gaming Mouse - 45
```

---

## Current Route Policy Model

Current route policy type file:

```txt
apps/api-gateway/src/policies/route-policy.types.ts
```

Current policy model:

```txt
RoutePolicies
  -> auth
  -> timeout
  -> cache
  -> rateLimit
  -> requestTransform
  -> responseTransform
  -> retry
```

Current product route policy:

```txt
GET /api/products
  -> auth.requireApiKey: true
  -> auth.requireJwt: true
  -> timeout.enabled: true
  -> timeout.timeoutMs: 3000
  -> cache.enabled: true
  -> cache.ttlSeconds: 30
  -> rateLimit.enabled: true
  -> rateLimit.limit: 5
  -> rateLimit.windowMs: 60000
  -> requestTransform.enabled: false
  -> responseTransform.enabled: false
  -> retry.enabled: false
  -> retry.attempts: 0
  -> retry.retryOnStatuses: [502, 503, 504]
```

Current health route policy:

```txt
GET /api/product-service/health
  -> auth.requireApiKey: false
  -> auth.requireJwt: false
  -> timeout.enabled: true
  -> timeout.timeoutMs: 3000
  -> cache.enabled: false
  -> rateLimit.enabled: false
  -> requestTransform.enabled: false
  -> responseTransform.enabled: false
  -> retry.enabled: false
```

Current policy helper files:

```txt
apps/api-gateway/src/policies/timeout.policy.ts
apps/api-gateway/src/policies/cache.policy.ts
apps/api-gateway/src/policies/rate-limit.policy.ts
apps/api-gateway/src/policies/request-transform.policy.ts
apps/api-gateway/src/policies/response-transform.policy.ts
apps/api-gateway/src/policies/retry.policy.ts
```

Current validation checks:

```txt
serviceName must be present
gatewayPath must start with /
method must be supported
downstreamUrl must be valid http/https URL
timeoutMs must be positive when timeout is enabled
cache ttlSeconds must be positive when cache is enabled
rate limit limit/windowMs must be positive when rate limit is enabled
request transform header names must be valid HTTP header names
response transform header names must be valid HTTP header names
retry attempts must be non-negative
retry attempts must be greater than 0 when retry is enabled
retryOnStatuses must not be empty when retry is enabled
retryOnStatuses must contain valid HTTP status codes
duplicate active method + gatewayPath routes are rejected
```

---

## Current Observability

Structured access log event:

```txt
http_request_completed
```

Structured access log fields:

```txt
requestId
method
path
route
statusCode
durationMs
cacheStatus
userAgent
remoteAddress
```

Sensitive headers are intentionally not logged:

```txt
x-api-key
x-admin-api-key
authorization
cookie
```

Response latency header:

```txt
x-response-time-ms
```

Metrics endpoint:

```txt
GET /metrics
```

Current metrics:

```txt
http_requests_total
http_request_duration_seconds
http_response_cache_total
```

Current cache statuses:

```txt
HIT
MISS
BYPASS
```

Prometheus URL:

```txt
http://localhost:9090
```

Prometheus scrape target:

```txt
http://api-gateway:3000/metrics
```

Grafana URL:

```txt
http://localhost:3002
```

Grafana login:

```txt
username: admin
password: admin
```

Grafana dashboard:

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

## Current CI/CD

Workflow file:

```txt
.github/workflows/ci.yml
```

Workflow name:

```txt
CI
```

Job name:

```txt
Test, Typecheck, and Build
```

Triggers:

```txt
push to main
pull_request to main
```

CI steps:

```txt
Checkout repository
Setup Node.js 20
npm ci
Generate Product Service Prisma Client
Generate API Gateway Prisma Client
npm run test
npm run typecheck
npm run build
docker build -t pulsegate-api-gateway:ci -f apps/api-gateway/Dockerfile .
docker build -t pulsegate-product-service:ci -f apps/product-service/Dockerfile .
```

Current CI status:

```txt
CI -> passing
README CI badge -> passing
```

---

## Environment Configuration

API Gateway env values:

```txt
PORT
HOST
PRODUCT_SERVICE_URL
DOWNSTREAM_REQUEST_TIMEOUT_MS
MAX_REQUEST_BODY_BYTES
API_KEY_HEADER
API_KEYS
ADMIN_API_KEY_HEADER
ADMIN_API_KEY
JWT_SECRET
JWT_ISSUER
JWT_AUDIENCE
JWT_EXPIRES_IN_SECONDS
PRODUCT_PRODUCTS_RATE_LIMIT_MAX_REQUESTS
PRODUCT_PRODUCTS_RATE_LIMIT_WINDOW_MS
REDIS_URL
```

Important API Gateway Prisma note:

```txt
API Gateway DATABASE_URL is read by Prisma from process.env.DATABASE_URL.
It is not currently parsed through apps/api-gateway/src/config/env.ts.
```

Default local API Gateway values:

```txt
PORT=3000
HOST=0.0.0.0
PRODUCT_SERVICE_URL=http://127.0.0.1:3001
DOWNSTREAM_REQUEST_TIMEOUT_MS=3000
MAX_REQUEST_BODY_BYTES=1048576
API_KEY_HEADER=x-api-key
API_KEYS=dev-api-key
ADMIN_API_KEY_HEADER=x-admin-api-key
ADMIN_API_KEY=local-admin-key
JWT_SECRET=local-dev-jwt-secret-change-me
JWT_ISSUER=pulsegate-api-gateway
JWT_AUDIENCE=pulsegate-clients
JWT_EXPIRES_IN_SECONDS=900
PRODUCT_PRODUCTS_RATE_LIMIT_MAX_REQUESTS=5
PRODUCT_PRODUCTS_RATE_LIMIT_WINDOW_MS=60000
REDIS_URL=redis://localhost:6379
```

Docker internal values:

```txt
PRODUCT_SERVICE_URL=http://product-service:3001
API Gateway DATABASE_URL=postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate?schema=gateway
Product Service DATABASE_URL=postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate
REDIS_URL=redis://redis:6379
Prometheus target=http://api-gateway:3000/metrics
Grafana Prometheus datasource=http://prometheus:9090
```

---

## Repository Structure

Current important structure:

```txt
pulsegate/
  .github/
    workflows/
      ci.yml

  apps/
    api-gateway/
      Dockerfile
      prisma/
        migrations/
          20260701063629_add_gateway_routes/
          20260702090000_add_gateway_route_soft_delete/
        schema.prisma
        seed.ts
      src/
        app.ts
        app.test.ts
        cache/
        config/
        database/
        errors/
        middlewares/
        observability/
        policies/
        rate-limit/
        redis/
        route-management/
        routes/
          admin-route-config.route.ts
          admin-route-config.route.test.ts
          health.route.ts
          metrics.route.ts
          metrics.route.test.ts
          product-proxy.route.ts
        runtime/
          route-runtime-registry.ts
          route-runtime-registry.test.ts
        server.ts

    product-service/
      Dockerfile
      prisma/
        migrations/
          20260628092746_init_products/
        schema.prisma
        seed.ts
        tsconfig.json
      src/
        config/
        database/
        middlewares/
        products/
        routes/
        server.ts

  observability/
    prometheus/
      prometheus.yml
    grafana/
      dashboards/
        api-gateway-overview.json
      provisioning/
        dashboards/
        datasources/

  docs/
    architecture/
      overview.md
    sdlc/
      requirements.md
    project-context/
      CURRENT_PROGRESS.md
      DECISION_LOG.md
      AI_HANDOFF.md

  docker-compose.yml
  .dockerignore
  .env.example
  .gitattributes
  .gitignore
  package.json
  package-lock.json
  README.md
```

---

## Current Commands

Run full Docker stack:

```powershell
docker compose up --build -d
```

Check Docker services:

```powershell
docker compose ps
```

Stop Docker stack:

```powershell
docker compose down
```

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

Run CI-equivalent validation locally:

```powershell
npm ci
npm run db:generate -w apps/product-service
npm run db:generate -w apps/api-gateway
npm run test
npm run typecheck
npm run build
docker build -t pulsegate-api-gateway:ci -f apps/api-gateway/Dockerfile .
docker build -t pulsegate-product-service:ci -f apps/product-service/Dockerfile .
```

Generate Product Service Prisma Client:

```powershell
npm run db:generate -w apps/product-service
```

Generate API Gateway Prisma Client:

```powershell
npm run db:generate -w apps/api-gateway
```

Apply API Gateway migration:

```powershell
$env:DATABASE_URL="postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway"

npm run db:migrate:deploy -w apps/api-gateway
```

Seed API Gateway route config:

```powershell
$env:DATABASE_URL="postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway"

npm run db:seed -w apps/api-gateway
```

Validate active route configs:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "SELECT method, gateway_path, enabled, deleted_at FROM gateway.gateway_routes WHERE deleted_at IS NULL ORDER BY priority, gateway_path;"
```

Expected active routes:

```txt
GET /api/products
GET /api/product-service/health
```

Validate Redis:

```powershell
docker compose exec redis redis-cli ping
```

Expected:

```txt
PONG
```

Test API Gateway health:

```powershell
Invoke-RestMethod http://localhost:3000/health | ConvertTo-Json -Depth 10
```

Test metrics:

```powershell
Invoke-WebRequest http://localhost:3000/metrics -UseBasicParsing
```

Test Product Service health through Gateway:

```powershell
Invoke-WebRequest http://localhost:3000/api/product-service/health -UseBasicParsing
```

Test runtime registry status:

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes/runtime `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } |
  ConvertTo-Json -Depth 10
```

Test route reload:

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes/reload `
  -Method POST `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } `
  -ContentType "application/json" `
  -Body "{}" |
  ConvertTo-Json -Depth 10
```

Expected reload metadata after Sprint 11:

```txt
mode: runtime-registry-refresh
registryAvailable: true
registryApplied: true
runtimeApplied: true
runtimeScope: registered-routes-only
newRoutesRequireRestart: true
requiresRestart: true
routeCount: 2
```

Create local development JWT token:

```powershell
$token = node --input-type=module -e "import { SignJWT } from 'jose'; const secretKey = new TextEncoder().encode('local-dev-jwt-secret-change-me'); const expiresAt = Math.floor(Date.now() / 1000) + 900; const token = await new SignJWT({ role: 'user' }).setProtectedHeader({ alg: 'HS256' }).setSubject('user_123').setIssuer('pulsegate-api-gateway').setAudience('pulsegate-clients').setExpirationTime(expiresAt).sign(secretKey); console.log(token);"
```

Create product request headers:

```powershell
$headers = @{
  "x-api-key" = "dev-api-key"
  "authorization" = "Bearer $token"
}
```

Test protected products:

```powershell
Invoke-RestMethod http://localhost:3000/api/products `
  -Headers $headers |
  ConvertTo-Json -Depth 10
```

Test response cache MISS/HIT:

```powershell
docker compose exec redis redis-cli DEL "response-cache:GET:/api/products"
docker compose exec redis redis-cli DEL "rate-limit:api-key:dev-api-key:route:GET:/api/products"

$res1 = Invoke-WebRequest http://localhost:3000/api/products `
  -Headers $headers `
  -UseBasicParsing

$res1.StatusCode
$res1.Headers["x-cache"]
$res1.Headers["x-response-time-ms"]

$res2 = Invoke-WebRequest http://localhost:3000/api/products `
  -Headers $headers `
  -UseBasicParsing

$res2.StatusCode
$res2.Headers["x-cache"]
$res2.Headers["x-response-time-ms"]
```

Expected:

```txt
Request 1 -> 200, x-cache: MISS
Request 2 -> 200, x-cache: HIT
```

---

## Completed Sprint Summary

### Sprint 0

Completed basic monorepo setup, API Gateway, Product Service, request ID propagation, basic routes, TypeScript build, README and initial docs.

### Sprint 1

Completed normalized downstream errors, timeout handling, route config foundation, API key auth, JWT auth, and integration test foundation.

### Sprint 2

Completed in-memory rate limiting, rate limit middleware, route-level auth config, request size limit, and basic security headers.

### Sprint 3

Completed Docker Compose foundation, PostgreSQL-backed Product Service, Redis service, Redis-backed rate limiting, and Redis response caching.

### Sprint 4

Completed structured access logs, response time header, Prometheus metrics endpoint, Prometheus service, Grafana service, datasource provisioning, and dashboard foundation.

### Sprint 5

Completed route policy type foundation, route config validation, per-route timeout/cache/rate-limit helpers, request/response transform foundations, and upstream retry foundation.

### Sprint 6

Completed GitHub Actions CI/CD foundation with npm ci, Prisma generate, tests, typecheck, build, and Docker image build validation.

### Sprint 7

Completed generic downstream proxy route foundation, Product Service health route config, and multi-route Gateway routing.

### Sprint 8

Completed API Gateway PostgreSQL route config schema, seed data, database route mapper, runtime DB route loader, static fallback, API Gateway Prisma client generation in CI and Docker.

### Sprint 9

Completed internal/admin route management API foundation: list, detail, create, update, enable/disable, validation, duplicate checks, and admin API key auth.

### Sprint 10

Completed route management hardening: soft delete, audit metadata, x-admin-actor, active-only partial unique index, admin filtering for deleted routes, runtime loader filtering, recreate-after-soft-delete behavior, and reload validation endpoint.

### Sprint 11

Completed route runtime reload/admin hardening foundation:

* Runtime route registry.
* Runtime registry snapshot with version, loadedAt, routeCount, routes.
* Runtime registry validation before replacement.
* Runtime registry status endpoint.
* Reload endpoint refreshes runtime registry snapshot.
* Downstream proxy pre-handler reads latest runtime route policy.
* Downstream proxy handler reads latest runtime route config.
* Existing registered routes can be disabled/enabled and reloaded without restarting API Gateway.
* Reload response accurately reports partial runtime apply.
* Known limitation remains: brand-new gateway paths still require restart.

---

## Current Stable Commits

### Sprint 11

```txt
83c8f62 feat(gateway): add route runtime registry foundation
5c55c08 feat(gateway): expose route runtime registry status
1c759bf feat(gateway): refresh route runtime registry on reload
d96914a feat(gateway): resolve downstream routes from runtime registry
6ee93e0 feat(gateway): report partial runtime reload scope
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

### Sprint 8

```txt
01a32ac feat(gateway): add route config database schema
ff105f6 feat(gateway): seed route config data
a1785dc feat(gateway): map database route configs
6f67cb7 feat(gateway): load runtime route configs with fallback
951139c chore(gateway): configure database route config runtime
6d8f6ab docs: finalize sprint 8 documentation
```

### Sprint 7

```txt
f825b61 refactor(gateway): add generic downstream proxy route
2e65849 feat(gateway): add product service health route config
db97b76 feat(gateway): register downstream routes from config
ae96ab3 test(gateway): cover product service health proxy route
41fed83 docs: finalize sprint 7 documentation
```

### Sprint 6

```txt
b2b8929 ci: add github actions workflow
e102aa0 ci: add docker image build validation
d06e0e7 docs: add ci badge to readme
0f83248 docs: finalize sprint 6 documentation
```

---

## Current Next Step

Current next step:

```txt
Sprint 11 - Final Documentation Update
```

Documentation files being updated:

```txt
README.md
docs/architecture/overview.md
docs/project-context/CURRENT_PROGRESS.md
docs/project-context/AI_HANDOFF.md
docs/project-context/DECISION_LOG.md
docs/sdlc/requirements.md
```

Important Sprint 11 documentation points:

```txt
v0.12.0
28 test files
189 tests
Runtime route registry
GET /internal/admin/routes/runtime
POST /internal/admin/routes/reload now refreshes runtime registry
runtimeApplied=true for existing registered routes
runtimeScope=registered-routes-only
newRoutesRequireRestart=true
requiresRestart=true
Brand-new gateway paths still require restart
Avoided unsafe Fastify dynamic unregister/register
Existing routes can be enabled/disabled and reloaded without API Gateway restart
```

After all Sprint 11 documentation files are updated, run:

```powershell
npm run test
npm run typecheck
npm run build
git status
```

Then commit docs with:

```txt
docs: finalize sprint 11 documentation
```

After Sprint 11 docs are committed and pushed, recommended Sprint 12 options:

```txt
Option 1:
Sprint 12 - Full Dynamic Route Dispatch Foundation
  -> Add a safe catch-all dynamic router so brand-new gateway paths can work without restart.

Option 2:
Sprint 12 - Admin Auth / RBAC Hardening
  -> Replace simple local admin API key with stronger admin auth/RBAC foundation.

Option 3:
Sprint 12 - Admin Dashboard Foundation
  -> Start UI only after backend docs are stable.

Recommended technical order:
  If the goal is to complete API Gateway core first, choose Option 1 before Admin Dashboard.
```

---

## Do Not Add Yet Without Planned Sprint

Do not jump to these too early:

* Kafka.
* RabbitMQ.
* Kubernetes.
* Developer Portal.
* Advanced OpenTelemetry tracing.
* Loki centralized logs.
* k6 load testing.
* Complex service discovery.
* Production cloud deployment.
* Docker image registry push.
* Automatic deployment.

Admin Dashboard should only start when the backend route management lifecycle and docs are stable.

Kafka/RabbitMQ/Kubernetes should wait until core Gateway routing, route policy, route config, reload behavior, admin APIs, and observability are stable.

---

## Important Technical Decisions

### DB Schema Separation

```txt
Product Service uses public schema.
API Gateway uses gateway schema.
```

Reason:

```txt
Avoid Prisma migration drift between Product Service and API Gateway.
Keep service-owned database objects separated.
```

### Static Fallback Is Required

```txt
API Gateway should fall back to static downstreamRouteConfigs when DB route loading fails or returns no active routes.
```

Reason:

```txt
Gateway startup remains safe.
Local development remains recoverable.
DB config rollout remains safer.
```

### Soft Delete Instead of Hard Delete

```txt
DELETE /internal/admin/routes/:id soft-deletes route config.
```

Reason:

```txt
Preserve historical route records.
Allow audit-friendly behavior.
Allow recreation of same route path through active-only partial unique index.
```

### Runtime Registry Instead of Fastify Hot Unregister/Register

```txt
Sprint 11 uses runtime registry snapshot replacement.
It does not dynamically unregister/register Fastify routes.
```

Reason:

```txt
Fastify runtime route mutation can create stale handlers, duplicate conflicts, or inconsistent routing.
Runtime registry is safer and easier to test.
```

### Reload Metadata Must Be Honest

```txt
runtimeApplied=true
runtimeScope=registered-routes-only
newRoutesRequireRestart=true
requiresRestart=true
```

Reason:

```txt
Reload now affects existing registered route behavior,
but brand-new paths still require restart.
```

---

## How the Assistant Should Continue

When continuing from this file, the assistant should continue with:

```txt
Sprint 11 - Final Documentation Update
```

If Sprint 11 final docs are already committed, continue with Sprint 12 planning.

Before coding the next step, the assistant should explain:

* What problem the checkpoint solves.
* What behavior will change.
* What files will be changed.
* What tests should pass.
* What Docker/runtime checks are needed.
* What the commit message should be.

The assistant should continue slowly, one file or one checkpoint at a time.

The assistant should not skip directly to Kafka, RabbitMQ, Kubernetes, Developer Portal, production cloud deployment, Loki, k6, Docker image registry push, or advanced OpenTelemetry unless the user explicitly chooses that as the next sprint.

For the next technical sprint, preserve the current safety model:

```txt
Database route config first.
Static fallback still available.
Validation before persistence.
Validation before runtime registry replacement.
Small admin route management API surface.
No unsafe Fastify route mutation.
No overbuilding.
```

