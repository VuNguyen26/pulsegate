# PulseGate Requirements

## 1. Project Name

PulseGate - High-Traffic API Gateway & Observability Platform

## 2. Project Purpose

PulseGate is a mini API Gateway, API Management, and Observability Platform.

The project is built to demonstrate backend engineering skills, API Gateway design, microservice communication, observability, scalability, and production-oriented system design.

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
* APIs need protection from spam and abuse.
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

Current constraints after Sprint 1 completion:

* Product data is hard-coded.
* No database is connected.
* API key authentication exists for `GET /api/products`.
* JWT authentication exists for `GET /api/products`.
* No rate limiting exists yet.
* No caching exists yet.
* No Docker setup exists yet.
* No metrics dashboard exists yet.
* No tracing system exists yet.
* API Gateway currently proxies only Product Service.
* API Gateway normalizes downstream service failures.
* API Gateway applies request timeout to downstream calls.
* API Gateway uses a simple downstream route configuration foundation.
* API Gateway supports environment-based API key authentication.
* API Gateway supports JWT authentication using `jose`.
* Unit tests are added for request ID, API key authentication, JWT authentication, downstream errors, and env parsing.
* Integration tests are added for API Gateway health, API key route protection, JWT route protection, valid product proxy flow, downstream failures, and downstream timeout behavior.

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

Sprint 1 still intentionally avoided:

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

Recommended next sprint:

```txt
Sprint 2 - Gateway Traffic Protection
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

Suggested status code:

```txt
503 Service Unavailable
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

Suggested status code:

```txt
504 Gateway Timeout
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
* Sprint 1 may use a simple in-memory or environment-based API key list before database support exists.

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
* Valid API key allows request to continue to JWT authentication.
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

Current unit test files:

```txt
apps/api-gateway/src/middlewares/request-id.middleware.test.ts
apps/api-gateway/src/middlewares/api-key-auth.middleware.test.ts
apps/api-gateway/src/middlewares/jwt-auth.middleware.test.ts
apps/api-gateway/src/errors/downstream-service-error.test.ts
apps/api-gateway/src/config/env.test.ts
```

Current unit test count:

```txt
36 tests
```

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

Current integration test file:

```txt
apps/api-gateway/src/app.test.ts
```

Current integration test count:

```txt
10 tests
```

Current integration test coverage:

```txt
GET /health
  -> 200 OK

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

GET /api/products with valid API key and valid JWT but downstream unavailable
  -> 503 DOWNSTREAM_SERVICE_UNAVAILABLE

GET /api/products with valid API key and valid JWT but downstream returns 500
  -> 502 DOWNSTREAM_HTTP_ERROR

GET /api/products with valid API key and valid JWT but downstream returns invalid JSON
  -> 502 DOWNSTREAM_INVALID_RESPONSE

GET /api/products with valid API key and valid JWT but downstream times out
  -> 504 DOWNSTREAM_TIMEOUT
```

Current total automated test status:

```txt
6 test files passed
46 tests passed
```

Status:

```txt
Done
```

## 11. Future Functional Requirements

These requirements are planned for later sprints.

### Future FR: Rate Limiting

API Gateway should limit excessive requests.

Planned features:

* Limit requests by IP.
* Limit requests by API key.
* Store counters in Redis later.
* Return `429 Too Many Requests`.

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

## 12. Current Test Commands

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

## 13. Sprint 0 Definition of Done

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

## 14. Sprint 1 Definition of Done

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

## 15. Next Step

Recommended next step:

```txt
Sprint 2 - Gateway Traffic Protection
```

Reason:

The Gateway now has authentication, downstream routing, downstream timeout handling, normalized error handling, and automated tests. The next useful production-like feature is traffic protection.

Recommended Sprint 2 order:

1. Add in-memory rate limiting foundation.
2. Add route-level rate limit configuration.
3. Add request size limit.
4. Add basic security headers.
5. Add route-level auth configuration refinement.
6. Add automated tests for traffic protection behavior.
