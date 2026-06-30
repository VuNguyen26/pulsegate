# PulseGate Requirements

## 1. Project Name

PulseGate - High-Traffic API Gateway & Observability Platform

## 2. Current Version

```txt
v0.8.0
```

## 3. Current Sprint

```txt
Sprint 7 - Multi-Route Gateway Expansion
```

## 4. Project Purpose

PulseGate is a mini API Gateway, API Management, and Observability Platform.

The project demonstrates backend engineering skills through:

* API Gateway design.
* Microservice communication.
* Multi-route Gateway routing.
* Authentication and authorization.
* Traffic protection.
* Redis-backed rate limiting.
* Redis response caching.
* Database-backed downstream services.
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
* APIs need protection from excessive traffic and unsafe payloads.
* Downstream services should be protected from repeated requests.
* Selected responses should be cached to reduce downstream load.
* API traffic should be logged for debugging.
* API latency should be visible during local testing.
* Gateway metrics should be exposed to Prometheus.
* Gateway behavior should be visible through Grafana dashboards.
* Gateway route behavior should be configurable through policies.
* Repository health should be validated automatically before the main branch is considered stable.
* The system should be easy to run locally before cloud deployment.
* The route configuration foundation should prepare the project for database-backed route config later.

---

## 7. Current System Overview

Current stable architecture after Sprint 7:

```txt
Client
  -> API Gateway :3000
    -> Request ID handling
    -> Structured access log timer
    -> Metrics timer
    -> Basic security headers
    -> Request size limit
    -> Static downstream route configuration
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
               -> PostgreSQL :5432
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
    -> Add x-cache
    -> Add x-response-time-ms
    -> Record Prometheus metrics
    -> Write structured access log
    -> Return response to Client

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
  -> Generates Prisma Client
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

Current downstream Product Service endpoints:

```txt
GET /health
GET /products
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

* Reviewed root and workspace package scripts.
* Added GitHub Actions workflow.
* Configured CI on push to `main`.
* Configured CI on pull request to `main`.
* Configured Node.js 20 in CI.
* Configured dependency installation with `npm ci`.
* Configured Prisma Client generation in CI.
* Configured automated tests in CI.
* Configured TypeScript typecheck in CI.
* Configured production build in CI.
* Added API Gateway Docker image build validation.
* Added Product Service Docker image build validation.
* Validated GitHub Actions CI on GitHub.
* Added live CI badge to README.
* Final local validation passed.
* Final Docker Compose validation passed.
* API Gateway `/health` validation passed.
* API Gateway `/metrics` validation passed.
* Final Sprint 6 documentation was completed.

### Sprint 7 - Multi-Route Gateway Expansion

Status:

```txt
Technical implementation complete
```

Completed:

* Reviewed existing single-route Product proxy implementation.
* Refactored Product proxy route into a generic downstream proxy route foundation.
* Added `downstreamProxyRoute()`.
* Kept `productProxyRoute()` as a compatibility wrapper.
* Preserved existing protected `GET /api/products` behavior.
* Added Product Service health proxy route config.
* Added `GET /api/product-service/health -> Product Service /health`.
* Configured Product Service health proxy route as public.
* Configured Product Service health proxy route without API key requirement.
* Configured Product Service health proxy route without JWT requirement.
* Configured Product Service health proxy route without Redis-backed rate limiting.
* Configured Product Service health proxy route without Redis response cache.
* Configured Product Service health proxy route with downstream timeout policy.
* Registered multiple downstream routes from `downstreamRouteConfigs`.
* Added route config tests for the new public route.
* Added integration test for `GET /api/product-service/health`.
* Validated Docker runtime for the new route.
* Validated existing protected `GET /api/products` still works.
* Validated Redis cache `MISS -> HIT` still works.
* Validated rate limit headers still work.
* Final local validation passed.
* Final Docker Compose validation passed.
* API Gateway `/health` validation passed.
* API Gateway `/metrics` validation passed.
* API Gateway `/api/product-service/health` validation passed.

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
* API Gateway can run locally.
* API Gateway can run through Docker Compose.
* API Gateway Docker image can be built in CI.

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
  "timestamp": "2026-06-30T00:00:00.000Z"
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
* Product Service URL is configurable through `PRODUCT_SERVICE_URL`.
* Product route behavior is driven by route policy configuration.
* Product route remains protected by API key and JWT.
* Product route still uses Redis-backed rate limiting.
* Product route still uses Redis response caching.

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

Current protected route:

```txt
GET /api/products
```

Current public route without API key requirement:

```txt
GET /api/product-service/health
```

Current header:

```txt
x-api-key
```

Current local API key:

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

Current protected route:

```txt
GET /api/products
```

Current public route without JWT requirement:

```txt
GET /api/product-service/health
```

Current header:

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

## FR-013: PostgreSQL and Prisma

Product Service must use PostgreSQL and Prisma for product data.

Acceptance criteria:

* PostgreSQL runs through Docker Compose.
* Product Service uses `DATABASE_URL`.
* Prisma schema defines Product model.
* Prisma migration creates `products` table.
* Product seed script is idempotent.
* Product Service reads products from PostgreSQL.
* Prisma Client can be generated locally and in CI.

Current Prisma schema:

```txt
apps/product-service/prisma/schema.prisma
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
* Metrics support route labels for both protected and public Gateway routes.

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
* Test, typecheck, and build must pass before stable commits.

Current test status:

```txt
24 test files passed
142 tests passed
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
* CI generates Prisma Client before typecheck and build.
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

Current CI commands:

```powershell
npm ci
npm run db:generate -w apps/product-service
npm run test
npm run typecheck
npm run build
docker build -t pulsegate-api-gateway:ci -f apps/api-gateway/Dockerfile .
docker build -t pulsegate-product-service:ci -f apps/product-service/Dockerfile .
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

Current configured routes:

```txt
GET /api/products
  -> Product Service GET /products
  -> Protected
  -> API key required
  -> JWT required
  -> Redis-backed rate limit enabled
  -> Redis response cache enabled

GET /api/product-service/health
  -> Product Service GET /health
  -> Public
  -> API key not required
  -> JWT not required
  -> Redis-backed rate limit disabled
  -> Redis response cache disabled
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

* API Gateway separates app building, config, routes, middlewares, errors, Redis client, cache stores, rate limit stores, policy helpers, observability code, tests, and server startup.
* Product Service separates config, database helper, repositories, routes, middlewares, and server startup.
* Prisma files are located under Product Service.
* Prometheus and Grafana config are located under `observability`.
* CI workflow is located under `.github/workflows`.
* Downstream route behavior is centralized through route config.
* Generic downstream proxy behavior is reusable for multiple static routes.

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
* Prisma Client can be generated.

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
* Middleware, policy helpers, metrics helpers, and route behavior are covered by tests.
* Multi-route behavior is covered by route config and integration tests.

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

Status:

```txt
Done
```

---

## NFR-008: Reproducible Local Infrastructure

The local infrastructure stack must be reproducible from repository files.

Acceptance criteria:

* Docker Compose config is committed.
* Prometheus config is committed.
* Grafana datasource config is committed.
* Grafana dashboard provider config is committed.
* Grafana dashboard JSON is committed.
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
* CI validates Prisma Client generation.
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
* Existing API key behavior must remain unchanged.
* Existing JWT behavior must remain unchanged.
* Existing Redis-backed rate limit behavior must remain unchanged.
* Existing Redis cache behavior must remain unchanged.
* Existing downstream error behavior must remain unchanged.
* Existing tests must continue passing.
* New route additions must not break current runtime flow.

Status:

```txt
Done
```

---

# 11. Current System Constraints

Current constraints after Sprint 7 completion:

* API Gateway currently proxies only Product Service, but now supports more than one Gateway route.
* Current downstream routes are still static code-based route configs.
* Route configuration is not database-backed yet.
* API key list is still environment-based.
* JWT validation is local-secret based.
* There is no user service yet.
* There is no API consumer database yet.
* Product data is database-backed, but only a minimal Product model exists.
* Product Service has no create, update, or delete product APIs yet.
* Redis-backed rate limiting is implemented for `GET /api/products`, not all possible dynamic routes.
* `GET /api/product-service/health` intentionally has rate limiting disabled.
* Redis response caching is implemented for `GET /api/products`.
* `GET /api/product-service/health` intentionally has response caching disabled.
* Route policy foundation exists and is now used by multiple routes.
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

## Protected Product Flow

```txt
Client
  -> GET http://localhost:3000/api/products
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
           -> Product Service reads products from PostgreSQL using Prisma
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
    -> GitHub Actions generates Prisma Client
    -> GitHub Actions runs automated tests
    -> GitHub Actions runs TypeScript typecheck
    -> GitHub Actions runs production build
    -> GitHub Actions builds API Gateway Docker image
    -> GitHub Actions builds Product Service Docker image
    -> GitHub Actions reports pass/fail status to GitHub
    -> README CI badge reflects workflow status
```

## Downstream Failure Behavior

```txt
Product Service unavailable + cache MISS
  -> 503 DOWNSTREAM_SERVICE_UNAVAILABLE

Product Service unavailable + cache HIT
  -> 200 from Redis cache

Product Service timeout + cache MISS
  -> 504 DOWNSTREAM_TIMEOUT

Product Service returns error status + cache MISS
  -> 502 DOWNSTREAM_HTTP_ERROR

Product Service returns invalid JSON + cache MISS
  -> 502 DOWNSTREAM_INVALID_RESPONSE
```

## Route Policy Behavior

```txt
GET /api/products
  -> auth:
       requireApiKey: true
       requireJwt: true
  -> timeout:
       enabled: true
       timeoutMs: DOWNSTREAM_REQUEST_TIMEOUT_MS
  -> cache:
       enabled: true
       ttlSeconds: 30
  -> rateLimit:
       enabled: true
       limit: PRODUCT_PRODUCTS_RATE_LIMIT_MAX_REQUESTS
       windowMs: PRODUCT_PRODUCTS_RATE_LIMIT_WINDOW_MS
  -> requestTransform:
       enabled: false
  -> responseTransform:
       enabled: false
  -> retry:
       enabled: false
       attempts: 0
       retryOnStatuses: [502, 503, 504]

GET /api/product-service/health
  -> auth:
       requireApiKey: false
       requireJwt: false
  -> timeout:
       enabled: true
       timeoutMs: DOWNSTREAM_REQUEST_TIMEOUT_MS
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
REDIS_URL=redis://redis:6379
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

Generate Prisma Client:

```powershell
npm run db:generate -w apps/product-service
```

Seed Product Service database:

```powershell
npm run db:seed -w apps/product-service
```

Run CI-equivalent validation locally:

```powershell
npm ci
npm run db:generate -w apps/product-service
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
24 test files passed
142 tests passed
```

Current important test areas:

* Request ID middleware.
* Access log middleware.
* API key authentication.
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
Technical implementation complete
```

---

# 17. Future Requirements

## Future FR: Dynamic Route Config from Database

Planned features:

* Add database model for Gateway route configuration.
* Store route configs in PostgreSQL.
* Load route configs from PostgreSQL at Gateway startup.
* Preserve safe static fallback during rollout.
* Validate database-backed route configs.
* Add tests for database-backed route config loading.
* Prepare future Admin API route management.

Status:

```txt
Next sprint - Sprint 8
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
* View API consumers.
* View API keys.
* View traffic metrics.
* View logs and status.
* Manage route policies later.

Status:

```txt
Planned for later sprint
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
Sprint 7 - Final Documentation Update
```

Currently updating:

```txt
README.md
docs/project-context/AI_HANDOFF.md
docs/project-context/CURRENT_PROGRESS.md
docs/project-context/DECISION_LOG.md
docs/sdlc/requirements.md
docs/architecture/overview.md
```

After Sprint 7 final documentation update, move to:

```txt
Sprint 8 - Dynamic Route Config from Database
```

Sprint 8 should focus on:

1. Route config database model.
2. Prisma model and migration for Gateway route config.
3. Seed or bootstrap route config data.
4. Load route config from PostgreSQL.
5. Keep safe static fallback config during rollout.
6. Validate database-backed route config.
7. Add tests for database route config loading.
8. Prepare future Admin API route management.

Do not add these before they are explicitly selected as a planned sprint:

* Kafka
* RabbitMQ
* Kubernetes
* Admin Dashboard
* Developer Portal
* Advanced OpenTelemetry tracing
* Loki centralized logs
* k6 load testing
* Production cloud deployment