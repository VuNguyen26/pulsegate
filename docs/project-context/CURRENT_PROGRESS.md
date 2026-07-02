# Current Progress

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

## Current Sprint

Sprint 10 - Route Management Hardening

## Current Version

v0.11.0

## Sprint Status

Sprint 10 technical implementation is complete.

Sprint 10 final documentation update is in progress.

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

Sprint 10 completed Route Management Hardening:

1. Added route config soft delete foundation.
2. Added `DELETE /internal/admin/routes/:id`.
3. Added `POST /internal/admin/routes/reload`.
4. Added safe route reload validation endpoint.
5. Kept reload endpoint intentionally `validation-only`.
6. Kept real runtime hot reload deferred.
7. Added route metadata fields `createdBy`, `updatedBy`, `deletedAt`, and `deletedBy`.
8. Added database columns `created_by`, `updated_by`, `deleted_at`, and `deleted_by`.
9. Added support for `x-admin-actor`.
10. Used `x-admin-actor` to populate create/update/delete metadata.
11. Defaulted admin actor to `admin-api-key` when actor header is missing.
12. Changed route delete behavior from hard delete to soft delete.
13. Soft delete now sets `enabled=false`.
14. Soft delete now sets `deleted_at`.
15. Soft delete now sets `deleted_by`.
16. Soft delete now sets `updated_by`.
17. Admin route list now excludes soft-deleted routes.
18. Admin route detail now excludes soft-deleted routes.
19. Admin duplicate route lookup now excludes soft-deleted routes.
20. Admin route update now rejects updates for soft-deleted routes by returning `404 ROUTE_CONFIG_NOT_FOUND`.
21. Admin route delete now returns `404 ROUTE_CONFIG_NOT_FOUND` for missing or already soft-deleted routes.
22. Runtime database route loader now loads only active routes.
23. Runtime database route repository now filters `enabled=true` and `deletedAt=null`.
24. Runtime database route mapper also filters deleted route records defensively.
25. API Gateway restart no longer registers soft-deleted route configs.
26. Recreating the same `method + gatewayPath` after soft delete is now allowed.
27. Removed the old full unique constraint behavior from the Prisma model.
28. Replaced full route uniqueness with a PostgreSQL partial unique index for active routes only.
29. Added partial unique index `gateway_routes_method_gateway_path_active_key`.
30. Partial unique index applies only when `deleted_at IS NULL`.
31. Added index `gateway_routes_deleted_at_idx`.
32. Added index `gateway_routes_enabled_deleted_at_priority_idx`.
33. Updated API Gateway route config seed script after removing Prisma compound unique upsert.
34. Seed now uses `findFirst({ method, gatewayPath, deletedAt: null })` before update/create.
35. Seed now remains idempotent with the partial unique index strategy.
36. Updated route management types for audit metadata and soft delete behavior.
37. Updated route management repository interface with `softDeleteRoute()`.
38. Updated Prisma route management repository with soft delete persistence.
39. Updated route management response mapper to return metadata fields.
40. Updated admin route config API to include soft delete endpoint.
41. Updated admin route config API to include reload validation endpoint.
42. Reload validation endpoint reads active route configs.
43. Reload validation endpoint validates active DB route configs through the existing route mapping and validation path.
44. Reload validation endpoint returns `mode: validation-only`.
45. Reload validation endpoint returns `runtimeApplied: false`.
46. Reload validation endpoint returns `requiresRestart: true`.
47. Reload validation endpoint returns current active route count.
48. Reload validation endpoint returns a lightweight route summary.
49. Reload validation endpoint is protected by admin API key.
50. Reload validation endpoint rejects missing admin API key with `401 ADMIN_API_KEY_MISSING`.
51. Reload validation endpoint rejects invalid admin API key with `403 ADMIN_API_KEY_INVALID`.
52. Added tests for route soft delete behavior.
53. Added tests that admin list hides soft-deleted routes.
54. Added tests that admin detail returns 404 for soft-deleted routes.
55. Added tests for soft delete auth failure behavior.
56. Added tests for reload validation behavior.
57. Added tests for reload validation missing admin API key.
58. Added tests for reload validation invalid admin API key.
59. Validated soft delete behavior in Docker runtime.
60. Validated reload validation behavior in Docker runtime.
61. Validated partial unique index behavior by recreating the same path after soft delete.
62. Confirmed active DB route query returns only 2 seeded routes.
63. Confirmed soft-deleted test routes remain only as historical rows.
64. Confirmed runtime route count returns to 2 after API Gateway restart.
65. Ran final local test validation.
66. Ran final TypeScript typecheck validation.
67. Ran final production build validation.
68. Confirmed current automated tests: 27 files and 176 tests.
69. Confirmed working tree clean after Sprint 10 technical commits.
70. Pushed stable Sprint 10 checkpoints to GitHub.

Current automated test status:

```txt
27 test files passed
176 tests passed
```

Current validation status:

```txt
npm run test       -> passed
npm run typecheck  -> passed
npm run build      -> passed
docker compose up -d --build -> passed
docker compose ps -> passed
GET /internal/admin/routes with x-admin-api-key -> returned active non-deleted routes
POST /internal/admin/routes -> created temporary runtime test route
docker compose restart api-gateway -> runtime loaded routeCount: 3
GET /api/product-service/health-copy -> 200 OK before soft delete after restart
DELETE /internal/admin/routes/:id -> soft-deleted temporary route
GET /internal/admin/routes -> temporary soft-deleted route hidden
GET /internal/admin/routes/:id after soft delete -> 404 ROUTE_CONFIG_NOT_FOUND
docker compose restart api-gateway -> runtime loaded routeCount: 2
GET /api/product-service/health-copy after soft delete and restart -> 404 Route not found
SELECT active routes WHERE deleted_at IS NULL -> 2 seeded routes
Recreated same method + gatewayPath after soft delete -> passed
Cleaned recreated test route with soft delete -> passed
POST /internal/admin/routes/reload with valid admin key -> 200 OK, routeCount: 2, mode: validation-only
POST /internal/admin/routes/reload without admin key -> 401 ADMIN_API_KEY_MISSING
POST /internal/admin/routes/reload with invalid admin key -> 403 ADMIN_API_KEY_INVALID
git status -> clean after Sprint 10 technical commits
```

---

## Completed

### Repository Setup

* GitHub repository created.
* Local repository cloned.
* npm workspaces configured.
* TypeScript configured.
* Basic monorepo structure created.
* `.gitignore` added.
* `.gitattributes` added.
* `.env.example` added.
* Docker Compose foundation added.
* API Gateway Dockerfile added.
* Product Service Dockerfile added.
* `.dockerignore` added.
* GitHub Actions workflow added.
* README CI badge added.
* API Gateway Prisma generated client ignored from Git.
* Product Service Prisma generated client generated in CI.
* API Gateway Prisma generated client generated in CI.
* API Gateway Prisma generated client generated inside Docker image.
* Admin route management environment variables documented in `.env.example`.
* Route management hardening documented in project docs.

---

## Infrastructure

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

Current Docker services:

```txt
pulsegate-api-gateway
pulsegate-product-service
pulsegate-postgres
pulsegate-redis
pulsegate-prometheus
pulsegate-grafana
```

Current Docker Compose behavior:

* API Gateway runs inside Docker.
* Product Service runs inside Docker.
* PostgreSQL runs inside Docker.
* Redis runs inside Docker.
* Prometheus runs inside Docker.
* Grafana runs inside Docker.
* Product Service depends on healthy PostgreSQL.
* API Gateway depends on healthy PostgreSQL.
* API Gateway depends on healthy Redis.
* API Gateway depends on healthy Product Service.
* Prometheus depends on API Gateway.
* Grafana depends on Prometheus.
* PostgreSQL uses a persistent Docker volume.
* Prometheus uses a persistent Docker volume.
* Grafana uses a persistent Docker volume.
* Product Service uses Docker internal PostgreSQL URL.
* API Gateway uses Docker internal PostgreSQL URL with `?schema=gateway`.
* API Gateway uses Docker internal Product Service URL.
* API Gateway uses Docker internal Redis URL.
* Prometheus scrapes API Gateway using Docker internal service URL.
* Grafana connects to Prometheus using Docker internal service URL.

Current infrastructure validation:

```powershell
docker compose up -d --build
docker compose ps
```

Expected services:

```txt
pulsegate-postgres         healthy
pulsegate-redis            healthy
pulsegate-product-service  healthy
pulsegate-api-gateway      up
pulsegate-prometheus       up
pulsegate-grafana          up
```

Expected API Gateway startup log after Sprint 10 with the clean seeded DB:

```txt
Loaded downstream route configs from database { routeCount: 2 }
```

---

## CI/CD

Sprint 6 added the first CI/CD foundation with GitHub Actions.

Sprint 8 extended CI so API Gateway Prisma Client is generated in clean runners.

Workflow file:

```txt
.github/workflows/ci.yml
```

Workflow name:

```txt
CI
```

Current job name:

```txt
Test, Typecheck, and Build
```

Current triggers:

```txt
push to main
pull_request to main
```

Current CI steps:

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

Current CI validates:

* Repository can install dependencies cleanly using `npm ci`.
* Product Service Prisma Client can be generated in a clean runner.
* API Gateway Prisma Client can be generated in a clean runner.
* Automated tests pass.
* TypeScript typecheck passes.
* Production build passes.
* API Gateway Docker image can be built.
* Product Service Docker image can be built.
* README CI badge reflects live workflow status.

Current GitHub Actions status:

```txt
CI -> passing
```

Current README badge:

```txt
CI passing
```

Why CI matters:

* Every push to `main` is automatically validated.
* Every pull request into `main` is automatically validated.
* The project has a professional GitHub portfolio signal.
* CI catches test, typecheck, build, Prisma generate, and Docker build issues early.
* The repository is safer to continue refactoring in later sprints.
* API Gateway Prisma Client is not committed but can still be generated from a clean runner.

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

---

## PostgreSQL

Implemented:

* PostgreSQL Docker service.
* PostgreSQL healthcheck.
* PostgreSQL persistent Docker volume.
* Prisma schema foundation for Product Service.
* Initial Product model.
* Initial Product migration.
* Idempotent Product seed script.
* PostgreSQL-backed Product Service data.
* Prisma schema foundation for API Gateway.
* API Gateway route config model.
* API Gateway route config migration.
* API Gateway route config soft delete migration.
* Idempotent API Gateway route config seed script.
* PostgreSQL-backed API Gateway route config.
* Product Service Prisma Client generation in CI.
* API Gateway Prisma Client generation in CI.
* API Gateway route management reads from PostgreSQL.
* API Gateway route management creates route configs in PostgreSQL.
* API Gateway route management updates route configs in PostgreSQL.
* API Gateway route management soft-deletes route configs in PostgreSQL.
* API Gateway route enable/disable state is persisted in PostgreSQL.
* API Gateway route delete metadata is persisted in PostgreSQL.
* Active route uniqueness is enforced by PostgreSQL partial unique index.

Local database name:

```txt
pulsegate
```

Default local database user:

```txt
pulsegate
```

Default local password:

```txt
pulsegate_password
```

Product Service local host connection string:

```txt
postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate
```

Product Service Docker internal connection string:

```txt
postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate
```

API Gateway local host connection string:

```txt
postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway
```

API Gateway Docker internal connection string:

```txt
postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate?schema=gateway
```

Current PostgreSQL schemas:

```txt
public
gateway
```

Current Product Service tables:

```txt
public._prisma_migrations
public.products
```

Current API Gateway tables:

```txt
gateway._prisma_migrations
gateway.gateway_routes
```

Current Product Service migration:

```txt
apps/product-service/prisma/migrations/20260628092746_init_products/migration.sql
```

Current API Gateway migrations:

```txt
apps/api-gateway/prisma/migrations/20260701063629_add_gateway_routes/migration.sql
apps/api-gateway/prisma/migrations/20260702090000_add_gateway_route_soft_delete/migration.sql
```

Current `products` table columns:

```txt
id
name
price
createdAt
updatedAt
```

Current `gateway.gateway_routes` important columns:

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

Current Gateway route config indexes:

```txt
gateway_routes_enabled_priority_idx
gateway_routes_deleted_at_idx
gateway_routes_enabled_deleted_at_priority_idx
gateway_routes_method_gateway_path_active_key
```

Important active route unique constraint:

```txt
CREATE UNIQUE INDEX gateway_routes_method_gateway_path_active_key
ON gateway.gateway_routes(method, gateway_path)
WHERE deleted_at IS NULL;
```

Design meaning:

```txt
Only active route configs must be unique by method + gateway_path.
Soft-deleted historical rows can keep the same method + gateway_path.
A route can be recreated after the previous active record has been soft-deleted.
```

Current seeded products:

```txt
prod_001 - Mechanical Keyboard - 120
prod_002 - Gaming Mouse - 45
```

Current seeded active Gateway route configs:

```txt
GET /api/products
  -> downstreamUrl: http://product-service:3001/products
  -> requireApiKey: true
  -> requireJwt: true
  -> timeoutEnabled: true
  -> cacheEnabled: true
  -> rateLimitEnabled: true
  -> retryEnabled: false
  -> deletedAt: null

GET /api/product-service/health
  -> downstreamUrl: http://product-service:3001/health
  -> requireApiKey: false
  -> requireJwt: false
  -> timeoutEnabled: true
  -> cacheEnabled: false
  -> rateLimitEnabled: false
  -> retryEnabled: false
  -> deletedAt: null
```

Validate Product Service products:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "SELECT id, name, price FROM products ORDER BY id;"
```

Validate active API Gateway route configs:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "SELECT method, gateway_path, downstream_url, enabled, priority, deleted_at FROM gateway.gateway_routes WHERE deleted_at IS NULL ORDER BY priority, gateway_path;"
```

Expected clean Sprint 10 active route config result:

```txt
GET /api/products
GET /api/product-service/health
```

Validate all Gateway route configs including soft-deleted history:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "SELECT method, gateway_path, enabled, created_by, updated_by, deleted_at, deleted_by FROM gateway.gateway_routes ORDER BY priority, gateway_path;"
```

Expected note:

```txt
Soft-deleted test routes may remain as historical rows.
This is expected.
A clean active state means only the 2 seeded routes have deleted_at IS NULL.
```

---

## Redis

Implemented:

* Redis Docker service.
* Redis healthcheck.
* Redis client foundation in API Gateway.
* Redis-backed rate limiting.
* Redis response caching.
* Redis command timeout behavior.
* Redis fail-fast behavior for rate limit and cache commands.
* Redis offline queue disabled.
* Redis reconnect strategy disabled for the current local development setup.

Current local Redis URL:

```txt
redis://localhost:6379
```

Current Docker internal Redis URL:

```txt
redis://redis:6379
```

Redis validation command:

```powershell
docker compose exec redis redis-cli ping
```

Expected result:

```txt
PONG
```

Current Redis key categories:

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

---

## Prometheus

Implemented:

* Prometheus Docker Compose service.
* Prometheus persistent Docker volume.
* Prometheus configuration file.
* Prometheus scrape job for API Gateway.
* Prometheus target validation.

Prometheus URL:

```txt
http://localhost:9090
```

Prometheus config location:

```txt
observability/prometheus/prometheus.yml
```

Current Prometheus scrape configuration:

```txt
job_name: pulsegate-api-gateway
metrics_path: /metrics
target: api-gateway:3000
scrape_interval: 5s
```

Prometheus health check:

```powershell
Invoke-WebRequest http://localhost:9090/-/healthy -UseBasicParsing
```

Expected result:

```txt
Prometheus Server is Healthy.
```

Prometheus target check:

```powershell
Invoke-RestMethod http://localhost:9090/api/v1/targets | ConvertTo-Json -Depth 10
```

Expected target:

```txt
job: pulsegate-api-gateway
scrapeUrl: http://api-gateway:3000/metrics
health: up
```

---

## Grafana

Implemented:

* Grafana Docker Compose service.
* Grafana persistent Docker volume.
* Grafana provisioning directory.
* Grafana Prometheus datasource provisioning.
* Grafana dashboard provider provisioning.
* API Gateway overview dashboard foundation.

Grafana URL:

```txt
http://localhost:3002
```

Local development login:

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

## API Gateway

Location:

```txt
apps/api-gateway
```

Current port:

```txt
3000
```

Implemented:

* Fastify server.
* Health check endpoint.
* Product proxy endpoint.
* Product Service health proxy endpoint.
* Prometheus metrics endpoint.
* Internal/admin route management API foundation.
* Internal/admin route management hardening.
* Internal/admin route config soft delete endpoint.
* Internal/admin route config reload validation endpoint.
* Request ID generation.
* Request ID response header.
* Request ID forwarding to Product Service.
* JSON logger.
* Structured access logs.
* Request latency measurement.
* `x-response-time-ms` response header.
* Basic HTTP metrics registry.
* HTTP metrics middleware.
* Prometheus-compatible metrics output.
* Basic 404 handler.
* Basic 500 error handler.
* Config separated into `config/env.ts`.
* Routes separated into `routes`.
* Middlewares separated into `middlewares`.
* Errors separated into `errors`.
* Redis client separated into `redis`.
* Rate limit stores separated into `rate-limit`.
* Response cache stores separated into `cache`.
* Gateway policies separated into `policies`.
* Route management logic separated into `route-management`.
* Observability code separated into `observability`.
* App builder separated into `app.ts`.
* Server startup separated into `server.ts`.
* Normalized downstream service errors.
* Downstream request timeout using `AbortController`.
* Configurable downstream request timeout through `DOWNSTREAM_REQUEST_TIMEOUT_MS`.
* Static downstream route configuration foundation.
* Database-backed downstream route configuration.
* Runtime route config loader.
* Database route config mapper.
* Database route config repository.
* Gateway Prisma Client wrapper.
* Safe static fallback for route config.
* Generic downstream proxy route foundation.
* Compatibility wrapper for the original Product proxy route.
* Route policy type foundation.
* Route policy configuration validation.
* API key authentication middleware.
* Configurable API key header through `API_KEY_HEADER`.
* Local development API key list through `API_KEYS`.
* Admin API key authentication middleware.
* Configurable admin API key header through `ADMIN_API_KEY_HEADER`.
* Configurable admin API key through `ADMIN_API_KEY`.
* Optional admin actor metadata through `x-admin-actor`.
* JWT configuration.
* JWT authentication middleware.
* JWT validation using `jose`.
* Protected Product route with API key and JWT.
* Public Product Service health proxy route.
* Route config list endpoint.
* Route config detail endpoint.
* Route config create endpoint.
* Route config update endpoint.
* Route config soft delete endpoint.
* Route config reload validation endpoint.
* Route config enable/disable foundation through PATCH.
* Route management repository abstraction.
* Prisma-backed route management repository.
* Route management request/response mappers.
* Route config create validation before persistence.
* Route config update validation before persistence.
* Route reload validation before reporting reload summary.
* Duplicate route config conflict detection for active routes only.
* Soft-deleted route config filtering for admin list/detail/duplicate checks.
* Soft-deleted route config filtering for runtime DB loading.
* Simple route config reload strategy through API Gateway restart.
* Validation-only reload endpoint to inspect active DB route config health.
* In-memory rate limit store for tests and fallback-compatible abstractions.
* Redis-backed rate limit store for Docker/runtime flow.
* Route-level rate limit configuration.
* Rate limit response behavior with `429 TOO_MANY_REQUESTS`.
* Rate limit response headers.
* Configurable product route rate limit through environment variables.
* Request size limit.
* Configurable request body size limit through `MAX_REQUEST_BODY_BYTES`.
* Request body too large response with `413 REQUEST_BODY_TOO_LARGE`.
* Basic security headers.
* Route-level auth policy.
* Redis response cache store.
* Product response caching for `GET /api/products`.
* Cache debug headers with `x-cache: MISS`, `x-cache: HIT`, and `x-cache: BYPASS`.
* Cache HIT behavior when Product Service is down.
* Cache write failure isolation.
* Per-route timeout policy helper.
* Per-route cache policy helper.
* Per-route rate limit policy helper.
* Request transformation policy foundation.
* Response transformation policy foundation.
* Upstream retry policy foundation.
* Vitest unit test setup.
* API Gateway integration tests using `app.inject()`.
* Route management API tests using `app.inject()`.
* API Gateway Prisma Client generation in CI.
* API Gateway Prisma Client generation inside Docker image.
* Docker image build validation in CI.

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
  -> May use x-admin-actor for metadata
  -> Do not use consumer x-api-key
  -> Do not use consumer JWT
```

Current API key header:

```txt
x-api-key
```

Default local development API key:

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

Default actor when missing:

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

Current traffic protection configuration:

```txt
MAX_REQUEST_BODY_BYTES=1048576
PRODUCT_PRODUCTS_RATE_LIMIT_MAX_REQUESTS=5
PRODUCT_PRODUCTS_RATE_LIMIT_WINDOW_MS=60000
```

Current admin route management APIs:

```txt
GET /internal/admin/routes
  -> Requires admin API key
  -> Returns non-deleted route configs, including disabled non-deleted route configs

GET /internal/admin/routes/:id
  -> Requires admin API key
  -> Returns one non-deleted route config by id
  -> Returns 404 when route config does not exist or is soft-deleted

POST /internal/admin/routes
  -> Requires admin API key
  -> Validates request body
  -> Reuses downstream route config validation
  -> Rejects duplicate active method + gatewayPath
  -> Creates route config in gateway.gateway_routes
  -> Sets createdBy and updatedBy from x-admin-actor or default actor
  -> Returns 201 Created

PATCH /internal/admin/routes/:id
  -> Requires admin API key
  -> Finds an existing non-deleted route config
  -> Merges existing route config with patch body
  -> Reuses downstream route config validation
  -> Rejects conflicts with another active method + gatewayPath
  -> Updates route config in gateway.gateway_routes
  -> Sets updatedBy from x-admin-actor or default actor
  -> Supports enable/disable through enabled field

DELETE /internal/admin/routes/:id
  -> Requires admin API key
  -> Finds an existing non-deleted route config
  -> Soft-deletes route config
  -> Sets enabled=false
  -> Sets deletedAt
  -> Sets deletedBy from x-admin-actor or default actor
  -> Sets updatedBy from x-admin-actor or default actor
  -> Returns the soft-deleted route config response

POST /internal/admin/routes/reload
  -> Requires admin API key
  -> Reads active non-deleted route configs
  -> Validates mapped downstream route configs
  -> Returns reload validation summary
  -> mode: validation-only
  -> runtimeApplied: false
  -> requiresRestart: true
  -> Does not mutate database
  -> Does not hot-reload Fastify runtime routes yet
```

Current response cache behavior:

```txt
GET /api/products
  -> Cache MISS:
       x-cache: MISS
       API Gateway calls Product Service
       API Gateway stores response in Redis
  -> Cache HIT:
       x-cache: HIT
       API Gateway returns cached response from Redis
  -> Cache disabled in injected tests:
       x-cache: BYPASS

GET /api/product-service/health
  -> Cache disabled by route policy:
       x-cache: BYPASS
       API Gateway calls Product Service /health
```

Current response cache TTL:

```txt
30 seconds
```

Current structured access log event:

```txt
http_request_completed
```

Current structured access log fields:

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

Sensitive headers are not logged:

```txt
x-api-key
x-admin-api-key
authorization
cookie
```

Current response latency header:

```txt
x-response-time-ms
```

Current Prometheus metrics:

```txt
http_requests_total
http_request_duration_seconds
http_response_cache_total
```

Current API Gateway structure:

```txt
apps/api-gateway/
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
```

---

## Product Service

Location:

```txt
apps/product-service
```

Current port:

```txt
3001
```

Implemented:

* Fastify server.
* Health check endpoint.
* Products endpoint.
* PostgreSQL-backed products.
* Prisma Client.
* Product repository.
* Database connection helper.
* Request ID generation and reuse.
* Request ID reuse from API Gateway.
* JSON logger.
* Basic 404 handler.
* Basic 500 error handler.
* Config separated into `config/env.ts`.
* Routes separated into `routes`.
* Middlewares separated into `middlewares`.
* Prisma schema.
* Prisma migration for `products`.
* Idempotent seed script.
* Prisma Client generation in CI.
* Docker image build validation in CI.

Current endpoints:

```txt
GET /health
GET /products
```

Current Product Service behavior:

```txt
GET /health
  -> Returns Product Service health response

GET /products
  -> Reads products from PostgreSQL public.products
  -> Returns product list ordered by id
```

Current Product Service structure:

```txt
apps/product-service/
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
```

---

## Gateway Route Config Behavior

Sprint 8 added database-backed dynamic route config.

Sprint 9 added internal/admin APIs to manage route config records.

Sprint 10 added route management hardening with soft delete, audit metadata fields, active-only uniqueness, and reload validation.

Current route config source priority:

```txt
1. PostgreSQL gateway.gateway_routes active records
2. Static downstreamRouteConfigs fallback
```

Current active route definition:

```txt
enabled = true
deleted_at IS NULL
```

Current runtime loading flow:

```txt
API Gateway startup
  -> loadRuntimeDownstreamRouteConfigs()
    -> Try loadDatabaseDownstreamRouteConfigs(gatewayPrisma)
      -> SELECT enabled routes from gateway.gateway_routes
      -> WHERE deleted_at IS NULL
      -> ORDER BY priority ASC, gatewayPath ASC
      -> Map records to DownstreamRouteConfig[]
      -> Validate mapped configs
    -> If database route configs exist:
         -> Use database-backed route configs
    -> If database loading fails:
         -> Use static downstreamRouteConfigs fallback
    -> If database returns no active routes:
         -> Use static downstreamRouteConfigs fallback
  -> buildApiGatewayApp({ routeConfigs })
  -> register downstreamProxyRoute() with resolved route configs
```

Current DB-backed active route configs:

```txt
GET /api/products
  -> Product Service /products
  -> Protected
  -> API key required
  -> JWT required
  -> Redis rate limit enabled
  -> Redis cache enabled
  -> deleted_at IS NULL

GET /api/product-service/health
  -> Product Service /health
  -> Public
  -> API key not required
  -> JWT not required
  -> Redis rate limit disabled
  -> Redis cache disabled
  -> deleted_at IS NULL
```

Fallback behavior:

```txt
DATABASE_URL missing
PostgreSQL unavailable
Prisma Client initialization error
gateway.gateway_routes unavailable
DB query error
DB route mapping error
DB route validation error
DB returns zero active routes
  -> API Gateway falls back to static downstreamRouteConfigs
```

Soft delete behavior:

```txt
DELETE /internal/admin/routes/:id
  -> Does not remove the row from gateway.gateway_routes
  -> Sets enabled=false
  -> Sets deleted_at
  -> Sets deleted_by
  -> Sets updated_by
  -> Route disappears from admin list/detail APIs
  -> Route is excluded from duplicate conflict checks
  -> Route is excluded from runtime route loading
  -> Route is not registered after API Gateway restart
  -> Same method + gatewayPath can be recreated as a new active record
```

Reload validation behavior:

```txt
POST /internal/admin/routes/reload
  -> Reads active route configs
  -> Maps records to DownstreamRouteConfig[]
  -> Validates mapped route configs
  -> Returns validation summary
  -> Does not register or unregister Fastify routes at runtime
  -> Runtime route changes still require API Gateway restart
```

Why fallback and validation-only reload matter:

* Gateway startup remains safe.
* Existing product route behavior remains stable.
* Existing health proxy route behavior remains stable.
* Database-backed route config can be rolled out safely.
* Route management APIs can write database records without removing the safe startup fallback.
* Reload validation gives admins a safe way to check DB route config health before restart.
* True hot reload is intentionally deferred until the routing lifecycle can be handled safely.

---

## Gateway Route Management API Behavior

Sprint 9 added the internal/admin Route Management API foundation.

Sprint 10 hardened the route management lifecycle.

Current internal/admin route management endpoints:

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

Current optional admin actor metadata:

```txt
Header: x-admin-actor
Default fallback actor: admin-api-key
```

Current admin environment variables:

```txt
ADMIN_API_KEY_HEADER=x-admin-api-key
ADMIN_API_KEY=local-admin-key
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

Current route management repository behavior:

```txt
listRoutes()
  -> Returns non-deleted route configs ordered by priority and gatewayPath
  -> Includes disabled non-deleted route configs

findRouteById(id)
  -> Returns one non-deleted route config or null

findRouteByMethodAndGatewayPath(method, gatewayPath)
  -> Returns a conflicting non-deleted route config or null

createRoute(data)
  -> Inserts a route config into gateway.gateway_routes
  -> Can set createdBy and updatedBy

updateRoute(id, data)
  -> Updates an existing route config in gateway.gateway_routes
  -> Can set updatedBy

softDeleteRoute(id, actor)
  -> Updates an existing route config in gateway.gateway_routes
  -> Sets enabled=false, deletedAt, deletedBy, updatedBy
```

Current route config create flow:

```txt
Admin client
  -> POST /internal/admin/routes
  -> x-admin-api-key
  -> Optional x-admin-actor
  -> Admin API key middleware
  -> Parse request body
  -> Map request body to DownstreamRouteConfig
  -> validateDownstreamRoutes()
  -> Check duplicate active method + gatewayPath
  -> Insert route into gateway.gateway_routes
  -> Persist created_by and updated_by
  -> Return 201 Created
```

Current route config update flow:

```txt
Admin client
  -> PATCH /internal/admin/routes/:id
  -> x-admin-api-key
  -> Optional x-admin-actor
  -> Admin API key middleware
  -> Find existing non-deleted route by id
  -> Return 404 if route does not exist or is soft-deleted
  -> Merge existing route config with PATCH body
  -> Map merged data to DownstreamRouteConfig
  -> validateDownstreamRoutes()
  -> Check method + gatewayPath conflict against other active routes
  -> Update route in gateway.gateway_routes
  -> Persist updated_by
  -> Return 200 OK
```

Current route config soft delete flow:

```txt
Admin client
  -> DELETE /internal/admin/routes/:id
  -> x-admin-api-key
  -> Optional x-admin-actor
  -> Admin API key middleware
  -> Find existing non-deleted route by id
  -> Return 404 if route does not exist or is already soft-deleted
  -> Set enabled=false
  -> Set deleted_at
  -> Set deleted_by
  -> Set updated_by
  -> Return 200 OK with deleted route response
```

Current enable/disable behavior:

```txt
PATCH /internal/admin/routes/:id
Body: { "enabled": false }

Result:
  -> Route remains stored in gateway.gateway_routes
  -> Route remains visible in admin read API if deleted_at IS NULL
  -> Route is not loaded as an active runtime route after API Gateway restart
  -> Client requests to the disabled route return 404 after restart
```

Current soft delete behavior:

```txt
DELETE /internal/admin/routes/:id

Result:
  -> Route remains stored in gateway.gateway_routes as historical row
  -> Route is hidden from admin read APIs
  -> Route is excluded from duplicate checks
  -> Route is excluded from runtime loading
  -> Route is not loaded after API Gateway restart
  -> Client requests to the soft-deleted route return 404 after restart
```

Current reload validation strategy:

```txt
POST /internal/admin/routes/reload

Result:
  -> Validates active database route configs
  -> Returns routeCount and route summary
  -> Does not apply runtime hot reload
  -> Runtime proxy route changes still require API Gateway restart
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

Why Sprint 10 matters:

* Route management is now safer and closer to a real API Gateway product.
* Deleting a route no longer destroys historical route data.
* Active runtime route uniqueness is correct for soft delete.
* Admin APIs no longer expose soft-deleted records.
* Runtime loader no longer loads deleted records.
* Admins can validate active route config health before restarting the Gateway.
* The project now has a safer foundation before Admin Dashboard work.

---

## Gateway Route Policy Behavior

Sprint 5 added the first advanced Gateway policy foundation.

Sprint 7 expanded the Gateway so more than one downstream route can be registered from route configuration.

Sprint 8 moved runtime route config source to PostgreSQL with static fallback.

Sprint 9 added route management APIs that reuse existing route policy validation before persistence.

Sprint 10 added reload validation that reuses the same mapping and validation path for active DB route configs.

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

Current DB route config repository file:

```txt
apps/api-gateway/src/config/database-route-config.repository.ts
```

Current DB route config mapper file:

```txt
apps/api-gateway/src/config/database-route-config.mapper.ts
```

Current route config validation file:

```txt
apps/api-gateway/src/config/validate-downstream-routes.ts
```

Current route registration flow:

```txt
loadRuntimeDownstreamRouteConfigs()
  -> DB active route config if available
  -> static route config fallback if DB fails or empty

app.ts
  -> Registers downstreamProxyRoute()
  -> Passes resolved route configs
  -> Gateway registers each route from config
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
duplicate active method + gatewayPath routes are rejected
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

The Product Service health proxy route also has retry disabled.

This keeps runtime behavior stable while preparing the Gateway for future safe retry scenarios.
```

---

## Observability Structure

Current observability-related files:

```txt
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
```

Current Docker Compose observability flow:

```txt
API Gateway :3000
  -> Exposes /metrics

Prometheus :9090
  -> Scrapes http://api-gateway:3000/metrics

Grafana :3002
  -> Uses Prometheus datasource at http://prometheus:9090
  -> Loads provisioned dashboard from /var/lib/grafana/dashboards
```

---

## Current Working Flow

```txt
Client
  -> API Gateway :3000
    -> Runtime route config loading
      -> Try PostgreSQL gateway.gateway_routes
      -> Load only enabled=true and deleted_at IS NULL records
      -> Fall back to static downstreamRouteConfigs if DB fails or empty
    -> Request ID handling
    -> Basic security headers
    -> Request size limit
    -> Structured access log start
    -> Metrics collection start
    -> Resolved downstream route configuration
      -> GET /api/products
      -> GET /api/product-service/health
    -> Route policy configuration
    -> Protected Product route:
      -> API key authentication
      -> Redis-backed rate limiting by API key and route
      -> JWT Bearer token authentication
      -> Redis response cache
        -> Cache HIT:
             -> Apply response transform foundation
             -> Return cached product response
        -> Cache MISS:
             -> Apply request transform foundation
             -> Downstream timeout policy helper
             -> Upstream retry policy foundation
             -> Product Service :3001 /products
               -> Prisma Client
               -> PostgreSQL public.products
               -> Database-backed product response
             -> Store response in Redis cache
             -> Apply response transform foundation
    -> Public Product Service health proxy route:
      -> No API key authentication
      -> No JWT authentication
      -> No Redis-backed rate limiting
      -> No Redis response cache
      -> Downstream timeout policy helper
      -> Product Service :3001 /health
    -> Add x-cache
    -> Add x-response-time-ms
    -> Record HTTP metrics
    -> Write structured access log
    -> Return response to Client

Admin Client / Future Admin Dashboard
  -> API Gateway :3000
    -> Internal/admin route management APIs
    -> x-admin-api-key
    -> Optional x-admin-actor
    -> GET /internal/admin/routes
    -> GET /internal/admin/routes/:id
    -> POST /internal/admin/routes
    -> PATCH /internal/admin/routes/:id
    -> DELETE /internal/admin/routes/:id
    -> POST /internal/admin/routes/reload
    -> Route management repository
    -> PostgreSQL gateway.gateway_routes
    -> Route config validation before persistence
    -> Soft delete instead of hard delete
    -> Reload validation-only endpoint
    -> Simple restart-based runtime reload strategy

GitHub Actions
  -> On push or pull request to main
    -> Install dependencies
    -> Generate Product Service Prisma Client
    -> Generate API Gateway Prisma Client
    -> Run tests
    -> Run typecheck
    -> Run build
    -> Build API Gateway Docker image
    -> Build Product Service Docker image
```

Current API Gateway startup flow:

```txt
API Gateway process starts
  -> loadRuntimeDownstreamRouteConfigs()
    -> loadDatabaseDownstreamRouteConfigs(gatewayPrisma)
      -> Query gateway.gateway_routes
      -> Filter enabled=true
      -> Filter deleted_at IS NULL
      -> Map records to DownstreamRouteConfig[]
      -> Validate mapped configs
    -> If DB configs exist:
         -> Use DB-backed route configs
    -> If DB fails or empty:
         -> Use static route config fallback
  -> buildApiGatewayApp({ routeConfigs })
  -> Register /health
  -> Register /metrics
  -> Register /internal/admin/routes
  -> Register downstream proxy routes
  -> Connect Redis
  -> Listen on port 3000
```

Current product request flow:

```txt
Client
  -> GET http://localhost:3000/api/products
    -> Route was loaded from PostgreSQL gateway.gateway_routes during startup
    -> API Gateway creates or reuses x-request-id
    -> API Gateway starts access log timer
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
                    -> API Gateway calls Product Service through timeout and retry helpers
                      -> GET http://product-service:3001/products inside Docker
                    -> Product Service reads products from PostgreSQL public.products
                    -> Product Service returns database-backed product data
                    -> API Gateway stores response in Redis cache
                    -> Apply response transform foundation
                    -> API Gateway returns 200 with x-cache: MISS
    -> API Gateway adds x-response-time-ms
    -> API Gateway records Prometheus metrics
    -> API Gateway writes structured access log
```

Current Product Service health proxy request flow:

```txt
Client
  -> GET http://localhost:3000/api/product-service/health
    -> Route was loaded from PostgreSQL gateway.gateway_routes during startup
    -> API Gateway creates or reuses x-request-id
    -> API Gateway starts access log timer
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
      -> GET http://product-service:3001/health inside Docker
    -> Product Service returns health response
    -> API Gateway returns 200 with x-cache: BYPASS
    -> API Gateway adds x-response-time-ms
    -> API Gateway records Prometheus metrics
    -> API Gateway writes structured access log
```

Current route management request flow:

```txt
Admin Client / Future Admin Dashboard
  -> GET /internal/admin/routes
    -> API Gateway checks x-admin-api-key
    -> API Gateway reads non-deleted route configs from gateway.gateway_routes
    -> API Gateway returns all non-deleted route configs including disabled non-deleted routes

Admin Client / Future Admin Dashboard
  -> POST /internal/admin/routes
    -> API Gateway checks x-admin-api-key
    -> API Gateway resolves actor from x-admin-actor or default actor
    -> API Gateway validates request body
    -> API Gateway maps request body to DownstreamRouteConfig
    -> API Gateway reuses validateDownstreamRoutes()
    -> API Gateway checks duplicate active method + gatewayPath
    -> API Gateway creates route config in gateway.gateway_routes
    -> API Gateway stores created_by and updated_by
    -> API Gateway returns 201 Created

Admin Client / Future Admin Dashboard
  -> PATCH /internal/admin/routes/:id
    -> API Gateway checks x-admin-api-key
    -> API Gateway resolves actor from x-admin-actor or default actor
    -> API Gateway reads existing non-deleted route by id
    -> API Gateway merges existing route with patch body
    -> API Gateway maps merged body to DownstreamRouteConfig
    -> API Gateway reuses validateDownstreamRoutes()
    -> API Gateway checks conflict with another active method + gatewayPath
    -> API Gateway updates route config in gateway.gateway_routes
    -> API Gateway stores updated_by
    -> API Gateway returns 200 OK

Admin Client / Future Admin Dashboard
  -> DELETE /internal/admin/routes/:id
    -> API Gateway checks x-admin-api-key
    -> API Gateway resolves actor from x-admin-actor or default actor
    -> API Gateway reads existing non-deleted route by id
    -> API Gateway soft-deletes route config
    -> API Gateway sets enabled=false, deleted_at, deleted_by, updated_by
    -> API Gateway returns 200 OK

Admin Client / Future Admin Dashboard
  -> POST /internal/admin/routes/reload
    -> API Gateway checks x-admin-api-key
    -> API Gateway reads active route configs
    -> API Gateway validates mapped downstream route configs
    -> API Gateway returns validation-only reload summary
```

Current observability flow:

```txt
Client
  -> Sends request to API Gateway

API Gateway
  -> Handles request
  -> Adds x-request-id
  -> Adds x-response-time-ms
  -> Writes structured JSON access log
  -> Updates in-memory Prometheus metrics registry
  -> Exposes metrics at /metrics

Prometheus
  -> Scrapes API Gateway /metrics every 5 seconds
  -> Stores time-series metrics

Grafana
  -> Reads metrics from Prometheus datasource
  -> Displays PulseGate API Gateway Overview dashboard
```

Current CI flow:

```txt
Developer
  -> Pushes code to main or opens pull request into main

GitHub Actions
  -> Starts CI workflow
  -> Checks out repository
  -> Sets up Node.js 20
  -> Runs npm ci
  -> Generates Product Service Prisma Client
  -> Generates API Gateway Prisma Client
  -> Runs automated tests
  -> Runs TypeScript typecheck
  -> Runs production build
  -> Builds API Gateway Docker image
  -> Builds Product Service Docker image
  -> Reports pass/fail status to GitHub

README
  -> Shows live CI badge status
```

Current downstream failure flow:

```txt
Client
  -> GET http://localhost:3000/api/products with valid API key and valid JWT
    -> API Gateway checks Redis response cache
      -> If cache HIT:
        -> 200 with x-cache: HIT even if Product Service is temporarily down
      -> If cache MISS:
        -> API Gateway calls Product Service through timeout and retry helpers
          -> If Product Service is unavailable:
            -> 503 DOWNSTREAM_SERVICE_UNAVAILABLE
          -> If Product Service times out:
            -> 504 DOWNSTREAM_TIMEOUT
          -> If Product Service returns 5xx:
            -> 502 DOWNSTREAM_HTTP_ERROR
          -> If Product Service returns invalid JSON:
            -> 502 DOWNSTREAM_INVALID_RESPONSE
```

Current Redis failure behavior:

```txt
Redis unavailable
  -> API Gateway fails fast for Redis-backed rate limit/cache commands
  -> Product route returns generic 500 Internal Server Error
  -> Internal Redis details are not exposed in the response body
```

---

## Traffic Protection Behavior

### Rate Limiting

Current protected route:

```txt
GET /api/products
```

Current public route without rate limit:

```txt
GET /api/product-service/health
```

Current internal/admin routes without consumer rate limit:

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
  -> Does not use Redis-backed rate limiting

Internal/admin route management APIs
  -> Protected by x-admin-api-key
  -> Do not use consumer x-api-key
  -> Do not use consumer JWT
```

Default local rate limit:

```txt
5 requests per 60 seconds
```

Rate limit identity:

```txt
API key + HTTP method + route path
```

Current rate limit key shape before Redis prefix:

```txt
api-key:<api-key>:route:<method>:<route-path>
```

Example logical rate limit key:

```txt
api-key:dev-api-key:route:GET:/api/products
```

Current Redis rate limit key shape:

```txt
rate-limit:api-key:<api-key>:route:<method>:<route-path>
```

Example Redis rate limit key:

```txt
rate-limit:api-key:dev-api-key:route:GET:/api/products
```

Rate limit response headers:

```txt
x-ratelimit-limit
x-ratelimit-remaining
x-ratelimit-reset
retry-after
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

---

### Request Size Limit

Current default request body size limit:

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

---

### Basic Security Headers

API Gateway currently adds these response headers:

```txt
x-content-type-options: nosniff
x-frame-options: DENY
referrer-policy: no-referrer
permissions-policy: camera=(), microphone=(), geolocation=()
content-security-policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'
```

---

## Response Cache Behavior

Current cached route:

```txt
GET /api/products
```

Current route with cache disabled:

```txt
GET /api/product-service/health
```

Current Redis response cache key:

```txt
response-cache:GET:/api/products
```

Current behavior:

```txt
GET /api/products first request
  -> Cache MISS
  -> API Gateway calls Product Service
  -> API Gateway stores response in Redis
  -> Response header: x-cache: MISS

GET /api/products second request within TTL
  -> Cache HIT
  -> API Gateway returns cached response from Redis
  -> Response header: x-cache: HIT

GET /api/product-service/health
  -> Cache disabled
  -> API Gateway calls Product Service /health
  -> Response header: x-cache: BYPASS

Internal/admin route management APIs
  -> Do not use product response cache
```

Current TTL:

```txt
30 seconds
```

Expected response cache headers:

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

---

## Observability Behavior

### Structured Access Logs

API Gateway writes structured access logs after each request completes.

Current access log event:

```txt
http_request_completed
```

Current fields:

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

Example conceptual log payload:

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

Sensitive values are intentionally not logged:

```txt
x-api-key
x-admin-api-key
authorization
cookie
```

---

### Response Time Header

API Gateway adds a latency header to responses:

```txt
x-response-time-ms
```

Example:

```txt
x-response-time-ms: 4.32
```

The value is formatted in milliseconds with two decimal places.

---

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

Current Prometheus metrics:

```txt
http_requests_total
http_request_duration_seconds
http_response_cache_total
```

Example metrics:

```txt
http_requests_total{method="GET",route="/health",status_code="200"} 1
http_requests_total{method="GET",route="/api/product-service/health",status_code="200"} 1
http_request_duration_seconds_count{method="GET",route="/health",status_code="200"} 1
http_response_cache_total{route="/api/products",cache_status="HIT"} 1
http_response_cache_total{route="/api/product-service/health",cache_status="BYPASS"} 1
```

---

### Prometheus Scraping

Prometheus scrapes API Gateway using Docker internal DNS:

```txt
http://api-gateway:3000/metrics
```

Scrape interval:

```txt
5 seconds
```

---

### Grafana Dashboard

Grafana uses the provisioned Prometheus datasource:

```txt
http://prometheus:9090
```

Dashboard title:

```txt
PulseGate API Gateway Overview
```

Dashboard UID:

```txt
pulsegate-api-gateway-overview
```

Dashboard panels:

```txt
Request Rate
Request Count by Route
Latency p95 by Route
Cache Outcomes
```

---

## Main Test Commands

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

Run Product Service seed:

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

Run API Gateway route config migration deploy:

```powershell
$env:DATABASE_URL="postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway"

npm run db:migrate:deploy -w apps/api-gateway
```

Run API Gateway route config seed:

```powershell
$env:DATABASE_URL="postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway"

npm run db:seed -w apps/api-gateway
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

Validate PostgreSQL Product Service tables:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "\dt"
```

Validate PostgreSQL API Gateway tables:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "\dt gateway.*"
```

Validate products table:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "SELECT id, name, price FROM products ORDER BY id;"
```

Validate active Gateway route config table:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "SELECT method, gateway_path, downstream_url, enabled, priority, deleted_at FROM gateway.gateway_routes WHERE deleted_at IS NULL ORDER BY priority, gateway_path;"
```

Validate all Gateway route configs including soft-deleted history:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "SELECT method, gateway_path, enabled, created_by, updated_by, deleted_at, deleted_by FROM gateway.gateway_routes ORDER BY priority, gateway_path;"
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

Test API Gateway metrics:

```powershell
Invoke-WebRequest http://localhost:3000/metrics -UseBasicParsing
```

Test Product Service health through API Gateway:

```powershell
Invoke-WebRequest http://localhost:3000/api/product-service/health -UseBasicParsing
```

Test API Gateway DB route config loading log:

```powershell
docker compose logs api-gateway --tail=80
```

Expected log with clean seeded DB:

```txt
Loaded downstream route configs from database { routeCount: 2 }
```

Test admin route config list API:

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } |
  ConvertTo-Json -Depth 10
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

Test route reload validation:

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes/reload `
  -Method POST `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } `
  -ContentType "application/json" `
  -Body "{}" |
  ConvertTo-Json -Depth 10
```

Expected result:

```txt
mode: validation-only
runtimeApplied: false
requiresRestart: true
routeCount: 2
```

Important PowerShell note:

```txt
For POST /internal/admin/routes/reload, send Content-Type application/json and Body "{}".
Without Content-Type and body, Fastify may reject the request before the handler.
```

Test reload missing admin key:

```powershell
try {
  Invoke-WebRequest http://localhost:3000/internal/admin/routes/reload `
    -Method POST `
    -ContentType "application/json" `
    -Body "{}" `
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

Test reload invalid admin key:

```powershell
try {
  Invoke-WebRequest http://localhost:3000/internal/admin/routes/reload `
    -Method POST `
    -Headers @{ "x-admin-api-key" = "wrong-admin-key" } `
    -ContentType "application/json" `
    -Body "{}" `
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

---

## Authentication Behavior

### API Key Authentication

Protected route:

```txt
GET /api/products
```

Public routes:

```txt
GET /health
GET /metrics
GET /api/product-service/health
```

Internal/admin routes:

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
GET /api/products missing API key
  -> 401 API_KEY_MISSING

GET /api/products invalid API key
  -> 403 API_KEY_INVALID

GET /api/products valid API key
  -> Continue to Redis-backed route-level rate limiting

GET /api/product-service/health
  -> Does not require API key

Internal/admin APIs
  -> Do not use x-api-key
  -> Use x-admin-api-key instead
```

### Admin API Key Authentication

Protected internal/admin routes:

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
Internal/admin API missing admin API key
  -> 401 ADMIN_API_KEY_MISSING

Internal/admin API invalid admin API key
  -> 403 ADMIN_API_KEY_INVALID

Internal/admin API valid admin API key
  -> Continue to route management behavior
```

Current admin API key header:

```txt
x-admin-api-key
```

Default local admin API key:

```txt
local-admin-key
```

Optional admin actor header:

```txt
x-admin-actor
```

Default actor fallback:

```txt
admin-api-key
```

### JWT Authentication

Protected route:

```txt
GET /api/products
```

Public routes:

```txt
GET /health
GET /metrics
GET /api/product-service/health
```

Internal/admin routes:

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
GET /api/products missing Bearer token
  -> 401 JWT_TOKEN_MISSING

GET /api/products invalid Bearer token
  -> 403 JWT_TOKEN_INVALID

GET /api/products valid Bearer token
  -> Continue to Redis response cache

GET /api/product-service/health
  -> Does not require JWT

Internal/admin APIs
  -> Do not require consumer JWT
  -> Protected by x-admin-api-key
```

JWT validation checks:

```txt
Signature
Issuer
Audience
Expiration
```

JWT payload is attached to:

```txt
request.jwtPayload
```

---

## Downstream Error Behavior

When Product Service is unavailable and cache MISS, API Gateway returns:

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

Reload validation failed:

```json
{
  "error": {
    "code": "ROUTE_CONFIG_RELOAD_VALIDATION_FAILED",
    "message": "Route config reload validation failed",
    "details": "example validation message",
    "requestId": "example-request-id"
  }
}
```

Expected status:

```txt
400
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

Current unit tests:

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
  -> Deleted route filtering
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
  -> Admin route config read, create, update, delete, reload validation, auth, not found, validation, and duplicate behavior

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
  -> includes route management read/create/update/delete/reload validation coverage
```

Integration test coverage:

```txt
GET /health
  -> 200 OK
  -> includes x-request-id
  -> includes x-response-time-ms
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
  -> includes response time header

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
  -> 200 and returns non-deleted route configs when admin API key is valid
  -> hides soft-deleted route configs

GET /internal/admin/routes/:id
  -> 200 and returns non-deleted route config by id
  -> 404 when route config id does not exist
  -> 404 when route config is soft-deleted

POST /internal/admin/routes
  -> 201 and creates route config
  -> 400 when route config is invalid
  -> 409 when active method + gatewayPath already exists
  -> 401 when admin API key is missing

PATCH /internal/admin/routes/:id
  -> 200 and updates route config
  -> 404 when route config id does not exist
  -> 400 when merged route config is invalid
  -> 409 when method + gatewayPath conflicts with another active route
  -> 401 when admin API key is missing

DELETE /internal/admin/routes/:id
  -> 200 and soft-deletes route config
  -> sets enabled=false
  -> sets deletedAt
  -> sets deletedBy
  -> sets updatedBy
  -> 404 when route config does not exist
  -> 401 when admin API key is missing

POST /internal/admin/routes/reload
  -> 200 and validates active route configs without applying runtime changes
  -> returns mode=validation-only
  -> returns runtimeApplied=false
  -> returns requiresRestart=true
  -> returns routeCount
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
  -> Filters deleted route records
  -> Sorts enabled routes by priority
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

Sprint 10 test coverage:

```txt
admin-route-config.route.test.ts
  -> Covers soft delete route config behavior
  -> Covers list hiding soft-deleted route config
  -> Covers detail 404 for soft-deleted route config
  -> Covers delete 404 for missing route config
  -> Covers delete missing admin API key behavior
  -> Covers reload validation-only behavior
  -> Covers reload missing admin API key behavior
  -> Covers reload invalid admin API key behavior
```

---

## Validation Status

Latest Sprint 10 validation:

* `npm run test` passed.
* `npm run typecheck` passed.
* `npm run build` passed.
* Current automated tests: 27 files and 176 tests.
* `docker compose up -d --build` passed.
* `docker compose ps` passed.
* PostgreSQL service was healthy.
* Redis service was healthy.
* Product Service container was healthy.
* API Gateway container started successfully.
* API Gateway loaded DB route configs from database.
* Clean active DB route query returned 2 seeded routes.
* Admin route config read API returned active non-deleted route configs with valid `x-admin-api-key`.
* Admin route config create API returned `201 Created`.
* Created temporary test route persisted to `gateway.gateway_routes`.
* API Gateway restart loaded 3 active route configs after temporary route creation.
* Temporary runtime test route returned `200 OK`.
* Admin route config delete API soft-deleted the temporary test route.
* Soft-deleted route response included `enabled=false`, `deletedAt`, `deletedBy`, and `updatedBy`.
* Admin route config list API hid the soft-deleted route.
* Admin route config detail API returned `404 ROUTE_CONFIG_NOT_FOUND` for the soft-deleted route.
* API Gateway restart returned runtime route config count to 2.
* Soft-deleted route returned `404 Route not found` after API Gateway restart.
* PostgreSQL retained soft-deleted route as historical row.
* PostgreSQL active route query returned only the 2 seeded routes.
* Recreating the same `method + gatewayPath` after soft delete succeeded.
* This validated the active-route partial unique index.
* Recreated test route was soft-deleted for cleanup.
* `POST /internal/admin/routes/reload` with valid admin key returned `200 OK`.
* Reload validation returned `mode: validation-only`.
* Reload validation returned `runtimeApplied: false`.
* Reload validation returned `requiresRestart: true`.
* Reload validation returned `routeCount: 2`.
* Reload validation returned active route summary for `/api/products` and `/api/product-service/health`.
* Reload validation without admin key returned `401 ADMIN_API_KEY_MISSING`.
* Reload validation with invalid admin key returned `403 ADMIN_API_KEY_INVALID`.
* Git working tree was clean after Sprint 10 technical commits.
* Code pushed to GitHub.

Latest Sprint 9 validation:

* `npm run test` passed.
* `npm run typecheck` passed.
* `npm run build` passed.
* Current automated tests: 27 files and 168 tests.
* `docker compose up -d --build` passed.
* `docker compose ps` passed.
* PostgreSQL service was healthy.
* Redis service was healthy.
* Product Service container was healthy.
* API Gateway container started successfully.
* Admin route config read API returned route configs with valid `x-admin-api-key`.
* Admin route config read API returned `401 ADMIN_API_KEY_MISSING` without admin key.
* Admin route config read API returned `403 ADMIN_API_KEY_INVALID` with invalid admin key.
* Admin route config create API returned `201 Created`.
* Created route config was persisted to `gateway.gateway_routes`.
* Created route config was visible through `GET /internal/admin/routes`.
* Duplicate route config create returned `409 ROUTE_CONFIG_ALREADY_EXISTS`.
* API Gateway restart loaded newly created route config from database.
* Created test route proxied successfully after API Gateway restart.
* Admin route config update API returned `200 OK`.
* Route config update persisted `enabled=false` and priority update.
* Disabled route remained visible in admin read API.
* Disabled route returned `404 Route not found` after API Gateway restart.
* Local test route `/api/product-service/health-copy` was removed from DB after validation.
* PostgreSQL `gateway.gateway_routes` returned to the 2 seeded routes.
* Public DB-backed route `GET /api/product-service/health` returned `200 OK`.
* Git working tree was clean after Sprint 9 technical commits.
* Code pushed to GitHub.

Latest Sprint 8 validation:

* `npm run db:generate -w apps/api-gateway` passed.
* `npm run db:migrate:deploy -w apps/api-gateway` passed.
* `npm run db:seed -w apps/api-gateway` passed.
* API Gateway seed inserted or updated 2 route configs.
* PostgreSQL `gateway.gateway_routes` contains `GET /api/products`.
* PostgreSQL `gateway.gateway_routes` contains `GET /api/product-service/health`.
* `npm run test` passed.
* `npm run typecheck` passed.
* `npm run build` passed.
* `docker compose up -d --build` passed.
* `docker compose ps` passed.
* PostgreSQL service was healthy.
* Redis service was healthy.
* Product Service container was healthy.
* API Gateway container started successfully.
* API Gateway Docker image generated Prisma Client inside Linux Alpine runtime.
* API Gateway avoided Windows-generated Prisma Client runtime mismatch.
* API Gateway loaded route config from database.
* API Gateway log showed `Loaded downstream route configs from database { routeCount: 2 }`.
* API Gateway `/health` returned `status: ok`.
* API Gateway `/metrics` returned `200 OK`.
* API Gateway `/metrics` returned Prometheus text format.
* API Gateway `/api/product-service/health` returned `200 OK`.
* API Gateway `/api/product-service/health` returned Product Service health response.
* API Gateway `/api/product-service/health` returned `x-cache: BYPASS`.
* API Gateway `/api/product-service/health` returned `x-request-id`.
* API Gateway `/api/product-service/health` returned `x-response-time-ms`.
* API Gateway `/api/products` passed with valid API key and valid JWT.
* API Gateway `/api/products` returned `x-cache: MISS` on first valid request after cache clear.
* API Gateway `/api/products` returned `x-cache: HIT` on the second valid request within cache TTL.
* API Gateway `/api/products` returned Redis-backed rate limit headers.
* Git working tree was clean after Sprint 8 technical commits.
* Code pushed to GitHub.

Latest Sprint 7 validation:

* `npm run test` passed.
* `npm run typecheck` passed.
* `npm run build` passed.
* `docker compose up -d --build` passed.
* `docker compose ps` passed.
* PostgreSQL service was healthy.
* Redis service was healthy.
* Product Service container was healthy.
* API Gateway container started successfully.
* Prometheus container started successfully.
* Grafana container started successfully.
* API Gateway `/health` returned `status: ok`.
* API Gateway `/metrics` returned `200 OK`.
* API Gateway `/metrics` returned Prometheus text format.
* API Gateway `/api/product-service/health` returned `200 OK`.
* API Gateway `/api/product-service/health` returned Product Service health response.
* API Gateway `/api/product-service/health` returned `x-cache: BYPASS`.
* API Gateway `/api/product-service/health` returned `x-request-id`.
* API Gateway `/api/product-service/health` returned `x-response-time-ms`.
* API Gateway `/api/products` passed with valid API key and valid JWT.
* API Gateway `/api/products` returned `x-cache: MISS` on first valid request after cache clear.
* API Gateway `/api/products` returned `x-cache: HIT` on the second valid request within cache TTL.
* API Gateway `/api/products` returned Redis-backed rate limit headers.
* Git working tree was clean before final Sprint 7 documentation update.
* Code pushed to GitHub.

Latest Sprint 6 validation:

* `npm run db:generate -w apps/product-service` passed.
* `npm run test` passed.
* `npm run typecheck` passed.
* `npm run build` passed.
* API Gateway Docker image build passed.
* Product Service Docker image build passed.
* GitHub Actions CI passed.
* `docker compose up -d --build` passed.
* `docker compose ps` passed.
* PostgreSQL service was healthy.
* Redis service was healthy.
* Product Service container was healthy.
* API Gateway container started successfully.
* Prometheus container started successfully.
* Grafana container started successfully.
* API Gateway `/health` returned `status: ok`.
* API Gateway `/metrics` returned `200 OK`.
* API Gateway `/metrics` returned Prometheus text format.
* API Gateway `/metrics` included security headers.
* Code pushed to GitHub.

Latest Sprint 5 validation:

* `npm run test` passed.
* `npm run typecheck` passed.
* `npm run build` passed.
* `docker compose up -d --build` passed.
* `docker compose ps` passed.
* API Gateway `/health` returned `status: ok`.
* API Gateway `/metrics` returned `200 OK`.
* API Gateway `/metrics` returned Prometheus text format.
* Code pushed to GitHub.

Latest Sprint 4 validation:

* Prometheus `/api/v1/targets` showed API Gateway target as `health: up`.
* Grafana `/api/health` returned `database: ok`.
* Grafana datasource API showed Prometheus datasource provisioned.
* Grafana dashboard search API showed `PulseGate API Gateway Overview`.
* Grafana dashboard detail API showed 4 provisioned panels.

Latest behavior validation from previous sprints:

* Product Service `/health` passed.
* Product Service `/products` returned database-backed product data.
* API Gateway `/health` passed without API key.
* API Gateway `/health` includes security headers.
* API Gateway responses include `x-response-time-ms`.
* API Gateway `/api/products` returned `401 API_KEY_MISSING` without API key.
* API Gateway `/api/products` returned `403 API_KEY_INVALID` with invalid API key.
* API Gateway `/api/products` returned `401 JWT_TOKEN_MISSING` with valid API key but missing JWT.
* API Gateway `/api/products` returned `403 JWT_TOKEN_INVALID` with valid API key but invalid JWT.
* API Gateway `/api/products` passed with valid API key and valid JWT.
* API Gateway `/api/products` returned `429 TOO_MANY_REQUESTS` when Redis-backed rate limit was exceeded.
* Redis rate limit key was created and incremented.
* API Gateway `/api/products` returned `x-cache: MISS` on first valid request after cache clear.
* API Gateway `/api/products` returned `x-cache: HIT` on the second valid request within cache TTL.
* Redis response cache key was created with TTL.
* API Gateway `/api/products` returned cached response with `x-cache: HIT` when Product Service was stopped.
* API Gateway `/api/products` returned generic `500 Internal Server Error` quickly when Redis was stopped.
* API Gateway did not expose Redis internal details in the Redis failure response body.
* API Gateway still returns valid downstream data if response cache write fails.

---

## Documentation Status

Completed documentation from previous sprints:

* `README.md`
* `.env.example`
* `docs/project-context/CURRENT_PROGRESS.md`
* `docs/project-context/DECISION_LOG.md`
* `docs/project-context/AI_HANDOFF.md`
* `docs/architecture/overview.md`
* `docs/sdlc/requirements.md`

Current Sprint 10 final documentation update is in progress.

Documentation files being updated for Sprint 10:

```txt
README.md
docs/architecture/overview.md
docs/project-context/CURRENT_PROGRESS.md
docs/project-context/AI_HANDOFF.md
docs/project-context/DECISION_LOG.md
docs/sdlc/requirements.md
```

---

## Latest Stable Commits

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

PulseGate currently has a stable local-first API Gateway, infrastructure foundation, traffic protection layer, PostgreSQL-backed Product Service, PostgreSQL-backed API Gateway route config, internal/admin route management API foundation, route management hardening with soft delete, safe reload validation, Redis-backed rate limiting, Redis response caching, observability foundation with structured logs, Prometheus metrics, Prometheus scraping, Grafana datasource provisioning, Grafana dashboard provisioning, advanced Gateway route policy foundation, GitHub Actions CI/CD foundation, multi-route Gateway routing, database-backed dynamic route config, route config create/update/delete APIs, route config enable/disable behavior, validation-only reload endpoint, and safe static route config fallback.

Current architecture:

```txt
Client
  -> API Gateway
    -> Runtime route config loading
      -> PostgreSQL gateway.gateway_routes active records
      -> enabled=true
      -> deleted_at IS NULL
      -> Static route config fallback
    -> Request ID handling
    -> Structured access logs
    -> Response time measurement
    -> Basic security headers
    -> Request size limit
    -> Resolved downstream route configuration
      -> GET /api/products
      -> GET /api/product-service/health
    -> Route policy configuration
    -> Protected product route:
      -> API key authentication
      -> Redis-backed rate limiting
      -> JWT authentication
      -> Redis response cache
      -> Request transform foundation
      -> Downstream timeout policy
      -> Upstream retry policy foundation
      -> Response transform foundation
      -> Normalized downstream error handling
      -> Product Service /products
        -> Prisma
        -> PostgreSQL public.products
        -> Database-backed product response
    -> Public Product Service health proxy route:
      -> No API key
      -> No JWT
      -> No rate limit
      -> No cache
      -> Product Service /health

Admin Client / Future Admin Dashboard
  -> API Gateway internal/admin APIs
    -> x-admin-api-key
    -> optional x-admin-actor
    -> GET /internal/admin/routes
    -> GET /internal/admin/routes/:id
    -> POST /internal/admin/routes
    -> PATCH /internal/admin/routes/:id
    -> DELETE /internal/admin/routes/:id
    -> POST /internal/admin/routes/reload
    -> Route management repository
    -> PostgreSQL gateway.gateway_routes
    -> Route config validation before persistence
    -> Soft delete instead of hard delete
    -> Active route uniqueness through partial unique index
    -> Reload validation-only endpoint
    -> Restart-based runtime apply strategy

API Gateway
  -> /metrics

Prometheus
  -> Scrapes API Gateway /metrics

Grafana
  -> Reads Prometheus datasource
  -> Displays PulseGate API Gateway Overview dashboard

GitHub Actions
  -> Validates npm ci, Prisma generate, tests, typecheck, build, and Docker image builds
```

---

## Sprint 10 Progress

### Done

1. Added route config soft delete migration.
2. Added `created_by`, `updated_by`, `deleted_at`, and `deleted_by` columns.
3. Removed full unique route identity strategy from Prisma model.
4. Added PostgreSQL partial unique index for active route identity.
5. Added `gateway_routes_method_gateway_path_active_key`.
6. Added deleted route indexes.
7. Updated Prisma schema with route metadata fields.
8. Updated API Gateway seed script to work without compound unique upsert.
9. Updated database route config repository to load only `enabled=true` and `deletedAt=null`.
10. Updated database route config mapper to exclude deleted routes defensively.
11. Updated route management types with soft delete metadata.
12. Updated route management repository with `softDeleteRoute()`.
13. Updated route management mapper response with metadata fields.
14. Updated admin route config route with `x-admin-actor` support.
15. Added actor metadata for create/update/delete.
16. Added `DELETE /internal/admin/routes/:id`.
17. Added soft delete behavior.
18. Added admin list/detail filtering for non-deleted routes.
19. Added duplicate route checks against non-deleted routes only.
20. Validated soft-deleted routes are hidden from admin APIs.
21. Validated soft-deleted routes are excluded from runtime route loading after restart.
22. Validated active route uniqueness allows recreating same path after soft delete.
23. Added `POST /internal/admin/routes/reload`.
24. Added reload validation-only behavior.
25. Added reload route summary response.
26. Added reload auth behavior.
27. Added soft delete tests.
28. Added reload validation tests.
29. Ran `npm run test`.
30. Ran `npm run typecheck`.
31. Ran `npm run build`.
32. Confirmed test count is 27 files and 176 tests.
33. Ran Docker runtime validation for create/restart/delete/restart/recreate/reload flow.
34. Confirmed active DB route state contains only the 2 seeded routes.
35. Confirmed Git working tree clean after technical commits.
36. Pushed Sprint 10 technical commits to GitHub.

### Remaining

No remaining Sprint 10 technical implementation tasks.

Sprint 10 final documentation update is in progress.

---

## Recommended Next Step

Recommended next step:

```txt
Sprint 10 - Final Documentation Update
```

Currently updating:

```txt
README.md
docs/architecture/overview.md
docs/project-context/CURRENT_PROGRESS.md
docs/project-context/AI_HANDOFF.md
docs/project-context/DECISION_LOG.md
docs/sdlc/requirements.md
```

After final Sprint 10 documentation update, run:

```powershell
npm run test
npm run typecheck
npm run build
git status
```

Then commit documentation with:

```txt
docs: finalize sprint 10 documentation
```

After Sprint 10 documentation is committed and pushed, the project can move to:

```txt
Sprint 11 - Route Reload Runtime Apply Foundation or Admin Dashboard Foundation
```

Recommended Sprint 11 direction:

1. Decide whether to implement true route reload runtime apply or keep restart-based apply longer.
2. If choosing runtime apply, design a safe route registry/swap mechanism before coding.
3. Add route reload audit logging if needed.
4. Add stronger admin authentication or RBAC foundation if needed.
5. Start Admin Dashboard only after backend route management lifecycle is stable.

---

## Do Not Add Yet

Do not add these before the project is ready or before they are explicitly selected as a sprint:

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

## Notes

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
10. Update project context docs at the end of the sprint or when needed.

Current preferred development style:

* Code sample first.
* Explain each file.
* Explain the request flow.
* Test manually and with automated tests.
* Run test, typecheck, and build.
* Validate Docker runtime when needed.
* Commit only after a stable checkpoint.
* Push after each stable commit.
