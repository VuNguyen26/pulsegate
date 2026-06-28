# Decision Log

This file records important technical decisions made during the PulseGate project.

## 2026-06-25 - Use Node.js and TypeScript

Decision:

Use Node.js with TypeScript for the initial implementation.

Reason:

* Node.js is a good fit for backend API development.
* TypeScript improves code safety and maintainability.
* The project goal is backend-focused, so TypeScript helps reduce runtime mistakes.
* The ecosystem supports Fastify, Redis, Kafka, RabbitMQ, Prisma, OpenTelemetry, and testing tools well.

Status:

Accepted.

---

## 2026-06-25 - Use Fastify for API Gateway and Services

Decision:

Use Fastify for both API Gateway and Product Service.

Reason:

* Fastify is lightweight and fast.
* It has good TypeScript support.
* It has built-in request logging support.
* It supports route registration through plugins.
* It is suitable for learning high-traffic backend API patterns.

Status:

Accepted.

---

## 2026-06-25 - Use npm Workspaces

Decision:

Use npm workspaces for the monorepo structure.

Reason:

* The project has multiple apps inside one repository.
* It keeps API Gateway, Product Service, and shared packages in one repo.
* It is simpler than Nx, Turborepo, or pnpm workspaces for Sprint 0.
* It is enough for the current learning phase.

Current structure:

```txt
pulsegate/
  apps/
    api-gateway/
    product-service/
  packages/
    shared/
```

Status:

Accepted.

---

## 2026-06-25 - Start with the Smallest Working Flow

Decision:

Sprint 0 should only focus on the smallest working API Gateway flow.

Current flow:

```txt
Client
  -> API Gateway :3000
    -> Product Service :3001
      -> Response
```

Reason:

* Avoid adding too many technologies too early.
* Build the foundation first.
* Make sure routing, logging, request ID, health check, and error handling work before adding infrastructure.
* Keep the project local-first and cost-safe.

Not included in Sprint 0:

* Redis.
* Kafka.
* RabbitMQ.
* PostgreSQL.
* Prisma.
* Docker.
* Kubernetes.
* Prometheus.
* Grafana.
* OpenTelemetry.
* Jaeger or Tempo.
* Admin Dashboard.
* Developer Portal.

Status:

Accepted.

---

## 2026-06-25 - Use Request ID from the Beginning

Decision:

Every request should have a request ID.

Reason:

* Request ID helps debug backend issues.
* It prepares the project for observability.
* It allows request tracing across multiple services.
* It helps connect API Gateway logs and Product Service logs.

Current behavior:

```txt
Client request
  -> API Gateway creates or reuses x-request-id
  -> API Gateway forwards x-request-id to Product Service
  -> Product Service reuses the same request ID
```

Implementation:

* API Gateway has `request-id.middleware.ts`.
* Product Service has `request-id.middleware.ts`.
* API Gateway returns `x-request-id` in response headers.
* Gateway forwards `x-request-id` to Product Service.

Status:

Accepted.

---

## 2026-06-25 - Use 127.0.0.1 for Local Internal Service URL

Decision:

Use `http://127.0.0.1:3001` as the default Product Service URL inside API Gateway.

Reason:

* On Windows, `localhost` can sometimes resolve to IPv6.
* Using `127.0.0.1` is more explicit for local development.
* It helped avoid local `fetch failed` connection issues.

Current API Gateway config:

```ts
PRODUCT_SERVICE_URL:
  process.env.PRODUCT_SERVICE_URL ?? "http://127.0.0.1:3001"
```

Status:

Accepted.

---

## 2026-06-25 - Keep Docker and Kubernetes for Later

Decision:

Do not add Docker, Docker Compose, or Kubernetes in Sprint 0.

Reason:

* The current goal is to understand the core backend flow first.
* Docker will be easier after the service structure is stable.
* Kubernetes is not needed for the first working version.
* The project should stay local-first and cost-safe.

Planned order:

```txt
Sprint 0: Local Node.js services
Sprint 1: API Gateway core features
Sprint 2: Gateway traffic protection
Sprint 3: Data and infrastructure foundation
Sprint 4: Observability
Sprint 5: Event-driven architecture
Later: Kubernetes
```

Status:

Accepted.

---

## 2026-06-25 - Refactor Services into Config, Routes, and Middlewares

Decision:

Refactor both API Gateway and Product Service into separate folders:

```txt
config/
middlewares/
routes/
server.ts
```

Reason:

* `server.ts` should not contain all logic.
* Routes should be separated by responsibility.
* Middlewares should be reusable.
* Config should be centralized.
* This structure is easier to maintain when the project grows.

API Gateway current structure:

```txt
apps/api-gateway/src/
  config/
    env.ts
  middlewares/
    error-handler.middleware.ts
    request-id.middleware.ts
  routes/
    health.route.ts
    product-proxy.route.ts
  server.ts
```

Product Service current structure:

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

Status:

Accepted.

---

## 2026-06-25 - Use Mock Product Data First

Decision:

Use hard-coded mock product data in Product Service for Sprint 0.

Reason:

* The goal is to test Gateway routing first.
* Database integration should come later.
* It keeps the first version simple and easy to debug.

Current mock products:

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

Accepted.

---

## 2026-06-25 - Commit After Stable Checkpoints

Decision:

Commit after each stable technical checkpoint.

Reason:

* Makes the project history clean.
* Makes rollback easier.
* Helps show progress on GitHub.
* Good practice for real development workflow.

Current stable commits:

```txt
5d247cc feat: setup basic gateway to product service flow
207616a refactor: split api gateway routes config and middlewares
3ae7802 refactor: split product service routes config and middlewares
```

Status:

Accepted.

---

## 2026-06-26 - Normalize Downstream Service Errors

Decision:

API Gateway should normalize downstream service errors instead of exposing raw runtime errors to clients.

Reason:

* Raw errors such as `fetch failed` are not user-friendly.
* Clients should receive consistent error responses.
* Error responses should include request ID for debugging.
* Gateway behavior should be production-oriented.
* Downstream service failures should be clearly separated from Gateway internal errors.

Implemented behavior:

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

Status:

Accepted.

---

## 2026-06-26 - Add Downstream Request Timeout

Decision:

API Gateway should apply timeout when calling downstream services.

Reason:

* Gateway should not wait forever for slow downstream services.
* Slow downstream services can block client requests.
* Timeout behavior is a core production API Gateway feature.
* Timeout response should be normalized and include request ID.

Implementation:

* Use `AbortController`.
* Add `DOWNSTREAM_REQUEST_TIMEOUT_MS`.
* Default timeout is `3000ms`.
* Return `504 DOWNSTREAM_TIMEOUT` when downstream service is too slow.

Status:

Accepted.

---

## 2026-06-26 - Add Downstream Route Configuration Foundation

Decision:

Move downstream route information into a route configuration file.

Reason:

* Avoid hard-coding downstream service details directly inside route handlers.
* Make it easier to add more downstream services later.
* Keep route handlers focused on request handling.
* Prepare the Gateway for route-level configuration in later sprints.

Implementation:

```txt
apps/api-gateway/src/config/downstream-routes.ts
```

Current configured route:

```txt
GET /api/products
  -> Product Service
  -> GET http://127.0.0.1:3001/products
```

Status:

Accepted.

---

## 2026-06-26 - Use API Key Authentication for Protected Gateway Routes

Decision:

Protect `GET /api/products` with API key authentication.

Reason:

* API Gateway should support client/application-level authentication.
* API key authentication is simpler than JWT and should be added first.
* It prepares the Gateway for API management features.
* API key authentication can later evolve into database-backed API clients.

Current behavior:

```txt
Missing API key
  -> 401 API_KEY_MISSING

Invalid API key
  -> 403 API_KEY_INVALID

Valid API key
  -> Continue to next middleware
```

Current default API key header:

```txt
x-api-key
```

Current default local API key:

```txt
dev-api-key
```

Status:

Accepted.

---

## 2026-06-26 - Use Vitest for Unit and Integration Tests

Decision:

Use Vitest as the test framework for API Gateway tests.

Reason:

* Vitest works well with TypeScript and ESM.
* It is simple to configure for the current project size.
* It supports unit tests and integration-style tests.
* It provides fast feedback for Gateway behavior.
* It is lighter than setting up a more complex test framework too early.

Current test command:

```powershell
npm run test
```

Current test status:

```txt
6 test files passed
46 tests passed
```

Status:

Accepted.

---

## 2026-06-26 - Separate API Gateway App Builder from Server Startup

Decision:

Separate API Gateway app creation into `app.ts` and keep `server.ts` focused on starting the server.

Reason:

* Integration tests should not need to open port `3000`.
* Fastify `app.inject()` can test routes in memory.
* Server startup and app construction should have separate responsibilities.
* This makes the Gateway easier to test and maintain.

Implementation:

```txt
apps/api-gateway/src/app.ts
  -> buildApiGatewayApp()

apps/api-gateway/src/server.ts
  -> app.listen()
```

Status:

Accepted.

---

## 2026-06-26 - Use JWT Authentication After API Key Authentication

Decision:

Add JWT authentication after API key authentication.

Reason:

* API key identifies the client/application.
* JWT identifies the user/session.
* API Gateway should support both client-level and user-level authentication.
* Adding JWT after API key keeps the learning path clear and incremental.

Current protected route behavior:

```txt
GET /api/products
  -> Requires x-api-key
  -> Requires Authorization: Bearer <jwt-token>
```

Current behavior:

```txt
Missing JWT
  -> 401 JWT_TOKEN_MISSING

Invalid JWT
  -> 403 JWT_TOKEN_INVALID

Valid JWT
  -> Continue to Product Service
```

Status:

Accepted.

---

## 2026-06-26 - Use jose for JWT Signing and Verification

Decision:

Use `jose` for JWT signing and verification.

Reason:

* `jose` works well with ESM and TypeScript.
* It supports JWT verification with issuer, audience, expiration, and signature checks.
* It is suitable for production-style JWT handling.
* It avoids implementing JWT verification manually.

Current JWT configuration:

```txt
JWT_SECRET
JWT_ISSUER
JWT_AUDIENCE
JWT_EXPIRES_IN_SECONDS
```

Current validation checks:

```txt
Signature
Issuer
Audience
Expiration
```

Status:

Accepted.

---

## 2026-06-26 - Keep Sprint 2 Focused on Gateway Traffic Protection

Decision:

Sprint 2 should focus on Gateway traffic protection before adding infrastructure.

Reason:

* Gateway core authentication and downstream behavior are now stable.
* Rate limiting and traffic protection are natural next API Gateway features.
* Redis can be added later after in-memory behavior is understood.
* Docker, Kafka, PostgreSQL, Prometheus, and OpenTelemetry should still wait until core Gateway behavior is stronger.

Recommended Sprint 2 order:

```txt
1. In-memory rate limiting foundation
2. Route-level rate limit configuration
3. Request size limit
4. Basic security headers
5. Route-level auth configuration refinement
6. Automated tests for traffic protection behavior
```

Not included yet:

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

Status:

Accepted.

---

## 2026-06-27 - Use In-Memory Rate Limiting Before Redis

Decision:

Use an in-memory rate limiting foundation in Sprint 2 before adding Redis-backed distributed rate limiting.

Reason:

* Gateway traffic protection behavior should be understood before adding infrastructure.
* In-memory rate limiting is simple to test locally.
* It allows the project to validate rate limit behavior, response format, headers, and request flow first.
* Redis can be added later by replacing the rate limit store implementation.
* This keeps Sprint 2 focused on Gateway behavior instead of infrastructure complexity.

Implemented behavior:

```txt
GET /api/products
  -> Limited by API key and route
  -> Default: 5 requests per 60 seconds
  -> Exceeded limit returns 429 TOO_MANY_REQUESTS
```

Current limitation:

* Counters are stored in API Gateway memory.
* Counters reset when the API Gateway process restarts.
* Counters are not shared across multiple Gateway instances.
* Redis-backed rate limiting is planned for a later sprint.

Status:

Accepted.

---

## 2026-06-27 - Rate Limit by API Key and Route

Decision:

Apply rate limiting to protected Gateway routes by API key and route.

Reason:

* API key represents the calling client or application.
* Protected routes already require API key authentication.
* API-key-based rate limiting is more suitable than IP-only limiting for API Gateway behavior.
* Including the HTTP method and route path prevents unrelated routes from sharing the same quota.
* This prepares the project for future API plans and client-level traffic policies.

Current rate limit key shape:

```txt
api-key:<api-key>:route:<method>:<route-path>
```

Example:

```txt
api-key:dev-api-key:route:GET:/api/products
```

Current response when the limit is exceeded:

```json
{
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Too many requests. Please try again later.",
    "requestId": "example-request-id"
  }
}
```

Current status code:

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

Status:

Accepted.

---

## 2026-06-27 - Store Route-Level Rate Limit Configuration in Downstream Route Config

Decision:

Store product route rate limit configuration in `downstream-routes.ts`, backed by environment variables.

Reason:

* API Gateway routes should have route-level traffic rules.
* Route handlers should not hard-code traffic protection values directly.
* Environment variables make local configuration easier without changing code.
* This prepares the Gateway for future per-route and per-client traffic policies.

Implementation:

```txt
apps/api-gateway/src/config/downstream-routes.ts
```

Current environment variables:

```txt
PRODUCT_PRODUCTS_RATE_LIMIT_MAX_REQUESTS=5
PRODUCT_PRODUCTS_RATE_LIMIT_WINDOW_MS=60000
```

Current product route config:

```txt
GET /api/products
  -> 5 requests per 60 seconds
```

Status:

Accepted.

---

## 2026-06-27 - Add Request Size Limit at the Gateway Level

Decision:

API Gateway should reject requests with oversized bodies before they reach route handlers or downstream services.

Reason:

* Large request bodies can waste memory, CPU, bandwidth, and parsing time.
* Gateway should protect downstream services from oversized payloads.
* Request body size protection is a common production Gateway feature.
* The behavior should be configurable through environment variables.

Implementation:

* Add `MAX_REQUEST_BODY_BYTES`.
* Default value is `1048576` bytes.
* Add request size limit middleware.
* Configure Fastify `bodyLimit`.
* Return `413 REQUEST_BODY_TOO_LARGE` when the request body is too large.

Current default:

```txt
MAX_REQUEST_BODY_BYTES=1048576
```

Current response:

```json
{
  "error": {
    "code": "REQUEST_BODY_TOO_LARGE",
    "message": "Request body is too large",
    "requestId": "example-request-id"
  }
}
```

Current status code:

```txt
413
```

Status:

Accepted.

---

## 2026-06-27 - Add Basic Security Headers to API Gateway Responses

Decision:

API Gateway should add basic HTTP security headers to responses.

Reason:

* Security headers improve baseline HTTP response safety.
* API responses should avoid browser MIME sniffing.
* Gateway responses should prevent iframe embedding by default.
* Browser permissions such as camera, microphone, and geolocation should be disabled by default.
* The project should demonstrate production-oriented API Gateway behavior.

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

Reason HSTS is not included yet:

* The project is still local-first.
* Local development currently uses HTTP.
* HSTS should be added when HTTPS deployment is introduced.

Status:

Accepted.

---

## 2026-06-27 - Move Auth Requirements into Route Configuration

Decision:

Move route-level authentication requirements into downstream route configuration.

Reason:

* API Gateway route behavior should be driven by route configuration.
* Route handlers should not hard-code all auth requirements directly.
* Future routes may require different combinations of API key and JWT authentication.
* This prepares the Gateway for more flexible route policies.

Implementation:

```txt
apps/api-gateway/src/config/downstream-routes.ts
```

Current product route auth config:

```txt
GET /api/products
  -> requireApiKey: true
  -> requireJwt: true
```

Current request flow:

```txt
Client
  -> API Gateway
    -> Request ID
    -> Security headers
    -> Request size limit
    -> API key authentication
    -> Rate limit
    -> JWT authentication
    -> Product Service
```

Status:

Accepted.

---

## 2026-06-27 - Keep Sprint 3 Focused on Data and Infrastructure Foundation

Decision:

After Sprint 2, the next sprint should focus on data and infrastructure foundation.

Reason:

* Gateway traffic protection behavior is now stable.
* The project can now safely introduce infrastructure without hiding missing Gateway behavior.
* PostgreSQL, Prisma, Docker Compose, Redis, and caching are natural next steps.
* Kafka, RabbitMQ, Prometheus, Grafana, OpenTelemetry, Admin Dashboard, Developer Portal, and Kubernetes should still wait until the data and infrastructure foundation is stable.

Recommended Sprint 3 order:

```txt
1. Add Docker Compose foundation.
2. Add PostgreSQL service.
3. Add Product Service database foundation.
4. Add Prisma.
5. Replace mock product data with database-backed product data.
6. Add Redis service.
7. Upgrade rate limiting from in-memory store to Redis-backed store.
8. Add basic response caching.
```

Not included in Sprint 3 Step 1:

* Kafka
* RabbitMQ
* Prometheus
* Grafana
* OpenTelemetry
* Admin Dashboard
* Developer Portal
* Kubernetes

Status:

Accepted.

---

## 2026-06-28 - Add Docker Compose Foundation in Sprint 3

Decision:

Add Docker Compose foundation for local infrastructure and service orchestration.

Reason:

* Sprint 3 focuses on data and infrastructure foundation.
* API Gateway and Product Service should be runnable together in a repeatable local environment.
* PostgreSQL and Redis require local infrastructure support.
* Docker Compose makes it easier to validate multi-service behavior.
* This keeps the project local-first and cost-safe before cloud deployment.

Implemented behavior:

```txt
docker compose up --build -d
  -> api-gateway
  -> product-service
  -> postgres
  -> redis
```

Current Docker services:

```txt
pulsegate-api-gateway
pulsegate-product-service
pulsegate-postgres
pulsegate-redis
```

Status:

Accepted.

---

## 2026-06-28 - Containerize API Gateway and Product Service

Decision:

Add Dockerfiles for API Gateway and Product Service.

Reason:

* Services should run consistently inside Docker.
* Dockerized services can communicate using Docker internal service names.
* This prepares the project for future infrastructure, observability, and deployment work.
* Docker images keep local runtime behavior closer to production-style service execution.

Implemented files:

```txt
apps/api-gateway/Dockerfile
apps/product-service/Dockerfile
```

Current Docker runtime behavior:

```txt
API Gateway      -> port 3000
Product Service  -> port 3001
```

Status:

Accepted.

---

## 2026-06-28 - Use PostgreSQL as Product Service Database

Decision:

Use PostgreSQL as the database for Product Service data.

Reason:

* Product data should no longer stay hard-coded after the Gateway foundation is stable.
* PostgreSQL is a production-grade relational database.
* It is widely used in backend systems.
* It works well with Prisma.
* It can run locally through Docker Compose.

Implemented behavior:

```txt
postgres service
  -> database: pulsegate
  -> user: pulsegate
  -> password: pulsegate_password
```

Current database URL for local host mode:

```txt
postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate
```

Current database URL for Docker internal mode:

```txt
postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate
```

Status:

Accepted.

---

## 2026-06-28 - Use Prisma for Product Service Database Access

Decision:

Use Prisma as the ORM for Product Service database access.

Reason:

* Prisma provides type-safe database access.
* Prisma migrations make schema changes trackable.
* Prisma Client improves developer experience with TypeScript.
* Prisma is a good fit for a learning project that needs clean database modeling.
* Product Service can grow from a simple Product model into more realistic data models later.

Implemented files:

```txt
apps/product-service/prisma/schema.prisma
apps/product-service/prisma/migrations/20260628092746_init_products/migration.sql
apps/product-service/prisma/seed.ts
apps/product-service/src/database/prisma.ts
apps/product-service/src/products/product.repository.ts
```

Current Product model:

```txt
id
name
price
createdAt
updatedAt
```

Status:

Accepted.

---

## 2026-06-28 - Replace Mock Product Data with Database-Backed Products

Decision:

Replace hard-coded mock product data with PostgreSQL-backed product data.

Reason:

* Sprint 0 used mock data to validate the Gateway flow quickly.
* Sprint 3 needs real data storage foundation.
* Product Service should own product data and read it from its database.
* The API response shape should remain compatible with previous Gateway behavior.
* This allows later features to build on real persistence.

Implemented behavior:

```txt
GET /products
  -> Product Service
  -> Prisma Client
  -> PostgreSQL products table
  -> Return products ordered by id
```

Current seeded products:

```txt
prod_001 - Mechanical Keyboard - 120
prod_002 - Gaming Mouse - 45
```

Status:

Accepted.

---

## 2026-06-28 - Add Idempotent Product Seed Script

Decision:

Add a Product Service seed script that can be safely run multiple times.

Reason:

* Local development needs predictable sample data.
* Docker and database validation are easier with stable seed data.
* The seed script should not create duplicate products on repeated runs.
* Idempotent seeding is safer for local and CI-like workflows.

Implemented command:

```powershell
npm run db:seed -w apps/product-service
```

Implemented behavior:

```txt
upsert prod_001
upsert prod_002
```

Status:

Accepted.

---

## 2026-06-28 - Add Redis Service in Sprint 3

Decision:

Add Redis as a local infrastructure service through Docker Compose.

Reason:

* Redis is needed for distributed rate limiting.
* Redis is needed for response caching.
* Redis is a common production dependency for API Gateways.
* Adding Redis after the in-memory rate limit foundation keeps the learning path clear.
* Redis can be reused by future features such as session storage, distributed locks, and background jobs.

Implemented service:

```txt
redis
```

Validation command:

```powershell
docker compose exec redis redis-cli ping
```

Expected result:

```txt
PONG
```

Status:

Accepted.

---

## 2026-06-28 - Add Redis Client Foundation to API Gateway

Decision:

Add a Redis client module to API Gateway.

Reason:

* API Gateway needs a shared Redis connection for rate limiting and caching.
* Redis connection lifecycle should be centralized.
* App shutdown should disconnect Redis cleanly.
* Future Gateway features should reuse the same Redis client foundation.

Implemented file:

```txt
apps/api-gateway/src/redis/redis-client.ts
```

Current API Gateway Redis config:

```txt
REDIS_URL=redis://localhost:6379
```

Current Docker Redis config:

```txt
REDIS_URL=redis://redis:6379
```

Status:

Accepted.

---

## 2026-06-28 - Upgrade Product Route Rate Limiting to Redis-Backed Store

Decision:

Use Redis-backed rate limiting for `GET /api/products`.

Reason:

* In-memory rate limiting was useful for Sprint 2 learning and tests.
* In-memory counters are not shared across multiple Gateway instances.
* Redis allows distributed counters and prepares for horizontal scaling.
* The external API behavior should stay compatible with the previous rate limit behavior.
* The existing rate limit middleware should support both in-memory and Redis-backed stores.

Implemented behavior:

```txt
GET /api/products
  -> API key authentication
  -> Redis-backed rate limiting
  -> JWT authentication
```

Current Redis rate limit key:

```txt
rate-limit:api-key:dev-api-key:route:GET:/api/products
```

Current default rate limit:

```txt
5 requests per 60 seconds
```

Status:

Accepted.

---

## 2026-06-28 - Keep In-Memory Rate Limit Store for Tests and Abstraction

Decision:

Keep `InMemoryRateLimitStore` even after adding Redis-backed rate limiting.

Reason:

* Unit and integration tests should not require Redis.
* The rate limit middleware should support dependency injection.
* In-memory store is still useful for fast local tests.
* Keeping both stores makes the design more flexible.

Current behavior:

```txt
Production Docker flow
  -> RedisRateLimitStore

Injected app tests
  -> InMemoryRateLimitStore
```

Status:

Accepted.

---

## 2026-06-28 - Make Redis Rate Limit Commands Fail Fast

Decision:

Redis-backed rate limit commands should fail fast instead of hanging for a long time when Redis is unavailable.

Reason:

* API Gateway requests should not hang when Redis is down.
* A slow Redis retry loop can consume request time and make debugging confusing.
* Fail-fast behavior is better for local validation and production-style resilience.
* Redis internal errors should not be exposed to clients.

Implemented behavior:

```txt
Redis unavailable
  -> Redis command fails quickly
  -> API Gateway returns generic 500 Internal Server Error
  -> Redis internal details are not exposed in response body
```

Implementation notes:

* Redis offline queue is disabled.
* Redis reconnect strategy is disabled for the current local development setup.
* Redis command timeout is added in the rate limit store.

Status:

Accepted.

---

## 2026-06-28 - Add Redis Response Cache Store

Decision:

Add a Redis-backed response cache store to API Gateway.

Reason:

* API Gateway should reduce repeated downstream calls.
* Response caching is a common API Gateway feature.
* Redis is already available after the rate limiting upgrade.
* A dedicated cache store keeps caching logic separate from route handling.
* Cache behavior can be tested independently.

Implemented file:

```txt
apps/api-gateway/src/cache/redis-response-cache-store.ts
```

Current cache key shape:

```txt
response-cache:<method>:<route-path>
```

Current product cache key:

```txt
response-cache:GET:/api/products
```

Status:

Accepted.

---

## 2026-06-28 - Cache Product Responses in Redis

Decision:

Cache `GET /api/products` responses in Redis.

Reason:

* Product data is a good first caching example.
* Caching reduces repeated calls to Product Service.
* Caching demonstrates Gateway-level performance optimization.
* The feature prepares the project for future cache policies and invalidation strategies.

Implemented behavior:

```txt
First valid request
  -> x-cache: MISS
  -> API Gateway calls Product Service
  -> API Gateway stores response in Redis

Second valid request within TTL
  -> x-cache: HIT
  -> API Gateway returns cached response
```

Current cache TTL:

```txt
30 seconds
```

Current response headers:

```txt
x-cache: MISS
x-cache: HIT
x-cache: BYPASS
```

Status:

Accepted.

---

## 2026-06-28 - Allow Cache HIT to Serve Data When Product Service Is Down

Decision:

If Product Service is temporarily down but Redis cache has a valid response, API Gateway should return the cached response.

Reason:

* Cache should improve resilience, not only performance.
* A cached response can keep read-only endpoints available during short downstream outages.
* This behavior demonstrates a production-oriented API Gateway pattern.
* Product Service should only be required when cache is missing or expired.

Implemented behavior:

```txt
Product Service down + cache HIT
  -> 200
  -> x-cache: HIT
  -> Return cached product data

Product Service down + cache MISS
  -> 503 DOWNSTREAM_SERVICE_UNAVAILABLE
```

Status:

Accepted.

---

## 2026-06-28 - Isolate Response Cache Write Failures

Decision:

A cache write failure should not fail a request if Product Service already returned valid data.

Reason:

* Cache is an optimization layer.
* A valid downstream response should still be returned to the client.
* Cache write errors should be logged for debugging.
* Cache failures should not be incorrectly reported as downstream invalid response errors.

Implemented behavior:

```txt
Product Service returns valid JSON
  -> API Gateway attempts to write response cache
  -> If cache write fails:
       -> Log cache error
       -> Still return 200 response to client
```

Status:

Accepted.

---

## 2026-06-28 - Keep Sprint 4 Focused on Observability Foundation

Decision:

After Sprint 3 final documentation update, Sprint 4 should focus on observability foundation.

Reason:

* Gateway routing, authentication, traffic protection, data infrastructure, Redis rate limiting, and response caching are now stable.
* Observability is the next production-oriented layer.
* Metrics and dashboards should be introduced before Kafka, RabbitMQ, Kubernetes, Admin Dashboard, or Developer Portal.
* Keeping Sprint 4 focused prevents scope creep.

Recommended Sprint 4 order:

```txt
1. Add structured access logs.
2. Add request latency measurement.
3. Add basic metrics endpoint.
4. Add Prometheus service.
5. Add Grafana service.
6. Add dashboard foundation.
7. Add gateway-level observability documentation.
8. Keep OpenTelemetry for a later sprint unless explicitly needed.
```

Not included at the beginning of Sprint 4:

* Kafka
* RabbitMQ
* Kubernetes
* Admin Dashboard
* Developer Portal
* Advanced OpenTelemetry tracing
* Production cloud deployment

Status:

Accepted.
