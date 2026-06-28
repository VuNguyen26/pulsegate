# AI Handoff

## Project Name

PulseGate - High-Traffic API Gateway & Observability Platform

## Current Version

v0.4.0

## Current Sprint

Sprint 3 - Data & Infrastructure Foundation

## Current Status

Sprint 0 is complete.

Sprint 1 is complete.

Sprint 2 is complete.

Sprint 3 technical implementation is complete.

PulseGate currently has a stable local-first API Gateway and infrastructure foundation with:

* Docker Compose.
* API Gateway container.
* Product Service container.
* PostgreSQL.
* Prisma.
* Database-backed Product Service data.
* Redis.
* Redis-backed rate limiting.
* Redis response caching.
* API key authentication.
* JWT authentication.
* Request size protection.
* Basic security headers.
* Downstream timeout handling.
* Normalized downstream error handling.
* Automated tests.

Current automated test status:

```txt
13 test files passed
85 tests passed
```

Latest validation status:

```txt
npm run test       -> passed
npm run typecheck  -> passed
npm run build      -> passed
docker compose up --build -d -> passed
```

Current technical implementation is ready for:

```txt
Sprint 3 - Final Documentation Update
```

After final documentation update, the project can move to:

```txt
Sprint 4 - Observability Foundation
```

Recommended Sprint 4 direction:

1. Add structured access logs.
2. Add request latency measurement.
3. Add basic metrics endpoint.
4. Add Prometheus service.
5. Add Grafana service.
6. Add dashboard foundation.
7. Add gateway-level observability documentation.
8. Keep advanced OpenTelemetry tracing for a later sprint unless explicitly needed.

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
* What behavior is already stable.
* What tests currently exist.
* How Docker, PostgreSQL, Prisma, Redis, rate limiting, and caching currently work.

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

Preferred response style:

* Vietnamese explanation.
* Clear step-by-step instructions.
* Code sample first when implementing.
* Explain why the code is written that way.
* Keep Sprint scope controlled.
* Avoid jumping too far ahead into complex infrastructure.
* Prefer small, stable checkpoints.
* Review terminal output carefully before moving to the next step.

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
* Validate API keys and JWT tokens.
* Apply rate limiting.
* Add request size protection.
* Add security headers.
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

Current stable architecture:

```txt
Client
  -> API Gateway :3000
    -> Request ID handling
    -> Basic security headers
    -> Request size limit
    -> API key authentication for protected routes
    -> Redis-backed rate limiting by API key and route
    -> JWT authentication for protected routes
    -> Redis response cache
      -> Cache HIT:
           -> Return cached product response
      -> Cache MISS:
           -> Downstream route configuration
           -> Downstream timeout handling
           -> Normalized downstream error handling
           -> Product Service :3001
             -> Prisma Client
             -> PostgreSQL :5432
             -> Database-backed product response
           -> Store response in Redis cache
    -> Return response to Client
```

Current Docker services:

```txt
pulsegate-api-gateway
pulsegate-product-service
pulsegate-postgres
pulsegate-redis
```

Current service ports:

```txt
API Gateway      -> 3000
Product Service  -> 3001
PostgreSQL       -> 5432
Redis            -> 6379
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

Current public endpoint:

```txt
GET http://localhost:3000/health
```

The health endpoint does not require API key or JWT.

---

## Current Protected Request Flow

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
                -> API Gateway checks Redis response cache
                  -> If cache HIT:
                    -> 200 with x-cache: HIT
                    -> Return cached products
                  -> If cache MISS:
                    -> API Gateway calls Product Service
                    -> Product Service reads products from PostgreSQL using Prisma
                    -> Product Service returns database-backed product data
                    -> API Gateway stores response in Redis cache
                    -> API Gateway returns 200 with x-cache: MISS
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

Currently implemented:

* npm workspaces monorepo.
* TypeScript strict mode.
* API Gateway.
* Product Service.
* Docker Compose local infrastructure.
* PostgreSQL service.
* Redis service.
* Prisma schema, migration, and seed script.
* Database-backed Product Service products.
* Request ID middleware.
* Error handler middleware.
* Downstream service error class.
* Downstream route configuration.
* API key authentication middleware.
* JWT authentication middleware.
* In-memory rate limit store for tests and local abstractions.
* Redis-backed rate limit store.
* Rate limit middleware supporting async stores.
* Redis response cache store.
* Request size limit middleware.
* Security headers middleware.
* API Gateway app builder for integration tests.
* Unit tests.
* Integration tests.
* GitHub-ready README.
* Project context documentation.
* Architecture documentation.
* Requirements documentation.
* `.env.example`.

Not added yet:

* Kafka.
* RabbitMQ.
* Kubernetes.
* Prometheus.
* Grafana.
* OpenTelemetry.
* Jaeger or Tempo.
* Loki.
* k6.
* Admin Dashboard.
* Developer Portal.
* Production cloud deployment.

---

## Repository Structure

```txt
pulsegate/
  apps/
    api-gateway/
      src/
        app.ts
        app.test.ts
        cache/
          redis-response-cache-store.ts
          redis-response-cache-store.test.ts
        config/
          downstream-routes.ts
          downstream-routes.test.ts
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
          rate-limit.middleware.ts
          rate-limit.middleware.test.ts
          request-id.middleware.ts
          request-id.middleware.test.ts
          request-size-limit.middleware.ts
          request-size-limit.middleware.test.ts
          security-headers.middleware.ts
          security-headers.middleware.test.ts
        rate-limit/
          in-memory-rate-limit-store.ts
          in-memory-rate-limit-store.test.ts
          redis-rate-limit-store.ts
          redis-rate-limit-store.test.ts
        redis/
          redis-client.ts
        routes/
          health.route.ts
          product-proxy.route.ts
        server.ts
      Dockerfile
      package.json
      tsconfig.json
      vitest.config.ts

    product-service/
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
      Dockerfile
      package.json
      tsconfig.json

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
GET /api/products
```

Current route protection:

```txt
GET /health
  -> Public

GET /api/products
  -> Requires API key
  -> Redis-backed rate limited by API key and route
  -> Requires JWT Bearer token
  -> Uses Redis response cache
```

Current responsibilities:

* Receive client requests.
* Generate or reuse request ID.
* Return `x-request-id` response header.
* Add basic security headers.
* Apply request size limit.
* Route `/api/products` to Product Service `/products` on cache MISS.
* Return cached response on cache HIT.
* Forward `x-request-id` to Product Service.
* Return downstream response to client.
* Handle 404 errors.
* Handle basic 500 errors.
* Log requests in JSON format.
* Normalize downstream service errors.
* Return `503 DOWNSTREAM_SERVICE_UNAVAILABLE` when Product Service is down and cache MISS.
* Apply downstream request timeout.
* Return `504 DOWNSTREAM_TIMEOUT` when Product Service is too slow and cache MISS.
* Return `502 DOWNSTREAM_HTTP_ERROR` when Product Service returns 5xx.
* Return `502 DOWNSTREAM_INVALID_RESPONSE` when Product Service returns invalid JSON.
* Store downstream route information in route config.
* Store route-level auth requirements in route config.
* Store route-level rate limit values in route config.
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
* Return `x-cache: BYPASS` when cache is disabled in injected tests.
* Support automated integration tests using `buildApiGatewayApp()` and `app.inject()`.

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
* Read products from PostgreSQL using Prisma Client.
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
products
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
JWT_SECRET
JWT_ISSUER
JWT_AUDIENCE
JWT_EXPIRES_IN_SECONDS
PRODUCT_PRODUCTS_RATE_LIMIT_MAX_REQUESTS
PRODUCT_PRODUCTS_RATE_LIMIT_WINDOW_MS
REDIS_URL
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
DATABASE_URL=postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate
REDIS_URL=redis://redis:6379
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

Purpose:

* Easier debugging.
* Prepare for observability.
* Prepare for distributed tracing later.
* Connect logs between Gateway and downstream services.

Covered by tests:

```txt
apps/api-gateway/src/middlewares/request-id.middleware.test.ts
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
Missing API key
  -> 401 API_KEY_MISSING

Invalid API key
  -> 403 API_KEY_INVALID

Valid API key
  -> Request continues to Redis-backed route-level rate limiting
```

Covered by tests:

```txt
apps/api-gateway/src/middlewares/api-key-auth.middleware.test.ts
apps/api-gateway/src/app.test.ts
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
Missing Bearer token
  -> 401 JWT_TOKEN_MISSING

Invalid Bearer token
  -> 403 JWT_TOKEN_INVALID

Valid Bearer token
  -> Request continues to Redis response cache
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

Current behavior:

```txt
Allowed requests within the window
  -> Continue to JWT authentication

Exceeded rate limit
  -> 429 TOO_MANY_REQUESTS
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
apps/api-gateway/src/app.test.ts
```

---

## Response Cache Behavior

Redis response caching is implemented for:

```txt
GET /api/products
```

Current Redis cache key:

```txt
response-cache:GET:/api/products
```

Current behavior:

```txt
First valid request
  -> Cache MISS
  -> API Gateway calls Product Service
  -> API Gateway stores response in Redis
  -> Response header: x-cache: MISS

Second valid request within TTL
  -> Cache HIT
  -> API Gateway returns cached response from Redis
  -> Response header: x-cache: HIT
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
```

Manually validated:

```txt
Request 1 -> 200, x-cache: MISS
Request 2 -> 200, x-cache: HIT
Product Service stopped
Request 3 with cache HIT -> 200, x-cache: HIT
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

## Route Configuration Behavior

Current route config file:

```txt
apps/api-gateway/src/config/downstream-routes.ts
```

Current product route config includes:

```txt
serviceName
gatewayPath
downstreamUrl
method
timeoutMs
auth
rateLimit
```

Current product route auth config:

```txt
GET /api/products
  -> requireApiKey: true
  -> requireJwt: true
```

Current product route rate limit config:

```txt
GET /api/products
  -> limit: PRODUCT_PRODUCTS_RATE_LIMIT_MAX_REQUESTS
  -> windowMs: PRODUCT_PRODUCTS_RATE_LIMIT_WINDOW_MS
```

Covered by tests:

```txt
apps/api-gateway/src/config/downstream-routes.test.ts
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

## PostgreSQL and Prisma Behavior

PostgreSQL is used by Product Service.

Current database:

```txt
pulsegate
```

Current Product Service database URL for local host mode:

```txt
postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate
```

Current Product Service database URL for Docker mode:

```txt
postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate
```

Prisma schema location:

```txt
apps/product-service/prisma/schema.prisma
```

Seed script location:

```txt
apps/product-service/prisma/seed.ts
```

Migration location:

```txt
apps/product-service/prisma/migrations/20260628092746_init_products/migration.sql
```

Current seed command:

```powershell
npm run db:seed -w apps/product-service
```

Current Prisma generate command:

```powershell
npm run db:generate -w apps/product-service
```

Current seeded products:

```txt
prod_001 - Mechanical Keyboard - 120
prod_002 - Gaming Mouse - 45
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
13 test files passed
85 tests passed
```

Current unit tests:

```txt
apps/api-gateway/src/middlewares/request-id.middleware.test.ts
  -> 4 tests

apps/api-gateway/src/middlewares/api-key-auth.middleware.test.ts
  -> 4 tests

apps/api-gateway/src/middlewares/jwt-auth.middleware.test.ts
  -> 9 tests

apps/api-gateway/src/rate-limit/in-memory-rate-limit-store.test.ts
  -> 9 tests

apps/api-gateway/src/rate-limit/redis-rate-limit-store.test.ts
  -> 7 tests

apps/api-gateway/src/middlewares/rate-limit.middleware.test.ts
  -> 5 tests

apps/api-gateway/src/cache/redis-response-cache-store.test.ts
  -> 7 tests

apps/api-gateway/src/middlewares/request-size-limit.middleware.test.ts
  -> 6 tests

apps/api-gateway/src/middlewares/security-headers.middleware.test.ts
  -> 1 test

apps/api-gateway/src/errors/downstream-service-error.test.ts
  -> 5 tests

apps/api-gateway/src/config/env.test.ts
  -> 14 tests

apps/api-gateway/src/config/downstream-routes.test.ts
  -> 2 tests
```

Current integration tests:

```txt
apps/api-gateway/src/app.test.ts
  -> 12 tests
```

Integration test coverage:

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

Seed Product Service database:

```powershell
npm run db:seed -w apps/product-service
```

Generate Prisma Client:

```powershell
npm run db:generate -w apps/product-service
```

Validate PostgreSQL:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "\dt"
```

Validate products:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "SELECT id, name, price FROM products ORDER BY id;"
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
$res1.Content

$res2 = Invoke-WebRequest http://localhost:3000/api/products `
  -Headers $headers `
  -UseBasicParsing

$res2.StatusCode
$res2.Headers["x-cache"]
$res2.Content
```

Expected response cache behavior:

```txt
Request 1 -> 200, x-cache: MISS
Request 2 -> 200, x-cache: HIT
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

## Current Stable Commits

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
Sprint 3 - Final Documentation Update
```

After final documentation update, move to:

```txt
Sprint 4 - Observability Foundation
```

Recommended Sprint 4 order:

1. Add structured access logs.
2. Add request latency measurement.
3. Add basic metrics endpoint.
4. Add Prometheus service.
5. Add Grafana service.
6. Add dashboard foundation.
7. Add gateway-level observability documentation.
8. Keep OpenTelemetry for a later sprint unless explicitly needed.

Reason:

The Gateway now has routing, request ID propagation, authentication, downstream error handling, timeout handling, route configuration, traffic protection, Docker infrastructure, PostgreSQL-backed Product Service data, Redis-backed rate limiting, Redis response caching, and automated tests.

The next valuable production-like step is observability.

---

## Important Development Rules

Do not jump directly to advanced infrastructure before Sprint 4 foundations are stable.

Do not add these at the beginning of Sprint 4:

* Kafka
* RabbitMQ
* Kubernetes
* Admin Dashboard
* Developer Portal
* Advanced OpenTelemetry tracing
* Complex service discovery
* Production cloud deployment

Sprint 4 should focus on observability foundation only:

* Structured access logs.
* Request latency measurement.
* Basic metrics endpoint.
* Prometheus.
* Grafana.
* Simple dashboard foundation.
* Documentation for observability behavior.

The project should continue with small, stable checkpoints.

Each new feature should follow this workflow:

1. Implement code in small steps.
2. Explain purpose and request flow.
3. Run local tests.
4. Run `npm run test`.
5. Run `npm run typecheck`.
6. Run `npm run build`.
7. Commit after stable checkpoint.
8. Push after each stable commit.
9. Update project context docs after the sprint.

---

## How the Assistant Should Continue

When continuing from this file, the assistant should continue with:

```txt
Sprint 3 - Final Documentation Update
```

If Sprint 3 final documentation update is already complete, continue with:

```txt
Sprint 4 - Observability Foundation
```

The assistant should continue slowly, one file or one small feature at a time.

Before coding the next step, the assistant should explain:

* What problem the step solves.
* What the expected behavior is.
* What files will be changed.
* How to test success and failure cases.
* Which unit tests and integration tests should be added.

The assistant should not skip directly to Kafka, RabbitMQ, Kubernetes, Admin Dashboard, Developer Portal, or advanced OpenTelemetry yet.
