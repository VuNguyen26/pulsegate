# PulseGate Requirements

## 1. Project Name

PulseGate - High-Traffic API Gateway & Observability Platform

## 2. Current Version

```txt
v0.4.0
```

## 3. Current Sprint

```txt
Sprint 3 - Data & Infrastructure Foundation
```

## 4. Project Purpose

PulseGate is a mini API Gateway, API Management, and Observability Platform.

The project is built to demonstrate backend engineering skills, API Gateway design, microservice communication, authentication, traffic protection, caching, local infrastructure, database-backed services, observability preparation, scalability, and production-oriented system design.

The project is inspired by:

* Kong
* Apache APISIX
* Tyk
* Apigee
* AWS API Gateway

## 5. Target Users

PulseGate is designed for:

* Backend Developers
* DevOps Engineers
* SREs
* Tech Leads
* Companies that manage many APIs or microservices

## 6. Main Problems

PulseGate aims to solve the following problems:

* Clients need one single entry point for multiple backend services.
* Backend services should not be exposed directly to external clients.
* Requests need to be routed to the correct downstream service.
* APIs need centralized authentication and authorization.
* APIs need protection from spam, abuse, excessive traffic, and unsafe payloads.
* API traffic should be logged for debugging.
* API performance should be monitored.
* Distributed request flow should be traceable across services.
* Downstream services should be protected from unnecessary repeated requests.
* Selected responses should be cached to reduce downstream load.
* Product data should come from a real database instead of hard-coded mock data.
* The system should be easy to run locally before cloud deployment.

---

## 7. Current System Overview

Current stable architecture after Sprint 3:

```txt
Client
  -> API Gateway :3000
    -> Request ID handling
    -> Basic security headers
    -> Request size limit
    -> API key authentication
    -> Redis-backed rate limiting
    -> JWT authentication
    -> Redis response cache
      -> Cache HIT:
           -> Return cached response
      -> Cache MISS:
           -> Call Product Service
           -> Store response in Redis cache
    -> Product Service :3001
      -> Prisma Client
      -> PostgreSQL :5432
      -> Database-backed product data
```

Current Docker services:

```txt
pulsegate-api-gateway
pulsegate-product-service
pulsegate-postgres
pulsegate-redis
```

Current exposed ports:

```txt
API Gateway      -> 3000
Product Service  -> 3001
PostgreSQL       -> 5432
Redis            -> 6379
```

Current public endpoint:

```txt
GET /health
```

Current protected endpoint:

```txt
GET /api/products
```

Protected endpoint requirements:

```txt
x-api-key: dev-api-key
Authorization: Bearer <jwt-token>
```

---

## 8. Sprint Status Summary

### Sprint 0 - Core Setup & Basic Gateway Flow

Status:

```txt
Done
```

Sprint 0 completed:

* Monorepo setup.
* API Gateway.
* Product Service.
* Basic Gateway-to-Product-Service proxy flow.
* Health endpoints.
* Request ID generation and propagation.
* Basic error handlers.
* Initial project documentation.
* README foundation.
* `.env.example`.

### Sprint 1 - Gateway Core Behavior

Status:

```txt
Done
```

Sprint 1 completed:

* Normalized downstream service errors.
* Downstream request timeout.
* Downstream route configuration.
* API key authentication.
* JWT authentication.
* API Gateway app builder for integration tests.
* Unit test foundation.
* Integration test foundation.
* Manual validation for protected route behavior.

### Sprint 2 - Gateway Traffic Protection

Status:

```txt
Done
```

Sprint 2 completed:

* In-memory rate limiting foundation.
* Rate limit middleware.
* Route-level rate limit configuration.
* `429 TOO_MANY_REQUESTS` response behavior.
* Request size limit.
* `413 REQUEST_BODY_TOO_LARGE` response behavior.
* Basic security headers.
* Route-level auth configuration.
* Traffic protection unit tests.
* Traffic protection integration tests.
* Manual validation for rate limit behavior.

### Sprint 3 - Data & Infrastructure Foundation

Status:

```txt
Technical implementation complete
```

Sprint 3 completed:

* Docker Compose foundation.
* API Gateway Dockerfile.
* Product Service Dockerfile.
* PostgreSQL Docker service.
* Redis Docker service.
* Product Service `DATABASE_URL` configuration.
* Prisma setup.
* Product model.
* Initial Product migration.
* Product seed script.
* Product Service database-backed product data.
* Redis client foundation in API Gateway.
* Redis-backed rate limit store.
* Redis-backed rate limiting for `GET /api/products`.
* Redis response cache store.
* Response caching for `GET /api/products`.
* `x-cache: MISS`, `x-cache: HIT`, and `x-cache: BYPASS`.
* Cache HIT behavior when Product Service is down.
* Redis fail-fast behavior.
* Response cache write failure isolation.
* Automated tests updated to `13 test files passed`, `85 tests passed`.
* Manual Docker validation completed.

---

# 9. Functional Requirements

## FR-001: API Gateway Service

The system must have an API Gateway service.

Acceptance criteria:

* API Gateway can start successfully.
* API Gateway runs on port `3000`.
* API Gateway uses Fastify.
* API Gateway uses TypeScript.
* API Gateway has JSON logging enabled.
* API Gateway has a health check endpoint.
* API Gateway can be run locally.
* API Gateway can be run through Docker Compose.

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

## FR-002: Product Service

The system must have a Product Service.

Acceptance criteria:

* Product Service can start successfully.
* Product Service runs on port `3001`.
* Product Service uses Fastify.
* Product Service uses TypeScript.
* Product Service has JSON logging enabled.
* Product Service has a health check endpoint.
* Product Service has a products endpoint.
* Product Service reads product data from PostgreSQL through Prisma.
* Product Service can be run locally.
* Product Service can be run through Docker Compose.

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

## FR-003: Gateway Product Proxy Route

API Gateway must route product requests to Product Service.

Acceptance criteria:

* Client can call API Gateway at `GET /api/products`.
* API Gateway calls Product Service at `GET /products` on cache MISS.
* API Gateway returns Product Service response to the client.
* Client does not need to call Product Service directly.
* Product Service URL is configurable through `PRODUCT_SERVICE_URL`.
* API Gateway supports Docker internal Product Service URL.

Current Gateway endpoint:

```txt
GET /api/products
```

Current local downstream endpoint:

```txt
GET http://127.0.0.1:3001/products
```

Current Docker downstream endpoint:

```txt
GET http://product-service:3001/products
```

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

## FR-005: Basic Error Handling

Both services must have basic error handling.

Acceptance criteria:

* Unknown routes return `404`.
* Error response includes a message.
* Error response includes the request path for `404`.
* Error response includes request ID.
* Unexpected server errors return `500`.
* Server errors are logged.
* Internal implementation details should not be exposed to clients.

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

## FR-006: Health Check APIs

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

## FR-007: Downstream Error Normalization

API Gateway must return clean and consistent errors when downstream services fail.

Acceptance criteria:

* Product Service unavailable returns `503 DOWNSTREAM_SERVICE_UNAVAILABLE`.
* Product Service timeout returns `504 DOWNSTREAM_TIMEOUT`.
* Product Service 5xx response returns `502 DOWNSTREAM_HTTP_ERROR`.
* Product Service invalid JSON returns `502 DOWNSTREAM_INVALID_RESPONSE`.
* Error response includes request ID.
* Error response identifies downstream service.
* Raw runtime errors are not exposed to clients.

Expected unavailable response:

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

Status:

```txt
Done
```

---

## FR-008: Downstream Request Timeout

API Gateway must stop waiting if a downstream service takes too long to respond.

Acceptance criteria:

* Gateway request to Product Service has a timeout.
* Timeout duration is configurable.
* Timeout uses `AbortController`.
* Timeout error returns a normalized error response.
* Timeout response includes request ID.
* Timeout response does not expose raw internal error details.

Current config:

```txt
DOWNSTREAM_REQUEST_TIMEOUT_MS=3000
```

Expected timeout response:

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

Status:

```txt
Done
```

---

## FR-009: API Key Authentication

API Gateway must support API key authentication for protected routes.

Acceptance criteria:

* API Gateway checks API key from request headers.
* Missing API key returns `401 API_KEY_MISSING`.
* Invalid API key returns `403 API_KEY_INVALID`.
* Valid API key allows request to continue.
* API key header name is configurable.
* API key list is configurable through environment variables.

Current header:

```txt
x-api-key
```

Current local development API key:

```txt
dev-api-key
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

Status:

```txt
Done
```

---

## FR-010: JWT Authentication

API Gateway must support JWT authentication for protected routes.

Acceptance criteria:

* API Gateway accepts Bearer token.
* Missing token returns `401 JWT_TOKEN_MISSING`.
* Invalid token returns `403 JWT_TOKEN_INVALID`.
* Valid token allows request to continue.
* JWT configuration is controlled through environment variables.
* JWT validation checks signature, issuer, audience, and expiration.
* Verified JWT payload is attached to `request.jwtPayload`.

Current header:

```txt
Authorization: Bearer <jwt-token>
```

Current local JWT configuration:

```txt
JWT_SECRET=local-dev-jwt-secret-change-me
JWT_ISSUER=pulsegate-api-gateway
JWT_AUDIENCE=pulsegate-clients
JWT_EXPIRES_IN_SECONDS=900
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

Status:

```txt
Done
```

---

## FR-011: Request Size Limit

API Gateway must reject oversized request bodies.

Acceptance criteria:

* Gateway has configurable request body size limit.
* Gateway checks `content-length` before route handlers.
* Gateway returns `413 REQUEST_BODY_TOO_LARGE` when content length exceeds the configured limit.
* Error response includes request ID.
* Fastify body parser has configured body limit.

Current config:

```txt
MAX_REQUEST_BODY_BYTES=1048576
```

That equals:

```txt
1MB
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

Status:

```txt
Done
```

---

## FR-012: Basic Security Headers

API Gateway must add basic HTTP security headers to responses.

Acceptance criteria:

* Gateway adds basic security headers globally.
* Health route responses include security headers.
* Protected route responses include security headers.
* Error responses receive baseline security headers.
* Security header behavior is covered by automated tests.

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

Status:

```txt
Done
```

---

## FR-013: Route-Level Configuration

API Gateway must support route-level configuration for downstream routing, auth requirements, timeout, and rate limit.

Acceptance criteria:

* Product route config declares downstream service name.
* Product route config declares Gateway path.
* Product route config declares downstream URL.
* Product route config declares HTTP method.
* Product route config declares timeout.
* Product route config declares API key requirement.
* Product route config declares JWT requirement.
* Product route config declares rate limit values.
* Route config remains separated from route handler logic.

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

Status:

```txt
Done
```

---

## FR-014: Redis-Backed Rate Limiting

API Gateway must support Redis-backed rate limiting for protected routes.

Acceptance criteria:

* API Gateway stores rate limit counters in Redis.
* API Gateway rate limits by API key, HTTP method, and route path.
* API Gateway returns the same external response behavior as the previous in-memory rate limiter.
* API Gateway returns `429 TOO_MANY_REQUESTS` when the limit is exceeded.
* API Gateway returns rate limit headers.
* Product Service is not called for blocked requests.
* Redis rate limit commands fail fast when Redis is unavailable.
* Redis internal errors are not exposed to clients.

Current default product route rate limit:

```txt
5 requests per 60 seconds
```

Current logical rate limit key:

```txt
api-key:<api-key>:route:<method>:<route-path>
```

Current Redis rate limit key:

```txt
rate-limit:api-key:<api-key>:route:<method>:<route-path>
```

Example Redis key:

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

Expected headers:

```txt
x-ratelimit-limit
x-ratelimit-remaining
x-ratelimit-reset
retry-after
```

Status:

```txt
Done
```

---

## FR-015: Docker Compose Local Infrastructure

The project must support local infrastructure through Docker Compose.

Acceptance criteria:

* API Gateway can run in Docker Compose.
* Product Service can run in Docker Compose.
* PostgreSQL can run in Docker Compose.
* Redis can run in Docker Compose.
* PostgreSQL has a healthcheck.
* Redis has a healthcheck.
* Product Service waits for healthy PostgreSQL.
* API Gateway waits for healthy Redis and healthy Product Service.
* Developer can start the local stack with one command.

Current command:

```powershell
docker compose up --build -d
```

Current services:

```txt
api-gateway
product-service
postgres
redis
```

Status:

```txt
Done
```

---

## FR-016: PostgreSQL Database

Product Service must use PostgreSQL for product data.

Acceptance criteria:

* PostgreSQL is available through Docker Compose.
* PostgreSQL has a `pulsegate` database.
* PostgreSQL stores Product Service data.
* Database connection is configurable through `DATABASE_URL`.
* Product Service uses Docker internal database URL inside Docker.
* Product Service can use local host database URL in local host mode.

Current database:

```txt
pulsegate
```

Current local host database URL:

```txt
postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate
```

Current Docker internal database URL:

```txt
postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate
```

Status:

```txt
Done
```

---

## FR-017: Prisma Product Model

Product Service must use Prisma as the ORM for product data.

Acceptance criteria:

* Product Service has Prisma Client dependency.
* Product Service has Prisma CLI dependency.
* Product Service has Prisma schema.
* Prisma schema defines a Product model.
* Prisma migration creates `products` table.
* Prisma Client can be generated.
* Product seed script can insert or update sample products.
* Seed script is idempotent.

Current Prisma schema location:

```txt
apps/product-service/prisma/schema.prisma
```

Current migration location:

```txt
apps/product-service/prisma/migrations/20260628092746_init_products/migration.sql
```

Current seed script:

```txt
apps/product-service/prisma/seed.ts
```

Current Product model fields:

```txt
id
name
price
createdAt
updatedAt
```

Current seed products:

```txt
prod_001 - Mechanical Keyboard - 120
prod_002 - Gaming Mouse - 45
```

Status:

```txt
Done
```

---

## FR-018: Database-Backed Product Endpoint

Product Service must return products from PostgreSQL instead of hard-coded mock data.

Acceptance criteria:

* Product Service has a Prisma database helper.
* Product Service has a Product repository.
* Product route reads products from database.
* Product route returns products ordered by id.
* Product route response shape remains compatible with previous mock response.
* API Gateway receives the same product response shape through the proxy route.
* Product Service disconnects Prisma client on server close.

Current response:

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

## FR-019: Redis Response Caching

API Gateway must cache selected downstream responses in Redis.

Acceptance criteria:

* API Gateway can store product responses in Redis.
* API Gateway can read cached product responses from Redis.
* `GET /api/products` returns `x-cache: MISS` when the response is not cached.
* `GET /api/products` returns `x-cache: HIT` when cached response is used.
* Cache key is stable.
* Cache TTL is applied.
* Product Service is not called on cache HIT.
* Cache write failure does not fail an otherwise valid downstream response.
* Product Service down + cache HIT returns cached response successfully.
* Product Service down + cache MISS returns normalized downstream error.
* Redis cache commands fail fast when Redis is unavailable.

Current Redis cache key:

```txt
response-cache:GET:/api/products
```

Current cache TTL:

```txt
30 seconds
```

Expected cache behavior:

```txt
First valid request after cache clear
  -> 200
  -> x-cache: MISS
  -> Product Service is called
  -> Response is stored in Redis

Second valid request within TTL
  -> 200
  -> x-cache: HIT
  -> Cached response is returned
```

Status:

```txt
Done
```

---

## FR-020: Automated Tests

The project must include automated tests for Gateway behavior.

Acceptance criteria:

* Tests can be run with `npm run test`.
* API Gateway can be tested without opening port `3000`.
* API Gateway integration tests use `app.inject()`.
* Test output does not include unnecessary Fastify JSON logs.
* Unit tests cover middleware and helper behavior.
* Integration tests cover protected route behavior.
* Test, typecheck, and build must pass before committing stable checkpoints.

Current test framework:

```txt
Vitest
```

Current automated test status:

```txt
13 test files passed
85 tests passed
```

Current test command:

```powershell
npm run test
```

Status:

```txt
Done
```

---

# 10. Non-Functional Requirements

## NFR-001: Local First

The project must run locally before any cloud deployment.

Acceptance criteria:

* API Gateway can run locally.
* Product Service can run locally.
* PostgreSQL can run locally through Docker Compose.
* Redis can run locally through Docker Compose.
* No paid cloud infrastructure is required.
* Developer can test the full flow from local terminal.

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
* All current features run locally.

Status:

```txt
Done
```

---

## NFR-003: Maintainable Structure

The codebase must be organized clearly.

Acceptance criteria:

* API Gateway separates app building, config, routes, middlewares, errors, Redis client, cache stores, rate limit stores, tests, and server startup.
* Product Service separates config, database helper, repositories, routes, middlewares, and server startup.
* Prisma files are located under Product Service.
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

## NFR-004: Type Safety

The project must use TypeScript with strict checking.

Acceptance criteria:

* TypeScript is configured.
* `npm run typecheck` passes.
* `npm run build` passes.
* Services use TypeScript source files.
* Prisma seed script has its own TypeScript config.

Status:

```txt
Done
```

---

## NFR-005: Observability Foundation

The project must prepare for future observability.

Acceptance criteria:

* JSON logger is enabled.
* Request ID exists.
* Request ID is propagated across services.
* Error responses include request ID.
* API Gateway forwards `x-request-id` to Product Service.
* Integration tests verify request ID response header and downstream forwarding behavior.
* Gateway already has enough request flow structure to add structured access logs and metrics in Sprint 4.

Status:

```txt
Done
```

---

## NFR-006: Testability Foundation

The project must support automated testing for Gateway core behavior.

Acceptance criteria:

* Test framework is installed.
* Tests can be run with `npm run test`.
* API Gateway can be tested without opening port `3000`.
* API Gateway integration tests can use `app.inject()`.
* Tests can inject in-memory rate limit store instead of Redis when needed.
* Test output does not include unnecessary Fastify JSON logs.

Status:

```txt
Done
```

---

## NFR-007: Failure Isolation

Non-critical infrastructure failures should not break successful business responses when avoidable.

Acceptance criteria:

* Downstream failures are normalized.
* Redis command failures fail fast.
* Redis internal errors are not exposed to clients.
* Cache write failure does not fail a successful Product Service response.
* Cache HIT can serve data even when Product Service is temporarily down.

Status:

```txt
Done
```

---

# 11. Current System Constraints

Current constraints after Sprint 3 completion:

* API Gateway currently proxies only Product Service.
* API key list is still environment-based.
* JWT validation is local-secret based.
* There is no user service yet.
* There is no API consumer database yet.
* Product data is database-backed, but only a minimal Product model exists.
* Product Service has no create/update/delete product APIs yet.
* Response cache TTL is currently fixed in code at 30 seconds.
* Redis-backed rate limiting is implemented for `GET /api/products`, not for multiple dynamic routes yet.
* Redis failure currently causes protected product route to return generic `500`.
* There is no metrics endpoint yet.
* There is no Prometheus service yet.
* There is no Grafana dashboard yet.
* There is no distributed tracing yet.
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
                    -> 200
                    -> x-cache: HIT
                    -> Return cached product data
                  -> If cache MISS:
                    -> API Gateway calls Product Service
                    -> Product Service reads products from PostgreSQL using Prisma
                    -> Product Service returns product data
                    -> API Gateway stores response in Redis cache
                    -> API Gateway returns 200 with x-cache: MISS
```

## Public Health Flow

```txt
Client
  -> GET http://localhost:3000/health
    -> API Gateway creates or reuses x-request-id
    -> API Gateway adds basic security headers
    -> API Gateway applies request size limit
    -> API Gateway returns health response
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

## Redis Failure Behavior

```txt
Redis unavailable
  -> API Gateway fails fast
  -> Product route returns generic 500 Internal Server Error
  -> Redis internal details are not exposed to the client
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

---

# 14. Current Test Commands

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

Validate PostgreSQL tables:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "\dt"
```

Validate product data:

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

Expected result:

```txt
Attempt 1 -> 200, Remaining 4
Attempt 2 -> 200, Remaining 3
Attempt 3 -> 200, Remaining 2
Attempt 4 -> 200, Remaining 1
Attempt 5 -> 200, Remaining 0
Attempt 6 -> 429 TOO_MANY_REQUESTS
```

Check Redis rate limit key:

```powershell
docker compose exec redis redis-cli GET "rate-limit:api-key:dev-api-key:route:GET:/api/products"
docker compose exec redis redis-cli TTL "rate-limit:api-key:dev-api-key:route:GET:/api/products"
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

Expected result:

```txt
Request 1 -> 200, x-cache: MISS
Request 2 -> 200, x-cache: HIT
```

Check Redis response cache key:

```powershell
docker compose exec redis redis-cli GET "response-cache:GET:/api/products"
docker compose exec redis redis-cli TTL "response-cache:GET:/api/products"
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

# 15. Automated Test Status

Current test framework:

```txt
Vitest
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

# 16. Sprint Definitions of Done

## Sprint 0 Definition of Done

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

## Sprint 1 Definition of Done

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

## Sprint 2 Definition of Done

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

## Sprint 3 Definition of Done

Sprint 3 is done when:

* Docker Compose can run the local stack.
* API Gateway has a Dockerfile.
* Product Service has a Dockerfile.
* PostgreSQL service is available through Docker Compose.
* Redis service is available through Docker Compose.
* Product Service has `DATABASE_URL` configuration.
* Product Service uses Prisma.
* Prisma Product model exists.
* Initial Product migration exists.
* Product seed script exists and is idempotent.
* Product Service reads products from PostgreSQL.
* API Gateway has Redis client foundation.
* API Gateway uses Redis-backed rate limiting for `GET /api/products`.
* Redis rate limit key is created and incremented.
* Rate limit behavior remains externally compatible with Sprint 2.
* API Gateway has Redis response cache store.
* API Gateway caches product responses in Redis.
* API Gateway returns `x-cache: MISS` on cache MISS.
* API Gateway returns `x-cache: HIT` on cache HIT.
* API Gateway can return cached data when Product Service is down.
* Redis failures fail fast and do not expose internal Redis errors.
* Cache write failures are isolated from valid downstream responses.
* `npm run test` passes.
* `npm run typecheck` passes.
* `npm run build` passes.
* Docker validation passes.
* Code is pushed to GitHub.

Current Sprint 3 status:

```txt
Technical implementation complete
```

---

# 17. Future Functional Requirements

These requirements are planned for later sprints.

## Future FR: Observability Metrics

API Gateway should expose basic metrics.

Planned features:

* Request count metrics.
* Request duration metrics.
* Route-level metrics.
* Status-code-level metrics.
* Basic `/metrics` endpoint.
* Prometheus scraping.

Status:

```txt
Planned for Sprint 4
```

---

## Future FR: Grafana Dashboard

The system should provide a local Grafana dashboard.

Planned features:

* Prometheus service.
* Grafana service.
* API Gateway dashboard.
* Request rate panel.
* Latency panel.
* Error rate panel.

Status:

```txt
Planned for Sprint 4
```

---

## Future FR: Structured Access Logs

API Gateway should produce structured access logs.

Planned features:

* Log method.
* Log route.
* Log status code.
* Log request ID.
* Log latency.
* Log cache status.
* Log downstream service when relevant.

Status:

```txt
Planned for Sprint 4
```

---

## Future FR: Distributed Tracing

The system should support distributed tracing later.

Planned features:

* OpenTelemetry instrumentation.
* Trace ID propagation.
* Span generation.
* Jaeger or Tempo trace viewer.

Status:

```txt
Planned for later sprint
```

---

## Future FR: Event-Driven Architecture

The system should support event streaming and background processing later.

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

The system should eventually support an Admin Dashboard.

Planned features:

* View services.
* View routes.
* View API consumers.
* View API keys.
* View traffic metrics.
* View logs and status.

Status:

```txt
Planned for later sprint
```

---

## Future FR: Developer Portal

The system should eventually support a Developer Portal.

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

The system should eventually support Kubernetes deployment.

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
Sprint 3 - Final Documentation Update
```

After Sprint 3 final documentation update, move to:

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
8. Keep advanced OpenTelemetry tracing for a later sprint unless explicitly needed.

Do not add these before the Sprint 4 foundation is stable:

* Kafka
* RabbitMQ
* Kubernetes
* Admin Dashboard
* Developer Portal
* Advanced OpenTelemetry tracing
* Production cloud deployment
