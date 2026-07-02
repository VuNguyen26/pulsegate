# PulseGate Requirements

## 1. Project Name

PulseGate - High-Traffic API Gateway & Observability Platform

## 2. Current Version

```txt
v0.11.0
```

## 3. Current Sprint

```txt
Sprint 10 - Route Management Hardening
```

## 4. Project Purpose

PulseGate is a mini API Gateway, API Management, and Observability Platform.

The project demonstrates backend engineering skills through:

* API Gateway design.
* Microservice communication.
* Multi-route Gateway routing.
* Authentication and authorization.
* Admin API key authentication for internal/admin APIs.
* Traffic protection.
* Redis-backed rate limiting.
* Redis response caching.
* Database-backed downstream services.
* Database-backed Gateway route configuration.
* Internal/admin route management APIs.
* Route config list, detail, create, update, soft delete, and reload validation behavior.
* Route config enable/disable foundation.
* Route lifecycle metadata for create, update, and soft delete attribution.
* Route config validation before persistence.
* Active-route duplicate conflict detection.
* Active-route partial unique index for safe recreate-after-delete behavior.
* Safe static route config fallback.
* Restart-based route config application strategy.
* Validation-only route reload endpoint as a safe step before true hot reload.
* Docker Compose local infrastructure.
* Observability with logs, metrics, Prometheus, and Grafana.
* Policy-driven Gateway behavior.
* CI validation with GitHub Actions.
* Production-oriented backend system design.

PulseGate is inspired by:

* Kong
* Apache APISIX
* Tyk
* Apigee
* AWS API Gateway

The long-term target is to grow PulseGate into a product-like API Gateway/API Management platform with:

* Admin Dashboard.
* Developer Portal.
* API key request flow.
* Dynamic route configuration.
* Route management APIs.
* Route reload or controlled hot reload foundation.
* Service registry foundation.
* API consumer management.
* Usage plans and quotas.
* Observability stack.
* Kubernetes/cloud deployment later.
* CI/CD.
* Event streaming later.
* Background jobs later.

---

## 5. Target Users

PulseGate is designed for:

* Backend Developers
* DevOps Engineers
* SREs
* Tech Leads
* Teams that manage multiple APIs or microservices
* Companies that need a centralized API entry point

---

## 6. Main Problems

PulseGate aims to solve these problems:

* Clients need one single entry point for multiple backend services.
* Backend services should not be exposed directly to external clients.
* Requests need to be routed to the correct downstream service.
* Gateway should support more than one downstream route.
* Public routes and protected routes should behave differently.
* APIs need centralized authentication and authorization.
* Internal/admin APIs need separate protection from consumer API keys.
* APIs need protection from excessive traffic and unsafe payloads.
* Downstream services should be protected from repeated requests.
* Selected responses should be cached to reduce downstream load.
* API traffic should be logged for debugging.
* API latency should be visible during local testing.
* Gateway metrics should be exposed to Prometheus.
* Gateway behavior should be visible through Grafana dashboards.
* Gateway route behavior should be configurable through policies.
* Gateway route configuration should be persisted in PostgreSQL.
* Gateway should load route configuration from database at startup.
* Gateway should keep a safe static fallback when DB route loading fails.
* Gateway route configuration should be readable through internal/admin APIs.
* Gateway route configuration should be creatable through internal/admin APIs.
* Gateway route configuration should be updatable through internal/admin APIs.
* Gateway route configuration should support enable/disable behavior.
* Gateway route configuration should support safe soft delete behavior.
* Soft-deleted route configs should remain in the database for historical visibility.
* Soft-deleted route configs should not be visible in normal admin read APIs.
* Soft-deleted route configs should not be loaded as active runtime routes.
* Duplicate route identity checks should ignore soft-deleted routes.
* The same `method + gatewayPath` should be reusable after the old route is soft-deleted.
* Route reload should be validated safely before true runtime hot reload is introduced.
* Gateway route configuration should be validated before persistence and reload validation.
* Repository health should be validated automatically before the main branch is considered stable.
* The system should be easy to run locally before cloud deployment.
* The route management backend foundation should prepare the project for a future Admin Dashboard.

---

## 7. Current System Overview

Current stable architecture after Sprint 10:

```txt
Client
  -> API Gateway :3000
    -> Runtime route config loading
      -> Try loading active route configs from PostgreSQL gateway.gateway_routes
      -> Active means enabled=true and deleted_at IS NULL
      -> Map database records to DownstreamRouteConfig[]
      -> Validate mapped route configs
      -> If database route configs are valid and not empty:
           -> Use database-backed route configs
           -> Log: Loaded downstream route configs from database { routeCount: 2 }
      -> If database loading fails:
           -> Fall back to static downstreamRouteConfigs
      -> If database returns no active routes:
           -> Fall back to static downstreamRouteConfigs
    -> Request ID handling
    -> Structured access log timer
    -> Metrics timer
    -> Basic security headers
    -> Request size limit
    -> Resolved downstream route configuration
      -> GET /api/products
      -> GET /api/product-service/health
    -> Route policy configuration
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
      -> Redis-backed rate limiting
      -> JWT authentication
      -> Redis response cache
        -> Cache HIT:
             -> Apply response transform foundation
             -> Return cached product response
             -> x-cache: HIT
        -> Cache MISS:
             -> Apply request transform foundation
             -> Call Product Service through timeout and retry helpers
             -> Product Service :3001 /products
               -> Prisma Client
               -> PostgreSQL public.products
               -> Database-backed product data
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

    -> Internal/admin route management APIs:
      -> GET /internal/admin/routes
      -> GET /internal/admin/routes/:id
      -> POST /internal/admin/routes
      -> PATCH /internal/admin/routes/:id
      -> DELETE /internal/admin/routes/:id
      -> POST /internal/admin/routes/reload
      -> Admin API key authentication
      -> Optional x-admin-actor attribution header
      -> Route management repository
      -> Route management mapper
      -> PostgreSQL gateway.gateway_routes
      -> Route config validation before persistence
      -> Active method + gatewayPath conflict detection
      -> Enable/disable route config through PATCH
      -> Soft delete route config through DELETE
      -> Reload validation without applying runtime changes

    -> Add x-cache when applicable
    -> Add x-response-time-ms
    -> Record Prometheus metrics
    -> Write structured access log
    -> Return response to Client

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
  -> Reports pass/fail status to GitHub
```

Current Docker services:

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

Current public endpoints through API Gateway:

```txt
GET /health
GET /metrics
GET /api/product-service/health
```

Current protected endpoint through API Gateway:

```txt
GET /api/products
```

Protected endpoint requirements:

```txt
x-api-key: dev-api-key
Authorization: Bearer <jwt-token>
```

Current internal/admin endpoints through API Gateway:

```txt
GET /internal/admin/routes
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
```

Internal/admin endpoint requirement:

```txt
x-admin-api-key: local-admin-key
```

Optional admin actor attribution header:

```txt
x-admin-actor: <admin-name-or-system-actor>
```

Current downstream Product Service endpoints:

```txt
GET /health
GET /products
```

Current Gateway route config table:

```txt
gateway.gateway_routes
```

Current CI workflow:

```txt
.github/workflows/ci.yml
```

---

## 8. Sprint Status Summary

### Sprint 0 - Core Setup & Basic Gateway Flow

Status:

```txt
Done
```

Completed:

* Monorepo setup.
* API Gateway.
* Product Service.
* Basic Gateway-to-Product-Service proxy flow.
* Health endpoints.
* Request ID generation and propagation.
* Basic error handling.
* Initial project documentation.
* README foundation.
* `.env.example`.

### Sprint 1 - Gateway Core Behavior

Status:

```txt
Done
```

Completed:

* Normalized downstream service errors.
* Downstream request timeout.
* Downstream route configuration.
* API key authentication.
* JWT authentication.
* API Gateway app builder for integration tests.
* Unit test foundation.
* Integration test foundation.

### Sprint 2 - Gateway Traffic Protection

Status:

```txt
Done
```

Completed:

* In-memory rate limiting foundation.
* Rate limit middleware.
* Route-level rate limit configuration.
* `429 TOO_MANY_REQUESTS` response behavior.
* Request size limit.
* `413 REQUEST_BODY_TOO_LARGE` response behavior.
* Basic security headers.
* Route-level auth configuration.
* Traffic protection tests.

### Sprint 3 - Data & Infrastructure Foundation

Status:

```txt
Done
```

Completed:

* Docker Compose foundation.
* API Gateway Dockerfile.
* Product Service Dockerfile.
* PostgreSQL service.
* Redis service.
* Prisma setup.
* Product model.
* Initial Product migration.
* Product seed script.
* Database-backed Product Service data.
* Redis-backed rate limiting.
* Redis response caching.
* Cache HIT behavior when Product Service is down.
* Redis fail-fast behavior.
* Response cache write failure isolation.

### Sprint 4 - Observability Foundation

Status:

```txt
Done
```

Completed:

* Structured access logs.
* Request latency measurement.
* `x-response-time-ms` response header.
* Prometheus-compatible metrics registry.
* Metrics middleware.
* `/metrics` endpoint.
* Prometheus Docker service.
* Prometheus scrape configuration.
* Grafana Docker service.
* Grafana Prometheus datasource provisioning.
* Grafana dashboard provisioning.
* API Gateway overview dashboard.

### Sprint 5 - Advanced Gateway Policies

Status:

```txt
Done
```

Completed:

* Route policy type foundation.
* Central `RoutePolicies` model.
* Route config validation improvements.
* Per-route timeout policy helper.
* Per-route cache policy helper.
* Per-route rate limit policy helper.
* Request transformation policy foundation.
* Response transformation policy foundation.
* Upstream retry policy foundation.
* Product proxy route refactor to use policy helpers.
* Route policy unit tests.
* Route policy integration tests.

### Sprint 6 - CI/CD Foundation

Status:

```txt
Done
```

Completed:

* GitHub Actions workflow.
* CI on push to `main`.
* CI on pull request to `main`.
* Node.js 20 in CI.
* Dependency installation with `npm ci`.
* Product Service Prisma Client generation in CI.
* Automated tests in CI.
* TypeScript typecheck in CI.
* Production build in CI.
* API Gateway Docker image build validation.
* Product Service Docker image build validation.
* README CI badge.
* Final validation and documentation.

### Sprint 7 - Multi-Route Gateway Expansion

Status:

```txt
Done
```

Completed:

* Generic downstream proxy route foundation.
* `downstreamProxyRoute()`.
* `productProxyRoute()` compatibility wrapper.
* Public Product Service health proxy route.
* Multiple downstream routes from route config.
* Public/protected route policy separation.
* Docker runtime validation.
* Final validation and documentation.

### Sprint 8 - Dynamic Route Config from Database

Status:

```txt
Done
```

Completed:

* API Gateway Prisma setup.
* PostgreSQL schema `gateway`.
* `gateway.gateway_routes` table.
* Migration `20260701063629_add_gateway_routes`.
* DB route config seed script.
* Database route config mapper.
* Database route config repository.
* Runtime route config loader.
* DB-first route loading at startup.
* Static fallback.
* API Gateway Prisma Client generation in CI and Docker.
* Docker runtime validation.
* Final validation and documentation.

### Sprint 9 - Route Management API Foundation

Status:

```txt
Done
```

Completed:

* Admin API key environment config.
* Admin API key middleware.
* Route management type foundation.
* Route management repository interface.
* Prisma route management repository.
* Route management request/response mappers.
* `GET /internal/admin/routes`.
* `GET /internal/admin/routes/:id`.
* `POST /internal/admin/routes`.
* `PATCH /internal/admin/routes/:id`.
* Route config list behavior.
* Route config detail behavior.
* Route config create behavior.
* Route config update behavior.
* Route config enable/disable behavior through PATCH.
* Validation before create/update.
* Duplicate method + gatewayPath conflict detection.
* Route management API tests.
* Docker runtime create/update/disable validation.
* Final validation and documentation.

### Sprint 10 - Route Management Hardening

Status:

```txt
Done
```

Completed:

* Added route config soft delete foundation.
* Added lifecycle metadata fields:
  * `created_by`
  * `updated_by`
  * `deleted_at`
  * `deleted_by`
* Added `createdBy`, `updatedBy`, `deletedAt`, and `deletedBy` to route management response models.
* Added optional `x-admin-actor` attribution header.
* Added `DELETE /internal/admin/routes/:id`.
* Implemented soft delete behavior:
  * Sets `enabled=false`
  * Sets `deleted_at`
  * Sets `deleted_by`
  * Sets `updated_by`
* Excluded soft-deleted routes from admin list API.
* Excluded soft-deleted routes from admin detail API.
* Excluded soft-deleted routes from duplicate checks.
* Excluded soft-deleted routes from runtime DB route loading.
* Updated runtime loader to load only `enabled=true` and `deleted_at IS NULL` routes.
* Replaced full unique constraint with PostgreSQL partial unique index:
  * `method + gateway_path`
  * Only where `deleted_at IS NULL`
* Allowed recreating the same `method + gatewayPath` after the old route is soft-deleted.
* Updated seed strategy to avoid relying on removed Prisma compound unique upsert.
* Added reload validation endpoint:
  * `POST /internal/admin/routes/reload`
* Reload endpoint validates active DB route configs without applying runtime changes.
* Reload endpoint returns:
  * `mode: validation-only`
  * `runtimeApplied: false`
  * `requiresRestart: true`
  * active route count
* Added soft delete tests.
* Added reload validation tests.
* Validated Docker runtime soft delete behavior.
* Validated recreate-after-soft-delete behavior.
* Validated reload endpoint in Docker runtime.
* Confirmed current automated tests:
  * 27 test files passed
  * 176 tests passed
* Confirmed `npm run test` passed.
* Confirmed `npm run typecheck` passed.
* Confirmed `npm run build` passed.
* Pushed stable technical commits:
  * `8052742 feat(gateway): add route config soft delete`
  * `1f7443d feat(gateway): add route config reload validation`

---

# 9. Functional Requirements

## FR-001: API Gateway Service

The system must have an API Gateway service.

Acceptance criteria:

* API Gateway runs on port `3000`.
* API Gateway uses Fastify and TypeScript.
* API Gateway has JSON logging enabled.
* API Gateway exposes `GET /health`.
* API Gateway exposes `GET /metrics`.
* API Gateway exposes `GET /api/products`.
* API Gateway exposes `GET /api/product-service/health`.
* API Gateway exposes `GET /internal/admin/routes`.
* API Gateway exposes `GET /internal/admin/routes/:id`.
* API Gateway exposes `POST /internal/admin/routes`.
* API Gateway exposes `PATCH /internal/admin/routes/:id`.
* API Gateway exposes `DELETE /internal/admin/routes/:id`.
* API Gateway exposes `POST /internal/admin/routes/reload`.
* API Gateway can run locally.
* API Gateway can run through Docker Compose.
* API Gateway Docker image can be built in CI.
* API Gateway can generate Prisma Client in CI.
* API Gateway can generate Prisma Client inside Docker image.

Status:

```txt
Done
```

---

## FR-002: Product Service

The system must have a Product Service.

Acceptance criteria:

* Product Service runs on port `3001`.
* Product Service uses Fastify and TypeScript.
* Product Service exposes `GET /health`.
* Product Service exposes `GET /products`.
* Product Service reads product data from PostgreSQL through Prisma.
* Product Service can run locally.
* Product Service can run through Docker Compose.
* Product Service Docker image can be built in CI.

Current product response:

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

Current health response shape:

```json
{
  "service": "product-service",
  "status": "ok",
  "timestamp": "2026-07-02T00:00:00.000Z"
}
```

Status:

```txt
Done
```

---

## FR-003: Gateway Product Proxy Route

API Gateway must route product requests to Product Service.

Acceptance criteria:

* Client can call `GET /api/products` through API Gateway.
* API Gateway calls Product Service `GET /products` on cache MISS.
* API Gateway can return cached response on cache HIT.
* Product Service URL is configurable through route config.
* Product route behavior is driven by route policy configuration.
* Product route remains protected by API key and JWT.
* Product route still uses Redis-backed rate limiting.
* Product route still uses Redis response caching.
* Product route can be loaded from database route config.
* Product route can fall back to static config when DB loading fails.
* Product route is loaded from DB only when `enabled=true` and `deleted_at IS NULL`.

Status:

```txt
Done
```

---

## FR-004: Request ID

The system must support request ID generation and propagation.

Acceptance criteria:

* API Gateway creates a request ID if the client does not provide one.
* API Gateway reuses `x-request-id` if the client provides one.
* API Gateway returns `x-request-id` in response headers.
* API Gateway forwards `x-request-id` to Product Service.
* Product Service reuses the request ID from API Gateway.
* Error responses include request ID.
* Structured access logs include request ID.
* Multi-route Gateway responses include request ID.
* DB-backed route config does not break request ID behavior.
* Internal/admin route management API responses include request ID.

Header:

```txt
x-request-id
```

Status:

```txt
Done
```

---

## FR-005: Basic Error Handling

Both services must have basic error handling.

Acceptance criteria:

* Unknown routes return `404`.
* Unexpected server errors return `500`.
* Error responses include request ID.
* Internal implementation details are not exposed to clients.

Status:

```txt
Done
```

---

## FR-006: Downstream Error Normalization

API Gateway must return clean and consistent errors when downstream services fail.

Acceptance criteria:

* Product Service unavailable returns `503 DOWNSTREAM_SERVICE_UNAVAILABLE`.
* Product Service timeout returns `504 DOWNSTREAM_TIMEOUT`.
* Product Service 5xx response returns `502 DOWNSTREAM_HTTP_ERROR`.
* Product Service invalid JSON returns `502 DOWNSTREAM_INVALID_RESPONSE`.
* Error response includes request ID.
* Raw runtime errors are not exposed.
* Normalized downstream error handling remains compatible with multi-route proxy behavior.
* Normalized downstream error handling remains compatible with DB-backed route config.

Status:

```txt
Done
```

---

## FR-007: API Key Authentication

API Gateway must support API key authentication for protected routes.

Acceptance criteria:

* Missing API key returns `401 API_KEY_MISSING`.
* Invalid API key returns `403 API_KEY_INVALID`.
* Valid API key allows request to continue.
* API key header name is configurable.
* API key list is configurable through environment variables.
* Sensitive API key values are not logged.
* API key requirement is controlled by route auth policy.
* Public routes can disable API key requirement through route policy.
* DB route config supports API key requirement field.
* Internal/admin APIs do not use consumer `x-api-key`.

Current protected route:

```txt
GET /api/products
```

Current public route without API key requirement:

```txt
GET /api/product-service/health
```

Current consumer API key header:

```txt
x-api-key
```

Current local consumer API key:

```txt
dev-api-key
```

Status:

```txt
Done
```

---

## FR-008: JWT Authentication

API Gateway must support JWT authentication for protected routes.

Acceptance criteria:

* Missing Bearer token returns `401 JWT_TOKEN_MISSING`.
* Invalid token returns `403 JWT_TOKEN_INVALID`.
* Valid token allows request to continue.
* JWT validation checks signature, issuer, audience, and expiration.
* Verified JWT payload is attached to `request.jwtPayload`.
* Sensitive JWT values are not logged.
* JWT requirement is controlled by route auth policy.
* Public routes can disable JWT requirement through route policy.
* DB route config supports JWT requirement field.
* Internal/admin APIs do not require consumer JWT.

Current protected route:

```txt
GET /api/products
```

Current public route without JWT requirement:

```txt
GET /api/product-service/health
```

Current JWT header:

```txt
Authorization: Bearer <jwt-token>
```

Status:

```txt
Done
```

---

## FR-009: Request Size Limit

API Gateway must reject oversized request bodies.

Acceptance criteria:

* Gateway has configurable request body size limit.
* Gateway checks `content-length`.
* Gateway returns `413 REQUEST_BODY_TOO_LARGE` when content length exceeds the configured limit.
* Fastify body parser has configured body limit.
* Request size protection applies globally to Gateway routes.

Current config:

```txt
MAX_REQUEST_BODY_BYTES=1048576
```

Status:

```txt
Done
```

---

## FR-010: Basic Security Headers

API Gateway must add basic HTTP security headers to responses.

Acceptance criteria:

* Gateway adds security headers globally.
* Health route responses include security headers.
* Metrics route responses include security headers.
* Protected route responses include security headers.
* Public downstream proxy route responses include security headers.
* Internal/admin route responses include security headers.
* Error responses include security headers.
* Security header behavior is covered by tests.

Current security headers:

```txt
x-content-type-options: nosniff
x-frame-options: DENY
referrer-policy: no-referrer
permissions-policy: camera=(), microphone=(), geolocation=()
content-security-policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'
```

Status:

```txt
Done
```

---

## FR-011: Redis-Backed Rate Limiting

API Gateway must support Redis-backed rate limiting for protected routes.

Acceptance criteria:

* API Gateway stores rate limit counters in Redis.
* API Gateway rate limits by API key, HTTP method, and route path.
* API Gateway returns `429 TOO_MANY_REQUESTS` when the limit is exceeded.
* API Gateway returns rate limit headers.
* Product Service is not called for blocked requests.
* Redis commands fail fast when Redis is unavailable.
* Redis internal errors are not exposed.
* Runtime rate limit behavior is resolved from route policy.
* Public routes can disable rate limiting through route policy.
* DB route config supports rate limit policy fields.
* Internal/admin route management APIs do not use consumer product route rate limit identity.

Default product route rate limit:

```txt
5 requests per 60 seconds
```

Redis key example:

```txt
rate-limit:api-key:dev-api-key:route:GET:/api/products
```

Route with rate limiting disabled:

```txt
GET /api/product-service/health
```

Status:

```txt
Done
```

---

## FR-012: Redis Response Caching

API Gateway must cache selected downstream responses in Redis.

Acceptance criteria:

* API Gateway can store product responses in Redis.
* API Gateway can read product responses from Redis.
* Cache MISS returns `x-cache: MISS`.
* Cache HIT returns `x-cache: HIT`.
* Cache BYPASS is supported.
* Product Service is not called on cache HIT.
* Cache write failure does not fail a valid downstream response.
* Product Service down + cache HIT returns cached response.
* Product Service down + cache MISS returns normalized downstream error.
* Cache behavior is resolved from route policy.
* Public routes can disable cache through route policy.
* DB route config supports cache policy fields.
* Internal/admin route management APIs do not use Product response cache.

Current Redis cache key:

```txt
response-cache:GET:/api/products
```

Current TTL:

```txt
30 seconds
```

Route with cache disabled:

```txt
GET /api/product-service/health
  -> x-cache: BYPASS
```

Status:

```txt
Done
```

---

## FR-013: PostgreSQL and Prisma for Product Service

Product Service must use PostgreSQL and Prisma for product data.

Acceptance criteria:

* PostgreSQL runs through Docker Compose.
* Product Service uses `DATABASE_URL`.
* Prisma schema defines Product model.
* Prisma migration creates `public.products` table.
* Product seed script is idempotent.
* Product Service reads products from PostgreSQL.
* Prisma Client can be generated locally and in CI.

Current Prisma schema:

```txt
apps/product-service/prisma/schema.prisma
```

Current table:

```txt
public.products
```

Status:

```txt
Done
```

---

## FR-014: Docker Compose Local Infrastructure

The project must support local infrastructure through Docker Compose.

Acceptance criteria:

* API Gateway runs in Docker Compose.
* Product Service runs in Docker Compose.
* PostgreSQL runs in Docker Compose.
* Redis runs in Docker Compose.
* Prometheus runs in Docker Compose.
* Grafana runs in Docker Compose.
* Developer can start the local stack with one command.
* Multi-route Gateway behavior can be validated through Docker Compose.
* DB-backed route config loading can be validated through Docker Compose.
* Internal/admin route management APIs can be validated through Docker Compose.
* Soft delete behavior can be validated through Docker Compose.
* Reload validation endpoint can be validated through Docker Compose.

Current command:

```powershell
docker compose up --build -d
```

Status:

```txt
Done
```

---

## FR-015: Observability Foundation

The system must provide API Gateway observability.

Acceptance criteria:

* API Gateway writes structured access logs.
* API Gateway returns `x-response-time-ms`.
* API Gateway records HTTP request metrics.
* API Gateway records cache outcome metrics.
* API Gateway exposes Prometheus-compatible `/metrics`.
* Prometheus scrapes API Gateway metrics.
* Grafana visualizes Gateway metrics.
* Grafana dashboard is provisioned from repository files.
* Metrics support route labels for protected, public, and internal/admin Gateway routes.

Current metrics:

```txt
http_requests_total
http_request_duration_seconds
http_response_cache_total
```

Current dashboard panels:

```txt
Request Rate
Request Count by Route
Latency p95 by Route
Cache Outcomes
```

Status:

```txt
Done
```

---

## FR-016: Route Policy Model

API Gateway must support policy-driven route behavior.

Acceptance criteria:

* Route config contains a `policies` object.
* Policy model includes auth, timeout, cache, rate limit, request transform, response transform, and retry.
* Route config is validated.
* Product proxy route uses policy helpers.
* Product Service health proxy route uses policy config.
* Policy helpers are unit tested.
* Policy behavior is covered by integration tests.
* Policy behavior can be mapped from database route config records.
* Route management APIs reuse route validation before persistence and reload validation.

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

Status:

```txt
Done
```

---

## FR-017: Per-Route Timeout Policy

API Gateway must support per-route timeout policy resolution.

Acceptance criteria:

* Timeout policy can be enabled or disabled.
* Timeout helper creates an `AbortSignal` when enabled.
* Timeout helper aborts downstream request after configured timeout.
* Timeout helper provides cleanup function.
* Product route uses timeout policy helper.
* Product Service health proxy route uses timeout policy helper.
* DB route config supports timeout policy fields.
* Route management create/update APIs validate timeout policy before persistence.

Status:

```txt
Done
```

---

## FR-018: Per-Route Cache Policy

API Gateway must support per-route cache policy resolution.

Acceptance criteria:

* Cache policy can be enabled or disabled.
* Cache is enabled only when route policy is enabled and cache store exists.
* Cache TTL comes from route policy.
* Cache key generation is stable.
* Product route uses cache policy helper.
* Product Service health proxy route disables cache through route policy.
* DB route config supports cache policy fields.
* Mapper normalizes disabled cache TTL to runtime value `0`.
* Route management create/update APIs validate cache policy before persistence.

Status:

```txt
Done
```

---

## FR-019: Per-Route Rate Limit Policy

API Gateway must support per-route rate limit policy resolution.

Acceptance criteria:

* Rate limit policy can be enabled or disabled.
* Rate limit policy resolves runtime middleware values.
* Rate limit policy includes limit, window, route path, identity type, and store.
* Product route uses rate limit policy helper.
* Product Service health proxy route disables rate limiting through route policy.
* DB route config supports rate limit policy fields.
* Mapper normalizes disabled rate limit values to runtime `0`.
* Route management create/update APIs validate rate limit policy before persistence.

Status:

```txt
Done
```

---

## FR-020: Request and Response Transformation Foundation

API Gateway must support request and response header transformation foundations.

Acceptance criteria:

* Request transform policy can add and remove configured headers.
* Response transform policy can add and remove configured headers.
* Header removal is case-insensitive.
* Original header objects are not mutated.
* Downstream proxy route applies request transform before downstream fetch.
* Downstream proxy route applies response transform for cache HIT, MISS, and BYPASS responses.
* Current product route keeps transform disabled by default.
* Current Product Service health proxy route keeps transform disabled by default.
* DB route config supports transform policy JSON fields.
* Mapper validates transform JSON fields.
* Route management create/update APIs validate transform policy JSON before persistence.

Status:

```txt
Done
```

---

## FR-021: Upstream Retry Policy Foundation

API Gateway must support an upstream retry policy foundation.

Acceptance criteria:

* Retry policy can be enabled or disabled.
* Retry is allowed only for safe `GET` requests.
* Retry attempts are additional retries after the first request.
* Retryable statuses are configured by route policy.
* Downstream proxy route is wired to retry helper.
* Retry remains disabled by default for current routes.
* DB route config supports retry policy fields.
* Mapper validates retry status JSON.
* Route management create/update APIs validate retry policy before persistence.

Status:

```txt
Done
```

---

## FR-022: Automated Tests

The project must include automated tests for Gateway behavior.

Acceptance criteria:

* Tests can be run with `npm run test`.
* API Gateway can be tested without opening port `3000`.
* API Gateway integration tests use `app.inject()`.
* Unit tests cover middleware and policy helper behavior.
* Integration tests cover protected route behavior.
* Integration tests cover public multi-route behavior.
* Integration tests cover route policy cache behavior.
* Metrics and observability helpers are covered by tests.
* DB route config mapper is covered by tests.
* Runtime route config loader fallback behavior is covered by tests.
* Admin route management APIs are covered by tests.
* Route soft delete behavior is covered by tests.
* Route reload validation behavior is covered by tests.
* Test, typecheck, and build must pass before stable commits.

Current test status:

```txt
27 test files passed
176 tests passed
```

Status:

```txt
Done
```

---

## FR-023: GitHub Actions CI/CD Foundation

The project must support automated CI validation through GitHub Actions.

Acceptance criteria:

* Repository has a GitHub Actions workflow file.
* CI runs on push to `main`.
* CI runs on pull request to `main`.
* CI uses Node.js 20.
* CI installs dependencies with `npm ci`.
* CI generates Product Service Prisma Client before typecheck and build.
* CI generates API Gateway Prisma Client before typecheck and build.
* CI runs automated tests.
* CI runs TypeScript typecheck.
* CI runs production build.
* CI validates API Gateway Docker image build.
* CI validates Product Service Docker image build.
* CI status is visible through README badge.
* CI passes successfully on GitHub.

Current workflow file:

```txt
.github/workflows/ci.yml
```

Status:

```txt
Done
```

---

## FR-024: Static Multi-Route Gateway Routing

API Gateway must support registering more than one downstream Gateway route from route configuration.

Acceptance criteria:

* Gateway route registration supports multiple `DownstreamRouteConfig` entries.
* Gateway no longer depends on only one hardcoded Product route.
* Existing `GET /api/products` behavior remains stable after refactor.
* New `GET /api/product-service/health` route is registered from route config.
* Each route can use different route policies.
* Public and protected routes can coexist.
* Duplicate route validation still protects against duplicate method + gateway path.
* Multi-route behavior is covered by tests.
* Multi-route behavior is validated through Docker Compose runtime.
* Static multi-route config remains available as safe fallback.

Current configured fallback routes:

```txt
GET /api/products
  -> Product Service GET /products
  -> Protected

GET /api/product-service/health
  -> Product Service GET /health
  -> Public
```

Status:

```txt
Done
```

---

## FR-025: Product Service Health Proxy Route

API Gateway must expose a public proxy route to Product Service health.

Acceptance criteria:

* Client can call `GET /api/product-service/health` through API Gateway.
* API Gateway proxies request to Product Service `GET /health`.
* Route does not require API key.
* Route does not require JWT.
* Route does not apply Redis-backed rate limiting.
* Route does not use Redis response cache.
* Route returns `x-cache: BYPASS`.
* Route returns `x-request-id`.
* Route returns `x-response-time-ms`.
* Route returns Product Service health response.
* Route is covered by integration test.
* Route is validated in Docker Compose runtime.
* Route can be loaded from database route config.
* Route can fall back to static config when DB loading fails.

Status:

```txt
Done
```

---

## FR-026: Database-Backed Gateway Route Configuration

API Gateway must support loading downstream route configuration from PostgreSQL.

Acceptance criteria:

* API Gateway has its own Prisma schema.
* API Gateway has its own Prisma migration.
* API Gateway route config is stored in PostgreSQL schema `gateway`.
* API Gateway route config table is `gateway.gateway_routes`.
* Product Service data remains in PostgreSQL schema `public`.
* Product Service migration history remains in `public._prisma_migrations`.
* API Gateway migration history is stored in `gateway._prisma_migrations`.
* Gateway route config supports method, gateway path, downstream URL, enabled flag, priority, route policies, and lifecycle metadata.
* Gateway route config supports active route uniqueness through a partial unique index on `method + gateway_path` where `deleted_at IS NULL`.
* Gateway route config can be seeded idempotently.
* Current protected Product route can be seeded.
* Current public Product Service health proxy route can be seeded.
* Database records can be mapped to runtime `DownstreamRouteConfig[]`.
* Mapped route configs are validated before use.
* Invalid DB route config should not be silently accepted.
* API Gateway loads DB route config at startup.
* API Gateway uses DB route config when DB loading succeeds and returns active routes.
* API Gateway loads only `enabled=true` and `deleted_at IS NULL` records as active runtime routes.
* API Gateway falls back to static route config when DB loading fails.
* API Gateway falls back to static route config when DB returns no active routes.
* Docker runtime can load route config from database successfully.
* Docker logs confirm DB-backed route loading.

Current DB table:

```txt
gateway.gateway_routes
```

Current DB-backed active routes:

```txt
GET /api/products
GET /api/product-service/health
```

Current startup log:

```txt
Loaded downstream route configs from database { routeCount: 2 }
```

Status:

```txt
Done
```

---

## FR-027: API Gateway Prisma Client Generation

API Gateway must generate Prisma Client in local development, CI, and Docker builds.

Acceptance criteria:

* API Gateway has `db:generate` script.
* API Gateway generated Prisma Client is ignored by Git.
* CI generates API Gateway Prisma Client before typecheck and build.
* API Gateway Docker image generates Prisma Client inside the Linux Alpine image.
* Docker runtime does not use Windows-generated Prisma Client.
* Docker runtime avoids Prisma Query Engine mismatch.

Generated client ignore path:

```txt
apps/api-gateway/src/generated/
```

Status:

```txt
Done
```

---

## FR-028: Admin API Key Authentication

API Gateway must protect internal/admin APIs with a separate admin API key.

Acceptance criteria:

* API Gateway supports `ADMIN_API_KEY_HEADER`.
* API Gateway supports `ADMIN_API_KEY`.
* Default local admin API key header is `x-admin-api-key`.
* Default local admin API key is `local-admin-key`.
* Missing admin API key returns `401 ADMIN_API_KEY_MISSING`.
* Invalid admin API key returns `403 ADMIN_API_KEY_INVALID`.
* Valid admin API key allows request to continue to route management behavior.
* Admin API key values are not logged.
* Consumer `x-api-key` is not used for internal/admin route management APIs.
* Admin API key variables are documented in `.env.example`.
* Admin API key config is covered by tests.

Current internal/admin routes:

```txt
GET /internal/admin/routes
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
```

Current admin header:

```txt
x-admin-api-key
```

Current default local admin API key:

```txt
local-admin-key
```

Status:

```txt
Done
```

---

## FR-029: Route Management Read API

API Gateway must expose internal/admin APIs to read route config records.

Acceptance criteria:

* `GET /internal/admin/routes` exists.
* `GET /internal/admin/routes/:id` exists.
* Both endpoints require admin API key.
* List endpoint returns non-deleted route configs.
* List endpoint includes enabled and disabled routes when `deleted_at IS NULL`.
* List endpoint excludes soft-deleted routes.
* Detail endpoint returns one non-deleted route config by id.
* Detail endpoint returns `404 ROUTE_CONFIG_NOT_FOUND` when route config does not exist.
* Detail endpoint returns `404 ROUTE_CONFIG_NOT_FOUND` when route config was soft-deleted.
* Read behavior uses a route management repository abstraction.
* Read behavior is covered by tests.

Current endpoints:

```txt
GET /internal/admin/routes
GET /internal/admin/routes/:id
```

Status:

```txt
Done
```

---

## FR-030: Route Management Create API

API Gateway must expose an internal/admin API to create route config records.

Acceptance criteria:

* `POST /internal/admin/routes` exists.
* Endpoint requires admin API key.
* Request body is parsed and mapped to route config.
* Mapped route config is validated through `validateDownstreamRoutes()`.
* Invalid route config returns `400 ROUTE_CONFIG_INVALID`.
* Duplicate active `method + gatewayPath` returns `409 ROUTE_CONFIG_ALREADY_EXISTS`.
* Soft-deleted routes do not block recreating the same `method + gatewayPath`.
* Valid route config is persisted to `gateway.gateway_routes`.
* Successful creation returns `201 Created`.
* Created route config records `createdBy` and `updatedBy` when `x-admin-actor` is provided.
* Created route config is visible through `GET /internal/admin/routes`.
* Created route config can become active after API Gateway restart if enabled.
* Create behavior is covered by tests.
* Create behavior is validated in Docker runtime.

Current endpoint:

```txt
POST /internal/admin/routes
```

Status:

```txt
Done
```

---

## FR-031: Route Management Update API

API Gateway must expose an internal/admin API to update route config records.

Acceptance criteria:

* `PATCH /internal/admin/routes/:id` exists.
* Endpoint requires admin API key.
* Endpoint finds existing non-deleted route config by id.
* Missing route config returns `404 ROUTE_CONFIG_NOT_FOUND`.
* Soft-deleted route config returns `404 ROUTE_CONFIG_NOT_FOUND`.
* Patch body is merged with the existing route config.
* Merged route config is mapped to runtime route config shape.
* Merged route config is validated through `validateDownstreamRoutes()`.
* Invalid merged route config returns `400 ROUTE_CONFIG_INVALID`.
* Conflict with another active `method + gatewayPath` returns `409 ROUTE_CONFIG_ALREADY_EXISTS`.
* Soft-deleted routes do not count as conflicts.
* Valid update is persisted to `gateway.gateway_routes`.
* Successful update returns `200 OK`.
* Update records `updatedBy` when `x-admin-actor` is provided.
* Update behavior is covered by tests.
* Update behavior is validated in Docker runtime.

Current endpoint:

```txt
PATCH /internal/admin/routes/:id
```

Status:

```txt
Done
```

---

## FR-032: Route Enable/Disable Foundation

API Gateway must support enabling and disabling route config records.

Acceptance criteria:

* Route config has an `enabled` field.
* `PATCH /internal/admin/routes/:id` can update `enabled`.
* Disabled route remains stored in `gateway.gateway_routes`.
* Disabled route remains visible through admin read API if it is not soft-deleted.
* Disabled route is not loaded as an active runtime route after API Gateway restart.
* Requests to disabled route return `404 Route not found` after API Gateway restart.
* Enable/disable behavior is validated in Docker runtime.

Current disable request shape:

```json
{
  "enabled": false
}
```

Status:

```txt
Done
```

---

## FR-033: Route Config Soft Delete

API Gateway must support soft deleting route config records.

Acceptance criteria:

* `DELETE /internal/admin/routes/:id` exists.
* Endpoint requires admin API key.
* Endpoint returns `401 ADMIN_API_KEY_MISSING` when admin API key is missing.
* Endpoint returns `403 ADMIN_API_KEY_INVALID` when admin API key is invalid.
* Endpoint returns `404 ROUTE_CONFIG_NOT_FOUND` when route config does not exist.
* Endpoint returns `404 ROUTE_CONFIG_NOT_FOUND` when route config is already soft-deleted.
* Delete operation does not physically remove the row.
* Delete operation sets `enabled=false`.
* Delete operation sets `deleted_at`.
* Delete operation sets `deleted_by` from `x-admin-actor` or fallback actor.
* Delete operation sets `updated_by` from `x-admin-actor` or fallback actor.
* Soft-deleted route is excluded from admin list.
* Soft-deleted route is excluded from admin detail.
* Soft-deleted route is excluded from runtime DB route loading.
* Soft-deleted route is excluded from duplicate conflict detection.
* Soft delete behavior is covered by tests.
* Soft delete behavior is validated in Docker runtime.

Current endpoint:

```txt
DELETE /internal/admin/routes/:id
```

Status:

```txt
Done
```

---

## FR-034: Route Lifecycle Metadata

Gateway route config records must include basic lifecycle metadata.

Acceptance criteria:

* `gateway.gateway_routes` includes `created_by`.
* `gateway.gateway_routes` includes `updated_by`.
* `gateway.gateway_routes` includes `deleted_at`.
* `gateway.gateway_routes` includes `deleted_by`.
* Route management responses include `createdBy`.
* Route management responses include `updatedBy`.
* Route management responses include `deletedAt`.
* Route management responses include `deletedBy`.
* Create operation can set `createdBy` and `updatedBy`.
* Update operation can set `updatedBy`.
* Soft delete operation can set `deletedBy` and `updatedBy`.
* `x-admin-actor` is used as a basic attribution source.
* If `x-admin-actor` is missing or empty, the fallback actor is `admin-api-key`.

Current attribution header:

```txt
x-admin-actor
```

Status:

```txt
Done
```

---

## FR-035: Active Route Partial Unique Index

Gateway route config must enforce uniqueness only for active non-deleted route identities.

Acceptance criteria:

* Full unique constraint on `method + gateway_path` is removed.
* PostgreSQL partial unique index exists on `method + gateway_path` where `deleted_at IS NULL`.
* Two active non-deleted routes cannot share the same `method + gateway_path`.
* A soft-deleted route does not block creating a new active route with the same `method + gateway_path`.
* Route management duplicate checks match the database uniqueness strategy.
* Seed logic no longer relies on Prisma compound unique upsert.
* Recreate-after-soft-delete behavior is validated in Docker runtime.

Current index concept:

```sql
CREATE UNIQUE INDEX gateway_routes_method_gateway_path_active_key
ON gateway.gateway_routes(method, gateway_path)
WHERE deleted_at IS NULL;
```

Status:

```txt
Done
```

---

## FR-036: Route Reload Validation Endpoint

API Gateway must expose a safe validation endpoint for route reload preparation.

Acceptance criteria:

* `POST /internal/admin/routes/reload` exists.
* Endpoint requires admin API key.
* Endpoint returns `401 ADMIN_API_KEY_MISSING` when admin API key is missing.
* Endpoint returns `403 ADMIN_API_KEY_INVALID` when admin API key is invalid.
* Endpoint reads non-deleted route configs from the route management repository.
* Endpoint validates active routes by mapping them to runtime `DownstreamRouteConfig[]`.
* Endpoint does not apply runtime route changes.
* Endpoint does not perform true hot reload yet.
* Endpoint returns `mode: validation-only`.
* Endpoint returns `runtimeApplied: false`.
* Endpoint returns `requiresRestart: true`.
* Endpoint returns active route count.
* Endpoint returns active route summary.
* Validation failure returns `400 ROUTE_CONFIG_RELOAD_VALIDATION_FAILED`.
* Reload validation behavior is covered by tests.
* Reload validation behavior is validated in Docker runtime.

Current endpoint:

```txt
POST /internal/admin/routes/reload
```

Current successful response shape:

```json
{
  "data": {
    "mode": "validation-only",
    "runtimeApplied": false,
    "requiresRestart": true,
    "routeCount": 2,
    "routes": [
      {
        "method": "GET",
        "gatewayPath": "/api/products",
        "enabled": true,
        "priority": 100
      },
      {
        "method": "GET",
        "gatewayPath": "/api/product-service/health",
        "enabled": true,
        "priority": 200
      }
    ]
  }
}
```

Status:

```txt
Done
```

---

# 10. Non-Functional Requirements

## NFR-001: Local First

The project must run locally before cloud deployment.

Acceptance criteria:

* API Gateway can run locally.
* Product Service can run locally.
* PostgreSQL, Redis, Prometheus, and Grafana run through Docker Compose.
* No paid cloud infrastructure is required.
* Developer can test the full flow from local terminal.
* Developer can validate both protected and public Gateway routes locally.
* Developer can validate DB-backed route config through local Docker Compose.
* Developer can validate route management APIs through local Docker Compose.
* Developer can validate soft delete and reload validation through local Docker Compose.

Status:

```txt
Done
```

---

## NFR-002: Cost Safe

The project must avoid unnecessary paid services during early development.

Acceptance criteria:

* Current system does not require AWS, GCP, Azure, or paid hosting.
* Current system does not require managed databases.
* Current system does not require managed message brokers.
* Current system does not require managed observability services.

Status:

```txt
Done
```

---

## NFR-003: Maintainable Structure

The codebase must be organized clearly.

Acceptance criteria:

* API Gateway separates app building, config, routes, middlewares, errors, Redis client, cache stores, rate limit stores, policy helpers, observability code, tests, database helpers, Prisma schema, route config mapper, route config repository, runtime route config loader, route management module, and server startup.
* Product Service separates config, database helper, repositories, routes, middlewares, Prisma files, and server startup.
* Product Service Prisma files are located under Product Service.
* API Gateway Prisma files are located under API Gateway.
* Route management logic is separated under `route-management`.
* Prometheus and Grafana config are located under `observability`.
* CI workflow is located under `.github/workflows`.
* Downstream route behavior is centralized through route config.
* Generic downstream proxy behavior is reusable for multiple routes.

Status:

```txt
Done
```

---

## NFR-004: Type Safety

The project must use TypeScript with strict checking.

Acceptance criteria:

* TypeScript is configured.
* `npm run typecheck` passes.
* `npm run build` passes.
* Route policies are typed.
* Downstream route configs are typed.
* Database route record mapper is typed.
* Route management request/response mapper is typed.
* Route management repository interface is typed.
* Product Service Prisma Client can be generated.
* API Gateway Prisma Client can be generated.

Status:

```txt
Done
```

---

## NFR-005: Observability

The project must provide local observability.

Acceptance criteria:

* Request ID exists.
* Request ID is propagated across services.
* API Gateway writes structured access logs.
* API Gateway includes request latency response header.
* API Gateway exposes Prometheus-compatible metrics.
* Prometheus scrapes API Gateway metrics.
* Grafana visualizes API Gateway metrics.
* Metrics include route labels for current Gateway routes.
* Internal/admin route management requests are observable through logs and metrics.

Status:

```txt
Done
```

---

## NFR-006: Testability

The project must support automated testing.

Acceptance criteria:

* Tests can run with `npm run test`.
* API Gateway can be tested with `app.inject()`.
* Tests can inject in-memory stores when Redis is not needed.
* Middleware, policy helpers, metrics helpers, route config mapper, runtime config loader, route management mapper, route management route behavior, and route behavior are covered by tests.
* Multi-route behavior is covered by route config and integration tests.
* DB-backed route config mapping and fallback behavior are covered by tests.
* Route management API behavior is covered by tests.
* Soft delete behavior is covered by tests.
* Reload validation behavior is covered by tests.

Status:

```txt
Done
```

---

## NFR-007: Failure Isolation

Non-critical failures should not break successful business responses when avoidable.

Acceptance criteria:

* Downstream failures are normalized.
* Redis command failures fail fast.
* Redis internal errors are not exposed.
* Cache write failure does not fail a successful Product Service response.
* Cache HIT can serve data when Product Service is temporarily down.
* Retry foundation is disabled by default to avoid hidden behavior changes.
* Public Product Service health proxy route does not depend on Redis because rate limit and cache are disabled for that route.
* API Gateway can fall back to static route config when DB route config loading fails.
* Invalid route config is rejected before persistence in route management APIs.
* Reload validation failure does not apply runtime route changes.

Status:

```txt
Done
```

---

## NFR-008: Reproducible Local Infrastructure

The local infrastructure stack must be reproducible from repository files.

Acceptance criteria:

* Docker Compose config is committed.
* PostgreSQL schema/migration files are committed.
* API Gateway route config seed script is committed.
* Product Service seed script is committed.
* Prometheus config is committed.
* Grafana datasource config is committed.
* Grafana dashboard provider config is committed.
* Grafana dashboard JSON is committed.
* `.env.example` documents consumer and admin API key environment variables.
* Developer does not need to manually create Prometheus target, Grafana datasource, or Grafana dashboard.

Status:

```txt
Done
```

---

## NFR-009: Policy-Driven Gateway Behavior

Gateway route behavior should be policy-driven instead of hardcoded directly inside route handlers.

Acceptance criteria:

* Route config contains `policies`.
* Auth, timeout, cache, rate limit, transform, and retry behavior are controlled by policy.
* Policy config is validated.
* Policy helpers are unit tested.
* Policy behavior is covered by integration tests.
* Different routes can use different policy combinations.
* Database route config can be mapped to the same route policy model.
* Route management APIs reuse the same validation model before persistence and reload validation.

Status:

```txt
Done
```

---

## NFR-010: Automated CI Validation

The project must validate repository health automatically.

Acceptance criteria:

* CI workflow is committed to the repository.
* CI uses clean dependency installation.
* CI validates Product Service Prisma Client generation.
* CI validates API Gateway Prisma Client generation.
* CI validates automated tests.
* CI validates TypeScript typecheck.
* CI validates production build.
* CI validates Docker image builds.
* CI result is visible in GitHub Actions.
* CI badge is visible in README.
* CI does not deploy automatically yet.

Status:

```txt
Done
```

---

## NFR-011: Backward Compatibility During Refactor

Refactors should preserve existing stable Gateway behavior.

Acceptance criteria:

* Existing `GET /api/products` behavior must continue working after multi-route refactor.
* Existing `GET /api/products` behavior must continue working after DB-backed route config rollout.
* Existing `GET /api/products` behavior must continue working after route management API addition.
* Existing `GET /api/products` behavior must continue working after route management hardening.
* Existing API key behavior must remain unchanged.
* Existing JWT behavior must remain unchanged.
* Existing Redis-backed rate limit behavior must remain unchanged.
* Existing Redis cache behavior must remain unchanged.
* Existing downstream error behavior must remain unchanged.
* Existing tests must continue passing.
* New route additions must not break current runtime flow.
* DB-backed route config must preserve the same external behavior for current routes.

Status:

```txt
Done
```

---

## NFR-012: Safe Dynamic Config Rollout

Database-backed Gateway route config must be introduced safely.

Acceptance criteria:

* API Gateway uses DB route config when available.
* API Gateway falls back to static route config when DB loading fails.
* API Gateway falls back to static route config when DB returns zero active routes.
* Existing static route config remains validated.
* DB route records are mapped and validated before route registration.
* Only active routes are loaded from DB.
* Active means `enabled=true` and `deleted_at IS NULL`.
* Docker runtime confirms DB route config is loaded.
* Route changes do not require true runtime hot reload yet.

Status:

```txt
Done
```

---

## NFR-013: Safe Route Management Foundation

Route management APIs must be introduced safely.

Acceptance criteria:

* Internal/admin route management APIs require admin API key.
* Route management APIs do not use normal consumer API keys.
* Route management APIs do not require consumer JWT.
* Create and update operations validate route config before persistence.
* Create and update operations reject duplicate active `method + gatewayPath` conflicts.
* Disabled routes remain visible to admins if they are not soft-deleted.
* Disabled routes are not loaded as active runtime routes after restart.
* Soft-deleted routes are hidden from normal admin reads.
* Soft-deleted routes are not loaded as active runtime routes after restart.
* Runtime route application remains restart-based after Sprint 10.
* True hot reload is deferred to a later sprint.

Status:

```txt
Done
```

---

## NFR-014: Safe Route Management Hardening

Route management hardening must preserve auditability and avoid destructive data loss.

Acceptance criteria:

* Route delete operation uses soft delete instead of hard delete.
* Soft-deleted rows remain in PostgreSQL.
* Active route uniqueness is enforced through partial unique index.
* Recreate-after-soft-delete is supported.
* Basic admin actor attribution exists through `x-admin-actor`.
* Route lifecycle metadata is returned in admin API responses.
* Reload endpoint validates route config but does not apply runtime changes.
* Runtime changes still require API Gateway restart.
* Full audit log table is deferred to a later sprint.

Status:

```txt
Done
```

---

# 11. Current System Constraints

Current constraints after Sprint 10 technical completion:

* API Gateway currently proxies only Product Service, but supports more than one Gateway route.
* Current downstream routes are loaded from PostgreSQL at startup when available.
* Runtime DB route loading only loads `enabled=true` and `deleted_at IS NULL` routes.
* Static code-based route configs still exist as fallback.
* Route configuration is database-backed and manageable through internal/admin APIs.
* Route configuration changes require API Gateway restart to affect runtime proxy routing.
* True runtime route hot reload is not implemented yet.
* `POST /internal/admin/routes/reload` is validation-only and does not apply runtime changes.
* Route config soft delete is implemented.
* Route config hard delete is not implemented.
* Route management audit log table is not implemented yet.
* Route lifecycle metadata exists, but it is not a full audit history.
* Internal/admin APIs use a local admin API key foundation, not a full admin user system yet.
* Admin attribution uses optional `x-admin-actor`, not verified admin identity yet.
* API key list is still environment-based.
* JWT validation is local-secret based.
* There is no user service yet.
* There is no API consumer database yet.
* Product data is database-backed, but only a minimal Product model exists.
* Product Service has no create, update, or delete product APIs yet.
* Redis-backed rate limiting is implemented for `GET /api/products`.
* `GET /api/product-service/health` intentionally has rate limiting disabled.
* Internal/admin route management APIs do not use product route consumer rate limiting.
* Redis response caching is implemented for `GET /api/products`.
* `GET /api/product-service/health` intentionally has response caching disabled.
* Internal/admin route management APIs do not use Product response cache.
* Route policy foundation exists and is used by multiple routes.
* Request and response transformation foundations support headers only.
* Request and response transformation policies are disabled by default for current routes.
* Retry foundation exists, but retry is disabled by default for current routes.
* Redis failure currently causes protected product route to return generic `500`.
* `/metrics` is public in local development.
* Prometheus and Grafana are local Docker services only.
* Grafana local credentials are development-only.
* Dashboard is a foundation dashboard, not a complete production dashboard.
* CI validates tests, typecheck, build, Prisma generate, and Docker image builds only.
* CI does not run the full Docker Compose runtime stack yet.
* CI does not push Docker images to a registry yet.
* CI does not deploy automatically yet.
* There is no distributed tracing yet.
* There is no OpenTelemetry instrumentation yet.
* There is no Loki centralized logging yet.
* There is no k6 load testing yet.
* There is no Kafka or RabbitMQ yet.
* There is no Admin Dashboard yet.
* There is no Developer Portal yet.
* There is no Kubernetes deployment yet.
* There is no production cloud deployment yet.

---

# 12. Current Runtime Behavior

## Runtime Route Config Loading Flow

```txt
API Gateway process starts
  -> loadRuntimeDownstreamRouteConfigs()
    -> Try loading active route configs from PostgreSQL gateway.gateway_routes
      -> Query enabled=true and deleted_at IS NULL routes
      -> Order by priority ASC and gatewayPath ASC
      -> Map DB records to DownstreamRouteConfig[]
      -> Validate mapped route configs
    -> If DB loading succeeds and active routes exist:
         -> Use database-backed route configs
         -> Log: Loaded downstream route configs from database { routeCount: 2 }
    -> If DB loading fails:
         -> Use static downstreamRouteConfigs fallback
    -> If DB returns zero active routes:
         -> Use static downstreamRouteConfigs fallback
  -> buildApiGatewayApp({ routeConfigs })
  -> Register /health
  -> Register /metrics
  -> Register internal/admin route management APIs
  -> Register downstream proxy routes
  -> Connect Redis
  -> Listen on port 3000
```

## Protected Product Flow

```txt
Client
  -> GET http://localhost:3000/api/products
    -> Route was loaded from PostgreSQL gateway.gateway_routes during startup
    -> API Gateway creates or reuses x-request-id
    -> API Gateway starts access log timer
    -> API Gateway starts metrics timer
    -> API Gateway adds basic security headers
    -> API Gateway applies request size limit
    -> API Gateway matches route config: GET /api/products
    -> API Gateway loads route policy configuration
    -> API Gateway checks x-api-key
    -> API Gateway applies Redis-backed rate limit
    -> API Gateway checks JWT Bearer token
    -> API Gateway checks Redis response cache
      -> Cache HIT:
           -> Apply response transform foundation
           -> Return cached product data with x-cache: HIT
      -> Cache MISS:
           -> Apply request transform foundation
           -> Call Product Service through timeout and retry helpers
           -> Product Service reads products from PostgreSQL public.products using Prisma
           -> Store response in Redis cache
           -> Apply response transform foundation
           -> Return product data with x-cache: MISS
    -> API Gateway adds x-response-time-ms
    -> API Gateway records Prometheus metrics
    -> API Gateway writes structured access log
```

## Public Product Service Health Proxy Flow

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
    -> API Gateway does not require API key
    -> API Gateway does not require JWT
    -> API Gateway does not apply Redis-backed rate limiting
    -> API Gateway does not use Redis response cache
    -> API Gateway applies request transform foundation
    -> API Gateway calls Product Service through timeout helper
    -> Product Service returns health response
    -> API Gateway returns health response with x-cache: BYPASS
    -> API Gateway adds x-response-time-ms
    -> API Gateway records Prometheus metrics
    -> API Gateway writes structured access log
```

## Internal Admin Route Management Flow

```txt
Admin Client / Future Admin Dashboard
  -> GET http://localhost:3000/internal/admin/routes
    -> API Gateway checks x-admin-api-key
    -> If missing:
         -> 401 ADMIN_API_KEY_MISSING
    -> If invalid:
         -> 403 ADMIN_API_KEY_INVALID
    -> If valid:
         -> API Gateway reads non-deleted route configs from gateway.gateway_routes
         -> API Gateway returns enabled and disabled routes where deleted_at IS NULL

Admin Client / Future Admin Dashboard
  -> GET http://localhost:3000/internal/admin/routes/:id
    -> API Gateway checks x-admin-api-key
    -> API Gateway reads one non-deleted route config by id
    -> If route does not exist or is soft-deleted:
         -> 404 ROUTE_CONFIG_NOT_FOUND
    -> If route exists:
         -> 200 with route config response

Admin Client / Future Admin Dashboard
  -> POST http://localhost:3000/internal/admin/routes
    -> API Gateway checks x-admin-api-key
    -> API Gateway parses request body
    -> API Gateway maps request body to DownstreamRouteConfig
    -> API Gateway reuses validateDownstreamRoutes()
    -> API Gateway checks duplicate active method + gatewayPath
    -> If invalid:
         -> 400 ROUTE_CONFIG_INVALID
    -> If active duplicate:
         -> 409 ROUTE_CONFIG_ALREADY_EXISTS
    -> If valid:
         -> API Gateway creates route config in gateway.gateway_routes
         -> API Gateway records createdBy and updatedBy
         -> API Gateway returns 201 Created

Admin Client / Future Admin Dashboard
  -> PATCH http://localhost:3000/internal/admin/routes/:id
    -> API Gateway checks x-admin-api-key
    -> API Gateway finds existing non-deleted route by id
    -> If route does not exist or is soft-deleted:
         -> 404 ROUTE_CONFIG_NOT_FOUND
    -> If route exists:
         -> API Gateway merges existing route with patch body
         -> API Gateway maps merged body to DownstreamRouteConfig
         -> API Gateway reuses validateDownstreamRoutes()
         -> API Gateway checks conflict with another active method + gatewayPath
         -> If invalid:
              -> 400 ROUTE_CONFIG_INVALID
         -> If conflict:
              -> 409 ROUTE_CONFIG_ALREADY_EXISTS
         -> If valid:
              -> API Gateway updates route config in gateway.gateway_routes
              -> API Gateway records updatedBy
              -> API Gateway returns 200 OK

Admin Client / Future Admin Dashboard
  -> DELETE http://localhost:3000/internal/admin/routes/:id
    -> API Gateway checks x-admin-api-key
    -> API Gateway finds existing non-deleted route by id
    -> If route does not exist or is already soft-deleted:
         -> 404 ROUTE_CONFIG_NOT_FOUND
    -> If route exists:
         -> API Gateway sets enabled=false
         -> API Gateway sets deleted_at
         -> API Gateway sets deleted_by
         -> API Gateway sets updated_by
         -> API Gateway returns 200 OK with deleted route response

Admin Client / Future Admin Dashboard
  -> POST http://localhost:3000/internal/admin/routes/reload
    -> API Gateway checks x-admin-api-key
    -> API Gateway reads active route configs
    -> API Gateway validates active route configs
    -> API Gateway does not apply runtime changes
    -> API Gateway returns validation-only summary
```

## Route Enable/Disable Runtime Behavior

```txt
PATCH /internal/admin/routes/:id
Body: { "enabled": false }

Result:
  -> Route remains stored in gateway.gateway_routes
  -> Route remains visible through GET /internal/admin/routes if deleted_at IS NULL
  -> API Gateway restart loads only enabled=true and deleted_at IS NULL route configs
  -> Disabled route is not registered as an active runtime route
  -> Client request to disabled route returns 404 Route not found
```

## Route Soft Delete Runtime Behavior

```txt
DELETE /internal/admin/routes/:id

Result:
  -> Route remains stored in gateway.gateway_routes
  -> enabled=false
  -> deleted_at is set
  -> deleted_by is set
  -> updated_by is set
  -> Route is hidden from normal admin list/detail APIs
  -> Route is not loaded as an active runtime route after API Gateway restart
  -> Same method + gatewayPath can be recreated as a new active route
```

## Route Reload Validation Behavior

```txt
POST /internal/admin/routes/reload
Content-Type: application/json
Body: {}

Result:
  -> Validates active route configs
  -> Does not apply runtime changes
  -> Returns mode=validation-only
  -> Returns runtimeApplied=false
  -> Returns requiresRestart=true
```

## Public Health Flow

```txt
Client
  -> GET http://localhost:3000/health
    -> API Gateway creates or reuses x-request-id
    -> API Gateway adds basic security headers
    -> API Gateway applies request size limit
    -> API Gateway returns health response
    -> API Gateway adds x-response-time-ms
    -> API Gateway records Prometheus metrics
    -> API Gateway writes structured access log
```

## Metrics Flow

```txt
Prometheus
  -> GET http://api-gateway:3000/metrics
    -> API Gateway returns Prometheus text format
    -> Prometheus stores time-series metrics
    -> Grafana reads metrics from Prometheus datasource
```

## CI Flow

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

# 13. Current Environment Variables

## API Gateway

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
DATABASE_URL=postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway
```

Important note:

```txt
API Gateway DATABASE_URL is used by Prisma.
It is not currently parsed through apps/api-gateway/src/config/env.ts.
```

Docker internal values:

```txt
PRODUCT_SERVICE_URL=http://product-service:3001
REDIS_URL=redis://redis:6379
DATABASE_URL=postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate?schema=gateway
ADMIN_API_KEY_HEADER=x-admin-api-key
ADMIN_API_KEY=local-admin-key
```

## Product Service

```txt
PORT=3001
HOST=0.0.0.0
DATABASE_URL=postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate
```

Docker internal value:

```txt
DATABASE_URL=postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate
```

## Observability Internal Values

```txt
Prometheus scrape target=http://api-gateway:3000/metrics
Grafana Prometheus datasource=http://prometheus:9090
```

---

# 14. Main Commands

Run full Docker stack:

```powershell
docker compose up --build -d
```

Check Docker services:

```powershell
docker compose ps
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

Generate Product Service Prisma Client:

```powershell
npm run db:generate -w apps/product-service
```

Seed Product Service database:

```powershell
npm run db:seed -w apps/product-service
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

Expected log:

```txt
Loaded downstream route configs from database { routeCount: 2 }
```

Validate active Gateway route configs:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "SELECT method, gateway_path, enabled, deleted_at FROM gateway.gateway_routes WHERE deleted_at IS NULL ORDER BY priority, gateway_path;"
```

Expected active result:

```txt
GET /api/products
GET /api/product-service/health
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
mode = validation-only
runtimeApplied = false
requiresRestart = true
routeCount = 2
```

Test protected Product route:

```powershell
$token = node --input-type=module -e "import { SignJWT } from 'jose'; const secretKey = new TextEncoder().encode('local-dev-jwt-secret-change-me'); const expiresAt = Math.floor(Date.now() / 1000) + 900; const token = await new SignJWT({ role: 'user' }).setProtectedHeader({ alg: 'HS256' }).setSubject('user_123').setIssuer('pulsegate-api-gateway').setAudience('pulsegate-clients').setExpirationTime(expiresAt).sign(secretKey); console.log(token);"

$headers = @{
  "x-api-key" = "dev-api-key"
  "authorization" = "Bearer $token"
}

Invoke-WebRequest http://localhost:3000/api/products `
  -Headers $headers `
  -UseBasicParsing
```

Test Redis:

```powershell
docker compose exec redis redis-cli ping
```

Expected Redis result:

```txt
PONG
```

---

# 15. Automated Test Status

Current test framework:

```txt
Vitest
```

Current test result:

```txt
27 test files passed
176 tests passed
```

Current important test areas:

* Request ID middleware.
* Access log middleware.
* API key authentication.
* Admin API key authentication.
* JWT authentication.
* Metrics middleware.
* Rate limit stores.
* Rate limit middleware.
* Redis response cache store.
* Request size limit.
* Security headers.
* Downstream service errors.
* Environment config parsing.
* Downstream route config.
* Multi-route downstream config.
* Route config validation.
* Database route config mapper.
* Runtime route config loader and fallback.
* Route management API behavior.
* Route config soft delete behavior.
* Route reload validation behavior.
* Metrics registry.
* Metrics route.
* Timeout policy.
* Cache policy.
* Rate limit policy.
* Request transform policy.
* Response transform policy.
* Retry policy.
* API Gateway integration flow.

Current integration test coverage:

* `GET /health` returns `200 OK`.
* `GET /api/product-service/health` returns `200 OK`.
* `GET /api/product-service/health` does not require API key.
* `GET /api/product-service/health` does not require JWT.
* `GET /api/product-service/health` returns `x-cache: BYPASS`.
* `GET /api/product-service/health` includes `x-request-id`.
* `GET /api/product-service/health` includes `x-response-time-ms`.
* `GET /api/product-service/health` does not return rate limit headers.
* `GET /metrics` returns Prometheus text format.
* Oversized request returns `413 REQUEST_BODY_TOO_LARGE`.
* Missing API key returns `401 API_KEY_MISSING`.
* Invalid API key returns `403 API_KEY_INVALID`.
* Missing JWT returns `401 JWT_TOKEN_MISSING`.
* Invalid JWT returns `403 JWT_TOKEN_INVALID`.
* Valid protected request returns `200`.
* Cache MISS then HIT behavior works.
* Rate limit exceeded returns `429 TOO_MANY_REQUESTS`.
* Downstream unavailable returns `503`.
* Downstream 500 returns `502`.
* Downstream invalid JSON returns `502`.
* Downstream timeout returns `504`.

Sprint 8 test coverage:

* Database route records map to runtime `DownstreamRouteConfig`.
* Disabled DB routes are filtered out.
* Enabled DB routes are sorted by priority.
* Invalid transform JSON is rejected.
* Invalid retry status JSON is rejected.
* Mapped route configs are validated.
* Runtime loader uses DB configs when DB loading succeeds.
* Runtime loader falls back to static configs when DB returns no routes.
* Runtime loader falls back to static configs when DB loading fails.

Sprint 9 test coverage:

* Default admin API key env config is exposed.
* Custom admin API key env config is exposed.
* `GET /internal/admin/routes` returns `401` when admin API key is missing.
* `GET /internal/admin/routes` returns `403` when admin API key is invalid.
* `GET /internal/admin/routes` returns route configs with valid admin API key.
* `GET /internal/admin/routes/:id` returns route config detail.
* `GET /internal/admin/routes/:id` returns `404` when route config does not exist.
* `POST /internal/admin/routes` creates route config.
* `POST /internal/admin/routes` returns `400` for invalid route config.
* `POST /internal/admin/routes` returns `409` for duplicate route config.
* `PATCH /internal/admin/routes/:id` updates route config.
* `PATCH /internal/admin/routes/:id` returns `404` when route config does not exist.
* `PATCH /internal/admin/routes/:id` returns `400` for invalid merged route config.
* `PATCH /internal/admin/routes/:id` returns `409` for duplicate route conflict.
* `PATCH /internal/admin/routes/:id` returns `401` when admin API key is missing.

Sprint 10 test coverage:

* `DELETE /internal/admin/routes/:id` soft deletes a route config.
* Soft delete sets route lifecycle fields.
* Soft delete hides route from admin list API.
* Soft delete makes detail API return `404`.
* Soft delete returns `404` for missing route.
* Soft delete requires admin API key.
* Runtime DB route mapper/repository excludes deleted routes.
* Duplicate checks ignore soft-deleted routes.
* `POST /internal/admin/routes/reload` validates route configs.
* Reload validation returns `mode=validation-only`.
* Reload validation returns `runtimeApplied=false`.
* Reload validation returns `requiresRestart=true`.
* Reload validation requires admin API key.
* Reload validation rejects invalid admin API key.

---

# 16. Sprint Definitions of Done

## Sprint 0 Definition of Done

Sprint 0 is done when the basic monorepo, API Gateway, Product Service, proxy flow, health endpoints, request ID, logging, error handlers, docs, typecheck, build, and GitHub push are complete.

Current Sprint 0 status:

```txt
Done
```

## Sprint 1 Definition of Done

Sprint 1 is done when downstream error normalization, downstream timeout, route config, API key auth, JWT auth, unit tests, integration tests, typecheck, build, and GitHub push are complete.

Current Sprint 1 status:

```txt
Done
```

## Sprint 2 Definition of Done

Sprint 2 is done when rate limiting, request size limit, security headers, route-level auth config, traffic protection tests, typecheck, build, and GitHub push are complete.

Current Sprint 2 status:

```txt
Done
```

## Sprint 3 Definition of Done

Sprint 3 is done when Docker Compose, PostgreSQL, Prisma, database-backed Product Service data, Redis-backed rate limiting, Redis response caching, Docker validation, tests, typecheck, build, and GitHub push are complete.

Current Sprint 3 status:

```txt
Done
```

## Sprint 4 Definition of Done

Sprint 4 is done when structured access logs, response time header, metrics, `/metrics`, Prometheus, Grafana, dashboard provisioning, tests, typecheck, build, Docker validation, and GitHub push are complete.

Current Sprint 4 status:

```txt
Done
```

## Sprint 5 Definition of Done

Sprint 5 is done when route policy foundation, route config validation, per-route timeout/cache/rate-limit helpers, request/response transform foundations, retry foundation, policy tests, integration tests, typecheck, build, Docker validation, and GitHub push are complete.

Current Sprint 5 status:

```txt
Done
```

## Sprint 6 Definition of Done

Sprint 6 is done when GitHub Actions CI workflow, push/PR triggers, Node.js 20 setup, `npm ci`, Prisma Client generation, tests, typecheck, build, Docker image build validation, README CI badge, final local validation, Docker Compose validation, final docs, and GitHub push are complete.

Current Sprint 6 status:

```txt
Done
```

## Sprint 7 Definition of Done

Sprint 7 is done when the Gateway can register multiple downstream routes from static route config, the generic downstream proxy route foundation exists, the existing protected Product route remains stable, a new public Product Service health proxy route is added, tests pass, typecheck passes, build passes, Docker runtime validation passes, final docs are updated, and GitHub push is complete.

Current Sprint 7 status:

```txt
Done
```

## Sprint 8 Definition of Done

Sprint 8 is done when API Gateway route config is persisted in PostgreSQL, API Gateway can load route config from database at startup, static fallback is preserved, seeded routes match the current stable Gateway routes, mapper and loader tests pass, typecheck passes, build passes, Docker runtime validation confirms DB route loading, final docs are updated, and GitHub push is complete.

Current Sprint 8 status:

```txt
Done
```

## Sprint 9 Definition of Done

Sprint 9 is done when internal/admin route management APIs exist, admin API key authentication protects them, route configs can be listed, read, created, and updated, route configs can be enabled or disabled through PATCH, validation runs before persistence, duplicate route conflicts are rejected, route management tests pass, typecheck passes, build passes, Docker runtime validation confirms create/update/disable behavior, final docs are updated, and GitHub push is complete.

Current Sprint 9 status:

```txt
Done
```

## Sprint 10 Definition of Done

Sprint 10 is done when route management hardening is complete, route configs support soft delete, lifecycle metadata is recorded, soft-deleted routes are excluded from admin reads and runtime loading, active-route partial unique index supports recreate-after-soft-delete, reload validation endpoint exists, tests pass, typecheck passes, build passes, Docker runtime validation confirms soft delete and reload validation behavior, final docs are updated, and GitHub push is complete.

Current Sprint 10 status:

```txt
Technical implementation complete
Final documentation update in progress
```

---

# 17. Future Requirements

## Future FR: True Runtime Route Reload

Planned features:

* Apply route config changes without restarting API Gateway.
* Keep reload safe and validated.
* Avoid duplicate route registration issues.
* Decide whether reload is manual, admin-triggered, or periodic.
* Preserve static fallback behavior.
* Define behavior for changed route cache keys and rate limit keys.
* Add tests for successful reload and failed reload.

Current related feature:

```txt
POST /internal/admin/routes/reload exists as validation-only.
It does not apply runtime changes yet.
```

Status:

```txt
Planned for later sprint
```

---

## Future FR: Route Management Audit Log

Planned features:

* Track who changed route configs.
* Track route config create, update, enable, disable, delete, and reload validation operations.
* Store previous and new values where useful.
* Prepare Admin Dashboard history view.
* Prepare production troubleshooting behavior.

Current related feature:

```txt
Route lifecycle metadata exists:
created_by
updated_by
deleted_at
deleted_by

This is not a full audit log table yet.
```

Status:

```txt
Planned for later sprint
```

---

## Future FR: Stronger Admin Authentication

Planned features:

* Replace or extend local admin API key with stronger admin auth.
* Add admin user model if needed.
* Add role-based authorization.
* Protect admin operations more strictly.
* Prepare Admin Dashboard login flow.

Status:

```txt
Planned for later sprint
```

---

## Future FR: Service Registry Foundation

Planned features:

* Register downstream services.
* Store service name, base URL, health path, and status.
* Connect route configs to service records.
* Prepare service discovery behavior.

Status:

```txt
Planned for later sprint
```

---

## Future FR: API Consumer Database

Planned features:

* Store API consumers in database.
* Link API keys to consumers.
* Track consumer status.
* Prepare for API key lifecycle.

Status:

```txt
Planned for later sprint
```

---

## Future FR: API Key Lifecycle

Planned features:

* Create API keys.
* Revoke API keys.
* Rotate API keys.
* Hash API keys before storage.
* Associate API keys with consumers.
* Track key status and metadata.

Status:

```txt
Planned for later sprint
```

---

## Future FR: Usage Plans and Quotas

Planned features:

* Define usage plans.
* Attach consumers to plans.
* Enforce quota limits.
* Track usage per consumer and route.
* Prepare billing-like API management behavior.

Status:

```txt
Planned for later sprint
```

---

## Future FR: OpenAPI Documentation

Planned features:

* Add OpenAPI spec foundation.
* Document Gateway routes.
* Document developer-facing APIs.
* Prepare Developer Portal API docs.

Status:

```txt
Planned for later sprint
```

---

## Future FR: Distributed Tracing

Planned features:

* OpenTelemetry instrumentation.
* Trace ID propagation.
* Span generation.
* Jaeger or Tempo trace viewer.
* Trace context propagation across Gateway and downstream services.

Status:

```txt
Planned for later sprint
```

---

## Future FR: Centralized Logs

Planned features:

* Loki log aggregation.
* Structured log shipping.
* Grafana log exploration.
* Request ID correlation between metrics and logs.

Status:

```txt
Planned for later sprint
```

---

## Future FR: Load Testing

Planned features:

* k6 load testing.
* Basic load scenarios.
* Gateway latency and throughput validation.
* Rate limit behavior under load.

Status:

```txt
Planned for later sprint
```

---

## Future FR: Event-Driven Architecture

Planned features:

* Kafka event streaming.
* RabbitMQ background jobs.
* Notification Service.
* Async processing examples.

Status:

```txt
Planned for later sprint
```

---

## Future FR: Admin Dashboard

Planned features:

* View services.
* View routes.
* Create routes.
* Update routes.
* Enable or disable routes.
* Soft delete routes.
* Validate reload status.
* View API consumers.
* View API keys.
* View traffic metrics.
* View logs and status.
* Manage route policies later.

Status:

```txt
Planned for later sprint after backend route management is stable
```

---

## Future FR: Developer Portal

Planned features:

* API documentation.
* API key request flow.
* Usage overview.
* Developer onboarding.

Status:

```txt
Planned for later sprint
```

---

## Future FR: Kubernetes Deployment

Planned features:

* Kubernetes manifests.
* Service deployments.
* ConfigMaps.
* Secrets.
* Ingress.
* Horizontal scaling examples.

Status:

```txt
Planned for later sprint
```

---

# 18. Recommended Next Step

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

After Sprint 10 final documentation update, run:

```powershell
npm run test
npm run typecheck
npm run build
git status
```

Then commit docs:

```powershell
git add README.md docs/architecture/overview.md docs/project-context/AI_HANDOFF.md docs/project-context/CURRENT_PROGRESS.md docs/project-context/DECISION_LOG.md docs/sdlc/requirements.md

git commit -m "docs: finalize sprint 10 documentation"

git push
```

After Sprint 10 documentation is committed, move to:

```txt
Sprint 11 - Controlled Route Reload or Route Management Audit Foundation
```

Recommended Sprint 11 direction:

1. Controlled true runtime route reload if the next goal is runtime behavior.
2. Route management audit log table if the next goal is admin/audit hardening.
3. Stronger admin authentication foundation if the next goal is security.
4. Admin Dashboard foundation only after backend route management hardening remains stable.

Do not add these before they are explicitly selected as a planned sprint:

* Kafka
* RabbitMQ
* Kubernetes
* Admin Dashboard UI
* Developer Portal UI
* Advanced OpenTelemetry tracing
* Loki centralized logs
* k6 load testing
* Docker image registry push
* Production cloud deployment
