# AI Handoff

## Project Name

PulseGate - High-Traffic API Gateway & Observability Platform

## Current Version

v0.2.0

## Current Status

Sprint 0 is complete.

Sprint 1 is complete.

PulseGate currently has a stable local-first API Gateway foundation with production-oriented Gateway behavior and automated tests.

Completed Sprint 1 checkpoints:

1. Normalize downstream service errors.
2. Add downstream request timeout.
3. Add downstream route configuration foundation.
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

The project is currently ready to move to:

```txt
Sprint 2 - Gateway Traffic Protection
```

Recommended Sprint 2 direction:

1. Add in-memory rate limiting foundation.
2. Add route-level rate limit configuration.
3. Add request size limit.
4. Add basic security headers.
5. Add route-level auth configuration refinement.
6. Add automated tests for traffic protection behavior.

---

## Purpose of This File

This file is used to transfer project context to a new AI chat when the current chat becomes too long or slow.

When continuing this project in a new chat, provide this file first so the assistant can understand:

* What PulseGate is.
* What has already been completed.
* What the current architecture is.
* What coding style and learning workflow should be followed.
* What the next sprint should be.
* What should not be added too early.

---

## User Learning Workflow

The assistant should follow this workflow:

1. Provide sample code step by step.
2. Do not generate too much code at once.
3. Explain the purpose of each file.
4. Explain important code blocks.
5. Explain the request flow after each feature.
6. Let the user run and test the code.
7. Review errors, logs, and code like a senior backend reviewer.
8. Give a checklist after each step.
9. Ask the user to commit only after a stable checkpoint.
10. Ask the user to push after each stable commit.
11. Keep this handoff file updated when the project grows.

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

Long-term problems PulseGate should solve:

* Provide a single entry point for many backend services.
* Route requests to the correct downstream service.
* Validate API keys or JWT.
* Apply rate limiting.
* Add Redis caching.
* Add request logging.
* Add metrics monitoring.
* Add distributed tracing.
* Stream events with Kafka.
* Process background jobs with RabbitMQ.
* Run load tests with k6.
* Support Docker, Docker Compose, and later Kubernetes.
* Provide Admin Dashboard later.
* Provide Developer Portal later.

---

## Current Architecture

Current architecture:

```txt
Client
  -> API Gateway :3000
    -> Request ID handling
    -> API key authentication for protected routes
    -> JWT authentication for protected routes
    -> Downstream route configuration
    -> Downstream timeout handling
    -> Normalized downstream error handling
    -> Product Service :3001
      -> Mock product response
```

Current working endpoint through Gateway:

```txt
GET http://localhost:3000/api/products
```

This endpoint currently requires:

```txt
x-api-key: dev-api-key
Authorization: Bearer <jwt-token>
```

Gateway forwards the request to:

```txt
GET http://127.0.0.1:3001/products
```

Current public endpoint:

```txt
GET http://localhost:3000/health
```

The health endpoint does not require API key or JWT.

---

## Current Tech Stack

Currently used:

* Node.js
* TypeScript
* Fastify
* npm workspaces
* Vitest
* jose

Added so far:

* `.gitignore`
* `.gitattributes`
* `.env.example`
* Project context documentation
* Architecture documentation
* Requirements documentation
* GitHub-ready README
* Request ID middleware
* Error handler middleware
* Downstream service error class
* Downstream route configuration
* API key authentication middleware
* JWT authentication middleware
* API Gateway app builder for integration tests
* Unit tests
* Integration tests

Not added yet:

* PostgreSQL
* Prisma
* Redis
* Kafka
* RabbitMQ
* Docker
* Docker Compose
* Kubernetes
* Prometheus
* Grafana
* OpenTelemetry
* Jaeger or Tempo
* Loki
* k6
* Admin Dashboard
* Developer Portal

---

## Repository Structure

```txt
pulsegate/
  apps/
    api-gateway/
      src/
        app.ts
        app.test.ts
        config/
          downstream-routes.ts
          env.ts
          env.test.ts
        errors/
          downstream-service-error.ts
          downstream-service-error.test.ts
        middlewares/
          api-key-auth.middleware.ts
          api-key-auth.middleware.test.ts
          error-handler.middleware.ts
          jwt-auth.middleware.ts
          jwt-auth.middleware.test.ts
          request-id.middleware.ts
          request-id.middleware.test.ts
        routes/
          health.route.ts
          product-proxy.route.ts
        server.ts
      package.json
      tsconfig.json
      vitest.config.ts

    product-service/
      src/
        config/
          env.ts
        middlewares/
          error-handler.middleware.ts
          request-id.middleware.ts
        routes/
          health.route.ts
          product.route.ts
        server.ts
      package.json
      tsconfig.json

  packages/
    shared/
      src/
        errors/
        types/

  docs/
    architecture/
      overview.md
    sdlc/
      requirements.md
    project-context/
      CURRENT_PROGRESS.md
      DECISION_LOG.md
      AI_HANDOFF.md

  infra/

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
GET /api/products
```

Current route protection:

```txt
GET /health
  -> Public

GET /api/products
  -> Requires API key
  -> Requires JWT Bearer token
```

Current responsibilities:

* Receive client requests.
* Generate or reuse request ID.
* Return `x-request-id` response header.
* Route `/api/products` to Product Service `/products`.
* Forward `x-request-id` to Product Service.
* Return downstream response to client.
* Handle 404 errors.
* Handle basic 500 errors.
* Log requests in JSON format.
* Normalize downstream service errors.
* Return `503 DOWNSTREAM_SERVICE_UNAVAILABLE` when Product Service is down.
* Apply downstream request timeout.
* Return `504 DOWNSTREAM_TIMEOUT` when Product Service is too slow.
* Return `502 DOWNSTREAM_HTTP_ERROR` when Product Service returns 5xx.
* Return `502 DOWNSTREAM_INVALID_RESPONSE` when Product Service returns invalid JSON.
* Store downstream route information in a route config file.
* Protect `/api/products` using API key authentication.
* Return `401 API_KEY_MISSING` when API key is missing.
* Return `403 API_KEY_INVALID` when API key is invalid.
* Protect `/api/products` using JWT authentication.
* Return `401 JWT_TOKEN_MISSING` when Bearer token is missing.
* Return `403 JWT_TOKEN_INVALID` when Bearer token is invalid.
* Attach verified JWT payload to `request.jwtPayload`.
* Support automated integration tests using `buildApiGatewayApp()` and `app.inject()`.

Current API Gateway structure:

```txt
apps/api-gateway/src/
  app.ts
  app.test.ts
  config/
    downstream-routes.ts
    env.ts
    env.test.ts
  errors/
    downstream-service-error.ts
    downstream-service-error.test.ts
  middlewares/
    api-key-auth.middleware.ts
    api-key-auth.middleware.test.ts
    error-handler.middleware.ts
    jwt-auth.middleware.ts
    jwt-auth.middleware.test.ts
    request-id.middleware.ts
    request-id.middleware.test.ts
  routes/
    health.route.ts
    product-proxy.route.ts
  server.ts
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

* Provide health check.
* Return mock product data.
* Generate or reuse request ID.
* Reuse request ID forwarded by API Gateway.
* Handle 404 errors.
* Handle basic 500 errors.
* Log requests in JSON format.

Current Product Service structure:

```txt
apps/product-service/src/
  config/
    env.ts
  middlewares/
    error-handler.middleware.ts
    request-id.middleware.ts
  routes/
    health.route.ts
    product.route.ts
  server.ts
```

---

## Request ID Behavior

Request ID is already implemented in both services.

Current flow:

```txt
Client
  -> API Gateway creates or reuses x-request-id
  -> API Gateway returns x-request-id in response header
  -> API Gateway sends x-request-id to Product Service
  -> Product Service reuses the same request ID
```

Purpose:

* Easier debugging.
* Prepare for observability.
* Prepare for distributed tracing later.
* Connect logs between Gateway and downstream services.

Covered by tests:

```txt
apps/api-gateway/src/middlewares/request-id.middleware.test.ts
```

Current request ID unit tests:

* Reuse `x-request-id` when the header is a non-empty string.
* Use the first `x-request-id` when the header is an array.
* Generate a new request ID when `x-request-id` is missing.
* Generate a new request ID when `x-request-id` is an empty string.

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
Missing API key
  -> 401 API_KEY_MISSING

Invalid API key
  -> 403 API_KEY_INVALID

Valid API key
  -> Request continues to JWT authentication
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

Covered by tests:

```txt
apps/api-gateway/src/middlewares/api-key-auth.middleware.test.ts
apps/api-gateway/src/app.test.ts
```

Current API key test coverage:

* Missing API key returns `401 API_KEY_MISSING`.
* Invalid API key returns `403 API_KEY_INVALID`.
* Valid API key allows request to continue.
* Valid API key as array header allows request to continue.
* `/api/products` without API key returns `401`.
* `/api/products` with invalid API key returns `403`.

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
Missing Bearer token
  -> 401 JWT_TOKEN_MISSING

Invalid Bearer token
  -> 403 JWT_TOKEN_INVALID

Valid Bearer token
  -> Request continues to Product Service
```

JWT validation checks:

```txt
Signature
Issuer
Audience
Expiration
```

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

Verified JWT payload is attached to:

```txt
request.jwtPayload
```

Covered by tests:

```txt
apps/api-gateway/src/middlewares/jwt-auth.middleware.test.ts
apps/api-gateway/src/app.test.ts
```

Current JWT test coverage:

* `extractBearerToken()` returns `undefined` when Authorization header is missing.
* `extractBearerToken()` returns `undefined` when Authorization header does not use Bearer scheme.
* `extractBearerToken()` returns `undefined` when Bearer token is empty.
* `extractBearerToken()` extracts valid Bearer token.
* `extractBearerToken()` supports lowercase `bearer`.
* `verifyJwtToken()` verifies a valid JWT token.
* Missing Bearer token returns `401 JWT_TOKEN_MISSING`.
* Invalid Bearer token returns `403 JWT_TOKEN_INVALID`.
* Valid Bearer token attaches JWT payload to request.
* `/api/products` with valid API key but missing JWT returns `401`.
* `/api/products` with valid API key but invalid JWT returns `403`.
* `/api/products` with valid API key and valid JWT returns product data.

---

## Downstream Error Behavior

When Product Service is down, API Gateway returns:

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

When Product Service is too slow, API Gateway returns:

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

When Product Service returns an error status, API Gateway returns:

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

When Product Service returns invalid JSON, API Gateway returns:

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

Current downstream test coverage:

* `DownstreamServiceError` stores code, message, service, status code, and original error.
* `isDownstreamServiceError()` identifies downstream errors correctly.
* Product Service unavailable returns `503 DOWNSTREAM_SERVICE_UNAVAILABLE`.
* Product Service returns 500 results in `502 DOWNSTREAM_HTTP_ERROR`.
* Product Service invalid JSON results in `502 DOWNSTREAM_INVALID_RESPONSE`.
* Product Service timeout results in `504 DOWNSTREAM_TIMEOUT`.

---

## Environment Configuration Behavior

Current API Gateway env config includes:

```txt
PORT
HOST
PRODUCT_SERVICE_URL
DOWNSTREAM_REQUEST_TIMEOUT_MS
API_KEY_HEADER
API_KEYS
JWT_SECRET
JWT_ISSUER
JWT_AUDIENCE
JWT_EXPIRES_IN_SECONDS
```

Covered by tests:

```txt
apps/api-gateway/src/config/env.test.ts
```

Current env test coverage:

* `readNumberEnv()` returns fallback when env value is missing.
* `readNumberEnv()` parses valid number values.
* `readNumberEnv()` returns fallback for non-number values.
* `readNumberEnv()` returns fallback for zero.
* `readNumberEnv()` returns fallback for negative values.
* `readCsvEnv()` returns fallback when env value is missing.
* `readCsvEnv()` parses comma-separated values.
* `readCsvEnv()` trims spaces and removes empty values.
* `readCsvEnv()` returns fallback when parsed values are empty.
* `readStringEnv()` returns fallback when env value is missing.
* `readStringEnv()` returns env value when valid.
* `readStringEnv()` trims env value.
* `readStringEnv()` returns fallback for empty string.
* `readStringEnv()` returns fallback for whitespace-only string.

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
6 test files passed
46 tests passed
```

Current unit tests:

```txt
apps/api-gateway/src/middlewares/request-id.middleware.test.ts
  -> 4 tests

apps/api-gateway/src/middlewares/api-key-auth.middleware.test.ts
  -> 4 tests

apps/api-gateway/src/middlewares/jwt-auth.middleware.test.ts
  -> 9 tests

apps/api-gateway/src/errors/downstream-service-error.test.ts
  -> 5 tests

apps/api-gateway/src/config/env.test.ts
  -> 14 tests
```

Current integration tests:

```txt
apps/api-gateway/src/app.test.ts
  -> 10 tests
```

Integration test coverage:

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

---

## Current Commands

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

Test Product Service:

```powershell
Invoke-RestMethod http://localhost:3001/health | ConvertTo-Json -Depth 10
Invoke-RestMethod http://localhost:3001/products | ConvertTo-Json -Depth 10
```

Test API Gateway health:

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

---

## Expected Products Response

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

### Step 1: Normalize downstream service errors

Implemented:

* `DownstreamServiceError`.
* Normalized downstream error responses.
* `503 DOWNSTREAM_SERVICE_UNAVAILABLE`.
* `502 DOWNSTREAM_HTTP_ERROR`.
* `502 DOWNSTREAM_INVALID_RESPONSE`.

### Step 2: Add downstream request timeout

Implemented:

* `DOWNSTREAM_REQUEST_TIMEOUT_MS`.
* Timeout handling with `AbortController`.
* `504 DOWNSTREAM_TIMEOUT`.

### Step 3: Route configuration foundation

Implemented:

* `config/downstream-routes.ts`.
* `DownstreamRouteConfig`.
* Product proxy route now uses route config instead of hard-coded service details.

### Step 4: API key authentication

Implemented:

* `API_KEY_HEADER`.
* `API_KEYS`.
* `api-key-auth.middleware.ts`.
* `401 API_KEY_MISSING`.
* `403 API_KEY_INVALID`.
* `/api/products` protected by API key.
* `/health` remains public.

### Step 5: Add basic unit test setup

Implemented:

* Vitest.
* Root `npm run test`.
* API Gateway workspace test script.
* `vitest.config.ts`.

### Step 6: Add API key authentication unit tests

Implemented:

* Missing API key unit test.
* Invalid API key unit test.
* Valid API key unit test.
* Header array API key unit test.

### Step 7: Add downstream service error unit tests

Implemented:

* `DownstreamServiceError` property tests.
* Original error storage test.
* `isDownstreamServiceError()` tests.

### Step 8: Add environment parsing unit tests

Implemented:

* `readNumberEnv()` tests.
* `readCsvEnv()` tests.

### Step 9: Prepare API Gateway app for integration tests

Implemented:

* `app.ts`.
* `buildApiGatewayApp()`.
* `server.ts` now only starts the server.
* Integration tests can use `app.inject()` without opening port `3000`.

### Step 10: Add API key route integration tests

Implemented:

* `/health` integration test.
* `/api/products` missing API key integration test.
* `/api/products` invalid API key integration test.

### Step 11: Add valid API key product route integration test

Implemented:

* `/api/products` valid API key integration test.
* Mocked `fetch`.
* Verified downstream URL.
* Verified `x-request-id` forwarding.
* Verified `AbortSignal` is passed to `fetch`.

### Step 12: Add downstream failure integration tests

Implemented:

* Downstream unavailable test.
* Downstream HTTP error status test.
* Downstream invalid JSON test.

### Step 13: Add downstream timeout integration test

Implemented:

* Mocked `AbortError`.
* Verified `504 DOWNSTREAM_TIMEOUT`.

### Step 14: Add JWT configuration

Implemented:

* `JWT_SECRET`.
* `JWT_ISSUER`.
* `JWT_AUDIENCE`.
* `JWT_EXPIRES_IN_SECONDS`.
* `readStringEnv()` helper.
* Env tests for string parsing.

### Step 15: Add JWT authentication middleware

Implemented:

* `jwt-auth.middleware.ts`.
* Bearer token extraction.
* JWT verification using `jose`.
* `request.jwtPayload`.
* `401 JWT_TOKEN_MISSING`.
* `403 JWT_TOKEN_INVALID`.

### Step 16: Add JWT authentication unit tests

Implemented:

* `extractBearerToken()` tests.
* `verifyJwtToken()` valid token test.
* JWT missing token middleware test.
* JWT invalid token middleware test.
* JWT valid token middleware test.

### Step 17: Protect Product route with API key and JWT

Implemented:

* `/api/products` now requires API key and JWT.
* Integration tests updated for the new auth flow.
* Missing JWT route test.
* Invalid JWT route test.
* Valid API key and valid JWT product route test.

### Step 18: Manual validation for API key and JWT protected route

Validated:

* `/health` remains public.
* Missing API key returns `401 API_KEY_MISSING`.
* Valid API key but missing JWT returns `401 JWT_TOKEN_MISSING`.
* Valid API key but invalid JWT returns `403 JWT_TOKEN_INVALID`.
* Valid API key and valid JWT returns product data.
* `npm run test` passes.
* `npm run typecheck` passes.
* `npm run build` passes.
* Git working tree is clean.

---

## Current Stable Commits

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
```

---

## Current Next Step

Recommended next step:

```txt
Sprint 2 - Gateway Traffic Protection
```

Recommended Sprint 2 order:

1. Add in-memory rate limiting foundation.
2. Add route-level rate limit configuration.
3. Add request size limit.
4. Add basic security headers.
5. Add route-level auth configuration refinement.
6. Add automated tests for traffic protection behavior.

Reason:

The Gateway now has authentication, downstream error handling, timeout handling, route configuration, and automated tests. The next valuable production-like Gateway feature is traffic protection.

---

## Important Development Rules

Do not add complex infrastructure yet.

Do not add these before Gateway traffic protection features are stable:

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

The immediate goal is to continue making API Gateway behavior more production-like first.

---

## How the Assistant Should Continue

When continuing from this file, the assistant should continue with:

```txt
Sprint 2 - Gateway Traffic Protection
```

The assistant should continue slowly, one file or one small feature at a time.

Before coding the next step, the assistant should explain:

* What problem the step solves.
* What the expected behavior is.
* What files will be changed.
* How to test success and failure cases.
* Which unit tests and integration tests should be added.

The assistant should not skip directly to Redis, Kafka, Docker, Kubernetes, Prometheus, Grafana, or OpenTelemetry yet.
