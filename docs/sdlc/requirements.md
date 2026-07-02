# PulseGate Requirements

## 1. Project Name

PulseGate - High-Traffic API Gateway & Observability Platform

## 2. Current Version

```txt
v0.12.0
```

## 3. Current Sprint

```txt
Sprint 11 - Route Runtime Reload / Admin Hardening Foundation
```

## 4. Sprint Status

```txt
Sprint 11 technical implementation is complete.
Sprint 11 final documentation update is in progress.
Sprint 0 through Sprint 10 are complete.
```

Current automated test status:

```txt
28 test files passed
189 tests passed
```

Current validation status:

```txt
npm run test       -> passed
npm run typecheck  -> passed
npm run build      -> passed
Docker runtime validation -> passed
GitHub Actions CI -> passing
```

---

## 5. Project Purpose

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
* Database-backed Product Service data.
* Database-backed Gateway route configuration.
* Internal/admin route management APIs.
* Route config list, detail, create, update, enable/disable, soft delete, runtime status, and reload behavior.
* Route lifecycle metadata.
* Route config validation before persistence and before runtime registry replacement.
* Active-route duplicate conflict detection.
* Active-route partial unique index for safe recreate-after-delete behavior.
* Runtime route registry for existing registered routes.
* Runtime reload endpoint that refreshes the in-memory route registry.
* Safe static route config fallback at startup.
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

Long-term target:

```txt
Build PulseGate toward a product-like API Gateway/API Management platform, not only a portfolio backend project.
```

Long-term product direction:

* Admin Dashboard.
* Developer Portal.
* API key request flow.
* Dynamic route configuration.
* Runtime route registry.
* Catch-all dynamic router later for brand-new paths without restart.
* Route management APIs.
* Service registry foundation.
* API consumer management.
* Usage plans and quotas.
* Observability stack.
* Kubernetes/cloud deployment later.
* CI/CD.
* Event streaming later.
* Background jobs later.

---

## 6. Target Users

PulseGate is designed for:

* Backend Developers.
* DevOps Engineers.
* SREs.
* Tech Leads.
* Teams that manage multiple APIs or microservices.
* Companies that need a centralized API entry point.

---

## 7. Main Problems

PulseGate aims to solve these problems:

* Clients need one single entry point for multiple backend services.
* Backend services should not be exposed directly to external clients.
* Requests need to be routed to the correct downstream service.
* Gateway should support more than one downstream route.
* Public routes and protected routes should behave differently.
* APIs need centralized authentication and authorization.
* Internal/admin APIs need separate protection from consumer API keys.
* APIs need protection from excessive traffic and unsafe payloads.
* Selected responses should be cached to reduce downstream load.
* API traffic should be logged for debugging.
* API latency should be visible during local testing.
* Gateway metrics should be exposed to Prometheus.
* Gateway behavior should be visible through Grafana dashboards.
* Gateway route behavior should be configurable through policies.
* Gateway route configuration should be persisted in PostgreSQL.
* Gateway should load route configuration from database at startup.
* Gateway should keep a safe static fallback when DB route loading fails.
* Gateway route configuration should be manageable through internal/admin APIs.
* Gateway route configuration should support safe soft delete behavior.
* Soft-deleted route configs should remain in the database for historical visibility.
* Soft-deleted route configs should not be visible in normal admin read APIs.
* Soft-deleted route configs should not be loaded as active runtime routes.
* The same `method + gatewayPath` should be reusable after the old route is soft-deleted.
* Existing registered routes should support runtime config refresh without API Gateway restart.
* Brand-new Gateway paths should be clearly marked as requiring restart until catch-all dynamic routing exists.
* Repository health should be validated automatically before the main branch is considered stable.

---

## 8. Current System Overview

Current stable architecture after Sprint 11:

```txt
Client
  -> API Gateway :3000
    -> Startup route config loading
      -> Try PostgreSQL gateway.gateway_routes active records
      -> Active means enabled=true and deleted_at IS NULL
      -> Map database records to DownstreamRouteConfig[]
      -> Validate mapped route configs
      -> Use DB-backed config if valid and non-empty
      -> Fall back to static downstreamRouteConfigs if DB load fails or returns no active routes
    -> Runtime route registry
      -> Holds current in-memory route config snapshot
      -> Snapshot has version, loadedAt, routeCount, and routes
      -> Existing registered routes resolve latest config from registry per request
      -> Registry replacement validates new route configs before swap
      -> Invalid replacement keeps the old snapshot
    -> Request ID handling
    -> Structured access log timer
    -> Metrics timer
    -> Basic security headers
    -> Request size limit
    -> Route policy configuration
    -> Protected Product route: GET /api/products
    -> Public Product Service health proxy route: GET /api/product-service/health
    -> Internal/admin route management APIs
    -> Prometheus metrics
    -> Structured access log

PostgreSQL :5432
  -> public schema
       -> Product Service data
       -> public.products
  -> gateway schema
       -> API Gateway route config
       -> gateway.gateway_routes

Redis :6379
  -> API Gateway rate limit counters
  -> API Gateway response cache payloads

Prometheus :9090
  -> Scrapes API Gateway /metrics

Grafana :3002
  -> Uses Prometheus datasource
  -> Displays PulseGate API Gateway Overview dashboard

GitHub Actions
  -> npm ci
  -> Prisma generate
  -> tests
  -> typecheck
  -> build
  -> Docker image build validation
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

---

## 9. Current Endpoints

Public API Gateway endpoints:

```txt
GET /health
GET /metrics
GET /api/product-service/health
```

Protected API Gateway endpoint:

```txt
GET /api/products
```

Protected endpoint requirements:

```txt
x-api-key: dev-api-key
Authorization: Bearer <jwt-token>
```

Internal/admin API Gateway endpoints:

```txt
GET /internal/admin/routes
GET /internal/admin/routes/runtime
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

---

## 10. Sprint Status Summary

| Sprint | Name | Status |
|---|---|---|
| Sprint 0 | Core Setup & Basic Gateway Flow | Done |
| Sprint 1 | Gateway Core Behavior | Done |
| Sprint 2 | Gateway Traffic Protection | Done |
| Sprint 3 | Data & Infrastructure Foundation | Done |
| Sprint 4 | Observability Foundation | Done |
| Sprint 5 | Advanced Gateway Policies | Done |
| Sprint 6 | CI/CD Foundation | Done |
| Sprint 7 | Multi-Route Gateway Expansion | Done |
| Sprint 8 | Dynamic Route Config from Database | Done |
| Sprint 9 | Route Management API Foundation | Done |
| Sprint 10 | Route Management Hardening | Done |
| Sprint 11 | Route Runtime Reload / Admin Hardening Foundation | Technical implementation complete |

Sprint 11 completed:

* Added runtime route registry foundation.
* Added in-memory route config snapshot with version metadata.
* Added safe registry replacement with validation.
* Added runtime lookup by method and gateway path.
* Updated registered downstream routes to resolve latest route config from registry per request.
* Updated pre-handler policy resolution to use latest registry config.
* Added runtime registry status endpoint.
* Updated reload endpoint from validation-only to runtime registry refresh.
* Kept scope explicit: existing registered routes can refresh at runtime; brand-new paths still require restart.
* Added tests for runtime registry behavior.
* Updated app tests for runtime registry behavior.
* Validated Docker runtime by disabling and re-enabling an existing registered route without API Gateway restart.

---

# 11. Functional Requirements

## FR-001: API Gateway Service

The system must have an API Gateway service.

Acceptance criteria:

* API Gateway runs on port `3000`.
* API Gateway uses Fastify and TypeScript.
* API Gateway has JSON logging enabled.
* API Gateway exposes public, protected, and internal/admin endpoints.
* API Gateway can run locally and through Docker Compose.
* API Gateway Docker image can be built in CI.
* API Gateway can generate Prisma Client in CI and inside Docker image.

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
* Product Service can run locally and through Docker Compose.
* Product Service Docker image can be built in CI.

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
* Product route behavior is driven by route policy configuration.
* Product route requires API key and JWT.
* Product route uses Redis-backed rate limiting.
* Product route uses Redis response caching.
* Product route can be loaded from database route config.
* Product route can be refreshed at runtime through registry reload because it is an existing registered path.

Status:

```txt
Done
```

---

## FR-004: Public Product Service Health Proxy Route

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
* Route can be loaded from database route config.
* Route can be refreshed at runtime through registry reload because it is an existing registered path.

Status:

```txt
Done
```

---

## FR-005: Request ID

The system must support request ID generation and propagation.

Acceptance criteria:

* API Gateway creates a request ID if the client does not provide one.
* API Gateway reuses `x-request-id` if the client provides one.
* API Gateway returns `x-request-id` in response headers.
* API Gateway forwards `x-request-id` to Product Service.
* Product Service reuses the request ID from API Gateway.
* Error responses include request ID.
* Structured access logs include request ID.

Status:

```txt
Done
```

---

## FR-006: Authentication and Authorization

API Gateway must support route-level authentication behavior.

Acceptance criteria:

* Protected routes can require API key.
* Protected routes can require JWT.
* Public routes can disable API key and JWT requirements.
* Missing API key returns `401 API_KEY_MISSING`.
* Invalid API key returns `403 API_KEY_INVALID`.
* Missing Bearer token returns `401 JWT_TOKEN_MISSING`.
* Invalid token returns `403 JWT_TOKEN_INVALID`.
* JWT validation checks signature, issuer, audience, and expiration.
* Verified JWT payload is attached to `request.jwtPayload`.
* DB route config supports API key and JWT requirement fields.
* Internal/admin APIs use admin API key instead of consumer API key/JWT.

Status:

```txt
Done
```

---

## FR-007: Admin API Key Authentication

API Gateway must protect internal/admin APIs with a separate admin API key.

Acceptance criteria:

* API Gateway supports `ADMIN_API_KEY_HEADER`.
* API Gateway supports `ADMIN_API_KEY`.
* Default local admin API key header is `x-admin-api-key`.
* Default local admin API key is `local-admin-key`.
* Missing admin API key returns `401 ADMIN_API_KEY_MISSING`.
* Invalid admin API key returns `403 ADMIN_API_KEY_INVALID`.
* Valid admin API key allows request to continue to route management behavior.
* Consumer `x-api-key` is not used for internal/admin route management APIs.
* Admin API key variables are documented in `.env.example`.

Status:

```txt
Done
```

---

## FR-008: Traffic Protection

API Gateway must protect selected routes from excessive traffic and unsafe payloads.

Acceptance criteria:

* API Gateway supports Redis-backed rate limiting.
* Product route is rate limited by API key, HTTP method, and route path.
* Rate limit exceeded returns `429 TOO_MANY_REQUESTS`.
* API Gateway returns rate limit headers.
* Product Service is not called for blocked requests.
* Redis commands fail fast when Redis is unavailable.
* Redis internal errors are not exposed.
* API Gateway rejects oversized request bodies with `413 REQUEST_BODY_TOO_LARGE`.
* API Gateway adds basic HTTP security headers globally.
* Public health proxy route disables product route rate limiting through policy.

Status:

```txt
Done
```

---

## FR-009: Redis Response Caching

API Gateway must cache selected downstream responses in Redis.

Acceptance criteria:

* API Gateway stores product responses in Redis.
* API Gateway reads product responses from Redis.
* Cache MISS returns `x-cache: MISS`.
* Cache HIT returns `x-cache: HIT`.
* Cache BYPASS is supported.
* Product Service is not called on cache HIT.
* Cache write failure does not fail a valid downstream response.
* Product Service down + cache HIT returns cached response.
* Product Service down + cache MISS returns normalized downstream error.
* Public health proxy route disables cache through policy.

Status:

```txt
Done
```

---

## FR-010: Downstream Error Normalization

API Gateway must return clean and consistent errors when downstream services fail.

Acceptance criteria:

* Product Service unavailable returns `503 DOWNSTREAM_SERVICE_UNAVAILABLE`.
* Product Service timeout returns `504 DOWNSTREAM_TIMEOUT`.
* Product Service 5xx response returns `502 DOWNSTREAM_HTTP_ERROR`.
* Product Service invalid JSON returns `502 DOWNSTREAM_INVALID_RESPONSE`.
* Error response includes request ID.
* Raw runtime errors are not exposed.

Status:

```txt
Done
```

---

## FR-011: PostgreSQL and Prisma

PulseGate must use PostgreSQL and Prisma for persistent data.

Acceptance criteria:

* Product Service owns product data in PostgreSQL `public` schema.
* API Gateway owns route config data in PostgreSQL `gateway` schema.
* Product Service has Prisma schema, migration, and seed script.
* API Gateway has Prisma schema, migrations, and seed script.
* Product Service Prisma Client can be generated locally and in CI.
* API Gateway Prisma Client can be generated locally, in CI, and inside Docker image.

Status:

```txt
Done
```

---

## FR-012: Database-Backed Gateway Route Configuration

API Gateway must support loading downstream route configuration from PostgreSQL.

Acceptance criteria:

* API Gateway route config is stored in `gateway.gateway_routes`.
* Gateway route config supports method, gateway path, downstream URL, enabled flag, priority, policies, and lifecycle metadata.
* Gateway route config supports active route uniqueness through a partial unique index on `method + gateway_path` where `deleted_at IS NULL`.
* Database records can be mapped to runtime `DownstreamRouteConfig[]`.
* Mapped route configs are validated before use.
* API Gateway loads DB route config at startup.
* API Gateway uses DB route config when loading succeeds and active routes exist.
* API Gateway loads only `enabled=true` and `deleted_at IS NULL` records as active startup routes.
* API Gateway falls back to static route config when DB loading fails or returns no active routes.

Status:

```txt
Done
```

---

## FR-013: Policy-Driven Gateway Behavior

API Gateway must support policy-driven route behavior.

Acceptance criteria:

* Route config contains a `policies` object.
* Policy model includes auth, timeout, cache, rate limit, request transform, response transform, and retry.
* Route config is validated.
* Product route uses policy helpers.
* Product Service health proxy route uses policy config.
* Policy helpers are unit tested.
* Policy behavior is covered by integration tests.
* Policy behavior can be mapped from database route config records.
* Route management APIs reuse route validation before persistence and reload validation.

Status:

```txt
Done
```

---

## FR-014: Route Management APIs

API Gateway must expose internal/admin APIs to manage route config records.

Acceptance criteria:

* `GET /internal/admin/routes` exists.
* `GET /internal/admin/routes/:id` exists.
* `POST /internal/admin/routes` exists.
* `PATCH /internal/admin/routes/:id` exists.
* `DELETE /internal/admin/routes/:id` exists.
* All route management APIs require admin API key.
* List/detail endpoints exclude soft-deleted routes.
* Create/update endpoints validate route config through `validateDownstreamRoutes()`.
* Create/update endpoints reject duplicate active `method + gatewayPath` conflicts.
* PATCH can enable or disable route configs.
* DELETE performs soft delete instead of hard delete.
* Route management behavior is covered by tests.

Status:

```txt
Done
```

---

## FR-015: Route Config Soft Delete and Lifecycle Metadata

API Gateway must support safe route config deletion and metadata tracking.

Acceptance criteria:

* `DELETE /internal/admin/routes/:id` soft deletes a route config.
* Soft delete sets `enabled=false`.
* Soft delete sets `deleted_at`.
* Soft delete sets `deleted_by`.
* Soft delete sets `updated_by`.
* Create can set `created_by` and `updated_by`.
* Update can set `updated_by`.
* Route management responses include `createdBy`, `updatedBy`, `deletedAt`, and `deletedBy`.
* `x-admin-actor` is used as a basic attribution source.
* Fallback actor is `admin-api-key`.
* Soft-deleted routes are excluded from admin list/detail, runtime loading, and duplicate checks.

Status:

```txt
Done
```

---

## FR-016: Active Route Partial Unique Index

Gateway route config must enforce uniqueness only for active non-deleted route identities.

Acceptance criteria:

* Full unique constraint on `method + gateway_path` is removed.
* PostgreSQL partial unique index exists on `method + gateway_path` where `deleted_at IS NULL`.
* Two active non-deleted routes cannot share the same `method + gateway_path`.
* A soft-deleted route does not block creating a new active route with the same `method + gateway_path`.
* Route management duplicate checks match the database uniqueness strategy.
* Recreate-after-soft-delete behavior is validated in Docker runtime.

Status:

```txt
Done
```

---

## FR-017: Runtime Route Registry

API Gateway must maintain a runtime route config registry for registered routes.

Acceptance criteria:

* Runtime registry has a current route snapshot.
* Snapshot includes `version`, `loadedAt`, `routeCount`, and `routes`.
* Registry can return current snapshot.
* Registry can find route config by method and gateway path.
* Registry can replace routes only after validation succeeds.
* Invalid replacement must keep the old snapshot.
* Existing registered route handlers must resolve latest config from registry per request.
* Existing registered route pre-handlers must also resolve latest policy config from registry per request.
* Registry behavior is covered by tests.

Status:

```txt
Done
```

---

## FR-018: Runtime Registry Status API

API Gateway must expose internal/admin API for current runtime route registry status.

Acceptance criteria:

* `GET /internal/admin/routes/runtime` exists.
* Endpoint requires admin API key.
* Endpoint returns current registry snapshot metadata.
* Endpoint returns current route count.
* Endpoint returns current registered runtime route summary.
* Endpoint is useful for confirming whether reload changed runtime registry state.

Status:

```txt
Done
```

---

## FR-019: Route Reload Runtime Registry Refresh

API Gateway must expose a reload endpoint that refreshes the runtime registry for existing registered routes.

Acceptance criteria:

* `POST /internal/admin/routes/reload` exists.
* Endpoint requires admin API key.
* Endpoint reads active DB route configs.
* Endpoint maps DB records to runtime route config.
* Endpoint validates mapped route configs before replacing registry snapshot.
* Endpoint replaces runtime registry snapshot only when validation succeeds.
* Endpoint returns `mode: runtime-registry-refresh`.
* Endpoint returns `registryAvailable: true`.
* Endpoint returns `registryApplied: true` on successful replacement.
* Endpoint returns `runtimeApplied: true` for existing registered route config refresh.
* Endpoint returns `runtimeScope: registered-routes-only`.
* Endpoint returns `newRoutesRequireRestart: true`.
* Endpoint returns `requiresRestart: true` because brand-new paths are not registered yet.
* Endpoint returns version metadata.
* Reload behavior is covered by tests.
* Reload behavior is validated in Docker runtime.

Status:

```txt
Done
```

---

## FR-020: Automated Tests

The project must include automated tests for Gateway behavior.

Acceptance criteria:

* Tests can be run with `npm run test`.
* API Gateway can be tested with `app.inject()`.
* Unit tests cover middleware and policy helper behavior.
* Integration tests cover protected route behavior.
* Integration tests cover public multi-route behavior.
* DB route config mapper and runtime loader behavior are covered by tests.
* Route management API behavior is covered by tests.
* Soft delete behavior is covered by tests.
* Runtime route registry behavior is covered by tests.
* Runtime reload behavior is covered by tests.
* Test, typecheck, and build pass before stable commits.

Current test status:

```txt
28 test files passed
189 tests passed
```

Status:

```txt
Done
```

---

## FR-021: GitHub Actions CI/CD Foundation

The project must support automated CI validation through GitHub Actions.

Acceptance criteria:

* Repository has a GitHub Actions workflow file.
* CI runs on push to `main`.
* CI runs on pull request to `main`.
* CI uses Node.js 20.
* CI installs dependencies with `npm ci`.
* CI generates Product Service Prisma Client.
* CI generates API Gateway Prisma Client.
* CI runs automated tests.
* CI runs TypeScript typecheck.
* CI runs production build.
* CI validates API Gateway Docker image build.
* CI validates Product Service Docker image build.
* CI status is visible through README badge.

Status:

```txt
Done
```

---

# 12. Non-Functional Requirements

## NFR-001: Local First

The project must run locally before cloud deployment.

Acceptance criteria:

* API Gateway can run locally.
* Product Service can run locally.
* PostgreSQL, Redis, Prometheus, and Grafana run through Docker Compose.
* No paid cloud infrastructure is required.
* Developer can validate protected, public, and internal/admin Gateway routes locally.

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

* API Gateway separates app building, config, routes, middlewares, errors, Redis client, cache stores, rate limit stores, policy helpers, observability code, tests, database helpers, route config mapper, runtime route loader, runtime route registry, route management module, and server startup.
* Product Service separates config, database helper, repositories, routes, middlewares, Prisma files, and server startup.
* Prometheus and Grafana config are under `observability`.
* CI workflow is under `.github/workflows`.

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
* Runtime route registry is typed.
* Product Service and API Gateway Prisma Clients can be generated.

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
* Middleware, policy helpers, metrics helpers, route config mapper, runtime config loader, runtime route registry, route management APIs, and route behavior are covered by tests.

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
* API Gateway can fall back to static route config when DB route config loading fails.
* Runtime registry replacement does not apply invalid route configs.
* Invalid reload attempt keeps the old runtime registry snapshot.

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
* Different routes can use different policy combinations.
* Database route config can be mapped to the same route policy model.
* Runtime reload uses the same validation model before registry replacement.

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
* CI does not deploy automatically yet.

Status:

```txt
Done
```

---

## NFR-011: Backward Compatibility During Refactor

Refactors should preserve existing stable Gateway behavior.

Acceptance criteria:

* Existing `GET /api/products` behavior remains stable after multi-route, DB route config, route management, soft delete, and runtime registry reload changes.
* Existing API key behavior remains unchanged.
* Existing JWT behavior remains unchanged.
* Existing Redis-backed rate limit behavior remains unchanged.
* Existing Redis cache behavior remains unchanged.
* Existing downstream error behavior remains unchanged.
* Existing tests continue passing.

Status:

```txt
Done
```

---

## NFR-012: Safe Dynamic Config Rollout

Database-backed Gateway route config must be introduced safely.

Acceptance criteria:

* API Gateway uses DB route config when available.
* API Gateway falls back to static route config when DB loading fails or returns zero active routes.
* DB route records are mapped and validated before route registration.
* Only active routes are loaded from DB.
* Active means `enabled=true` and `deleted_at IS NULL`.
* Startup behavior remains safe.

Status:

```txt
Done
```

---

## NFR-013: Safe Runtime Registry Reload

Runtime route config reload must be safe and explicit.

Acceptance criteria:

* Reload endpoint validates DB route configs before registry replacement.
* Registry replacement is atomic from the app perspective.
* Invalid replacement keeps old snapshot.
* Existing registered paths can reflect config changes after reload.
* Brand-new paths still require restart until catch-all dynamic routing is implemented.
* Reload response clearly reports runtime scope and restart requirement.

Status:

```txt
Done
```

---

# 13. Current System Constraints

Current constraints after Sprint 11:

* API Gateway currently proxies only Product Service, but supports more than one Gateway route.
* Current startup route configs are loaded from PostgreSQL when available.
* Startup DB route loading only loads `enabled=true` and `deleted_at IS NULL` routes.
* Static code-based route configs still exist as startup fallback.
* Route configuration is database-backed and manageable through internal/admin APIs.
* Runtime route registry can refresh config for existing registered routes.
* Existing registered paths can be enabled, disabled, or policy-updated through reload without restart.
* Brand-new Gateway paths still require API Gateway restart because Fastify routes for new paths are not registered yet.
* There is no catch-all dynamic router yet.
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
* Request and response transformation foundations support headers only.
* Retry foundation exists, but retry is disabled by default for current routes.
* Redis failure currently causes protected product route to return generic `500`.
* `/metrics` is public in local development.
* Prometheus and Grafana are local Docker services only.
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

# 14. Current Runtime Behavior

## 14.1 Startup Route Config Loading

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
    -> If DB loading fails or returns zero active routes:
         -> Use static downstreamRouteConfigs fallback
  -> Create runtime route registry from resolved startup routes
  -> buildApiGatewayApp({ routeConfigs, routeRuntimeRegistry })
  -> Register /health
  -> Register /metrics
  -> Register internal/admin route management APIs
  -> Register downstream proxy routes
  -> Connect Redis
  -> Listen on port 3000
```

## 14.2 Runtime Registry Reload

```txt
Admin Client
  -> POST /internal/admin/routes/reload
    -> API Gateway checks x-admin-api-key
    -> API Gateway loads active DB route configs
    -> API Gateway maps records to DownstreamRouteConfig[]
    -> API Gateway validates mapped configs
    -> If valid:
         -> replace runtime registry snapshot
         -> existing registered routes use the new config on next request
    -> If invalid:
         -> keep old registry snapshot
         -> return validation failure
```

Current runtime reload scope:

```txt
registered-routes-only
```

Meaning:

```txt
Existing Fastify-registered paths can refresh config at runtime.
Brand-new paths still require API Gateway restart.
```

## 14.3 Protected Product Flow

```txt
Client
  -> GET /api/products
    -> Existing registered route resolves latest config from runtime registry
    -> API key authentication
    -> Redis-backed rate limit
    -> JWT authentication
    -> Redis response cache
    -> Product Service /products on cache MISS
    -> x-cache and x-response-time-ms response headers
    -> Prometheus metrics
    -> Structured access log
```

## 14.4 Public Health Proxy Flow

```txt
Client
  -> GET /api/product-service/health
    -> Existing registered route resolves latest config from runtime registry
    -> No API key
    -> No JWT
    -> No Redis-backed rate limit
    -> No Redis response cache
    -> Product Service /health
    -> x-cache: BYPASS
    -> x-response-time-ms
    -> Prometheus metrics
    -> Structured access log
```

## 14.5 Internal Admin Route Management Flow

```txt
Admin Client
  -> /internal/admin/routes*
    -> x-admin-api-key required
    -> Optional x-admin-actor
    -> Route management repository
    -> PostgreSQL gateway.gateway_routes
    -> Validation before persistence
    -> Runtime registry status and reload APIs
```

---

# 15. Current Environment Variables

API Gateway:

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

Docker internal values:

```txt
PRODUCT_SERVICE_URL=http://product-service:3001
REDIS_URL=redis://redis:6379
DATABASE_URL=postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate?schema=gateway
ADMIN_API_KEY_HEADER=x-admin-api-key
ADMIN_API_KEY=local-admin-key
```

Product Service:

```txt
PORT=3001
HOST=0.0.0.0
DATABASE_URL=postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate
```

Observability internal values:

```txt
Prometheus scrape target=http://api-gateway:3000/metrics
Grafana Prometheus datasource=http://prometheus:9090
```

---

# 16. Main Commands

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

Validate runtime registry status:

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes/runtime `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } |
  ConvertTo-Json -Depth 10
```

Reload runtime registry:

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes/reload `
  -Method POST `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } `
  -ContentType "application/json" `
  -Body "{}" |
  ConvertTo-Json -Depth 10
```

Expected reload result:

```txt
mode = runtime-registry-refresh
registryAvailable = true
registryApplied = true
runtimeApplied = true
runtimeScope = registered-routes-only
newRoutesRequireRestart = true
requiresRestart = true
```

---

# 17. Definition of Done

## Sprint 11 Definition of Done

Sprint 11 is done when:

* Runtime route registry exists.
* Registry snapshot supports version metadata.
* Registry can find route config by method and path.
* Registry can replace routes safely after validation.
* Invalid replacement keeps old snapshot.
* Downstream proxy resolves latest route config from registry per request.
* Pre-handler route policy resolution also uses latest registry config.
* `GET /internal/admin/routes/runtime` exists and requires admin API key.
* `POST /internal/admin/routes/reload` refreshes runtime registry for existing registered routes.
* Reload response clearly states registered-route-only scope.
* New paths are explicitly documented as requiring restart.
* Tests pass.
* Typecheck passes.
* Build passes.
* Docker runtime validation passes.
* Sprint 11 documentation is updated.
* GitHub push is complete.

Current Sprint 11 status:

```txt
Technical implementation complete
Final documentation update in progress
```

---

# 18. Future Requirements

## Future FR: Catch-All Dynamic Router

Planned features:

* Register a generic catch-all route once.
* Match incoming requests against runtime route registry.
* Allow brand-new Gateway paths to work after reload without API Gateway restart.
* Keep route validation and registry replacement safe.
* Preserve existing route policy behavior.
* Add tests for new-path runtime activation.

Status:

```txt
Recommended Sprint 12 direction
```

---

## Future FR: Route Management Audit Log

Planned features:

* Track route create, update, enable, disable, delete, reload, and failed reload events.
* Store actor, timestamp, action, route id, and useful snapshots.
* Prepare Admin Dashboard history view.

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

## Future FR: API Consumer, API Key Lifecycle, and Usage Plans

Planned features:

* Store API consumers in database.
* Store and hash API keys.
* Revoke and rotate API keys.
* Define usage plans.
* Enforce quotas.
* Track usage per consumer and route.

Status:

```txt
Planned for later sprint
```

---

## Future FR: Admin Dashboard

Planned features:

* View routes.
* Create routes.
* Update routes.
* Enable or disable routes.
* Soft delete routes.
* Validate runtime reload status.
* View registry status.
* View API consumers and API keys later.
* View traffic metrics later.

Status:

```txt
Planned for later sprint after backend route lifecycle remains stable
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

## Future FR: Advanced Observability

Planned features:

* OpenTelemetry instrumentation.
* Trace ID propagation.
* Jaeger or Tempo trace viewer.
* Loki centralized logs.
* k6 load testing.
* Advanced Grafana dashboards.

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

## Future FR: Kubernetes and Cloud Deployment

Planned features:

* Docker image registry push.
* Kubernetes manifests.
* ConfigMaps and Secrets.
* Ingress.
* Horizontal scaling examples.
* Production cloud demo.

Status:

```txt
Future
```

---

# 19. Recommended Next Step

Recommended immediate next step:

```txt
Sprint 11 - Final Documentation Update
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

After Sprint 11 documentation update, run:

```powershell
npm run test
npm run typecheck
npm run build
git status
```

Then commit docs:

```powershell
git add README.md docs/architecture/overview.md docs/project-context/AI_HANDOFF.md docs/project-context/CURRENT_PROGRESS.md docs/project-context/DECISION_LOG.md docs/sdlc/requirements.md

git commit -m "docs: finalize sprint 11 documentation"

git push
```

Recommended Sprint 12 direction:

```txt
Sprint 12 - Catch-All Dynamic Router Foundation
```

Reason:

```txt
Sprint 11 lets existing registered routes refresh config at runtime.
Sprint 12 should remove the current new-path restart limitation by adding a safe catch-all dynamic router.
```

Do not add these before they are explicitly selected as a planned sprint:

* Kafka.
* RabbitMQ.
* Kubernetes.
* Admin Dashboard UI.
* Developer Portal UI.
* Advanced OpenTelemetry tracing.
* Loki centralized logs.
* k6 load testing.
* Docker image registry push.
* Production cloud deployment.
