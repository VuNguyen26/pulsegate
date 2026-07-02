# AI Handoff

## Project Name

PulseGate - High-Traffic API Gateway & Observability Platform

## Current Version

v0.11.0

## Current Sprint

Sprint 10 - Route Management Hardening

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

Sprint 10 technical implementation is complete.

Sprint 10 final documentation update is in progress.

PulseGate currently has a stable local-first API Gateway, infrastructure foundation, observability foundation, route policy foundation, CI/CD foundation, static multi-route fallback, database-backed dynamic Gateway route configuration, internal/admin route management API foundation, and route management hardening with:

* Docker Compose.
* API Gateway container.
* Product Service container.
* PostgreSQL.
* Prisma.
* PostgreSQL-backed Product Service data.
* PostgreSQL-backed API Gateway route config.
* Dedicated PostgreSQL schema `public` for Product Service data.
* Dedicated PostgreSQL schema `gateway` for API Gateway route config.
* API Gateway Prisma schema.
* API Gateway Prisma migration.
* API Gateway route config seed script.
* `gateway.gateway_routes` table.
* Runtime route config loading from database.
* Safe static route config fallback.
* Database route config mapper.
* Database route config repository.
* Gateway Prisma Client wrapper.
* Internal/admin route management API.
* Admin API key authentication for internal/admin APIs.
* Route config list API.
* Route config detail API.
* Route config create API.
* Route config update API.
* Route config enable/disable foundation through PATCH.
* Route config soft delete endpoint.
* `DELETE /internal/admin/routes/:id`.
* Route soft delete metadata: `deleted_at`, `deleted_by`, and `updated_by`.
* Route audit metadata: `created_by` and `updated_by`.
* Admin actor capture through `x-admin-actor`.
* Active-route partial unique index for `method + gateway_path`.
* Deleted route exclusion from admin list/detail/duplicate lookup.
* Deleted route exclusion from runtime route loading.
* Ability to recreate the same `method + gatewayPath` after the previous route is soft deleted.
* Safe route reload validation endpoint.
* `POST /internal/admin/routes/reload`.
* Reload validation response: `mode=validation-only`, `runtimeApplied=false`, `requiresRestart=true`.
* Route config validation before persistence.
* Duplicate method + gatewayPath conflict detection for active routes.
* Simple restart-based route config reload strategy.
* Redis.
* Redis-backed rate limiting.
* Redis response caching.
* API key authentication.
* JWT authentication.
* Request size protection.
* Basic security headers.
* Downstream timeout handling.
* Normalized downstream error handling.
* Structured access logs.
* Request latency measurement.
* `x-response-time-ms` response header.
* Prometheus-compatible metrics endpoint.
* Prometheus Docker service.
* Prometheus scrape configuration.
* Grafana Docker service.
* Grafana Prometheus datasource provisioning.
* Grafana dashboard provisioning.
* API Gateway overview dashboard foundation.
* Route policy type foundation.
* Route policy configuration validation.
* Per-route timeout policy helper.
* Per-route cache policy helper.
* Per-route rate limit policy helper.
* Request transformation policy foundation.
* Response transformation policy foundation.
* Upstream retry policy foundation.
* Generic downstream proxy route foundation.
* Static multi-route downstream route configuration fallback.
* Protected Product route.
* Public Product Service health proxy route.
* Route policy integration tests.
* Multi-route integration tests.
* Database route config mapper tests.
* Runtime route config fallback tests.
* Route management API tests.
* Automated tests.
* GitHub Actions CI workflow.
* CI trigger on push to `main`.
* CI trigger on pull request to `main`.
* Clean dependency installation with `npm ci`.
* Product Service Prisma Client generation in CI.
* API Gateway Prisma Client generation in CI.
* Automated test validation in CI.
* TypeScript typecheck validation in CI.
* Build validation in CI.
* API Gateway Docker image build validation in CI.
* Product Service Docker image build validation in CI.
* API Gateway Prisma Client generation inside Docker image.
* README CI status badge.

Current automated test status:

```txt
27 test files passed
176 tests passed
```

Latest validation status:

```txt
npm run test       -> passed
npm run typecheck  -> passed
npm run build      -> passed
docker compose up -d --build -> passed
docker compose ps -> passed
GET /internal/admin/routes with x-admin-api-key -> returned 2 active seeded routes
POST /internal/admin/routes -> created temporary route /api/product-service/health-copy
docker compose restart api-gateway -> routeCount became 3 while temp route was active
GET /api/product-service/health-copy -> 200 OK while active after restart
DELETE /internal/admin/routes/:id -> soft deleted temporary route
Soft delete response -> enabled=false, deletedAt set, deletedBy captured from x-admin-actor
GET /internal/admin/routes -> hides soft-deleted route
GET /internal/admin/routes/:id for soft-deleted route -> 404 ROUTE_CONFIG_NOT_FOUND
docker compose restart api-gateway -> routeCount returned to 2
GET /api/product-service/health-copy after soft delete and restart -> 404 Route not found
SELECT active routes WHERE deleted_at IS NULL -> 2 seeded active routes
POST /internal/admin/routes after soft delete with same method + gatewayPath -> recreated route successfully
DELETE recreated test route -> cleanup soft delete succeeded
POST /internal/admin/routes/reload -> routeCount=2, mode=validation-only, runtimeApplied=false, requiresRestart=true
POST /internal/admin/routes/reload without admin API key -> 401 ADMIN_API_KEY_MISSING
POST /internal/admin/routes/reload with invalid admin API key -> 403 ADMIN_API_KEY_INVALID
git status -> working tree clean after Sprint 10 technical commits
```

Current technical implementation is ready for:

```txt
Sprint 10 - Final Documentation Update
```

After final Sprint 10 documentation update, the project can move to:

```txt
Sprint 11 - Admin Dashboard Foundation or Admin Auth/Audit Hardening
```

Recommended Sprint 11 direction:

1. Start a small Admin Dashboard foundation only after backend route management APIs are fully documented.
2. Or add stronger admin authentication/RBAC foundation if backend security should be hardened first.
3. Or add a dedicated route management audit log table if historical admin actions need stronger tracking.
4. Keep true runtime hot reload as a controlled future checkpoint, because Sprint 10 only added validation-only reload.
5. Do not jump to Kafka, RabbitMQ, Kubernetes, Developer Portal, OpenTelemetry, Loki, k6, Docker registry push, or production cloud deployment unless explicitly planned for a later sprint.

Do not jump to Kafka, RabbitMQ, Kubernetes, Admin Dashboard, Developer Portal, OpenTelemetry, Loki, k6, Docker registry push, or production cloud deployment unless explicitly planned for a later sprint.

---

## Purpose of This File

This file is used to transfer project context to a new AI chat when the current chat becomes too long or slow.

When continuing this project in a new chat, provide this file first so the assistant can understand:

* What PulseGate is.
* What has already been completed.
* What the current architecture is.
* What coding style and learning workflow should be followed.
* What the current sprint status is.
* What the next sprint should be.
* What should not be added too early.
* What behavior is already stable.
* What tests currently exist.
* How Docker, PostgreSQL, Prisma, Redis, rate limiting, caching, Prometheus, Grafana, route policies, multi-route Gateway routing, database-backed route config, route management APIs, safe static fallback, and GitHub Actions CI/CD currently work.

This file should be treated as the main continuation document for future AI chats.

---

## User Learning Workflow

The assistant should follow this workflow:

1. Provide sample code step by step.
2. Do not generate too much code at once.
3. Explain the purpose of each file.
4. Explain important code blocks.
5. Explain the request flow after each feature.
6. Let the user run and test the code.
7. Review errors, logs, screenshots, terminal output, and code like a senior backend reviewer.
8. Give a checklist after each step.
9. Ask the user to commit only after a stable checkpoint.
10. Ask the user to push after each stable commit.
11. Update project context docs at the end of each sprint or when needed.
12. Always run `npm run test`, `npm run typecheck`, and `npm run build` before committing.
13. For Prisma changes, also run the relevant Prisma generate/migrate/seed commands.
14. For Docker or infrastructure changes, also run `docker compose up --build -d` and `docker compose ps`.
15. For runtime Gateway changes, validate `/health`, `/metrics`, public route, protected route, admin route when relevant, and Docker logs.
16. For observability changes, validate `/metrics`, Prometheus target health, Grafana datasource, and Grafana dashboard provisioning when relevant.
17. For CI/CD changes, validate GitHub Actions, `npm ci`, Prisma Client generation, tests, typecheck, build, and Docker image build steps.
18. For final sprint validation, validate `/health`, `/metrics`, Docker runtime, key Gateway routes, admin route management behavior when relevant, and Git status before documentation update.
19. Do not commit documentation until all sprint documentation files are updated.
20. Prefer full-file replacement blocks when updating documentation so the user can copy easily.

Preferred response style:

* Vietnamese explanation.
* Clear step-by-step instructions.
* Code sample first when implementing.
* Explain why the code is written that way.
* Keep sprint scope controlled.
* Avoid jumping too far ahead into complex infrastructure.
* Prefer small, stable checkpoints.
* Review terminal output carefully before moving to the next step.
* Keep documentation updates accurate and not exaggerated.
* Use full-file replacement blocks when updating documentation so the user can copy easily.

---

## Project Goal

PulseGate is a mini API Gateway + API Management + Observability Platform.

It is inspired by:

* Kong
* Apache APISIX
* Tyk
* Apigee
* AWS API Gateway

Long-term target users:

* Backend Developer
* DevOps Engineer
* SRE
* Tech Lead
* Companies with many APIs or microservices

The user's long-term goal is to complete PulseGate at "Mức 2": a 100% product-like API Gateway/API Management platform, not just a simple portfolio backend project.

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

* Provide a single entry point for many backend services.
* Route requests to the correct downstream service.
* Support multiple Gateway routes.
* Support multiple downstream services later.
* Validate API keys and JWT tokens.
* Apply rate limiting.
* Add request size protection.
* Add security headers.
* Add Redis caching.
* Add request logging.
* Add metrics monitoring.
* Add dashboard visibility.
* Validate code health automatically with GitHub Actions CI/CD.
* Centralize route behavior through Gateway policies.
* Support per-route timeout rules.
* Support per-route cache rules.
* Support per-route rate limit rules.
* Support request transformation rules.
* Support response transformation rules.
* Support upstream retry rules.
* Store Gateway route configuration in PostgreSQL.
* Load Gateway route configuration from database.
* Keep safe fallback behavior when dynamic route loading fails.
* Manage Gateway route configuration through internal/admin APIs.
* Add API consumer database later.
* Add API key lifecycle later.
* Add usage plans and quotas later.
* Add distributed tracing later.
* Stream events with Kafka later.
* Process background jobs with RabbitMQ later.
* Run load tests with k6 later.
* Support Docker, Docker Compose, and later Kubernetes.
* Provide Admin Dashboard later.
* Provide Developer Portal later.

---

## Current Architecture

Current stable architecture after Sprint 10:

```txt
Client
  -> API Gateway :3000
    -> Runtime route config loading
      -> Try loading active route configs from PostgreSQL gateway.gateway_routes where enabled=true and deleted_at IS NULL
      -> Map database records to DownstreamRouteConfig[]
      -> Validate mapped route configs
      -> If database route configs are valid and not empty:
           -> Use database-backed route configs
           -> Log: Loaded downstream route configs from database { routeCount: 2 }
      -> If database loading fails:
           -> Fall back to static downstreamRouteConfigs
           -> Log fallback warning
      -> If database returns no active routes:
           -> Fall back to static downstreamRouteConfigs
           -> Log fallback warning
    -> Request ID handling
    -> Structured access log timer
    -> Metrics timer
    -> Basic security headers
    -> Request size limit
    -> Resolved downstream route configuration
      -> GET /api/products
      -> GET /api/product-service/health
    -> Downstream route policy configuration
      -> Auth policy
      -> Timeout policy
      -> Cache policy
      -> Rate limit policy
      -> Request transform policy
      -> Response transform policy
      -> Retry policy foundation
    -> Protected Product route:
      -> GET /api/products
      -> API key authentication
      -> Redis-backed rate limiting by API key and route
      -> JWT authentication
      -> Redis response cache
        -> Cache HIT:
             -> Apply response transform foundation
             -> Return cached product response
             -> x-cache: HIT
        -> Cache MISS:
             -> Apply request transform foundation
             -> Downstream timeout policy helper
             -> Upstream retry policy foundation
             -> Normalized downstream error handling
             -> Product Service :3001 /products
               -> Prisma Client
               -> PostgreSQL public.products
               -> Database-backed product response
             -> Store response in Redis cache
             -> Apply response transform foundation
             -> x-cache: MISS
    -> Public Product Service health proxy route:
      -> GET /api/product-service/health
      -> No API key required
      -> No JWT required
      -> No Redis-backed rate limiting
      -> No Redis response cache
      -> Downstream timeout policy helper
      -> Product Service :3001 /health
      -> x-cache: BYPASS
    -> Add x-cache
    -> Add x-response-time-ms
    -> Record Prometheus metrics
    -> Write structured access log
    -> Return response to Client

Admin Client / Future Admin Dashboard
  -> API Gateway :3000
    -> Internal/admin route management APIs
    -> x-admin-api-key
    -> GET /internal/admin/routes
    -> GET /internal/admin/routes/:id
    -> POST /internal/admin/routes
    -> PATCH /internal/admin/routes/:id
    -> DELETE /internal/admin/routes/:id
    -> POST /internal/admin/routes/reload
    -> x-admin-actor for audit metadata when provided
    -> Route management repository
    -> PostgreSQL gateway.gateway_routes
    -> Route config validation before persistence
    -> Simple restart-based runtime reload strategy

PostgreSQL :5432
  -> public schema
       -> Product Service data
       -> public.products
       -> public._prisma_migrations
  -> gateway schema
       -> API Gateway route config
       -> gateway.gateway_routes
       -> gateway._prisma_migrations

Redis :6379
  -> API Gateway rate limit counters
  -> API Gateway response cache payloads

API Gateway
  -> Exposes /metrics

Prometheus :9090
  -> Scrapes API Gateway /metrics

Grafana :3002
  -> Uses Prometheus datasource
  -> Displays PulseGate API Gateway Overview dashboard

GitHub Actions
  -> Runs on push and pull request to main
  -> Installs dependencies with npm ci
  -> Generates Product Service Prisma Client
  -> Generates API Gateway Prisma Client
  -> Runs tests, typecheck, and build
  -> Builds API Gateway and Product Service Docker images
```

Current Docker services:

```txt
pulsegate-api-gateway
pulsegate-product-service
pulsegate-postgres
pulsegate-redis
pulsegate-prometheus
pulsegate-grafana
```

Current service ports:

```txt
API Gateway      -> 3000
Product Service  -> 3001
Grafana          -> 3002
PostgreSQL       -> 5432
Redis            -> 6379
Prometheus       -> 9090
```

Current public endpoints through API Gateway:

```txt
GET http://localhost:3000/health
GET http://localhost:3000/metrics
GET http://localhost:3000/api/product-service/health
```

Current protected endpoint through API Gateway:

```txt
GET http://localhost:3000/api/products
```

This endpoint currently requires:

```txt
x-api-key: dev-api-key
Authorization: Bearer <jwt-token>
```

Current internal/admin endpoints through API Gateway:

```txt
GET http://localhost:3000/internal/admin/routes
GET http://localhost:3000/internal/admin/routes/:id
POST http://localhost:3000/internal/admin/routes
PATCH http://localhost:3000/internal/admin/routes/:id
```

These endpoints currently require:

```txt
x-admin-api-key: local-admin-key
```

Current downstream service endpoints:

```txt
Product Service:
GET http://localhost:3001/health
GET http://localhost:3001/products
```

Current observability endpoints:

```txt
Prometheus health:
GET http://localhost:9090/-/healthy

Prometheus targets:
GET http://localhost:9090/api/v1/targets

Grafana health:
GET http://localhost:3002/api/health

Grafana UI:
http://localhost:3002
```

Local Grafana login:

```txt
username: admin
password: admin
```

Current CI/CD workflow:

```txt
.github/workflows/ci.yml
```

Current CI workflow name:

```txt
CI
```

Current CI job:

```txt
Test, Typecheck, and Build
```

Current CI triggers:

```txt
push to main
pull_request to main
```

Current CI validation steps:

```txt
npm ci
npm run db:generate -w apps/product-service
npm run db:generate -w apps/api-gateway
npm run test
npm run typecheck
npm run build
docker build -t pulsegate-api-gateway:ci -f apps/api-gateway/Dockerfile .
docker build -t pulsegate-product-service:ci -f apps/product-service/Dockerfile .
```

---

## Current Gateway Routes

Current Gateway runtime routes:

```txt
GET /health
GET /metrics
GET /api/products
GET /api/product-service/health
GET /internal/admin/routes
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
```

Current route behavior:

```txt
GET /health
  -> Public
  -> Local API Gateway health check
  -> No API key
  -> No JWT
  -> No Redis rate limit
  -> No Redis response cache

GET /metrics
  -> Public for local Docker observability
  -> Prometheus text format
  -> Scraped by Prometheus

GET /api/products
  -> Protected
  -> Requires API key
  -> Requires JWT
  -> Uses Redis-backed rate limiting
  -> Uses Redis response cache
  -> Uses route policy configuration
  -> Proxies to Product Service GET /products on cache MISS

GET /api/product-service/health
  -> Public
  -> Does not require API key
  -> Does not require JWT
  -> Does not use Redis-backed rate limiting
  -> Does not use Redis response cache
  -> Uses route policy configuration
  -> Uses downstream timeout policy
  -> Proxies to Product Service GET /health

GET /internal/admin/routes
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
  -> Internal/admin route management APIs
  -> Require x-admin-api-key
  -> Do not use consumer x-api-key
  -> Do not use consumer JWT
  -> Do not use Product response cache
```

Current route config source priority:

```txt
1. PostgreSQL gateway.gateway_routes
2. Static downstreamRouteConfigs fallback
```

Current downstream route config list fallback:

```txt
downstreamRouteConfigs
  -> productProductsRouteConfig
  -> productServiceHealthRouteConfig
```

Current static route config file:

```txt
apps/api-gateway/src/config/downstream-routes.ts
```

Current runtime route config loader file:

```txt
apps/api-gateway/src/config/runtime-downstream-routes.ts
```

Current database route config repository file:

```txt
apps/api-gateway/src/config/database-route-config.repository.ts
```

Current database route config mapper file:

```txt
apps/api-gateway/src/config/database-route-config.mapper.ts
```

Current route management files:

```txt
apps/api-gateway/src/middlewares/admin-api-key-auth.middleware.ts
apps/api-gateway/src/routes/admin-route-config.route.ts
apps/api-gateway/src/routes/admin-route-config.route.test.ts
apps/api-gateway/src/route-management/route-management.types.ts
apps/api-gateway/src/route-management/route-management.mapper.ts
apps/api-gateway/src/route-management/route-management.repository.ts
```

Current generic proxy route file:

```txt
apps/api-gateway/src/routes/product-proxy.route.ts
```

Important naming note:

```txt
The file name is still product-proxy.route.ts for now, but Sprint 7 refactored the internals to include a generic downstreamProxyRoute().

productProxyRoute() remains as a compatibility wrapper for the original product route behavior.

A future cleanup sprint may rename this file to downstream-proxy.route.ts if desired.
```

---

## Current Database Route Config Behavior

Sprint 8 added database-backed dynamic route configuration.

Sprint 9 added internal/admin APIs to manage database route config records.

Sprint 10 added route config soft delete, audit metadata fields, active-route uniqueness, and a validation-only reload endpoint.

Current database table:

```txt
gateway.gateway_routes
```

Current Prisma schema:

```txt
apps/api-gateway/prisma/schema.prisma
```

Current migrations:

```txt
apps/api-gateway/prisma/migrations/20260701063629_add_gateway_routes/migration.sql
apps/api-gateway/prisma/migrations/20260702090000_add_gateway_route_soft_delete/migration.sql
```

Current seed script:

```txt
apps/api-gateway/prisma/seed.ts
```

Current generated Prisma Client output:

```txt
apps/api-gateway/src/generated/prisma
```

Important generated client note:

```txt
apps/api-gateway/src/generated/ is ignored by Git.

The generated API Gateway Prisma Client should not be committed.

It must be generated locally, in CI, and inside the Docker image.
```

Current DB-backed route configs:

```txt
GET /api/products
  -> downstreamUrl: http://product-service:3001/products
  -> serviceName: product-service
  -> method: GET
  -> enabled: true
  -> priority: 100
  -> requireApiKey: true
  -> requireJwt: true
  -> timeoutEnabled: true
  -> timeoutMs: 3000
  -> cacheEnabled: true
  -> cacheTtlSeconds: 30
  -> rateLimitEnabled: true
  -> rateLimitLimit: 5
  -> rateLimitWindowMs: 60000
  -> requestTransformEnabled: false
  -> responseTransformEnabled: false
  -> retryEnabled: false
  -> retryAttempts: 0
  -> retryOnStatuses: [502, 503, 504]
  -> deletedAt: null for active seeded route

GET /api/product-service/health
  -> downstreamUrl: http://product-service:3001/health
  -> serviceName: product-service
  -> method: GET
  -> enabled: true
  -> priority: 200
  -> requireApiKey: false
  -> requireJwt: false
  -> timeoutEnabled: true
  -> timeoutMs: 3000
  -> cacheEnabled: false
  -> cacheTtlSeconds: 30 in DB, normalized to 0 in runtime config when disabled
  -> rateLimitEnabled: false
  -> rateLimitLimit: 100 in DB, normalized to 0 in runtime config when disabled
  -> rateLimitWindowMs: 60000 in DB, normalized to 0 in runtime config when disabled
  -> requestTransformEnabled: false
  -> responseTransformEnabled: false
  -> retryEnabled: false
  -> retryAttempts: 0
  -> retryOnStatuses: [502, 503, 504]
  -> deletedAt: null for active seeded route
```

Runtime loading flow:

```txt
API Gateway process starts
  -> loadRuntimeDownstreamRouteConfigs()
    -> loadDatabaseDownstreamRouteConfigs(gatewayPrisma)
      -> Query active records from gateway.gateway_routes where enabled=true and deleted_at IS NULL
      -> Order by priority ASC and gatewayPath ASC
      -> Map records into DownstreamRouteConfig[]
      -> Validate mapped route configs
    -> If DB routes exist:
         -> Use DB-backed route configs
         -> Log: Loaded downstream route configs from database { routeCount: 2 }
    -> If DB returns no routes:
         -> Use static route config fallback
         -> Log fallback warning
    -> If DB loading fails:
         -> Use static route config fallback
         -> Log fallback warning
  -> buildApiGatewayApp({ routeConfigs })
  -> register healthRoute()
  -> register metricsRoute()
  -> register adminRouteConfigRoute()
  -> register downstreamProxyRoute()
  -> connect Redis
  -> listen on port 3000
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
API Gateway uses static downstreamRouteConfigs
```

Why fallback matters:

* Gateway startup remains safe.
* Existing protected product route behavior remains stable.
* Existing public health proxy route behavior remains stable.
* Database-backed route config can be rolled out safely.
* Route management APIs can write database records without removing safe startup behavior.

---

## Current Route Management API Behavior

Sprint 9 added the internal/admin Route Management API foundation.

Current admin route management endpoints:

```txt
GET /internal/admin/routes
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
```

Current admin authentication:

```txt
Header: x-admin-api-key
Default local value: local-admin-key
```

Current admin environment variables:

```txt
ADMIN_API_KEY_HEADER=x-admin-api-key
ADMIN_API_KEY=local-admin-key
```

Current route management repository behavior:

```txt
listRoutes()
  -> Returns non-deleted route configs ordered by priority and gatewayPath
  -> Includes enabled and disabled routes if deleted_at IS NULL

findRouteById(id)
  -> Returns one non-deleted route config or null

findRouteByMethodAndGatewayPath(method, gatewayPath)
  -> Returns a conflicting non-deleted route config or null

createRoute(data)
  -> Inserts a route config into gateway.gateway_routes
  -> Stores createdBy and updatedBy when x-admin-actor is provided

updateRoute(id, data)
  -> Updates an existing non-deleted route config in gateway.gateway_routes
  -> Stores updatedBy when x-admin-actor is provided

softDeleteRoute(id, actor)
  -> Sets enabled=false
  -> Sets deletedAt
  -> Sets deletedBy
  -> Sets updatedBy
  -> Does not hard delete the database row
```

Current route management read behavior:

```txt
GET /internal/admin/routes
  -> Requires x-admin-api-key
  -> Returns non-deleted route configs
  -> Includes enabled and disabled routes when deleted_at IS NULL
  -> Hides soft-deleted routes
  -> Does not apply consumer API key auth
  -> Does not apply consumer JWT auth

GET /internal/admin/routes/:id
  -> Requires x-admin-api-key
  -> Returns one non-deleted route config by id
  -> Returns 404 ROUTE_CONFIG_NOT_FOUND if missing or soft-deleted
```

Current route config create flow:

```txt
Admin client
  -> POST /internal/admin/routes
  -> x-admin-api-key
  -> Admin API key middleware
  -> Parse request body
  -> Map request body to DownstreamRouteConfig
  -> validateDownstreamRoutes()
  -> Check duplicate active method + gatewayPath
  -> Insert route into gateway.gateway_routes with createdBy/updatedBy actor metadata when provided
  -> Return 201 Created
```

Current route config update flow:

```txt
Admin client
  -> PATCH /internal/admin/routes/:id
  -> x-admin-api-key
  -> Admin API key middleware
  -> Find existing route by id
  -> Return 404 if route does not exist
  -> Merge existing route config with PATCH body
  -> Map merged data to DownstreamRouteConfig
  -> validateDownstreamRoutes()
  -> Check method + gatewayPath conflict against other non-deleted routes
  -> Update route in gateway.gateway_routes with updatedBy actor metadata when provided
  -> Return 200 OK
```

Current enable/disable behavior:

```txt
PATCH /internal/admin/routes/:id
Body: { "enabled": false }

Result:
  -> Route remains stored in gateway.gateway_routes
  -> Route remains visible in admin read API as long as deleted_at IS NULL
  -> Route is not loaded as an active runtime route after API Gateway restart
  -> Client requests to the disabled route return 404
```

Current soft delete behavior:

```txt
DELETE /internal/admin/routes/:id

Result:
  -> Route is not hard deleted from gateway.gateway_routes
  -> enabled is set to false
  -> deleted_at is set
  -> deleted_by is set from x-admin-actor or admin-api-key fallback
  -> updated_by is set from x-admin-actor or admin-api-key fallback
  -> Route no longer appears in GET /internal/admin/routes
  -> Route detail returns 404 ROUTE_CONFIG_NOT_FOUND
  -> Runtime loader ignores the route after API Gateway restart
  -> The same method + gatewayPath can be recreated because uniqueness applies only to active routes
```

Current reload validation behavior:

```txt
POST /internal/admin/routes/reload

Result:
  -> Requires x-admin-api-key
  -> Reads non-deleted route configs
  -> Filters active routes where enabled=true and deleted_at IS NULL
  -> Maps active records to DownstreamRouteConfig[]
  -> Reuses downstream route validation
  -> Does not apply runtime route changes
  -> Returns mode=validation-only
  -> Returns runtimeApplied=false
  -> Returns requiresRestart=true
  -> Returns routeCount and route summary
```

Current runtime reload strategy:

```txt
Route config create/update/delete writes to PostgreSQL.
API Gateway currently loads proxy route configs only at startup.
Route config changes take effect after API Gateway restart.
POST /internal/admin/routes/reload validates current active DB route configs only.
Reload validation returns mode=validation-only, runtimeApplied=false, requiresRestart=true.
True hot reload is intentionally deferred to a later sprint.
```

Current route management error responses:

```txt
Missing admin API key
  -> 401 ADMIN_API_KEY_MISSING

Invalid admin API key
  -> 403 ADMIN_API_KEY_INVALID

Route config not found
  -> 404 ROUTE_CONFIG_NOT_FOUND

Invalid route config
  -> 400 ROUTE_CONFIG_INVALID

Duplicate active method + gatewayPath
  -> 409 ROUTE_CONFIG_ALREADY_EXISTS

Reload validation failed
  -> 400 ROUTE_CONFIG_RELOAD_VALIDATION_FAILED
```

Why Sprint 9 and Sprint 10 matter:

* PulseGate now has backend APIs for route management.
* The future Admin Dashboard can use these APIs.
* Route configs can be managed through HTTP instead of manual DB edits.
* Existing runtime route validation is reused before persistence.
* Disabled routes are supported safely.
* Soft-deleted routes are hidden from admin reads and excluded from runtime loading.
* Active route uniqueness remains safe while preserving deleted history.
* Reload validation allows admins to check active route configs before restart.
* Runtime behavior remains stable through the simple restart-based reload strategy.

---

## Current Protected Product Request Flow

```txt
Client
  -> GET http://localhost:3000/api/products
    -> Route was loaded from PostgreSQL gateway.gateway_routes during startup
    -> API Gateway creates or reuses x-request-id
    -> API Gateway starts structured access log timer
    -> API Gateway starts metrics timer
    -> API Gateway adds basic security headers
    -> API Gateway applies request size limit
      -> If request body is too large:
        -> 413 REQUEST_BODY_TOO_LARGE
    -> API Gateway matches route config: GET /api/products
    -> API Gateway loads route policy configuration
    -> API Gateway checks x-api-key
      -> If missing:
        -> 401 API_KEY_MISSING
      -> If invalid:
        -> 403 API_KEY_INVALID
      -> If valid:
        -> API Gateway resolves route rate limit policy
        -> API Gateway applies Redis-backed rate limit by API key and route
          -> If exceeded:
            -> 429 TOO_MANY_REQUESTS
          -> If allowed:
            -> API Gateway checks Authorization Bearer token
              -> If missing:
                -> 401 JWT_TOKEN_MISSING
              -> If invalid:
                -> 403 JWT_TOKEN_INVALID
              -> If valid:
                -> API Gateway resolves route cache policy
                -> API Gateway checks Redis response cache
                  -> If cache HIT:
                    -> Apply response transform foundation
                    -> 200 with x-cache: HIT
                    -> Return cached products
                  -> If cache MISS:
                    -> Apply request transform foundation
                    -> Call Product Service through timeout and retry helpers
                    -> Docker: GET http://product-service:3001/products
                    -> Product Service reads products from PostgreSQL public.products using Prisma
                    -> Product Service returns database-backed product data
                    -> API Gateway stores response in Redis cache
                    -> Apply response transform foundation
                    -> API Gateway returns 200 with x-cache: MISS
    -> API Gateway adds x-response-time-ms
    -> API Gateway records Prometheus metrics
    -> API Gateway writes structured access log
```

Runtime validation result:

```txt
GET http://localhost:3000/api/products
  -> Valid API key required
  -> Valid JWT required
  -> First request after cache clear: 200, x-cache: MISS
  -> Second request within TTL: 200, x-cache: HIT
  -> x-ratelimit-remaining exists
  -> x-response-time-ms exists
  -> Product data is returned
```

Example response:

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

---

## Current Public Product Service Health Proxy Flow

```txt
Client
  -> GET http://localhost:3000/api/product-service/health
    -> Route was loaded from PostgreSQL gateway.gateway_routes during startup
    -> API Gateway creates or reuses x-request-id
    -> API Gateway starts structured access log timer
    -> API Gateway starts metrics timer
    -> API Gateway adds basic security headers
    -> API Gateway applies request size limit
    -> API Gateway matches route config: GET /api/product-service/health
    -> API Gateway loads route policy configuration
    -> API Gateway does not require API key
    -> API Gateway does not apply Redis-backed rate limiting
    -> API Gateway does not require JWT
    -> API Gateway does not use Redis response cache
    -> API Gateway applies request transform foundation
    -> API Gateway calls Product Service through timeout helper
      -> Docker: GET http://product-service:3001/health
      -> Local npm only works if database route config points to local URL or static fallback is used
    -> Product Service returns health response
    -> API Gateway returns 200 with Product Service health response
    -> API Gateway returns x-cache: BYPASS
    -> API Gateway adds x-response-time-ms
    -> API Gateway records Prometheus metrics
    -> API Gateway writes structured access log
```

Runtime validation result:

```txt
GET http://localhost:3000/api/product-service/health
  -> 200 OK
  -> x-cache: BYPASS
  -> x-request-id exists
  -> x-response-time-ms exists
  -> Content contains Product Service health response
```

Example response:

```json
{
  "service": "product-service",
  "status": "ok",
  "timestamp": "2026-07-01T13:37:27.985Z"
}
```

---

## Current Route Management Request Flow

```txt
Admin Client / Future Admin Dashboard
  -> GET http://localhost:3000/internal/admin/routes
    -> API Gateway checks x-admin-api-key
    -> API Gateway reads route configs from gateway.gateway_routes
    -> API Gateway returns all route configs including disabled routes

Admin Client / Future Admin Dashboard
  -> GET http://localhost:3000/internal/admin/routes/:id
    -> API Gateway checks x-admin-api-key
    -> API Gateway reads one route config by id
    -> If route does not exist:
         -> 404 ROUTE_CONFIG_NOT_FOUND
    -> If route exists:
         -> 200 with route config response

Admin Client / Future Admin Dashboard
  -> POST http://localhost:3000/internal/admin/routes
    -> API Gateway checks x-admin-api-key
    -> API Gateway validates request body
    -> API Gateway maps request body to DownstreamRouteConfig
    -> API Gateway reuses validateDownstreamRoutes()
    -> API Gateway checks duplicate method + gatewayPath
    -> If duplicate exists:
         -> 409 ROUTE_CONFIG_ALREADY_EXISTS
    -> If valid and not duplicate:
         -> API Gateway creates route config in gateway.gateway_routes
         -> API Gateway returns 201 Created

Admin Client / Future Admin Dashboard
  -> PATCH http://localhost:3000/internal/admin/routes/:id
    -> API Gateway checks x-admin-api-key
    -> API Gateway reads existing route by id
    -> If route does not exist:
         -> 404 ROUTE_CONFIG_NOT_FOUND
    -> If route exists:
         -> API Gateway merges existing route with patch body
         -> API Gateway maps merged body to DownstreamRouteConfig
         -> API Gateway reuses validateDownstreamRoutes()
         -> API Gateway checks conflict with another method + gatewayPath
         -> API Gateway updates route config in gateway.gateway_routes
         -> API Gateway returns 200 OK
```

Runtime validation result:

```txt
GET /internal/admin/routes with valid x-admin-api-key
  -> 200 OK
  -> Returned 2 seeded route configs after cleanup

GET /internal/admin/routes without x-admin-api-key
  -> 401 ADMIN_API_KEY_MISSING

GET /internal/admin/routes with wrong x-admin-api-key
  -> 403 ADMIN_API_KEY_INVALID

POST /internal/admin/routes
  -> Created temporary test route successfully

Duplicate POST /internal/admin/routes
  -> 409 ROUTE_CONFIG_ALREADY_EXISTS

PATCH /internal/admin/routes/:id
  -> Disabled temporary test route successfully

GET /api/product-service/health-copy after disable and API Gateway restart
  -> 404 Route not found

Cleanup
  -> Removed temporary route from gateway.gateway_routes
  -> Database returned to 2 seeded route configs
```

---

## Current Public Health Flow

```txt
Client
  -> GET http://localhost:3000/health
    -> API Gateway creates or reuses x-request-id
    -> API Gateway starts access log timer
    -> API Gateway starts metrics timer
    -> API Gateway adds basic security headers
    -> API Gateway applies request size limit
    -> API Gateway returns health response
    -> API Gateway adds x-response-time-ms
    -> API Gateway records metrics
    -> API Gateway writes structured access log
```

---

## Current Metrics Flow

```txt
Prometheus
  -> GET http://api-gateway:3000/metrics inside Docker network
    -> API Gateway returns Prometheus text format
    -> Prometheus stores time-series metrics
    -> Grafana reads those metrics from Prometheus
```

---

## Current CI Flow

```txt
Developer
  -> Pushes code to main or opens pull request into main
    -> GitHub Actions starts CI workflow
    -> GitHub Actions checks out repository
    -> GitHub Actions sets up Node.js 20
    -> GitHub Actions runs npm ci
    -> GitHub Actions generates Product Service Prisma Client
    -> GitHub Actions generates API Gateway Prisma Client
    -> GitHub Actions runs automated tests
    -> GitHub Actions runs TypeScript typecheck
    -> GitHub Actions runs production build
    -> GitHub Actions builds API Gateway Docker image
    -> GitHub Actions builds Product Service Docker image
    -> GitHub Actions reports pass/fail status to GitHub
    -> README CI badge reflects workflow status
```

---

## Current Tech Stack

Currently used:

* Node.js
* TypeScript
* Fastify
* npm workspaces
* Vitest
* jose
* Docker
* Docker Compose
* PostgreSQL
* Prisma
* Redis
* prom-client
* Prometheus
* Grafana
* GitHub Actions

Currently implemented:

* npm workspaces monorepo.
* TypeScript strict mode.
* API Gateway.
* Product Service.
* Docker Compose local infrastructure.
* PostgreSQL service.
* Redis service.
* Prometheus service.
* Grafana service.
* Prisma schema, migration, and seed script for Product Service.
* Prisma schema, migration, and seed script for API Gateway.
* PostgreSQL-backed Product Service products.
* PostgreSQL-backed API Gateway route config.
* Dedicated PostgreSQL `gateway` schema for API Gateway config.
* Request ID middleware.
* Structured access log middleware.
* Metrics middleware.
* Error handler middleware.
* Downstream service error class.
* Static downstream route configuration fallback.
* Database-backed downstream route configuration.
* Runtime route config loader.
* Database route config mapper.
* Database route config repository.
* Gateway Prisma Client wrapper.
* Generic downstream proxy route foundation.
* Product proxy compatibility wrapper.
* Route policy type foundation.
* Route config validation.
* API key authentication middleware.
* Admin API key authentication middleware.
* JWT authentication middleware.
* In-memory rate limit store for tests and local abstractions.
* Redis-backed rate limit store.
* Rate limit middleware supporting async stores.
* Redis response cache store.
* Request size limit middleware.
* Security headers middleware.
* Per-route timeout policy helper.
* Per-route cache policy helper.
* Per-route rate limit policy helper.
* Request transformation policy foundation.
* Response transformation policy foundation.
* Upstream retry policy foundation.
* Route management module.
* Route management repository.
* Route management mapper.
* Route config list API.
* Route config detail API.
* Route config create API.
* Route config update API.
* Route config enable/disable foundation.
* Route config soft delete foundation.
* Route config reload validation endpoint.
* Route audit metadata fields.
* API Gateway app builder for integration tests.
* Prometheus-compatible `/metrics` route.
* Prometheus scrape configuration.
* Grafana datasource provisioning.
* Grafana dashboard provider provisioning.
* Grafana API Gateway overview dashboard.
* GitHub Actions CI workflow.
* CI validation for `npm ci`, Prisma generate, tests, typecheck, build, and Docker image builds.
* Unit tests.
* Integration tests.
* Route management API tests.
* GitHub-ready README.
* Project context documentation.
* Architecture documentation.
* Requirements documentation.
* `.env.example`.

Not added yet:

* True runtime route hot reload that applies changes without restart.
* Dedicated route management audit log table.
* Stronger admin authentication beyond local admin API key.
* Kafka.
* RabbitMQ.
* Kubernetes.
* OpenTelemetry.
* Jaeger or Tempo.
* Loki.
* k6.
* Admin Dashboard.
* Developer Portal.
* API consumer database.
* API key lifecycle management.
* Usage plans and quotas.
* Service registry.
* Docker image registry push.
* Automatic deployment.
* Production cloud deployment.

---

## Repository Structure

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
            migration.sql
          20260702090000_add_gateway_route_soft_delete/
            migration.sql
          migration_lock.toml
        schema.prisma
        seed.ts
      src/
        app.ts
        app.test.ts
        cache/
          redis-response-cache-store.ts
          redis-response-cache-store.test.ts
        config/
          database-route-config.mapper.ts
          database-route-config.mapper.test.ts
          database-route-config.repository.ts
          downstream-routes.ts
          downstream-routes.test.ts
          env.ts
          env.test.ts
          runtime-downstream-routes.ts
          runtime-downstream-routes.test.ts
          validate-downstream-routes.ts
          validate-downstream-routes.test.ts
        database/
          gateway-prisma.ts
        errors/
          downstream-service-error.ts
          downstream-service-error.test.ts
        middlewares/
          access-log.middleware.ts
          access-log.middleware.test.ts
          admin-api-key-auth.middleware.ts
          api-key-auth.middleware.ts
          api-key-auth.middleware.test.ts
          error-handler.middleware.ts
          jwt-auth.middleware.ts
          jwt-auth.middleware.test.ts
          metrics.middleware.ts
          metrics.middleware.test.ts
          rate-limit.middleware.ts
          rate-limit.middleware.test.ts
          request-id.middleware.ts
          request-id.middleware.test.ts
          request-size-limit.middleware.ts
          request-size-limit.middleware.test.ts
          security-headers.middleware.ts
          security-headers.middleware.test.ts
        observability/
          metrics.ts
          metrics.test.ts
        policies/
          cache.policy.ts
          cache.policy.test.ts
          rate-limit.policy.ts
          rate-limit.policy.test.ts
          request-transform.policy.ts
          request-transform.policy.test.ts
          response-transform.policy.ts
          response-transform.policy.test.ts
          retry.policy.ts
          retry.policy.test.ts
          route-policy.types.ts
          timeout.policy.ts
          timeout.policy.test.ts
        rate-limit/
          in-memory-rate-limit-store.ts
          in-memory-rate-limit-store.test.ts
          redis-rate-limit-store.ts
          redis-rate-limit-store.test.ts
        redis/
          redis-client.ts
        route-management/
          route-management.mapper.ts
          route-management.repository.ts
          route-management.types.ts
        routes/
          admin-route-config.route.ts
          admin-route-config.route.test.ts
          health.route.ts
          metrics.route.ts
          metrics.route.test.ts
          product-proxy.route.ts
        server.ts
      package.json
      tsconfig.json
      vitest.config.ts

    product-service/
      Dockerfile
      prisma/
        migrations/
          20260628092746_init_products/
            migration.sql
          migration_lock.toml
        schema.prisma
        seed.ts
        tsconfig.json
      src/
        config/
          env.ts
        database/
          prisma.ts
        middlewares/
          error-handler.middleware.ts
          request-id.middleware.ts
        products/
          product.repository.ts
        routes/
          health.route.ts
          product.route.ts
        server.ts
      package.json
      tsconfig.json

  observability/
    prometheus/
      prometheus.yml
    grafana/
      dashboards/
        api-gateway-overview.json
      provisioning/
        dashboards/
          dashboards.yml
        datasources/
          prometheus.yml

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

## Current API Gateway

Location:

```txt
apps/api-gateway
```

Port:

```txt
3000
```

Current endpoints:

```txt
GET /health
GET /metrics
GET /api/products
GET /api/product-service/health
GET /internal/admin/routes
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
```

Current route protection:

```txt
GET /health
  -> Public

GET /metrics
  -> Public for local Docker observability

GET /api/products
  -> Requires API key
  -> Redis-backed rate limited by API key and route
  -> Requires JWT Bearer token
  -> Uses Redis response cache
  -> Uses route policy configuration loaded from resolved route config
  -> Proxies to Product Service GET /products on cache MISS

GET /api/product-service/health
  -> Public
  -> Does not require API key
  -> Does not require JWT
  -> Does not use Redis-backed rate limiting
  -> Does not use Redis response cache
  -> Uses route policy configuration loaded from resolved route config
  -> Uses downstream timeout policy
  -> Proxies to Product Service GET /health

GET /internal/admin/routes
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
  -> Internal/admin APIs
  -> Require x-admin-api-key
  -> Do not use consumer x-api-key
  -> Do not use consumer JWT
```

Current responsibilities:

* Receive client requests.
* Generate or reuse request ID.
* Return `x-request-id` response header.
* Add `x-response-time-ms` response header.
* Add basic security headers.
* Apply request size limit.
* Load active Gateway route configs from PostgreSQL `gateway.gateway_routes` where `enabled=true` and `deleted_at IS NULL`.
* Fall back to static route configs when DB loading fails or returns no routes.
* Map DB route records into `DownstreamRouteConfig[]`.
* Validate mapped route configs before registering routes.
* Register multiple downstream routes through generic downstream proxy route.
* Route `/api/products` to Product Service `/products` on cache MISS.
* Route `/api/product-service/health` to Product Service `/health`.
* Return cached product response on cache HIT.
* Forward `x-request-id` to Product Service.
* Return downstream response to client.
* Handle 404 errors.
* Handle basic 500 errors.
* Log requests in JSON format.
* Write structured access logs after request completion.
* Record HTTP metrics after request completion.
* Expose Prometheus-compatible metrics at `/metrics`.
* Normalize downstream service errors.
* Return `503 DOWNSTREAM_SERVICE_UNAVAILABLE` when Product Service is down and cache MISS.
* Apply downstream request timeout.
* Return `504 DOWNSTREAM_TIMEOUT` when Product Service is too slow and cache MISS.
* Return `502 DOWNSTREAM_HTTP_ERROR` when Product Service returns 5xx.
* Return `502 DOWNSTREAM_INVALID_RESPONSE` when Product Service returns invalid JSON.
* Store downstream route information in route config.
* Store route policies in route config.
* Validate downstream route config at startup.
* Protect `/api/products` using API key authentication.
* Return `401 API_KEY_MISSING` when API key is missing.
* Return `403 API_KEY_INVALID` when API key is invalid.
* Apply Redis-backed rate limiting after API key authentication.
* Return `429 TOO_MANY_REQUESTS` when rate limit is exceeded.
* Protect `/api/products` using JWT authentication.
* Return `401 JWT_TOKEN_MISSING` when Bearer token is missing.
* Return `403 JWT_TOKEN_INVALID` when Bearer token is invalid.
* Attach verified JWT payload to `request.jwtPayload`.
* Cache Product responses in Redis.
* Return `x-cache: MISS` on cache MISS.
* Return `x-cache: HIT` on cache HIT.
* Return `x-cache: BYPASS` when cache is disabled.
* Apply per-route timeout policy helper.
* Apply per-route cache policy helper.
* Apply per-route rate limit policy helper.
* Apply request transform policy foundation.
* Apply response transform policy foundation.
* Wire upstream retry policy foundation into downstream call flow.
* Protect internal/admin route management APIs with admin API key.
* Return `401 ADMIN_API_KEY_MISSING` when admin API key is missing.
* Return `403 ADMIN_API_KEY_INVALID` when admin API key is invalid.
* List Gateway route configs through internal/admin API.
* Read Gateway route config detail through internal/admin API.
* Create Gateway route config through internal/admin API.
* Update Gateway route config through internal/admin API.
* Enable or disable route configs through PATCH.
* Soft delete Gateway route config through internal/admin API.
* Validate active route configs through reload validation API.
* Validate route config before persistence.
* Detect duplicate active route config conflicts before persistence.
* Capture admin actor metadata through `x-admin-actor`.
* Support automated integration tests using `buildApiGatewayApp()` and `app.inject()`.
* Generate API Gateway Prisma Client in local development, CI, and Docker images.

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

* Provide health check.
* Return database-backed product data.
* Read products from PostgreSQL `public.products` using Prisma Client.
* Generate or reuse request ID.
* Reuse request ID forwarded by API Gateway.
* Handle 404 errors.
* Handle basic 500 errors.
* Log requests in JSON format.
* Disconnect Prisma client on server close.
* Support Prisma schema, migration, and seed script.

Current database-backed products:

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

Current database table:

```txt
public.products
```

Current Product model:

```txt
id        String
name      String
price     Int
createdAt DateTime
updatedAt DateTime
```

---

## Current Gateway Route Policy Model

Current route policy type file:

```txt
apps/api-gateway/src/policies/route-policy.types.ts
```

Current static route config file:

```txt
apps/api-gateway/src/config/downstream-routes.ts
```

Current runtime route config loader file:

```txt
apps/api-gateway/src/config/runtime-downstream-routes.ts
```

Current database route config repository file:

```txt
apps/api-gateway/src/config/database-route-config.repository.ts
```

Current database route config mapper file:

```txt
apps/api-gateway/src/config/database-route-config.mapper.ts
```

Current route config validation file:

```txt
apps/api-gateway/src/config/validate-downstream-routes.ts
```

Current route management mapper file:

```txt
apps/api-gateway/src/route-management/route-management.mapper.ts
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

Current route registration flow:

```txt
loadRuntimeDownstreamRouteConfigs()
  -> Try DB route config
  -> Fall back to static downstreamRouteConfigs when DB fails or empty

app.ts
  -> Registers healthRoute()
  -> Registers metricsRoute()
  -> Registers adminRouteConfigRoute()
  -> Registers downstreamProxyRoute()
  -> Passes resolved route configs
  -> Gateway registers each downstream route from config
```

Current product route policy:

```txt
GET /api/products
  -> auth:
       requireApiKey: true
       requireJwt: true

  -> timeout:
       enabled: true
       timeoutMs: 3000

  -> cache:
       enabled: true
       ttlSeconds: 30

  -> rateLimit:
       enabled: true
       limit: 5
       windowMs: 60000

  -> requestTransform:
       enabled: false

  -> responseTransform:
       enabled: false

  -> retry:
       enabled: false
       attempts: 0
       retryOnStatuses: [502, 503, 504]
```

Current Product Service health proxy route policy:

```txt
GET /api/product-service/health
  -> auth:
       requireApiKey: false
       requireJwt: false

  -> timeout:
       enabled: true
       timeoutMs: 3000

  -> cache:
       enabled: false
       ttlSeconds: 0

  -> rateLimit:
       enabled: false
       limit: 0
       windowMs: 0

  -> requestTransform:
       enabled: false

  -> responseTransform:
       enabled: false

  -> retry:
       enabled: false
       attempts: 0
       retryOnStatuses: [502, 503, 504]
```

Current route validation checks:

```txt
serviceName must be present
gatewayPath must start with /
method must be supported
downstreamUrl must be a valid http or https URL
timeoutMs must be positive when timeout policy is enabled
cache ttlSeconds must be positive when cache policy is enabled
rate limit limit/windowMs must be positive when rate limit policy is enabled
request transform header names must be valid HTTP header names
response transform header names must be valid HTTP header names
retry attempts must be non-negative
retry attempts must be greater than 0 when retry is enabled
retryOnStatuses must not be empty when retry is enabled
retryOnStatuses must contain valid HTTP status codes
duplicate method + gatewayPath routes are rejected
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

Current policy helper behavior:

```txt
timeout.policy.ts
  -> Creates per-request AbortController when timeout is enabled
  -> Returns cleanup function to clear timeout safely

cache.policy.ts
  -> Builds stable response cache keys
  -> Resolves cache enabled state from route policy and runtime cache store
  -> Supports TTL override for tests

rate-limit.policy.ts
  -> Resolves route rate limit policy into runtime middleware config

request-transform.policy.ts
  -> Adds configured request headers
  -> Removes configured request headers case-insensitively
  -> Does not mutate original header object

response-transform.policy.ts
  -> Adds configured response headers
  -> Removes configured response headers case-insensitively
  -> Does not mutate original header object

retry.policy.ts
  -> Allows retry only for GET requests
  -> Supports retry by result or error predicate
  -> Treats attempts as additional retries after the first request
```

Retry note:

```txt
The current product route has retry foundation wired into the route flow,
but retry is disabled in the default route policy.

The Product Service health proxy route also has retry foundation available,
but retry is disabled in the default route policy.

This keeps runtime behavior stable while preparing the Gateway for future safe retry scenarios.
```

---

## Current CI/CD Foundation

Sprint 6 added GitHub Actions CI/CD foundation.

Sprint 8 extended CI so API Gateway Prisma Client is generated in clean runners.

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

Trigger behavior:

```txt
push to main
pull_request to main
```

Current workflow steps:

```txt
Checkout repository
Setup Node.js 20
npm ci
npm run db:generate -w apps/product-service
npm run db:generate -w apps/api-gateway
npm run test
npm run typecheck
npm run build
docker build -t pulsegate-api-gateway:ci -f apps/api-gateway/Dockerfile .
docker build -t pulsegate-product-service:ci -f apps/product-service/Dockerfile .
```

Current CI validation status:

```txt
GitHub Actions CI -> passing
README CI badge -> passing
```

Why CI matters:

* It makes every push to `main` automatically validated.
* It makes every pull request into `main` automatically validated.
* It proves the repository can install dependencies cleanly with `npm ci`.
* It prevents Product Service Prisma Client generation issues on clean runners.
* It prevents API Gateway Prisma Client generation issues on clean runners.
* It ensures tests, typecheck, and build stay healthy.
* It validates Docker image builds for both runtime services.
* It makes the GitHub repository more professional for portfolio and hiring review.

---

## Current Observability

### Structured Access Logs

API Gateway writes structured access logs after each request completes.

Current access log event:

```txt
http_request_completed
```

Current structured log fields:

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

Example conceptual payload:

```json
{
  "event": "http_request_completed",
  "requestId": "example-request-id",
  "method": "GET",
  "path": "/health",
  "route": "/health",
  "statusCode": 200,
  "durationMs": 3.25,
  "userAgent": "PowerShell",
  "remoteAddress": "127.0.0.1"
}
```

### Response Time Header

API Gateway adds this response header:

```txt
x-response-time-ms
```

Example:

```txt
x-response-time-ms: 4.32
```

The value is formatted in milliseconds with two decimal places.

### Metrics Registry

API Gateway uses `prom-client` to maintain an in-memory Prometheus metrics registry.

Current metrics:

```txt
http_requests_total
http_request_duration_seconds
http_response_cache_total
```

Current metric behavior:

```txt
http_requests_total
  -> Counts HTTP requests by method, route, and status_code

http_request_duration_seconds
  -> Observes HTTP request duration in seconds by method, route, and status_code

http_response_cache_total
  -> Counts cache outcomes by route and cache_status
```

Supported cache statuses:

```txt
HIT
MISS
BYPASS
```

### Metrics Endpoint

Current metrics endpoint:

```txt
GET /metrics
```

Current behavior:

```txt
GET /metrics
  -> Public in local development
  -> Returns Prometheus text format
  -> Used by Prometheus Docker service
```

Example metric labels after Sprint 10:

```txt
route="/health"
route="/metrics"
route="/api/products"
route="/api/product-service/health"
route="/internal/admin/routes"
route="/internal/admin/routes/:id"
```

### Prometheus

Prometheus runs through Docker Compose.

Prometheus URL:

```txt
http://localhost:9090
```

Prometheus config location:

```txt
observability/prometheus/prometheus.yml
```

Current scrape configuration:

```txt
job_name: pulsegate-api-gateway
metrics_path: /metrics
target: api-gateway:3000
scrape_interval: 5s
```

Prometheus scrapes API Gateway using Docker internal DNS:

```txt
http://api-gateway:3000/metrics
```

### Grafana

Grafana runs through Docker Compose.

Grafana URL:

```txt
http://localhost:3002
```

Local login:

```txt
username: admin
password: admin
```

Grafana datasource config location:

```txt
observability/grafana/provisioning/datasources/prometheus.yml
```

Grafana dashboard provider location:

```txt
observability/grafana/provisioning/dashboards/dashboards.yml
```

Grafana dashboard JSON location:

```txt
observability/grafana/dashboards/api-gateway-overview.json
```

Provisioned datasource:

```txt
name: Prometheus
uid: pulsegate-prometheus
type: prometheus
url: http://prometheus:9090
isDefault: true
```

Provisioned dashboard:

```txt
title: PulseGate API Gateway Overview
uid: pulsegate-api-gateway-overview
folder: PulseGate
```

Current dashboard panels:

```txt
Request Rate
Request Count by Route
Latency p95 by Route
Cache Outcomes
```

---

## Environment Configuration Behavior

Current API Gateway env config includes:

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

Current API Gateway default local values:

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

Current Product Service env config includes:

```txt
PORT
HOST
DATABASE_URL
```

Current Product Service default local values:

```txt
PORT=3001
HOST=0.0.0.0
DATABASE_URL=postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate
```

Docker internal service values:

```txt
PRODUCT_SERVICE_URL=http://product-service:3001
API Gateway DATABASE_URL=postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate?schema=gateway
Product Service DATABASE_URL=postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate
REDIS_URL=redis://redis:6379
Prometheus target=http://api-gateway:3000/metrics
Grafana Prometheus datasource=http://prometheus:9090
```

Covered by tests:

```txt
apps/api-gateway/src/config/env.test.ts
```

---

## Request ID Behavior

Request ID is implemented in both services.

Current flow:

```txt
Client
  -> API Gateway creates or reuses x-request-id
  -> API Gateway returns x-request-id in response header
  -> API Gateway sends x-request-id to Product Service
  -> Product Service reuses the same request ID
```

This applies to:

```txt
GET /api/products
GET /api/product-service/health
```

Purpose:

* Easier debugging.
* Connect logs between Gateway and downstream services.
* Support structured access logs.
* Prepare for distributed tracing later.

Covered by tests:

```txt
apps/api-gateway/src/middlewares/request-id.middleware.test.ts
apps/api-gateway/src/app.test.ts
```

---

## API Key Authentication Behavior

API key authentication is implemented for the protected Gateway route:

```txt
GET /api/products
```

Default API key header:

```txt
x-api-key
```

Default local development API key:

```txt
dev-api-key
```

Current behavior:

```txt
GET /api/products missing API key
  -> 401 API_KEY_MISSING

GET /api/products invalid API key
  -> 403 API_KEY_INVALID

GET /api/products valid API key
  -> Request continues to Redis-backed route-level rate limiting

GET /api/product-service/health
  -> API key is not required

Internal/admin route management APIs
  -> Consumer x-api-key is not used
  -> x-admin-api-key is used instead
```

Covered by tests:

```txt
apps/api-gateway/src/middlewares/api-key-auth.middleware.test.ts
apps/api-gateway/src/app.test.ts
```

---

## Admin API Key Authentication Behavior

Admin API key authentication is implemented for the internal/admin Gateway route management APIs:

```txt
GET /internal/admin/routes
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
```

Default admin API key header:

```txt
x-admin-api-key
```

Default local admin API key:

```txt
local-admin-key
```

Current behavior:

```txt
Internal/admin API missing admin API key
  -> 401 ADMIN_API_KEY_MISSING

Internal/admin API invalid admin API key
  -> 403 ADMIN_API_KEY_INVALID

Internal/admin API valid admin API key
  -> Request continues to route management behavior
```

Covered by tests:

```txt
apps/api-gateway/src/routes/admin-route-config.route.test.ts
```

---

## JWT Authentication Behavior

JWT authentication is implemented for the protected Gateway route:

```txt
GET /api/products
```

Default JWT header:

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

Current behavior:

```txt
GET /api/products missing Bearer token
  -> 401 JWT_TOKEN_MISSING

GET /api/products invalid Bearer token
  -> 403 JWT_TOKEN_INVALID

GET /api/products valid Bearer token
  -> Request continues to Redis response cache

GET /api/product-service/health
  -> JWT is not required

Internal/admin route management APIs
  -> Consumer JWT is not required for internal/admin routes
  -> x-admin-api-key is used instead
```

JWT validation checks:

```txt
Signature
Issuer
Audience
Expiration
```

Verified JWT payload is attached to:

```txt
request.jwtPayload
```

Covered by tests:

```txt
apps/api-gateway/src/middlewares/jwt-auth.middleware.test.ts
apps/api-gateway/src/app.test.ts
```

---

## Rate Limiting Behavior

Redis-backed rate limiting is implemented for:

```txt
GET /api/products
```

Rate limiting is disabled for:

```txt
GET /api/product-service/health
```

Consumer rate limiting is not currently applied to:

```txt
GET /internal/admin/routes
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
```

Current behavior:

```txt
GET /api/products allowed requests within the window
  -> Continue to JWT authentication

GET /api/products exceeded rate limit
  -> 429 TOO_MANY_REQUESTS

GET /api/product-service/health
  -> No Redis-backed rate limit check
  -> No x-ratelimit-* headers

Internal/admin route management APIs
  -> Protected by x-admin-api-key
  -> Do not use consumer x-api-key rate limit identity
```

Default product route rate limit:

```txt
5 requests per 60 seconds
```

Rate limit identity:

```txt
API key + HTTP method + route path
```

Logical rate limit key shape:

```txt
api-key:<api-key>:route:<method>:<route-path>
```

Redis rate limit key shape:

```txt
rate-limit:api-key:<api-key>:route:<method>:<route-path>
```

Example:

```txt
rate-limit:api-key:dev-api-key:route:GET:/api/products
```

Expected rate limit response:

```json
{
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Too many requests. Please try again later.",
    "requestId": "example-request-id"
  }
}
```

Expected status:

```txt
429
```

Current rate limit headers:

```txt
x-ratelimit-limit
x-ratelimit-remaining
x-ratelimit-reset
retry-after
```

Current Redis failure behavior:

```txt
Redis unavailable
  -> API Gateway fails fast
  -> Product route returns generic 500 Internal Server Error
  -> Redis internal details are not exposed in response body
```

Covered by tests:

```txt
apps/api-gateway/src/rate-limit/in-memory-rate-limit-store.test.ts
apps/api-gateway/src/rate-limit/redis-rate-limit-store.test.ts
apps/api-gateway/src/middlewares/rate-limit.middleware.test.ts
apps/api-gateway/src/policies/rate-limit.policy.test.ts
apps/api-gateway/src/app.test.ts
```

---

## Response Cache Behavior

Redis response caching is implemented for:

```txt
GET /api/products
```

Response caching is disabled for:

```txt
GET /api/product-service/health
```

Response caching is not currently used for:

```txt
GET /internal/admin/routes
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
```

Current Redis cache key:

```txt
response-cache:GET:/api/products
```

Current behavior:

```txt
GET /api/products first valid request
  -> Cache MISS
  -> API Gateway calls Product Service
  -> API Gateway stores response in Redis
  -> Response header: x-cache: MISS

GET /api/products second valid request within TTL
  -> Cache HIT
  -> API Gateway returns cached response from Redis
  -> Response header: x-cache: HIT

GET /api/product-service/health
  -> Cache disabled by route policy
  -> API Gateway calls Product Service /health
  -> Response header: x-cache: BYPASS
```

Current TTL:

```txt
30 seconds
```

Current response cache headers:

```txt
x-cache: MISS
x-cache: HIT
x-cache: BYPASS
```

Cache write failure behavior:

```txt
Product Service returns valid JSON
  -> API Gateway attempts to write cache
  -> If cache write fails:
       -> API Gateway logs the cache error
       -> API Gateway still returns 200 response to client
```

Cache resilience behavior:

```txt
Product Service down + cache HIT
  -> API Gateway returns 200 from Redis cache

Product Service down + cache MISS
  -> API Gateway returns downstream error
```

Covered by tests:

```txt
apps/api-gateway/src/cache/redis-response-cache-store.test.ts
apps/api-gateway/src/policies/cache.policy.test.ts
apps/api-gateway/src/app.test.ts
```

Manually validated:

```txt
GET /api/products request 1 -> 200, x-cache: MISS
GET /api/products request 2 -> 200, x-cache: HIT
GET /api/product-service/health -> 200, x-cache: BYPASS
```

---

## Request Size Limit Behavior

Request size limit is implemented globally in the API Gateway.

Current config:

```txt
MAX_REQUEST_BODY_BYTES=1048576
```

That equals:

```txt
1MB
```

Current behavior:

```txt
Content-Length <= MAX_REQUEST_BODY_BYTES
  -> Continue request flow

Content-Length > MAX_REQUEST_BODY_BYTES
  -> 413 REQUEST_BODY_TOO_LARGE
```

Expected request body too large response:

```json
{
  "error": {
    "code": "REQUEST_BODY_TOO_LARGE",
    "message": "Request body is too large",
    "requestId": "example-request-id"
  }
}
```

Expected status:

```txt
413
```

Implementation:

* Request size limit middleware checks `content-length`.
* Fastify `bodyLimit` is configured with `MAX_REQUEST_BODY_BYTES`.

Covered by tests:

```txt
apps/api-gateway/src/middlewares/request-size-limit.middleware.test.ts
apps/api-gateway/src/app.test.ts
```

---

## Basic Security Headers Behavior

Security headers are implemented globally in the API Gateway.

Current security headers:

```txt
x-content-type-options: nosniff
x-frame-options: DENY
referrer-policy: no-referrer
permissions-policy: camera=(), microphone=(), geolocation=()
content-security-policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'
```

Not included yet:

```txt
strict-transport-security
```

Reason:

* The project is still local-first and uses HTTP in local development.
* HSTS should be added when HTTPS deployment is introduced.

Covered by tests:

```txt
apps/api-gateway/src/middlewares/security-headers.middleware.test.ts
apps/api-gateway/src/app.test.ts
```

---

## Downstream Error Behavior

When Product Service is down and cache MISS, API Gateway returns:

```json
{
  "error": {
    "code": "DOWNSTREAM_SERVICE_UNAVAILABLE",
    "message": "Product Service is currently unavailable",
    "service": "product-service",
    "requestId": "example-request-id"
  }
}
```

Expected status:

```txt
503
```

When Product Service is too slow and cache MISS, API Gateway returns:

```json
{
  "error": {
    "code": "DOWNSTREAM_TIMEOUT",
    "message": "Product Service did not respond in time",
    "service": "product-service",
    "requestId": "example-request-id"
  }
}
```

Expected status:

```txt
504
```

When Product Service returns an error status and cache MISS, API Gateway returns:

```json
{
  "error": {
    "code": "DOWNSTREAM_HTTP_ERROR",
    "message": "Product Service returned an error",
    "service": "product-service",
    "requestId": "example-request-id"
  }
}
```

Expected status:

```txt
502
```

When Product Service returns invalid JSON and cache MISS, API Gateway returns:

```json
{
  "error": {
    "code": "DOWNSTREAM_INVALID_RESPONSE",
    "message": "Product Service returned an invalid response",
    "service": "product-service",
    "requestId": "example-request-id"
  }
}
```

Expected status:

```txt
502
```

Covered by tests:

```txt
apps/api-gateway/src/errors/downstream-service-error.test.ts
apps/api-gateway/src/app.test.ts
```

---

## Route Management Error Behavior

Missing admin API key:

```json
{
  "error": {
    "code": "ADMIN_API_KEY_MISSING",
    "message": "Admin API key is required",
    "requestId": "example-request-id"
  }
}
```

Expected status:

```txt
401
```

Invalid admin API key:

```json
{
  "error": {
    "code": "ADMIN_API_KEY_INVALID",
    "message": "Admin API key is invalid",
    "requestId": "example-request-id"
  }
}
```

Expected status:

```txt
403
```

Route config not found:

```json
{
  "error": {
    "code": "ROUTE_CONFIG_NOT_FOUND",
    "message": "Route config was not found",
    "requestId": "example-request-id"
  }
}
```

Expected status:

```txt
404
```

Invalid route config:

```json
{
  "error": {
    "code": "ROUTE_CONFIG_INVALID",
    "message": "Route config is invalid",
    "details": "downstreamUrl must be a valid URL",
    "requestId": "example-request-id"
  }
}
```

Expected status:

```txt
400
```

Duplicate route config:

```json
{
  "error": {
    "code": "ROUTE_CONFIG_ALREADY_EXISTS",
    "message": "Route config already exists for this method and gateway path",
    "requestId": "example-request-id"
  }
}
```

Expected status:

```txt
409
```

Covered by tests:

```txt
apps/api-gateway/src/routes/admin-route-config.route.test.ts
```

---

## PostgreSQL and Prisma Behavior

PostgreSQL is used by both Product Service and API Gateway.

Product Service uses PostgreSQL for product data.

API Gateway uses PostgreSQL for route configuration.

Product Service database ownership:

```txt
Database: pulsegate
Schema: public
Table: public.products
Prisma schema: apps/product-service/prisma/schema.prisma
Prisma migration: apps/product-service/prisma/migrations/20260628092746_init_products/migration.sql
Seed script: apps/product-service/prisma/seed.ts
```

API Gateway database ownership:

```txt
Database: pulsegate
Schema: gateway
Table: gateway.gateway_routes
Prisma schema: apps/api-gateway/prisma/schema.prisma
Initial route migration: apps/api-gateway/prisma/migrations/20260701063629_add_gateway_routes/migration.sql
Soft delete migration: apps/api-gateway/prisma/migrations/20260702090000_add_gateway_route_soft_delete/migration.sql
Seed script: apps/api-gateway/prisma/seed.ts
```

Current Sprint 10 route metadata fields:

```txt
created_by
updated_by
deleted_at
deleted_by
```

Current active-route uniqueness:

```txt
Unique index: gateway_routes_method_gateway_path_active_key
Columns: method + gateway_path
Condition: deleted_at IS NULL
```

Design meaning:

```txt
Only non-deleted routes must be unique by method + gateway_path.
A soft-deleted route keeps history in DB but no longer blocks recreating the same route path.
```

Current Product Service database URL for local host mode:

```txt
postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate
```

Current Product Service database URL for Docker mode:

```txt
postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate
```

Current API Gateway database URL for local host mode:

```txt
postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway
```

Current API Gateway database URL for Docker mode:

```txt
postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate?schema=gateway
```

Current Product Service Prisma commands:

```powershell
npm run db:generate -w apps/product-service

npm run db:seed -w apps/product-service
```

Current API Gateway Prisma commands:

```powershell
$env:DATABASE_URL="postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway"

npm run db:generate -w apps/api-gateway

npm run db:migrate:deploy -w apps/api-gateway

npm run db:seed -w apps/api-gateway
```

Current seeded products:

```txt
prod_001 - Mechanical Keyboard - 120
prod_002 - Gaming Mouse - 45
```

Current seeded Gateway routes:

```txt
GET /api/products
GET /api/product-service/health
```

Important Sprint 8 database decision:

```txt
API Gateway uses PostgreSQL schema gateway instead of public.

This avoids Prisma migration drift with Product Service, because Product Service already owns the public schema migration history.
```

Important Sprint 9 route management decision:

```txt
Route management APIs write to gateway.gateway_routes.

API Gateway still loads active route configs only at startup.

Route config create/update changes require API Gateway restart before they affect runtime proxy routing.

This keeps Sprint 9 simpler and safer than hot reload.
```

---

## Automated Test Status

Current test framework:

```txt
Vitest
```

Current test command:

```powershell
npm run test
```

Current test result:

```txt
27 test files passed
176 tests passed
```

Current unit test coverage:

```txt
apps/api-gateway/src/middlewares/request-id.middleware.test.ts
  -> Request ID generation and reuse

apps/api-gateway/src/middlewares/access-log.middleware.test.ts
  -> Duration calculation, safe access log payload, response time header behavior

apps/api-gateway/src/middlewares/api-key-auth.middleware.test.ts
  -> Missing, invalid, valid, and array header API key cases

apps/api-gateway/src/middlewares/jwt-auth.middleware.test.ts
  -> Bearer token extraction, JWT verification, missing token, invalid token, valid token

apps/api-gateway/src/middlewares/metrics.middleware.test.ts
  -> Route label extraction, cache header reading, request metrics, cache metrics

apps/api-gateway/src/rate-limit/in-memory-rate-limit-store.test.ts
  -> In-memory rate limit store behavior, counters, window reset, cleanup, validation

apps/api-gateway/src/rate-limit/redis-rate-limit-store.test.ts
  -> Redis rate limit store behavior and fail-fast timeout

apps/api-gateway/src/middlewares/rate-limit.middleware.test.ts
  -> Rate limit key generation, allowed requests, exceeded limit, reset behavior, missing identifier

apps/api-gateway/src/cache/redis-response-cache-store.test.ts
  -> Redis response cache store MISS/HIT, set with TTL, validation, and fail-fast timeout

apps/api-gateway/src/middlewares/request-size-limit.middleware.test.ts
  -> Content-Length parsing, allowed body size, exceeded body size, invalid config

apps/api-gateway/src/middlewares/security-headers.middleware.test.ts
  -> Basic security headers

apps/api-gateway/src/errors/downstream-service-error.test.ts
  -> DownstreamServiceError and type guard behavior

apps/api-gateway/src/config/env.test.ts
  -> Number, CSV, string env parsing, default admin API key config, custom admin API key config

apps/api-gateway/src/config/downstream-routes.test.ts
  -> Product route policy config
  -> Product Service health route config
  -> Multi-route downstream route config list

apps/api-gateway/src/config/validate-downstream-routes.test.ts
  -> Route config validation, duplicate route detection, invalid policy detection

apps/api-gateway/src/config/database-route-config.mapper.test.ts
  -> Database route record mapping
  -> Disabled route filtering
  -> Priority ordering
  -> Header transform JSON validation
  -> Retry status JSON validation
  -> Mapped downstream route validation

apps/api-gateway/src/config/runtime-downstream-routes.test.ts
  -> Runtime DB route config success behavior
  -> Fallback when DB returns no routes
  -> Fallback when DB loading fails

apps/api-gateway/src/observability/metrics.test.ts
  -> Metrics registry, request metrics, cache metrics, cache status normalization

apps/api-gateway/src/routes/metrics.route.test.ts
  -> /metrics endpoint and Prometheus text format

apps/api-gateway/src/routes/admin-route-config.route.test.ts
  -> Admin route config read, create, update, auth, not found, validation, and duplicate behavior

apps/api-gateway/src/policies/timeout.policy.test.ts
  -> Timeout policy signal creation, abort behavior, and cleanup

apps/api-gateway/src/policies/cache.policy.test.ts
  -> Cache key generation, enabled/disabled resolution, TTL override

apps/api-gateway/src/policies/rate-limit.policy.test.ts
  -> Runtime rate limit policy resolution

apps/api-gateway/src/policies/request-transform.policy.test.ts
  -> Request header add/remove behavior and immutability

apps/api-gateway/src/policies/response-transform.policy.test.ts
  -> Response header add/remove behavior and immutability

apps/api-gateway/src/policies/retry.policy.test.ts
  -> Retryable HTTP method checks, retryable status checks, result retry, error retry, retry exhaustion
```

Current integration tests:

```txt
apps/api-gateway/src/app.test.ts
  -> 14 tests
```

Current route management API tests:

```txt
apps/api-gateway/src/routes/admin-route-config.route.test.ts
  -> Covers admin auth, list, detail, create, update, soft delete, reload validation, validation errors, duplicate conflicts, and not found behavior
```

Integration test coverage:

```txt
GET /health
  -> 200 OK
  -> includes x-request-id
  -> includes basic security headers

GET /api/product-service/health
  -> 200 OK
  -> does not require API key
  -> does not require JWT
  -> proxies to Product Service /health
  -> returns x-cache: BYPASS
  -> includes x-request-id
  -> includes x-response-time-ms
  -> does not return rate limit headers

GET /metrics
  -> 200 OK
  -> returns Prometheus text format

POST /api/products with oversized content-length
  -> 413 REQUEST_BODY_TOO_LARGE

GET /api/products without API key
  -> 401 API_KEY_MISSING

GET /api/products with invalid API key
  -> 403 API_KEY_INVALID

GET /api/products with valid API key but missing JWT
  -> 401 JWT_TOKEN_MISSING

GET /api/products with valid API key but invalid JWT
  -> 403 JWT_TOKEN_INVALID

GET /api/products with valid API key and valid JWT
  -> 200 and product data
  -> includes x-cache: BYPASS when no response cache store is configured in test app
  -> includes rate limit headers

GET /api/products with response cache store configured
  -> First request returns x-cache: MISS
  -> Second request returns x-cache: HIT
  -> Product Service is only called once

GET /api/products when rate limit is exceeded
  -> 429 TOO_MANY_REQUESTS
  -> does not call Product Service for the blocked request

GET /api/products with valid API key and valid JWT but downstream unavailable
  -> 503 DOWNSTREAM_SERVICE_UNAVAILABLE

GET /api/products with valid API key and valid JWT but downstream returns 500
  -> 502 DOWNSTREAM_HTTP_ERROR

GET /api/products with valid API key and valid JWT but downstream returns invalid JSON
  -> 502 DOWNSTREAM_INVALID_RESPONSE

GET /api/products with valid API key and valid JWT but downstream times out
  -> 504 DOWNSTREAM_TIMEOUT
```

Route management API test coverage:

```txt
GET /internal/admin/routes
  -> 401 when admin API key is missing
  -> 403 when admin API key is invalid
  -> 200 and returns all route configs when admin API key is valid

GET /internal/admin/routes/:id
  -> 200 and returns route config by id
  -> 404 when route config id does not exist

POST /internal/admin/routes
  -> 201 and creates route config
  -> 400 when route config is invalid
  -> 409 when method + gatewayPath already exists
  -> 401 when admin API key is missing

PATCH /internal/admin/routes/:id
  -> 200 and updates route config
  -> 404 when route config id does not exist or is soft-deleted
  -> 400 when merged route config is invalid
  -> 409 when method + gatewayPath conflicts with another active route
  -> 401 when admin API key is missing

DELETE /internal/admin/routes/:id
  -> 200 and soft deletes route config
  -> 404 when route config id does not exist or is already soft-deleted
  -> 401 when admin API key is missing
  -> hides soft-deleted route from list/detail

POST /internal/admin/routes/reload
  -> 200 and validates active route configs without applying runtime changes
  -> returns mode=validation-only
  -> returns runtimeApplied=false
  -> returns requiresRestart=true
  -> 401 when admin API key is missing
  -> 403 when admin API key is invalid
```

Sprint 8 test coverage:

```txt
database-route-config.mapper.test.ts
  -> Maps protected product route DB record
  -> Maps public health route DB record
  -> Maps request and response transform JSON fields
  -> Filters disabled route records
  -> Sorts active routes by priority
  -> Rejects invalid request addHeaders JSON
  -> Rejects invalid retryOnStatuses JSON
  -> Validates mapped downstream route config

runtime-downstream-routes.test.ts
  -> Uses database route configs when DB loading succeeds
  -> Falls back to static route configs when DB returns no routes
  -> Falls back to static route configs when DB loading fails
```

Sprint 9 test coverage:

```txt
env.test.ts
  -> Exposes default admin API key configuration
  -> Exposes custom admin API key configuration

admin-route-config.route.test.ts
  -> Covers admin API key guard behavior
  -> Covers route config list behavior
  -> Covers route config detail behavior
  -> Covers route config create behavior
  -> Covers route config update behavior
  -> Covers validation error behavior
  -> Covers duplicate conflict behavior
  -> Covers not found behavior
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

Run Product Service locally:

```powershell
npm run dev:product
```

Run API Gateway locally:

```powershell
npm run dev:gateway
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

Seed Product Service database:

```powershell
npm run db:seed -w apps/product-service
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

Validate PostgreSQL Product Service tables:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "\dt"
```

Validate PostgreSQL API Gateway tables:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "\dt gateway.*"
```

Validate products:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "SELECT id, name, price FROM products ORDER BY id;"
```

Validate Gateway route configs:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "SELECT method, gateway_path, downstream_url, enabled, priority, require_api_key, require_jwt, cache_enabled, rate_limit_enabled FROM gateway.gateway_routes ORDER BY priority;"
```

Validate Redis:

```powershell
docker compose exec redis redis-cli ping
```

Expected Redis result:

```txt
PONG
```

Test API Gateway health:

```powershell
Invoke-RestMethod http://localhost:3000/health | ConvertTo-Json -Depth 10
```

Expected:

```txt
service: api-gateway
status: ok
```

Test API Gateway metrics:

```powershell
Invoke-WebRequest http://localhost:3000/metrics -UseBasicParsing
```

Expected:

```txt
StatusCode: 200
Content includes Prometheus text format
```

Test Product Service health through API Gateway:

```powershell
Invoke-WebRequest http://localhost:3000/api/product-service/health -UseBasicParsing
```

Expected:

```txt
StatusCode: 200
x-cache: BYPASS
x-request-id exists
x-response-time-ms exists
Content includes Product Service health response
```

Test API Gateway DB route config loading log:

```powershell
docker compose logs api-gateway --tail=80
```

Expected with clean seeded DB:

```txt
Loaded downstream route configs from database { routeCount: 2 }
```

Test admin route config list API:

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } |
  ConvertTo-Json -Depth 10
```

Test active route configs in PostgreSQL:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "SELECT method, gateway_path, enabled, deleted_at FROM gateway.gateway_routes WHERE deleted_at IS NULL ORDER BY priority, gateway_path;"
```

Expected active routes after Sprint 10 cleanup:

```txt
GET /api/products
GET /api/product-service/health
```

Test reload validation API:

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes/reload `
  -Method POST `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } `
  -ContentType "application/json" `
  -Body "{}" |
  ConvertTo-Json -Depth 10
```

Expected reload validation result:

```txt
mode=validation-only
runtimeApplied=false
requiresRestart=true
routeCount=2
```

Test missing admin key:

```powershell
try {
  Invoke-WebRequest http://localhost:3000/internal/admin/routes `
    -UseBasicParsing
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}
```

Expected result:

```txt
401
ADMIN_API_KEY_MISSING
```

Test invalid admin key:

```powershell
try {
  Invoke-WebRequest http://localhost:3000/internal/admin/routes `
    -Headers @{ "x-admin-api-key" = "wrong-admin-key" } `
    -UseBasicParsing
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}
```

Expected result:

```txt
403
ADMIN_API_KEY_INVALID
```

Create local development JWT token:

```powershell
$token = node --input-type=module -e "import { SignJWT } from 'jose'; const secretKey = new TextEncoder().encode('local-dev-jwt-secret-change-me'); const expiresAt = Math.floor(Date.now() / 1000) + 900; const token = await new SignJWT({ role: 'user' }).setProtectedHeader({ alg: 'HS256' }).setSubject('user_123').setIssuer('pulsegate-api-gateway').setAudience('pulsegate-clients').setExpirationTime(expiresAt).sign(secretKey); console.log(token);"
```

Create request headers:

```powershell
$headers = @{
  "x-api-key" = "dev-api-key"
  "authorization" = "Bearer $token"
}
```

Test API Gateway products:

```powershell
Invoke-RestMethod http://localhost:3000/api/products `
  -Headers $headers |
  ConvertTo-Json -Depth 10
```

Test Redis-backed rate limit:

```powershell
docker compose exec redis redis-cli DEL "rate-limit:api-key:dev-api-key:route:GET:/api/products"

1..6 | ForEach-Object {
  try {
    $res = Invoke-WebRequest http://localhost:3000/api/products `
      -Headers $headers `
      -UseBasicParsing

    [PSCustomObject]@{
      Attempt = $_
      Status = $res.StatusCode
      Remaining = $res.Headers["x-ratelimit-remaining"]
      RetryAfter = $res.Headers["retry-after"]
    }
  } catch {
    [PSCustomObject]@{
      Attempt = $_
      Status = $_.Exception.Response.StatusCode.value__
      Remaining = $_.Exception.Response.Headers["x-ratelimit-remaining"]
      RetryAfter = $_.Exception.Response.Headers["retry-after"]
      Body = $_.ErrorDetails.Message
    }
  }
} | Format-Table -AutoSize
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
$res1.Content

$res2 = Invoke-WebRequest http://localhost:3000/api/products `
  -Headers $headers `
  -UseBasicParsing

$res2.StatusCode
$res2.Headers["x-cache"]
$res2.Headers["x-response-time-ms"]
$res2.Content
```

Expected response cache behavior:

```txt
Request 1 -> 200, x-cache: MISS
Request 2 -> 200, x-cache: HIT
Both responses include x-response-time-ms
```

Test cache HIT when Product Service is down:

```powershell
docker compose exec redis redis-cli DEL "response-cache:GET:/api/products"
docker compose exec redis redis-cli DEL "rate-limit:api-key:dev-api-key:route:GET:/api/products"

$res1 = Invoke-WebRequest http://localhost:3000/api/products `
  -Headers $headers `
  -UseBasicParsing

$res1.StatusCode
$res1.Headers["x-cache"]

docker compose stop product-service

$res2 = Invoke-WebRequest http://localhost:3000/api/products `
  -Headers $headers `
  -UseBasicParsing

$res2.StatusCode
$res2.Headers["x-cache"]
$res2.Content

docker compose start product-service
```

Expected result:

```txt
Request 1 -> 200, x-cache: MISS
Product Service stopped
Request 2 -> 200, x-cache: HIT
```

Test Redis down behavior:

```powershell
docker compose stop redis

try {
  Invoke-RestMethod http://localhost:3000/api/products `
    -Headers $headers |
    ConvertTo-Json -Depth 10
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}

docker compose start redis
docker compose restart api-gateway
```

Expected result:

```txt
500
{"error":{"message":"Internal Server Error","requestId":"example-request-id"}}
```

---

## Completed in Sprint 0

Sprint 0 completed:

* GitHub repo created.
* Local repo cloned.
* npm workspaces configured.
* TypeScript configured.
* API Gateway running on port `3000`.
* Product Service running on port `3001`.
* Gateway routes `/api/products` to Product Service `/products`.
* Product Service returns mock product data.
* Request ID propagation works.
* JSON logger works.
* Basic error handlers work.
* API Gateway refactored into config, routes, and middlewares.
* Product Service refactored into config, routes, and middlewares.
* `npm run typecheck` passes.
* `npm run build` passes.
* Project context docs created.
* Architecture overview created.
* Requirements document created.
* README improved as GitHub landing page.
* `.env.example` added.
* Sprint 0 README status finalized.

---

## Completed in Sprint 1

Sprint 1 completed:

* Normalized downstream service errors.
* Added `DownstreamServiceError`.
* Added `503 DOWNSTREAM_SERVICE_UNAVAILABLE`.
* Added `502 DOWNSTREAM_HTTP_ERROR`.
* Added `502 DOWNSTREAM_INVALID_RESPONSE`.
* Added downstream request timeout.
* Added `504 DOWNSTREAM_TIMEOUT`.
* Added downstream route configuration.
* Added API key authentication.
* Added API key auth unit tests.
* Added downstream error unit tests.
* Added env parsing unit tests.
* Prepared API Gateway app for integration tests.
* Added API key route integration tests.
* Added valid API key product route integration test.
* Added downstream failure integration tests.
* Added downstream timeout integration test.
* Added JWT configuration.
* Added JWT authentication middleware.
* Added JWT authentication unit tests.
* Protected Product route with API key and JWT.
* Manually validated API key and JWT protected route.

---

## Completed in Sprint 2

Sprint 2 completed:

* Added in-memory rate limiting foundation.
* Added rate limit store unit tests.
* Added rate limit middleware.
* Added rate limit middleware unit tests.
* Attached validated API key to request context.
* Applied rate limit to `GET /api/products`.
* Added route-level rate limit configuration.
* Moved product route rate limit values to environment-based config.
* Added `429 TOO_MANY_REQUESTS` response behavior.
* Added request size limit middleware.
* Added request size limit unit tests.
* Added `413 REQUEST_BODY_TOO_LARGE` response behavior.
* Added Fastify `bodyLimit`.
* Added basic security headers middleware.
* Added security headers unit tests.
* Added route-level auth configuration.
* Added downstream route config tests for rate limit and auth requirements.
* Added integration test for oversized request body.
* Added integration test for product route rate limit exceeded behavior.
* Manually validated rate limit behavior.
* Ran `npm run test`.
* Ran `npm run typecheck`.
* Ran `npm run build`.
* Pushed stable checkpoints to GitHub.

---

## Completed in Sprint 3

Sprint 3 completed:

* Added Docker Compose foundation.
* Added `.dockerignore`.
* Added API Gateway Dockerfile.
* Added Product Service Dockerfile.
* Validated Dockerized API Gateway and Product Service.
* Added PostgreSQL Docker service.
* Added PostgreSQL healthcheck.
* Added PostgreSQL Docker volume.
* Added Product Service `DATABASE_URL` config.
* Added Product Service Docker `DATABASE_URL`.
* Added Prisma Client dependency.
* Added Prisma CLI dependency.
* Added Prisma schema.
* Added `Product` model.
* Generated Prisma Client.
* Added initial Product migration.
* Validated `products` table in PostgreSQL.
* Added idempotent product seed script.
* Added Product Service Prisma database helper.
* Added Product repository.
* Replaced mock Product Service data with PostgreSQL-backed data.
* Added Redis Docker service.
* Added Redis healthcheck.
* Added API Gateway `REDIS_URL` config.
* Added API Gateway Redis client foundation.
* Added Redis client connection and disconnection lifecycle.
* Added Redis rate limit store.
* Added Redis rate limit store unit tests.
* Updated rate limit middleware to support async stores.
* Wired Redis-backed rate limiting into `GET /api/products`.
* Validated Redis rate limit key creation.
* Validated `429 TOO_MANY_REQUESTS` with Redis-backed rate limit.
* Added Redis fail-fast behavior for rate limiting.
* Added Redis response cache store.
* Added Redis response cache store unit tests.
* Wired Redis response caching into `GET /api/products`.
* Added `x-cache: MISS`, `x-cache: HIT`, and `x-cache: BYPASS`.
* Validated Redis response cache key creation.
* Validated cache MISS/HIT behavior.
* Validated cache HIT when Product Service is down.
* Isolated response cache write failures.
* Ran `npm run test`.
* Ran `npm run typecheck`.
* Ran `npm run build`.
* Pushed stable checkpoints to GitHub.

---

## Completed in Sprint 4

Sprint 4 completed:

* Added structured access log middleware.
* Added safe structured access log payload.
* Avoided logging sensitive headers.
* Registered access log middleware in API Gateway.
* Added access log middleware tests.
* Added request latency measurement.
* Added `x-response-time-ms` response header.
* Added response time header tests.
* Added `prom-client` dependency.
* Added basic HTTP metrics registry.
* Added request counter metric.
* Added request duration histogram metric.
* Added response cache outcome metric.
* Added metrics registry tests.
* Added metrics middleware.
* Recorded request metrics after response.
* Recorded cache metrics from `x-cache` header.
* Added metrics middleware tests.
* Added `/metrics` route.
* Returned Prometheus text format from `/metrics`.
* Added metrics route tests.
* Added Prometheus service to Docker Compose.
* Added Prometheus config file.
* Configured Prometheus to scrape `api-gateway:3000/metrics`.
* Validated Prometheus health.
* Validated Prometheus target health is `up`.
* Added Grafana service to Docker Compose.
* Added Grafana persistent volume.
* Added Grafana Prometheus datasource provisioning.
* Validated Grafana health.
* Validated Grafana datasource through API.
* Added Grafana dashboard provider.
* Added API Gateway overview dashboard JSON.
* Added dashboard panels for request rate, request count, p95 latency, and cache outcomes.
* Validated dashboard provisioning through Grafana API.
* Ran `npm run test`.
* Ran `npm run typecheck`.
* Ran `npm run build`.
* Ran Docker Compose validation.
* Pushed stable checkpoints to GitHub.

---

## Completed in Sprint 5

Sprint 5 completed:

* Reviewed current downstream route configuration model.
* Identified old hardcoded runtime behavior in product proxy route.
* Added route policy type foundation.
* Added central `RoutePolicies` model.
* Moved route behavior under `policies`.
* Added auth policy.
* Added timeout policy.
* Added cache policy.
* Added rate limit policy.
* Added request transform policy.
* Added response transform policy.
* Added retry policy foundation.
* Removed hardcoded response cache TTL from app registration.
* Added downstream route configuration validation helper.
* Added duplicate route validation.
* Added gateway path validation.
* Added downstream URL validation.
* Added policy value validation.
* Added request/response transform header name validation.
* Added retry status and retry attempts validation.
* Added per-route timeout policy helper.
* Added timeout policy tests.
* Refactored product proxy route to use timeout helper.
* Added per-route cache policy helper.
* Added cache key helper.
* Added cache policy tests.
* Refactored product proxy route to use resolved cache policy.
* Added per-route rate limit policy helper.
* Added rate limit policy tests.
* Refactored product proxy route to use resolved rate limit policy.
* Added request transformation policy foundation.
* Added request transform tests.
* Wired request transform foundation into downstream request headers.
* Added response transformation policy foundation.
* Added response transform tests.
* Wired response transform foundation into cache HIT, MISS, and BYPASS responses.
* Added upstream retry policy foundation.
* Added retry policy tests.
* Wired retry helper into downstream Product Service call flow.
* Kept retry disabled by default to preserve stable runtime behavior.
* Added route policy integration test for response cache store behavior.
* Validated cache MISS then cache HIT behavior in app integration test.
* Updated app integration test to assert `x-cache: BYPASS` when cache store is not configured.
* Ran `npm run test`.
* Ran `npm run typecheck`.
* Ran `npm run build`.
* Ran Docker Compose validation.
* Validated `GET /health`.
* Validated `GET /metrics`.
* Confirmed working tree clean before documentation update.
* Pushed stable checkpoints to GitHub.

---

## Completed in Sprint 6

Sprint 6 completed:

* Reviewed current root and workspace package scripts.
* Confirmed root `npm run test`, `npm run typecheck`, and `npm run build` are CI-ready.
* Confirmed Product Service requires Prisma Client generation before typecheck/build in clean environments.
* Added GitHub Actions workflow at `.github/workflows/ci.yml`.
* Configured CI to run on push to `main`.
* Configured CI to run on pull request to `main`.
* Configured CI to use Node.js 20.
* Configured CI to install dependencies with `npm ci`.
* Configured CI to generate Prisma Client with `npm run db:generate -w apps/product-service`.
* Configured CI to run automated tests with `npm run test`.
* Configured CI to run TypeScript validation with `npm run typecheck`.
* Configured CI to run production build with `npm run build`.
* Added Docker image build validation for API Gateway.
* Added Docker image build validation for Product Service.
* Validated GitHub Actions CI run successfully on GitHub.
* Added live CI badge to README.
* Ran local final validation.
* Ran Docker Compose final validation.
* Validated API Gateway `/health`.
* Validated API Gateway `/metrics`.
* Confirmed working tree clean before final documentation update.
* Pushed stable checkpoints to GitHub.
* Finalized Sprint 6 documentation.

---

## Completed in Sprint 7

Sprint 7 completed:

* Reviewed the existing Product proxy route implementation.
* Confirmed the Gateway only had one downstream proxy route before Sprint 7.
* Refactored Product proxy into a reusable generic downstream proxy route.
* Added `DownstreamProxyRouteOptions`.
* Added `downstreamProxyRoute()`.
* Kept `productProxyRoute()` as a compatibility wrapper.
* Preserved existing Product route behavior.
* Added Product Service health route config.
* Added `productServiceHealthRouteConfig`.
* Added the new route to `downstreamRouteConfigs`.
* Updated route config tests.
* Confirmed route config validation passes for multiple routes.
* Updated API Gateway app registration to use `downstreamProxyRoute()`.
* Passed `downstreamRouteConfigs` into Gateway route registration.
* Added integration test for `GET /api/product-service/health`.
* Confirmed the new route is public.
* Confirmed the new route does not require API key.
* Confirmed the new route does not require JWT.
* Confirmed the new route does not return rate limit headers.
* Confirmed the new route returns `x-cache: BYPASS`.
* Confirmed the new route returns `x-request-id`.
* Confirmed the new route returns `x-response-time-ms`.
* Ran `npm run test`.
* Ran `npm run typecheck`.
* Ran `npm run build`.
* Ran `docker compose up -d --build`.
* Ran `docker compose ps`.
* Validated API Gateway `/health`.
* Validated API Gateway `/metrics`.
* Validated API Gateway `/api/product-service/health`.
* Validated protected Product route still works.
* Validated `GET /api/products` with API key and JWT.
* Validated Redis response cache `MISS -> HIT`.
* Validated Redis-backed rate limit headers still work.
* Confirmed working tree clean before final documentation update.
* Pushed stable checkpoints to GitHub.
* Finalized Sprint 7 documentation.

---

## Completed in Sprint 8

Sprint 8 completed:

* Added Prisma to API Gateway.
* Added API Gateway Prisma schema.
* Added API Gateway Prisma scripts.
* Added `GatewayRoute` Prisma model.
* Added `GatewayRouteMethod` Prisma enum.
* Added API Gateway route config database migration.
* Created PostgreSQL schema `gateway`.
* Moved API Gateway route config migration history to `gateway._prisma_migrations`.
* Kept Product Service migration history in `public._prisma_migrations`.
* Added `gateway.gateway_routes` table.
* Added unique constraint for method + gateway path.
* Added enabled + priority index.
* Added route policy fields to database model.
* Added auth policy DB fields.
* Added timeout policy DB fields.
* Added cache policy DB fields.
* Added rate limit policy DB fields.
* Added request transform DB fields.
* Added response transform DB fields.
* Added retry policy DB fields.
* Added API Gateway route config seed script.
* Seeded `GET /api/products`.
* Seeded `GET /api/product-service/health`.
* Used idempotent `upsert` seed behavior.
* Used Docker internal Product Service URLs in seed data.
* Validated database contains 2 route configs.
* Added Gateway Prisma Client wrapper.
* Added database route config mapper.
* Added route record mapping into `DownstreamRouteConfig`.
* Added JSON validation for transform headers.
* Added JSON validation for retry statuses.
* Added disabled route filtering.
* Added priority sorting.
* Added mapped route config validation.
* Added mapper unit tests.
* Added database route config repository.
* Added runtime downstream route config loader.
* Added DB-first route config loading.
* Added empty DB fallback.
* Added DB error fallback.
* Preserved static route configs as safe fallback.
* Updated `app.ts` to accept runtime route configs.
* Updated `server.ts` to load route configs before building the app.
* Updated `onClose` lifecycle to disconnect Redis and Gateway Prisma Client.
* Updated GitHub Actions CI to generate Product Service Prisma Client.
* Updated GitHub Actions CI to generate API Gateway Prisma Client.
* Updated API Gateway Dockerfile to generate Prisma Client inside Docker image.
* Updated `.dockerignore` to exclude API Gateway generated Prisma Client.
* Updated Docker Compose with API Gateway `DATABASE_URL`.
* Updated Docker Compose dependency ordering for API Gateway.
* Fixed Prisma Query Engine mismatch between Windows-generated client and Linux Alpine container.
* Validated API Gateway loads DB route config in Docker runtime.
* Confirmed API Gateway log: `Loaded downstream route configs from database { routeCount: 2 }`.
* Validated public DB-backed `GET /api/product-service/health`.
* Validated `x-cache: BYPASS` for public health proxy route.
* Validated protected DB-backed `GET /api/products`.
* Validated API key and JWT still protect Product route.
* Validated Redis-backed rate limit still works.
* Validated Redis response cache still works.
* Validated cache `MISS -> HIT`.
* Ran `npm run test`.
* Ran `npm run typecheck`.
* Ran `npm run build`.
* Ran Docker Compose validation.
* Confirmed 26 test files and 152 tests passing.
* Pushed stable Sprint 8 technical checkpoints to GitHub.
* Finalized Sprint 8 documentation.

---

## Completed in Sprint 9

Sprint 9 completed:

* Added admin API key environment config.
* Added `ADMIN_API_KEY_HEADER`.
* Added `ADMIN_API_KEY`.
* Documented admin API key variables in `.env.example`.
* Added admin API key middleware.
* Added route management type foundation.
* Added route management repository interface.
* Added Prisma route management repository.
* Added route config response mapper.
* Added route config create request mapper.
* Added route config update request mapper.
* Added `GET /internal/admin/routes`.
* Added `GET /internal/admin/routes/:id`.
* Added `POST /internal/admin/routes`.
* Added `PATCH /internal/admin/routes/:id`.
* Added route config list behavior.
* Added route config detail behavior.
* Added route config create behavior.
* Added route config update behavior.
* Added route config enable/disable behavior through PATCH.
* Reused downstream route config validation before create.
* Reused downstream route config validation before update.
* Added duplicate method + gatewayPath check for create.
* Added duplicate method + gatewayPath conflict check for update.
* Added route config not found response.
* Added invalid route config response.
* Added duplicate route config response.
* Added missing admin API key response.
* Added invalid admin API key response.
* Added admin route config tests.
* Added env tests for admin API key config.
* Validated create route API in Docker runtime.
* Validated duplicate create route API returns `409 ROUTE_CONFIG_ALREADY_EXISTS`.
* Validated update route API in Docker runtime.
* Validated disabled route behavior after restart.
* Cleaned local test route from database.
* Confirmed database returned to 2 seeded route configs.
* Ran `npm run test`.
* Ran `npm run typecheck`.
* Ran `npm run build`.
* Confirmed test count is 27 files and 176 tests.
* Confirmed working tree clean after technical commits.
* Pushed stable checkpoints to GitHub.

---

## Completed in Sprint 10

Sprint 10 completed:

* Added route config soft delete foundation.
* Added `createdBy` and `updatedBy` route metadata.
* Added `deletedAt` and `deletedBy` route metadata.
* Added PostgreSQL migration `20260702090000_add_gateway_route_soft_delete`.
* Removed the old full unique constraint on `method + gateway_path`.
* Added PostgreSQL partial unique index for active routes only: `method + gateway_path WHERE deleted_at IS NULL`.
* Updated API Gateway route config seed to use `findFirst` plus create/update instead of compound `upsert`.
* Updated runtime DB route config repository to load only routes where `enabled=true` and `deleted_at IS NULL`.
* Updated database route config mapper to ignore soft-deleted records.
* Updated route management repository to list and find only non-deleted routes.
* Updated duplicate route lookup to ignore soft-deleted routes.
* Added `softDeleteRoute(id, actor)` to the route management repository.
* Added `DELETE /internal/admin/routes/:id`.
* Implemented soft delete behavior with `enabled=false`, `deletedAt`, `deletedBy`, and `updatedBy`.
* Added `x-admin-actor` support for createdBy, updatedBy, and deletedBy metadata.
* Updated route management response shape to include createdBy, updatedBy, deletedAt, and deletedBy.
* Confirmed admin list hides soft-deleted routes.
* Confirmed route detail returns `404 ROUTE_CONFIG_NOT_FOUND` for soft-deleted routes.
* Confirmed runtime route loader does not load soft-deleted routes after API Gateway restart.
* Confirmed the same method + gatewayPath can be recreated after the old route is soft-deleted.
* Added `POST /internal/admin/routes/reload`.
* Implemented reload validation as validation-only, not true hot reload.
* Reload validation reads active route configs, maps them to runtime config, validates them, and returns a summary.
* Reload validation returns `mode=validation-only`, `runtimeApplied=false`, and `requiresRestart=true`.
* Added reload validation auth behavior for missing and invalid admin API key.
* Added route management tests for soft delete behavior.
* Added route management tests for reload validation behavior.
* Validated Docker runtime soft delete behavior.
* Validated Docker runtime partial unique index behavior.
* Validated Docker runtime reload validation endpoint.
* Ran `npm run test`.
* Ran `npm run typecheck`.
* Ran `npm run build`.
* Confirmed test count is 27 files and 176 tests.
* Confirmed working tree clean after Sprint 10 technical commits.
* Pushed stable Sprint 10 technical checkpoints to GitHub.


---

## Current Stable Commits

### Sprint 10

```txt
8052742 feat(gateway): add route config soft delete
1f7443d feat(gateway): add route config reload validation
```

### Sprint 9

```txt
2e0faee feat(gateway): add admin route config read api
0d6aa66 feat(gateway): add route config create api
7a828ba feat(gateway): add route config update api
4f660d6 chore(gateway): document admin route config env
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

### Sprint 5

```txt
9138e16 feat(gateway): add route policy type foundation
dbd2607 feat(gateway): validate route policy configuration
6bf7eb1 feat(gateway): add per-route timeout policy helper
75d63f7 feat(gateway): add per-route cache policy helper
7480632 feat(gateway): add per-route rate limit policy helper
13ee083 feat(gateway): add request transformation policy foundation
57bdd38 feat(gateway): add response transformation policy foundation
806022a feat(gateway): add upstream retry policy foundation
84b3fed test(gateway): cover route policy integration behavior
```

### Sprint 4

```txt
75eacfb feat(gateway): add structured access logs
b0da511 feat(gateway): add response time header
fb17516 feat(gateway): add basic http metrics registry
31cae03 feat(gateway): expose prometheus metrics endpoint
13789a3 chore(observability): add prometheus service
6bb7de2 chore(observability): add grafana service
87490cf chore(observability): add grafana dashboard foundation
```

### Sprint 3

```txt
7dbb2d2 chore: add docker compose foundation
84a277b docs: document docker compose workflow
75edf46 chore: add postgres service to docker compose
934532b chore(product): add database url config
f390694 chore(product): add prisma schema foundation
10a3101 chore(product): add initial products migration
f247260 chore(product): add product seed script
23b5903 feat(product): read products from database
ccccda5 chore: add redis service to docker compose
94443a3 chore(gateway): add redis client foundation
25bff78 feat(gateway): add redis rate limit store
ff06658 feat(gateway): use redis backed rate limiting
411d13a feat(gateway): add redis response cache store
cf0f2b9 feat(gateway): cache product responses in redis
176bcfe fix(gateway): isolate response cache write failures
```

### Earlier Stable Foundation

```txt
5d247cc feat: setup basic gateway to product service flow
207616a refactor: split api gateway routes config and middlewares
3ae7802 refactor: split product service routes config and middlewares
c0615fe docs: add project context handoff and progress logs
71923ae docs: add architecture overview and requirements
009cc3d docs: improve readme landing page
b5ee327 docs: add environment example
fe9e5d2 docs: finalize sprint 0 readme status
f66d523 feat(gateway): normalize downstream service errors
32af4ab feat(gateway): add downstream request timeout
27f40bb refactor(gateway): add downstream route configuration
940806f feat(gateway): add api key authentication
04d616b docs: update sprint 1 progress context
6c93cbe test(gateway): add basic unit test setup
2b742d3 test(gateway): add api key auth unit tests
7388dab test(gateway): add downstream error unit tests
5023e36 test(gateway): add env parsing unit tests
7f100de test(gateway): prepare app for integration tests
056ed7a test(gateway): add api key route integration tests
8fe5aae test(gateway): add valid api key product route integration test
2fca28e test(gateway): add downstream failure integration tests
10d512a test(gateway): add downstream timeout integration test
82672c6 feat(gateway): add jwt configuration
ad0a9fd feat(gateway): add jwt authentication middleware
9cc8e88 test(gateway): add jwt auth unit tests
c233071 feat(gateway): protect product route with jwt
7c88936 feat(gateway): add in-memory rate limiting for product route
4aed0ff refactor(gateway): move product rate limit to route config env
a12605f feat(gateway): add request size limit
76fdd2f feat(gateway): add basic security headers
28a9b5e refactor(gateway): add route-level auth config
```

---

## Current Next Step

Recommended next step:

```txt
Sprint 10 - Final Documentation Update
```

Currently updating these files:

```txt
README.md
docs/architecture/overview.md
docs/project-context/CURRENT_PROGRESS.md
docs/project-context/AI_HANDOFF.md
docs/project-context/DECISION_LOG.md
docs/sdlc/requirements.md
```

After all Sprint 10 documentation files are updated:

```txt
1. Run git diff
2. Run git status
3. Run npm run test
4. Run npm run typecheck
5. Run npm run build
6. Commit docs with:
   docs: finalize sprint 10 documentation
7. Push to GitHub
8. Confirm GitHub Actions CI passes
```

After Sprint 10 documentation is committed, move to:

```txt
Sprint 11 - Admin Dashboard Foundation or Admin Auth/Audit Hardening
```

Recommended Sprint 11 direction:

```txt
1. Start a small Admin Dashboard foundation only if backend route management docs are fully updated.
2. Or add stronger admin authentication/RBAC if security hardening is prioritized.
3. Or add dedicated route management audit log table if audit history is prioritized.
4. Keep true runtime hot reload as a controlled future checkpoint.
5. Do not jump to Kafka, RabbitMQ, Kubernetes, Developer Portal, OpenTelemetry, Loki, k6, Docker registry push, or cloud deployment yet.
```

---

## Important Development Rules

Do not jump directly to advanced infrastructure before the current Gateway routing, route policies, database route config, route management API, CI/CD, and project context documentation are documented and stable.

Do not add these without a planned sprint:

* Kafka
* RabbitMQ
* Kubernetes
* Admin Dashboard
* Developer Portal
* Advanced OpenTelemetry tracing
* Loki centralized logs
* k6 load testing
* Complex service discovery
* Production cloud deployment
* Docker image registry push
* Automatic deployment

Sprint 10 documentation should focus on:

* Route Management Hardening.
* `DELETE /internal/admin/routes/:id`.
* `POST /internal/admin/routes/reload`.
* Soft delete instead of hard delete.
* `created_by`, `updated_by`, `deleted_at`, and `deleted_by`.
* `x-admin-actor` metadata.
* Partial unique index for active routes.
* Runtime loader filtering `enabled=true` and `deleted_at IS NULL`.
* Admin list/detail hiding soft-deleted routes.
* Duplicate route check ignoring soft-deleted routes.
* Ability to recreate the same method + gatewayPath after soft delete.
* Reload validation endpoint.
* `mode=validation-only`.
* `runtimeApplied=false`.
* `requiresRestart=true`.
* Docker runtime soft delete validation.
* Docker runtime reload validation.
* Test count update from 168 to 176.
* Version update from v0.10.0 to v0.11.0.
* Next sprint: Sprint 11 - Admin Dashboard Foundation or Admin Auth/Audit Hardening.

The project should continue with small, stable checkpoints.

Each new feature should follow this workflow:

1. Implement code in small steps.
2. Explain purpose and request flow.
3. Run local tests.
4. Run `npm run test`.
5. Run `npm run typecheck`.
6. Run `npm run build`.
7. Run Docker/runtime validation when runtime behavior changes.
8. Commit after stable checkpoint.
9. Push after each stable commit.
10. Update project context docs at the end of the sprint.

---

## How the Assistant Should Continue

When continuing from this file, the assistant should continue with:

```txt
Sprint 10 - Final Documentation Update
```

If Sprint 10 final documentation update is already complete, continue with:

```txt
Sprint 11 - Admin Dashboard Foundation or Admin Auth/Audit Hardening
```

The assistant should continue slowly, one file or one small feature at a time.

Before coding the next step, the assistant should explain:

* What problem the step solves.
* What the expected behavior is.
* What files will be changed.
* How to test success and failure cases.
* Which unit tests and integration tests should be added.

The assistant should not skip directly to Kafka, RabbitMQ, Kubernetes, Admin Dashboard, Developer Portal, production cloud deployment, Loki, k6, Docker image registry push, or advanced OpenTelemetry unless the user explicitly chooses that as the next sprint.

For Sprint 11, the assistant should preserve the Sprint 8, Sprint 9, and Sprint 10 safety model:

```txt
Database route config first
Static fallback still available
Validation before persistence
Small route management API surface
Admin Dashboard only after backend route management behavior is documented and stable
No true runtime hot reload complexity unless implemented as a controlled checkpoint
```