# PulseGate Requirements

## 1. Project Name

PulseGate - High-Traffic API Gateway & Observability Platform

## 2. Project Purpose

PulseGate is a mini API Gateway, API Management, and Observability Platform.

The project is built to demonstrate backend engineering skills, API Gateway design, microservice communication, authentication, traffic protection, observability, scalability, and production-oriented system design.

The project is inspired by:

* Kong
* Apache APISIX
* Tyk
* Apigee
* AWS API Gateway

## 3. Target Users

PulseGate is designed for:

* Backend Developers
* DevOps Engineers
* SREs
* Tech Leads
* Companies that manage many APIs or microservices

## 4. Main Problems

PulseGate aims to solve the following problems:

* Clients need one single entry point for multiple backend services.
* Backend services should not be exposed directly to external clients.
* Requests need to be routed to the correct downstream service.
* APIs need centralized authentication and authorization.
* APIs need protection from spam, abuse, excessive traffic, and unsafe payloads.
* API traffic should be logged for debugging.
* API performance should be monitored.
* Distributed request flow should be traceable across services.
* The system should be easy to run locally first before cloud deployment.

## 5. Sprint 0 Goal

Sprint 0 focused on the smallest working system.

The goal was to prove this flow:

```txt
Client
  -> API Gateway
    -> Product Service
      -> Response
```

Sprint 0 intentionally did not include complex infrastructure.

Not included in Sprint 0:

* Redis
* Kafka
* RabbitMQ
* PostgreSQL
* Prisma
* Docker
* Kubernetes
* Prometheus
* Grafana
* OpenTelemetry
* Admin Dashboard
* Developer Portal

Sprint 0 status:

```txt
Done
```

## 6. Sprint 0 Functional Requirements

### FR-001: API Gateway Service

The system must have an API Gateway service.

Acceptance criteria:

* API Gateway can start successfully.
* API Gateway runs on port `3000`.
* API Gateway uses Fastify.
* API Gateway uses TypeScript.
* API Gateway has JSON logging enabled.
* API Gateway has a health check endpoint.

Current endpoint:

```txt
GET /health
```

Expected response example:

```json
{
  "service": "api-gateway",
  "status": "ok",
  "timestamp": "2026-06-25T00:00:00.000Z"
}
```

Status:

```txt
Done
```

---

### FR-002: Product Service

The system must have a Product Service.

Acceptance criteria:

* Product Service can start successfully.
* Product Service runs on port `3001`.
* Product Service uses Fastify.
* Product Service uses TypeScript.
* Product Service has JSON logging enabled.
* Product Service has a health check endpoint.
* Product Service has a products endpoint.

Current endpoints:

```txt
GET /health
GET /products
```

Expected products response:

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

Status:

```txt
Done
```

---

### FR-003: Gateway Product Proxy Route

API Gateway must route product requests to Product Service.

Acceptance criteria:

* Client can call API Gateway at `GET /api/products`.
* API Gateway calls Product Service at `GET /products`.
* API Gateway returns Product Service response to the client.
* Client does not need to call Product Service directly.
* Product Service URL is configurable through `PRODUCT_SERVICE_URL`.

Current Gateway endpoint:

```txt
GET /api/products
```

Current downstream endpoint:

```txt
GET http://127.0.0.1:3001/products
```

Expected flow:

```txt
Client
  -> GET http://localhost:3000/api/products
    -> API Gateway
      -> GET http://127.0.0.1:3001/products
        -> Product Service
          -> Product response
      -> API Gateway
  -> Client
```

Status:

```txt
Done
```

---

### FR-004: Request ID

The system must support request ID generation and propagation.

Acceptance criteria:

* API Gateway creates a request ID if the client does not provide one.
* API Gateway reuses `x-request-id` if the client provides one.
* API Gateway returns `x-request-id` in response headers.
* API Gateway forwards `x-request-id` to Product Service.
* Product Service reuses the request ID from API Gateway.
* Logs from API Gateway and Product Service can be connected using the same request ID.

Header:

```txt
x-request-id
```

Status:

```txt
Done
```

---

### FR-005: Basic Error Handling

Both services must have basic error handling.

Acceptance criteria:

* Unknown routes return `404`.
* Error response includes a message.
* Error response includes the request path for `404`.
* Error response includes request ID.
* Unexpected server errors return `500`.
* Server errors are logged.

Example 404 response:

```json
{
  "error": {
    "message": "Route not found",
    "path": "/unknown",
    "requestId": "example-request-id"
  }
}
```

Status:

```txt
Done
```

---

### FR-006: Health Check APIs

Both services must expose health check APIs.

Acceptance criteria:

* API Gateway has `GET /health`.
* Product Service has `GET /health`.
* Health response includes service name.
* Health response includes status.
* Health response includes timestamp.

Status:

```txt
Done
```

---

### FR-007: Project Documentation

The project must include basic documentation.

Required documentation:

* `docs/project-context/CURRENT_PROGRESS.md`
* `docs/project-context/DECISION_LOG.md`
* `docs/project-context/AI_HANDOFF.md`
* `docs/architecture/overview.md`
* `docs/sdlc/requirements.md`
* Root `README.md`
* `.env.example`

Status:

```txt
Done
```

## 7. Sprint 0 Non-Functional Requirements

### NFR-001: Local First

The project must run locally before any cloud deployment.

Acceptance criteria:

* API Gateway can run locally.
* Product Service can run locally.
* No paid cloud infrastructure is required.
* Developer can test the basic flow from local terminal.

Status:

```txt
Done
```

---

### NFR-002: Cost Safe

The project must avoid unnecessary paid services during early development.

Acceptance criteria:

* Sprint 0 does not require AWS, GCP, Azure, or paid hosting.
* Sprint 0 does not require managed databases or managed message brokers.
* All current features run locally.

Status:

```txt
Done
```

---

### NFR-003: Maintainable Structure

The codebase must be organized clearly.

Acceptance criteria:

* API Gateway separates app building, config, routes, middlewares, errors, tests, and server startup.
* Product Service separates config, routes, middlewares, and server startup.
* `app.ts` builds the API Gateway app and can be reused by integration tests.
* `server.ts` mainly starts the server.
* Business routes live in `routes`.
* Reusable request handling logic lives in `middlewares`.
* Reusable Gateway error types live in `errors`.
* Downstream route information lives in `config/downstream-routes.ts`.

Status:

```txt
Done
```

---

### NFR-004: Type Safety

The project must use TypeScript with strict checking.

Acceptance criteria:

* TypeScript is configured.
* `npm run typecheck` passes.
* `npm run build` passes.
* Services use TypeScript source files.

Status:

```txt
Done
```

---

### NFR-005: Observability Foundation

The project must prepare for future observability.

Acceptance criteria:

* JSON logger is enabled.
* Request ID exists.
* Request ID is propagated across services.
* Error responses include request ID.
* API Gateway forwards `x-request-id` to Product Service.
* Integration tests verify request ID response header and downstream forwarding behavior.

Status:

```txt
Done
```

---

### NFR-006: Testability Foundation

The project must support automated testing for Gateway core behavior.

Acceptance criteria:

* Test framework is installed.
* Tests can be run with `npm run test`.
* API Gateway can be tested without opening port `3000`.
* API Gateway integration tests can use `app.inject()`.
* Test output does not include unnecessary Fastify JSON logs.

Status:

```txt
Done
```

## 8. Current System Constraints

Current constraints after Sprint 2 completion:

* Product data is still hard-coded.
* No database is connected yet.
* No Prisma schema exists yet.
* API Gateway currently proxies only Product Service.
* API key authentication exists for `GET /api/products`.
* JWT authentication exists for `GET /api/products`.
* In-memory rate limiting exists for `GET /api/products`.
* Rate limit counters are not shared across multiple Gateway instances yet.
* Redis-backed distributed rate limiting does not exist yet.
* Request size limit exists at the Gateway level.
* Basic security headers exist at the Gateway level.
* No response caching exists yet.
* No Docker setup exists yet.
* No metrics dashboard exists yet.
* No tracing system exists yet.
* API Gateway normalizes downstream service failures.
* API Gateway applies request timeout to downstream calls.
* API Gateway uses downstream route configuration.
* API Gateway supports route-level auth configuration.
* API Gateway supports route-level rate limit configuration.
* Unit tests cover request ID, API key authentication, JWT authentication, rate limiting, request size limit, security headers, downstream errors, route config, and env parsing.
* Integration tests cover API Gateway health, security headers, request size limit, API key route protection, JWT route protection, valid product proxy flow, rate limit behavior, downstream failures, and downstream timeout behavior.

## 9. Sprint 1 Goal

Sprint 1 focused on API Gateway core behavior.

The goal was to make the Gateway more production-like before adding infrastructure.

Sprint 1 improved:

* Downstream service error handling.
* Request timeout handling.
* Gateway route configuration foundation.
* API key authentication.
* JWT authentication.
* Unit tests.
* Integration tests.
* Manual validation for protected route behavior.

Sprint 1 intentionally avoided:

* Redis
* Kafka
* RabbitMQ
* PostgreSQL
* Prisma
* Docker
* Kubernetes
* Prometheus
* Grafana
* OpenTelemetry

Sprint 1 current status:

```txt
Done
```

Completed Sprint 1 checkpoints:

1. Normalize downstream service errors.
2. Add downstream request timeout.
3. Add route configuration foundation.
4. Add API key authentication.
5. Add basic unit test setup.
6. Add API key authentication unit tests.
7. Add downstream service error unit tests.
8. Add environment parsing unit tests.
9. Prepare API Gateway app for integration tests.
10. Add API key route integration tests.
11. Add valid API key product route integration test.
12. Add downstream failure integration tests.
13. Add downstream timeout integration test.
14. Add JWT configuration.
15. Add JWT authentication middleware.
16. Add JWT authentication unit tests.
17. Protect Product route with API key and JWT.
18. Manually validate API key and JWT protected route.

Status:

```txt
Done
```

## 10. Sprint 1 Functional Requirements

### S1-FR-001: Normalize Downstream Service Errors

API Gateway must return a clean and consistent error response when a downstream service is unavailable.

Problem:

If Product Service is down, `fetch` may throw a low-level error such as `fetch failed`.

Expected behavior:

* API Gateway should catch downstream connection errors.
* API Gateway should not expose raw runtime errors to clients.
* API Gateway should return a normalized error response.
* Error response should include request ID.
* Error response should identify the downstream service.
* Error response should use a suitable HTTP status code.

Expected response example:

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

Implemented behavior:

* `DownstreamServiceError` was added.
* Product proxy route catches downstream connection failures.
* Gateway returns normalized downstream error response.
* Raw `fetch failed` is not exposed to clients.

Status:

```txt
Done
```

---

### S1-FR-002: Add Downstream Request Timeout

API Gateway must stop waiting if a downstream service takes too long to respond.

Acceptance criteria:

* Gateway request to Product Service has a timeout.
* Timeout duration is configurable.
* Timeout error returns a normalized error response.
* Timeout response includes request ID.
* Timeout response does not expose raw internal error details.

Expected response example:

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

Implemented behavior:

* `DOWNSTREAM_REQUEST_TIMEOUT_MS` was added.
* API Gateway uses `AbortController` to cancel slow downstream requests.
* Timeout defaults to `3000ms`.
* Gateway returns `504 DOWNSTREAM_TIMEOUT`.
* Integration test verifies `AbortError` is converted to `504 DOWNSTREAM_TIMEOUT`.

Status:

```txt
Done
```

---

### S1-FR-003: Route Configuration Foundation

API Gateway should move hard-coded downstream route information toward a route configuration structure.

Acceptance criteria:

* Product Service URL remains configurable.
* Product route config is separated from route handler logic.
* Future services can be added without rewriting Gateway core logic too much.
* Route config should be simple in Sprint 1.

Implemented behavior:

* `apps/api-gateway/src/config/downstream-routes.ts` was added.
* `DownstreamRouteConfig` was added.
* Product proxy route now reads Gateway path, downstream URL, service name, method, and timeout from route config.
* Product proxy route no longer directly hard-codes all downstream details.

Status:

```txt
Done
```

---

### S1-FR-004: API Key Authentication

API Gateway should support basic API key authentication.

Acceptance criteria:

* API Gateway checks an API key from request headers.
* Missing API key returns `401 Unauthorized`.
* Invalid API key returns `403 Forbidden`.
* Valid API key allows request to continue.
* API key header name is configurable.
* Sprint 1 may use a simple environment-based API key list before database support exists.

Possible header:

```txt
x-api-key
```

Expected missing API key response:

```json
{
  "error": {
    "code": "API_KEY_MISSING",
    "message": "API key is required",
    "requestId": "example-request-id"
  }
}
```

Expected invalid API key response:

```json
{
  "error": {
    "code": "API_KEY_INVALID",
    "message": "API key is invalid",
    "requestId": "example-request-id"
  }
}
```

Implemented behavior:

* `API_KEY_HEADER` was added.
* `API_KEYS` was added.
* `api-key-auth.middleware.ts` was added.
* `GET /api/products` is protected by API key authentication.
* `GET /health` remains public.
* Missing API key returns `401 API_KEY_MISSING`.
* Invalid API key returns `403 API_KEY_INVALID`.
* Valid API key allows request to continue to route-level rate limiting and JWT authentication.
* Default local API key is `dev-api-key`.
* Unit tests cover missing, invalid, valid, and array header API key cases.
* Integration tests cover missing, invalid, and valid API key route behavior.

Status:

```txt
Done
```

---

### S1-FR-005: JWT Authentication

API Gateway should support JWT authentication after API key authentication foundation is clear.

Acceptance criteria:

* API Gateway accepts Bearer token.
* Missing token returns `401 Unauthorized`.
* Invalid token returns `403 Forbidden`.
* Valid token allows request to continue.
* User context can be forwarded to downstream services later.
* JWT configuration can be controlled through environment variables.
* JWT behavior should be covered by unit tests.
* JWT route behavior should be covered by integration tests.

Expected missing JWT response:

```json
{
  "error": {
    "code": "JWT_TOKEN_MISSING",
    "message": "Bearer token is required",
    "requestId": "example-request-id"
  }
}
```

Expected invalid JWT response:

```json
{
  "error": {
    "code": "JWT_TOKEN_INVALID",
    "message": "Bearer token is invalid",
    "requestId": "example-request-id"
  }
}
```

Implemented behavior:

* `JWT_SECRET` was added.
* `JWT_ISSUER` was added.
* `JWT_AUDIENCE` was added.
* `JWT_EXPIRES_IN_SECONDS` was added.
* `jose` dependency was added.
* `jwt-auth.middleware.ts` was added.
* `extractBearerToken()` was added.
* `verifyJwtToken()` was added.
* `request.jwtPayload` is attached after successful verification.
* Missing Bearer token returns `401 JWT_TOKEN_MISSING`.
* Invalid Bearer token returns `403 JWT_TOKEN_INVALID`.
* Valid Bearer token allows request to continue.
* JWT validation checks signature, issuer, audience, and expiration.
* `GET /api/products` is protected by both API key and JWT.
* Unit tests cover Bearer token extraction, token verification, missing token, invalid token, and valid token behavior.
* Integration tests cover missing JWT, invalid JWT, and valid JWT route behavior.
* Manual validation was completed with PowerShell.

Status:

```txt
Done
```

---

### S1-FR-006: Unit Tests

The project should add basic unit tests.

Acceptance criteria:

* Request ID generation is tested.
* Environment parsing is tested where applicable.
* API key authentication behavior is tested.
* JWT authentication behavior is tested.
* Downstream error helper is tested.
* Gateway utility functions are tested where applicable.
* Tests can be run with an npm script.

Implemented behavior:

* Vitest was added.
* Root `npm run test` was added.
* API Gateway workspace test script was added.
* `apps/api-gateway/vitest.config.ts` was added.
* Request ID middleware tests were added.
* API key authentication middleware tests were added.
* JWT authentication middleware tests were added.
* Downstream service error tests were added.
* Environment parsing tests were added.

Status:

```txt
Done
```

---

### S1-FR-007: Integration Tests

The project should add basic integration tests for the current flow.

Acceptance criteria:

* Test API Gateway `/health`.
* Test API Gateway `/api/products` with missing API key.
* Test API Gateway `/api/products` with invalid API key.
* Test API Gateway `/api/products` with valid API key but missing JWT.
* Test API Gateway `/api/products` with valid API key but invalid JWT.
* Test API Gateway `/api/products` with valid API key and valid JWT.
* Test Gateway behavior when downstream service is unavailable.
* Test Gateway behavior when downstream service returns an error status.
* Test Gateway behavior when downstream service returns invalid JSON.
* Test Gateway behavior when downstream service times out.

Implemented behavior:

* API Gateway app builder was separated into `apps/api-gateway/src/app.ts`.
* `server.ts` now only starts the server.
* API Gateway integration tests use `app.inject()`.
* `/health` integration test was added.
* `/api/products` missing API key integration test was added.
* `/api/products` invalid API key integration test was added.
* `/api/products` missing JWT integration test was added.
* `/api/products` invalid JWT integration test was added.
* `/api/products` valid API key and valid JWT integration test was added.
* Product proxy integration test verifies downstream URL, `x-request-id` forwarding, and `AbortSignal`.
* Downstream unavailable integration test was added.
* Downstream HTTP error integration test was added.
* Downstream invalid JSON integration test was added.
* Downstream timeout integration test was added.

Status:

```txt
Done
```

## 11. Sprint 2 Goal

Sprint 2 focused on Gateway traffic protection.

The goal was to protect the Gateway and downstream services from excessive traffic, oversized request bodies, and unsafe default HTTP response behavior before adding Redis, Docker, databases, or observability infrastructure.

Sprint 2 improved:

* In-memory rate limiting.
* Route-level rate limit configuration.
* Rate limit response behavior.
* Request size limit.
* Basic security headers.
* Route-level auth configuration.
* Traffic protection unit tests.
* Traffic protection integration tests.
* Manual validation for rate limit behavior.

Sprint 2 intentionally avoided:

* Redis-backed distributed rate limiting.
* PostgreSQL.
* Prisma.
* Docker.
* Kubernetes.
* Kafka.
* RabbitMQ.
* Prometheus.
* Grafana.
* OpenTelemetry.
* Admin Dashboard.
* Developer Portal.

Sprint 2 current status:

```txt
Done
```

Completed Sprint 2 checkpoints:

1. Add in-memory rate limiting foundation.
2. Add in-memory rate limit store unit tests.
3. Add rate limit middleware.
4. Add rate limit middleware unit tests.
5. Attach validated API key to request context.
6. Apply rate limit to `GET /api/products`.
7. Add route-level rate limit configuration.
8. Move product route rate limit values to environment-based config.
9. Add `429 TOO_MANY_REQUESTS` response behavior.
10. Add request size limit middleware.
11. Add request size limit unit tests.
12. Add `413 REQUEST_BODY_TOO_LARGE` response behavior.
13. Add Fastify `bodyLimit`.
14. Add basic security headers middleware.
15. Add security headers unit tests.
16. Add route-level auth configuration.
17. Add downstream route config tests for rate limit and auth requirements.
18. Add integration test for oversized request body.
19. Add integration test for product route rate limit exceeded behavior.
20. Add manual validation for rate limit behavior.
21. Run `npm run test`.
22. Run `npm run typecheck`.
23. Run `npm run build`.
24. Push stable checkpoints to GitHub.

Status:

```txt
Done
```

## 12. Sprint 2 Functional Requirements

### S2-FR-001: In-Memory Rate Limiting Foundation

API Gateway must support a local in-memory rate limiting foundation before Redis is added.

Acceptance criteria:

* Gateway can count requests per rate limit key.
* Gateway can allow requests under the limit.
* Gateway can block requests after the limit is exceeded.
* Gateway can reset counters after the configured window.
* Gateway can clear counters for tests.
* Gateway can clean up expired counters.
* Rate limit behavior is covered by unit tests.

Implemented behavior:

* `InMemoryRateLimitStore` was added.
* Rate limit records are stored in memory.
* Rate limit counters are keyed by identity and route.
* Window reset behavior is supported.
* Expired record cleanup is supported.
* Unit tests verify allowed requests, blocked requests, separate keys, window reset, cleanup, and invalid config.

Current limitation:

* Counters reset when API Gateway restarts.
* Counters are not shared across multiple Gateway instances.
* Redis-backed rate limiting is planned for a later sprint.

Status:

```txt
Done
```

---

### S2-FR-002: Route-Level Rate Limit Configuration

API Gateway must support route-level rate limit configuration.

Acceptance criteria:

* Product route has a dedicated rate limit config.
* Rate limit values are configurable through environment variables.
* Route handler reads rate limit values from route config.
* Route config remains separated from route handler logic.

Implemented behavior:

* `RouteRateLimitConfig` was added.
* Product route rate limit config was added to `downstream-routes.ts`.
* `PRODUCT_PRODUCTS_RATE_LIMIT_MAX_REQUESTS` was added.
* `PRODUCT_PRODUCTS_RATE_LIMIT_WINDOW_MS` was added.
* Product route defaults to 5 requests per 60 seconds.

Current config:

```txt
PRODUCT_PRODUCTS_RATE_LIMIT_MAX_REQUESTS=5
PRODUCT_PRODUCTS_RATE_LIMIT_WINDOW_MS=60000
```

Status:

```txt
Done
```

---

### S2-FR-003: Rate Limit Response Behavior

API Gateway must return a clean response when rate limit is exceeded.

Acceptance criteria:

* Gateway returns `429 Too Many Requests` when the route limit is exceeded.
* Error response includes a stable error code.
* Error response includes a user-friendly message.
* Error response includes request ID.
* Response includes rate limit headers.
* Product Service is not called for blocked requests.

Expected response:

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

Expected headers:

```txt
x-ratelimit-limit
x-ratelimit-remaining
x-ratelimit-reset
retry-after
```

Implemented behavior:

* Rate limit middleware was added.
* Product route uses rate limit middleware after API key authentication.
* Rate limit identity defaults to API key.
* Product route is limited by API key, HTTP method, and route path.
* Integration test verifies that the blocked request does not call Product Service.

Status:

```txt
Done
```

---

### S2-FR-004: Request Size Limit

API Gateway must reject oversized request bodies.

Acceptance criteria:

* Gateway has configurable request body size limit.
* Gateway checks `content-length` before route handlers.
* Gateway returns `413 Payload Too Large` when content length exceeds the configured limit.
* Error response includes request ID.
* Fastify body parser also has a configured body limit.
* Behavior is covered by unit and integration tests.

Current config:

```txt
MAX_REQUEST_BODY_BYTES=1048576
```

Expected response:

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

Implemented behavior:

* `MAX_REQUEST_BODY_BYTES` was added.
* Request size limit middleware was added.
* Fastify `bodyLimit` was configured.
* Unit tests cover content-length parsing, allowed body sizes, exceeded body size, and invalid config.
* Integration test verifies oversized request behavior.

Status:

```txt
Done
```

---

### S2-FR-005: Basic Security Headers

API Gateway must add basic HTTP security headers to responses.

Acceptance criteria:

* Gateway adds basic security headers globally.
* Health route responses include security headers.
* Error responses should receive the same baseline header behavior.
* Security header behavior is covered by automated tests.

Current security headers:

```txt
x-content-type-options: nosniff
x-frame-options: DENY
referrer-policy: no-referrer
permissions-policy: camera=(), microphone=(), geolocation=()
content-security-policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'
```

Implemented behavior:

* Security headers middleware was added.
* API Gateway registers the middleware globally.
* Unit test verifies basic security headers.
* Integration test verifies health response includes security headers.

Not included yet:

```txt
strict-transport-security
```

Reason:

* The project is still local-first and uses HTTP in local development.
* HSTS should be added when HTTPS deployment is introduced.

Status:

```txt
Done
```

---

### S2-FR-006: Route-Level Auth Configuration Refinement

API Gateway must support route-level auth requirements in route config.

Acceptance criteria:

* Product route config declares whether API key is required.
* Product route config declares whether JWT is required.
* Product route builds authentication handlers from route config.
* Route handler no longer hard-codes all auth requirements directly.
* Route-level auth config is covered by tests.

Implemented behavior:

* `RouteAuthConfig` was added.
* Product route config now includes `auth.requireApiKey`.
* Product route config now includes `auth.requireJwt`.
* Product proxy route builds pre-handlers based on route config.
* Downstream route config test verifies auth requirements.

Current product route auth config:

```txt
GET /api/products
  -> requireApiKey: true
  -> requireJwt: true
```

Status:

```txt
Done
```

---

### S2-FR-007: Traffic Protection Tests

Gateway traffic protection behavior must be covered by automated tests.

Acceptance criteria:

* Rate limit store behavior is tested.
* Rate limit middleware behavior is tested.
* Request size limit behavior is tested.
* Security header behavior is tested.
* Route-level rate limit config is tested.
* Route-level auth config is tested.
* API Gateway integration tests include rate limit behavior.
* API Gateway integration tests include request size limit behavior.
* `npm run test` passes.
* `npm run typecheck` passes.
* `npm run build` passes.

Implemented behavior:

Current total automated test status:

```txt
11 test files passed
71 tests passed
```

Current unit test files:

```txt
apps/api-gateway/src/middlewares/request-id.middleware.test.ts
apps/api-gateway/src/middlewares/api-key-auth.middleware.test.ts
apps/api-gateway/src/middlewares/jwt-auth.middleware.test.ts
apps/api-gateway/src/rate-limit/in-memory-rate-limit-store.test.ts
apps/api-gateway/src/middlewares/rate-limit.middleware.test.ts
apps/api-gateway/src/middlewares/request-size-limit.middleware.test.ts
apps/api-gateway/src/middlewares/security-headers.middleware.test.ts
apps/api-gateway/src/errors/downstream-service-error.test.ts
apps/api-gateway/src/config/env.test.ts
apps/api-gateway/src/config/downstream-routes.test.ts
```

Current integration test file:

```txt
apps/api-gateway/src/app.test.ts
```

Current integration test coverage:

```txt
GET /health
  -> 200 OK
  -> includes x-request-id
  -> includes basic security headers

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
  -> includes rate limit headers

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

Status:

```txt
Done
```

## 13. Current Runtime Behavior

Current protected product flow:

```txt
Client
  -> GET http://localhost:3000/api/products
    -> API Gateway creates or reuses x-request-id
    -> API Gateway adds basic security headers
    -> API Gateway applies request size limit
      -> If request body is too large:
        -> 413 REQUEST_BODY_TOO_LARGE
    -> API Gateway checks x-api-key
      -> If missing:
        -> 401 API_KEY_MISSING
      -> If invalid:
        -> 403 API_KEY_INVALID
      -> If valid:
        -> API Gateway applies rate limit by API key and route
          -> If exceeded:
            -> 429 TOO_MANY_REQUESTS
          -> If allowed:
            -> API Gateway checks Authorization Bearer token
              -> If missing:
                -> 401 JWT_TOKEN_MISSING
              -> If invalid:
                -> 403 JWT_TOKEN_INVALID
              -> If valid:
                -> API Gateway calls Product Service
                  -> GET http://127.0.0.1:3001/products
                -> Product Service returns mock product data
    -> API Gateway returns response to Client
```

Current public health flow:

```txt
Client
  -> GET http://localhost:3000/health
    -> API Gateway creates or reuses x-request-id
    -> API Gateway adds basic security headers
    -> API Gateway applies request size limit
    -> API Gateway returns health response
```

Current downstream failure behavior:

```txt
Product Service unavailable
  -> 503 DOWNSTREAM_SERVICE_UNAVAILABLE

Product Service timeout
  -> 504 DOWNSTREAM_TIMEOUT

Product Service returns error status
  -> 502 DOWNSTREAM_HTTP_ERROR

Product Service returns invalid JSON
  -> 502 DOWNSTREAM_INVALID_RESPONSE
```

## 14. Current Test Commands

Run Product Service:

```powershell
npm run dev:product
```

Run API Gateway:

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

Test Product Service manually:

```powershell
Invoke-RestMethod http://localhost:3001/health | ConvertTo-Json -Depth 10
Invoke-RestMethod http://localhost:3001/products | ConvertTo-Json -Depth 10
```

Test API Gateway health manually:

```powershell
Invoke-RestMethod http://localhost:3000/health | ConvertTo-Json -Depth 10
```

Create local development JWT token:

```powershell
$token = node --input-type=module -e "import { SignJWT } from 'jose'; const secretKey = new TextEncoder().encode('local-dev-jwt-secret-change-me'); const expiresAt = Math.floor(Date.now() / 1000) + 900; const token = await new SignJWT({ role: 'user' }).setProtectedHeader({ alg: 'HS256' }).setSubject('user_123').setIssuer('pulsegate-api-gateway').setAudience('pulsegate-clients').setExpirationTime(expiresAt).sign(secretKey); console.log(token);"
```

Test API Gateway products with valid API key and valid JWT:

```powershell
Invoke-RestMethod http://localhost:3000/api/products `
  -Headers @{
    "x-api-key" = "dev-api-key"
    "authorization" = "Bearer $token"
  } |
  ConvertTo-Json -Depth 10
```

Test product route rate limit:

```powershell
$headers = @{
  "x-api-key" = "dev-api-key"
  "authorization" = "Bearer $token"
}

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

Expected rate limit behavior:

```txt
Attempt 1 -> 200, Remaining 4
Attempt 2 -> 200, Remaining 3
Attempt 3 -> 200, Remaining 2
Attempt 4 -> 200, Remaining 1
Attempt 5 -> 200, Remaining 0
Attempt 6 -> 429 TOO_MANY_REQUESTS
```

Test missing API key:

```powershell
try {
  Invoke-RestMethod http://localhost:3000/api/products | ConvertTo-Json -Depth 10
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}
```

Test invalid API key:

```powershell
try {
  Invoke-RestMethod http://localhost:3000/api/products `
    -Headers @{ "x-api-key" = "wrong-key" } |
    ConvertTo-Json -Depth 10
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}
```

Test missing JWT:

```powershell
try {
  Invoke-RestMethod http://localhost:3000/api/products `
    -Headers @{ "x-api-key" = "dev-api-key" } |
    ConvertTo-Json -Depth 10
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}
```

Test invalid JWT:

```powershell
try {
  Invoke-RestMethod http://localhost:3000/api/products `
    -Headers @{
      "x-api-key" = "dev-api-key"
      "authorization" = "Bearer invalid-token"
    } |
    ConvertTo-Json -Depth 10
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}
```

Expected products response:

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

## 15. Sprint 0 Definition of Done

Sprint 0 is done when:

* API Gateway runs on port `3000`.
* Product Service runs on port `3001`.
* Client can call `GET /api/products` through API Gateway.
* API Gateway forwards request to Product Service.
* Product Service returns product data.
* Request ID works across services.
* JSON logger works.
* Health check endpoints work.
* Basic error handlers work.
* Typecheck passes.
* Build passes.
* Project context docs are created.
* Architecture overview is created.
* Requirements document is created.
* README is updated.
* `.env.example` is added.
* Code is pushed to GitHub.

Current Sprint 0 status:

```txt
Done
```

## 16. Sprint 1 Definition of Done

Sprint 1 is done when:

* API Gateway normalizes downstream service errors.
* API Gateway applies request timeout to Product Service calls.
* API Gateway has downstream route configuration foundation.
* API Gateway supports API key authentication.
* API Gateway supports JWT authentication.
* API Gateway keeps `/health` public.
* API Gateway protects `/api/products` with API key and JWT.
* API Gateway has unit tests for request ID, env parsing, API key auth, JWT auth, and downstream errors.
* API Gateway has integration tests for health, API key route behavior, JWT route behavior, product proxy success, downstream failure, and downstream timeout.
* Manual validation confirms API key and JWT protected route behavior.
* `npm run test` passes.
* `npm run typecheck` passes.
* `npm run build` passes.
* Code is pushed to GitHub.

Current Sprint 1 status:

```txt
Done
```

Completed Sprint 1 items:

```txt
S1-FR-001 Done
S1-FR-002 Done
S1-FR-003 Done
S1-FR-004 Done
S1-FR-005 Done
S1-FR-006 Done
S1-FR-007 Done
```

## 17. Sprint 2 Definition of Done

Sprint 2 is done when:

* API Gateway has in-memory rate limiting foundation.
* API Gateway can rate limit `GET /api/products`.
* API Gateway rate limits by API key and route.
* API Gateway returns `429 TOO_MANY_REQUESTS` when the limit is exceeded.
* API Gateway returns rate limit headers.
* API Gateway does not call Product Service for a blocked rate limited request.
* API Gateway has route-level rate limit config.
* API Gateway supports environment-based product route rate limit values.
* API Gateway has request size limit.
* API Gateway returns `413 REQUEST_BODY_TOO_LARGE` when request body is too large.
* API Gateway has Fastify `bodyLimit` configured.
* API Gateway adds basic security headers.
* API Gateway has route-level auth config.
* Unit tests cover rate limit store, rate limit middleware, request size limit, security headers, and route config.
* Integration tests cover oversized request body and exceeded rate limit.
* Manual validation confirms rate limit behavior.
* `npm run test` passes.
* `npm run typecheck` passes.
* `npm run build` passes.
* Code is pushed to GitHub.

Current Sprint 2 status:

```txt
Done
```

Completed Sprint 2 items:

```txt
S2-FR-001 Done
S2-FR-002 Done
S2-FR-003 Done
S2-FR-004 Done
S2-FR-005 Done
S2-FR-006 Done
S2-FR-007 Done
```

## 18. Future Functional Requirements

These requirements are planned for later sprints.

### Future FR: Redis-Backed Distributed Rate Limiting

API Gateway should support distributed rate limiting through Redis.

Planned features:

* Store counters in Redis.
* Share counters across multiple Gateway instances.
* Keep the same external rate limit behavior.
* Reuse the current rate limit middleware contract where possible.

Status:

```txt
Planned
```

---

### Future FR: Redis Caching

API Gateway should cache selected responses.

Planned features:

* Cache product responses.
* Configure TTL.
* Return cached response when available.
* Reduce downstream service load.

Status:

```txt
Planned
```

---

### Future FR: PostgreSQL and Prisma

Product Service should use a real database.

Planned features:

* Add PostgreSQL.
* Add Prisma.
* Create Product model.
* Replace mock product data with database data.

Status:

```txt
Planned
```

---

### Future FR: Docker Compose

The project should support local infrastructure through Docker Compose.

Planned services:

* API Gateway
* Product Service
* PostgreSQL
* Redis

Later services:

* Kafka
* RabbitMQ
* Prometheus
* Grafana
* Jaeger or Tempo

Status:

```txt
Planned
```

---

### Future FR: Metrics and Tracing

The system should expose metrics and distributed tracing.

Planned features:

* Prometheus metrics.
* Grafana dashboards.
* OpenTelemetry instrumentation.
* Jaeger or Tempo trace viewer.

Status:

```txt
Planned
```

---

### Future FR: Event-Driven Architecture

The system should support event streaming and background processing later.

Planned features:

* Kafka event streaming.
* RabbitMQ background jobs.
* Notification Service.
* Async processing examples.

Status:

```txt
Planned
```

## 19. Recommended Next Step

Recommended next step:

```txt
Sprint 3 - Data & Infrastructure Foundation
```

Reason:

The Gateway now has routing, request ID propagation, authentication, downstream timeout handling, normalized error handling, traffic protection, and automated tests. The next useful production-like step is adding local infrastructure and real data storage.

Recommended Sprint 3 order:

1. Add Docker Compose foundation.
2. Add PostgreSQL service.
3. Add Product Service database foundation.
4. Add Prisma.
5. Replace mock product data with database-backed product data.
6. Add Redis service.
7. Upgrade rate limiting from in-memory store to Redis-backed store.
8. Add basic response caching.

Do not add these before the Sprint 3 foundation is stable:

* Kafka
* RabbitMQ
* Prometheus
* Grafana
* OpenTelemetry
* Admin Dashboard
* Developer Portal
* Kubernetes
