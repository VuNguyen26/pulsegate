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

Planned order at that time:

```txt
Sprint 0: Local Node.js services
Sprint 1: API Gateway core features
Sprint 2: Gateway traffic protection
Sprint 3: Data and infrastructure foundation
Sprint 4: Observability
Later: Event-driven architecture and Kubernetes
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

Current configured route at that time:

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

Initial test status when accepted:

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

Current limitation at that time:

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

Current Docker services at that time:

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

---

## 2026-06-29 - Add Structured Access Logs to API Gateway

Decision:

Add structured access logs to API Gateway for completed HTTP requests.

Reason:

* API Gateway should provide clear request-level visibility.
* Logs should be machine-readable and useful for debugging.
* Structured logs make it easier to search by request ID, route, status code, latency, and cache status.
* Logs should prepare the project for future log aggregation tools such as Loki or cloud log systems.
* Sensitive authentication data should not be logged.

Implemented behavior:

```txt
API Gateway request completes
  -> Write structured JSON access log
```

Current access log event:

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

Sensitive values intentionally not logged:

```txt
x-api-key
authorization
cookie
```

Implemented files:

```txt
apps/api-gateway/src/middlewares/access-log.middleware.ts
apps/api-gateway/src/middlewares/access-log.middleware.test.ts
```

Status:

Accepted.

---

## 2026-06-29 - Add Response Time Header

Decision:

Add `x-response-time-ms` response header to API Gateway responses.

Reason:

* Clients and developers should be able to quickly see request latency.
* Response latency is useful during manual testing.
* It supports observability without requiring Prometheus or Grafana for every local check.
* It prepares the project for latency metrics and dashboard panels.

Implemented behavior:

```txt
API Gateway response
  -> Includes x-response-time-ms
```

Example:

```txt
x-response-time-ms: 4.32
```

Implementation notes:

* The value is measured using high-resolution time.
* The value is formatted in milliseconds.
* The value uses two decimal places.
* The header is added before the response is sent.

Implemented files:

```txt
apps/api-gateway/src/middlewares/access-log.middleware.ts
apps/api-gateway/src/middlewares/access-log.middleware.test.ts
```

Status:

Accepted.

---

## 2026-06-29 - Use prom-client for Prometheus Metrics

Decision:

Use `prom-client` to create Prometheus-compatible metrics inside API Gateway.

Reason:

* Prometheus is a common production monitoring standard.
* `prom-client` is a widely used Node.js library for Prometheus metrics.
* It supports counters, histograms, registries, and Prometheus text format.
* It allows the project to expose metrics without building a custom metrics format.
* It keeps the implementation local-first and Docker-friendly.

Implemented metrics:

```txt
http_requests_total
http_request_duration_seconds
http_response_cache_total
```

Metric behavior:

```txt
http_requests_total
  -> Counts HTTP requests by method, route, and status_code

http_request_duration_seconds
  -> Records request duration in seconds by method, route, and status_code

http_response_cache_total
  -> Counts cache outcomes by route and cache_status
```

Supported cache statuses:

```txt
HIT
MISS
BYPASS
```

Implemented files:

```txt
apps/api-gateway/src/observability/metrics.ts
apps/api-gateway/src/observability/metrics.test.ts
```

Status:

Accepted.

---

## 2026-06-29 - Add Metrics Middleware to API Gateway

Decision:

Add metrics middleware to record HTTP request metrics after each response completes.

Reason:

* Metrics collection should be automatic for all Gateway requests.
* Route handlers should not manually update metrics.
* Metrics should capture final response status code.
* Metrics should use route labels instead of raw URLs to avoid high-cardinality metrics.
* Cache metrics should be recorded from the `x-cache` response header.

Implemented behavior:

```txt
API Gateway request starts
  -> Store metrics start time

API Gateway response completes
  -> Record request count
  -> Record request duration
  -> Record cache outcome if x-cache exists
```

Implemented files:

```txt
apps/api-gateway/src/middlewares/metrics.middleware.ts
apps/api-gateway/src/middlewares/metrics.middleware.test.ts
```

Status:

Accepted.

---

## 2026-06-29 - Expose Prometheus Metrics Endpoint

Decision:

Expose a public local `/metrics` endpoint from API Gateway.

Reason:

* Prometheus needs an HTTP endpoint to scrape metrics.
* Keeping `/metrics` public in local Docker development makes Prometheus setup simple.
* The endpoint returns standard Prometheus text format.
* Production access control can be handled later through internal networking, firewall rules, or dedicated auth.

Implemented endpoint:

```txt
GET /metrics
```

Current behavior:

```txt
GET /metrics
  -> 200 OK
  -> Prometheus text format
  -> No API key required in local development
  -> No JWT required in local development
```

Implemented files:

```txt
apps/api-gateway/src/routes/metrics.route.ts
apps/api-gateway/src/routes/metrics.route.test.ts
```

Status:

Accepted.

---

## 2026-06-29 - Add Prometheus Service Through Docker Compose

Decision:

Add Prometheus as a Docker Compose service.

Reason:

* Metrics should be scraped automatically in the local development stack.
* Prometheus is the standard backend for time-series metrics.
* Docker Compose allows Prometheus to reach API Gateway through Docker internal DNS.
* Adding Prometheus before Grafana keeps the observability stack incremental and easy to validate.

Implemented service:

```txt
prometheus
```

Current container:

```txt
pulsegate-prometheus
```

Current exposed port:

```txt
9090
```

Current Prometheus URL:

```txt
http://localhost:9090
```

Current scrape target:

```txt
http://api-gateway:3000/metrics
```

Current scrape job:

```txt
pulsegate-api-gateway
```

Current scrape interval:

```txt
5s
```

Implemented files:

```txt
docker-compose.yml
observability/prometheus/prometheus.yml
```

Status:

Accepted.

---

## 2026-06-29 - Use Docker Internal Service Names for Observability Services

Decision:

Use Docker internal service names for Prometheus and Grafana communication.

Reason:

* Containers in the same Docker Compose network should communicate by service name.
* `localhost` inside a container refers to the container itself, not the host machine.
* Service names make the stack portable and predictable.
* This mirrors production-style internal service communication.

Current internal URLs:

```txt
Prometheus -> API Gateway:
http://api-gateway:3000/metrics

Grafana -> Prometheus:
http://prometheus:9090
```

Status:

Accepted.

---

## 2026-06-29 - Add Grafana Service Through Docker Compose

Decision:

Add Grafana as a Docker Compose service.

Reason:

* Prometheus stores metrics, but Grafana makes metrics easier to visualize.
* Dashboards make the project more demo-friendly for GitHub and CV presentation.
* Grafana is widely used in production observability stacks.
* Adding Grafana after Prometheus keeps the observability layer incremental.

Implemented service:

```txt
grafana
```

Current container:

```txt
pulsegate-grafana
```

Current exposed port:

```txt
3002
```

Reason for port choice:

```txt
3000 -> API Gateway
3001 -> Product Service
3002 -> Grafana
9090 -> Prometheus
```

Current local Grafana URL:

```txt
http://localhost:3002
```

Current local development login:

```txt
username: admin
password: admin
```

Implemented files:

```txt
docker-compose.yml
observability/grafana/provisioning/datasources/prometheus.yml
```

Status:

Accepted.

---

## 2026-06-29 - Provision Grafana Prometheus Datasource

Decision:

Provision Grafana Prometheus datasource through configuration files instead of creating it manually in the UI.

Reason:

* The observability stack should be reproducible after `docker compose up`.
* Manual UI setup is easy to forget and hard to document.
* Provisioned datasource makes the local environment predictable.
* A stable datasource UID is useful for dashboard JSON provisioning.

Current datasource:

```txt
name: Prometheus
uid: pulsegate-prometheus
type: prometheus
url: http://prometheus:9090
isDefault: true
```

Implemented file:

```txt
observability/grafana/provisioning/datasources/prometheus.yml
```

Status:

Accepted.

---

## 2026-06-29 - Provision Grafana Dashboard Foundation

Decision:

Provision a basic API Gateway overview dashboard through Grafana dashboard JSON.

Reason:

* The dashboard should load automatically when Grafana starts.
* The project should demonstrate a real observability flow from Gateway metrics to Prometheus to Grafana.
* A dashboard foundation makes future observability improvements easier.
* Provisioned dashboards are better than manual UI-created dashboards for a GitHub project.

Current dashboard:

```txt
PulseGate API Gateway Overview
```

Current dashboard UID:

```txt
pulsegate-api-gateway-overview
```

Current Grafana folder:

```txt
PulseGate
```

Current panels:

```txt
Request Rate
Request Count by Route
Latency p95 by Route
Cache Outcomes
```

Implemented files:

```txt
observability/grafana/provisioning/dashboards/dashboards.yml
observability/grafana/dashboards/api-gateway-overview.json
docker-compose.yml
```

Status:

Accepted.

---

## 2026-06-29 - Keep OpenTelemetry for a Later Sprint

Decision:

Do not add OpenTelemetry, Jaeger, Tempo, or distributed tracing in Sprint 4.

Reason:

* Sprint 4 should focus on foundational observability first.
* Structured logs, basic latency measurement, Prometheus metrics, Prometheus scraping, and Grafana dashboards are enough for the first observability layer.
* Distributed tracing adds more concepts and infrastructure.
* Tracing will be more valuable after the Gateway has more downstream services and more complex routing policies.
* Keeping OpenTelemetry for later prevents Sprint 4 from becoming too large.

Not included in Sprint 4:

```txt
OpenTelemetry
Jaeger
Tempo
Distributed tracing spans
Trace context propagation beyond x-request-id
```

Status:

Accepted.

---

## 2026-06-29 - Move Next Sprint Toward Advanced Gateway Policies

Decision:

After Sprint 4 final documentation update, move the next technical sprint toward advanced Gateway policy configuration.

Reason:

* Gateway routing, authentication, traffic protection, data infrastructure, Redis caching, and observability are now stable.
* The next valuable API Gateway capability is more flexible route-level behavior.
* Policy configuration should be improved before adding Kafka, RabbitMQ, Kubernetes, Admin Dashboard, or Developer Portal.
* Better policies will make future routes and services easier to manage.

Recommended Sprint 5 direction:

```txt
1. Review current route configuration model.
2. Add route policy type foundation.
3. Add per-route timeout policy.
4. Add per-route cache policy.
5. Add per-route rate limit policy.
6. Add request transformation foundation.
7. Add response transformation foundation.
8. Add upstream retry policy foundation.
9. Add route config validation improvements.
10. Add tests for each policy behavior.
```

Not included at the beginning of Sprint 5:

```txt
Kafka
RabbitMQ
Kubernetes
Admin Dashboard
Developer Portal
Advanced OpenTelemetry tracing
Complex service discovery
Production cloud deployment
```

Status:

Accepted.

---

## 2026-06-29 - Use Route Policies for Advanced Gateway Behavior

Decision:

Introduce a centralized route policy model for API Gateway routes.

Reason:

* The product proxy route had multiple behaviors mixed directly into the route handler.
* API Gateway behavior should be configurable per route.
* Future routes may need different auth, timeout, cache, rate limit, transform, and retry behavior.
* A policy model makes the Gateway closer to production API Gateway products such as Kong, Apache APISIX, Tyk, Apigee, and AWS API Gateway.
* Centralizing route behavior prepares the project for future Admin Dashboard or configuration-driven Gateway management.

Implemented policy model:

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

Implemented file:

```txt
apps/api-gateway/src/policies/route-policy.types.ts
```

Current product route policy:

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
```

Status:

Accepted.

---

## 2026-06-29 - Validate Downstream Route Configuration at Startup

Decision:

Validate downstream route configuration before the Gateway starts using it.

Reason:

* Invalid Gateway route configuration can cause runtime bugs that are hard to debug.
* Route config should fail fast if a route has invalid URL, invalid method, invalid policy values, invalid headers, or duplicate route keys.
* Gateway configuration should be treated as production-critical.
* Validation makes route policies safer before adding more routes later.

Implemented validation checks:

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
duplicate method + gatewayPath routes are rejected
```

Implemented files:

```txt
apps/api-gateway/src/config/validate-downstream-routes.ts
apps/api-gateway/src/config/validate-downstream-routes.test.ts
```

Status:

Accepted.

---

## 2026-06-29 - Extract Timeout Behavior into a Per-Route Timeout Policy Helper

Decision:

Move downstream timeout creation and cleanup into a dedicated timeout policy helper.

Reason:

* Timeout behavior is part of route policy.
* Route handlers should not manually manage `AbortController` and `setTimeout` logic inline.
* Each downstream request attempt should have its own timeout signal.
* Cleanup should always happen after the downstream request completes or fails.
* The timeout helper makes the behavior easier to test and reuse.

Implemented behavior:

```txt
timeout policy disabled
  -> no AbortSignal is created

timeout policy enabled
  -> create AbortController
  -> abort signal after configured timeoutMs
  -> expose cleanup function
```

Implemented files:

```txt
apps/api-gateway/src/policies/timeout.policy.ts
apps/api-gateway/src/policies/timeout.policy.test.ts
```

Status:

Accepted.

---

## 2026-06-29 - Extract Cache Behavior into a Per-Route Cache Policy Helper

Decision:

Move response cache key generation and cache policy resolution into a dedicated cache policy helper.

Reason:

* Cache behavior should be driven by route policy.
* Cache should only be enabled when both the route policy is enabled and a runtime cache store is available.
* Cache key generation should be stable and tested.
* Route handlers should not directly decide cache enabled state.
* This prepares the Gateway for future per-route cache TTLs and cache invalidation strategies.

Implemented behavior:

```txt
buildResponseCacheKey(method, routePath)
  -> returns METHOD:/route/path

resolveRouteCachePolicy()
  -> enabled only when policy.enabled is true and cache store exists
  -> uses route policy TTL by default
  -> supports TTL override for tests
```

Current product response cache key:

```txt
response-cache:GET:/api/products
```

Current product response cache TTL:

```txt
30 seconds
```

Implemented files:

```txt
apps/api-gateway/src/policies/cache.policy.ts
apps/api-gateway/src/policies/cache.policy.test.ts
```

Status:

Accepted.

---

## 2026-06-29 - Extract Rate Limit Behavior into a Per-Route Rate Limit Policy Helper

Decision:

Move rate limit runtime policy resolution into a dedicated rate limit policy helper.

Reason:

* Rate limit behavior should be driven by route policy.
* Route handlers should not directly spread route config values into middleware.
* A resolved rate limit policy makes route handling clearer.
* The helper prepares the Gateway for future rate limit identity types such as user ID, organization ID, IP address, API plan, or client ID.

Implemented behavior:

```txt
resolveRouteRateLimitPolicy()
  -> returns enabled state
  -> returns limit
  -> returns windowMs
  -> returns routePath
  -> returns identityType
  -> returns store
```

Current rate limit identity type:

```txt
api-key
```

Implemented files:

```txt
apps/api-gateway/src/policies/rate-limit.policy.ts
apps/api-gateway/src/policies/rate-limit.policy.test.ts
```

Status:

Accepted.

---

## 2026-06-29 - Add Request Transformation Policy Foundation

Decision:

Add a request header transformation policy foundation.

Reason:

* API Gateways commonly modify requests before forwarding them to upstream services.
* Future routes may need to add headers such as gateway name, tenant ID, client ID, or forwarding metadata.
* Future routes may also need to remove internal or unsafe request headers.
* Header transformation should be policy-driven and tested.
* Sprint 5 should add the foundation without changing current runtime behavior.

Implemented behavior:

```txt
requestTransform.enabled = false
  -> request headers are copied without changes

requestTransform.enabled = true
  -> remove configured request headers case-insensitively
  -> add configured request headers
  -> added headers win after removal
  -> original headers object is not mutated
```

Current product route behavior:

```txt
requestTransform:
  enabled: false
```

Current forwarded header remains:

```txt
x-request-id
```

Implemented files:

```txt
apps/api-gateway/src/policies/request-transform.policy.ts
apps/api-gateway/src/policies/request-transform.policy.test.ts
```

Status:

Accepted.

---

## 2026-06-29 - Add Response Transformation Policy Foundation

Decision:

Add a response header transformation policy foundation.

Reason:

* API Gateways commonly modify responses before returning them to clients.
* Future routes may need to add headers such as `x-served-by`, `x-gateway-name`, or policy metadata.
* Future routes may also need to remove upstream/internal response headers.
* Response transformation should be policy-driven and tested.
* Gateway-owned headers such as `x-cache` should still be controlled by the Gateway.

Implemented behavior:

```txt
responseTransform.enabled = false
  -> response headers are copied without changes

responseTransform.enabled = true
  -> remove configured response headers case-insensitively
  -> add configured response headers
  -> added headers win after removal
  -> original headers object is not mutated
```

Current product route behavior:

```txt
responseTransform:
  enabled: false
```

Gateway-owned response headers still apply:

```txt
x-cache
x-response-time-ms
x-request-id
x-ratelimit-limit
x-ratelimit-remaining
x-ratelimit-reset
```

Implemented files:

```txt
apps/api-gateway/src/policies/response-transform.policy.ts
apps/api-gateway/src/policies/response-transform.policy.test.ts
```

Status:

Accepted.

---

## 2026-06-29 - Add Upstream Retry Policy Foundation

Decision:

Add an upstream retry policy foundation for downstream calls.

Reason:

* API Gateways often retry temporary upstream failures for safe read-only requests.
* Retry behavior must be carefully controlled to avoid unsafe duplicate writes.
* The first retry foundation should only allow retry for `GET` requests.
* Retry should be policy-driven and disabled by default until explicitly enabled.
* This keeps current runtime behavior stable while preparing the Gateway for future resilience improvements.

Implemented retry rules:

```txt
Retry is allowed only for GET requests.
Retry is disabled by default for the product route.
attempts means additional retries after the first request.
Retry can be based on result predicate or error predicate.
Retryable statuses are configured by route policy.
```

Current product route retry policy:

```txt
retry:
  enabled: false
  attempts: 0
  retryOnStatuses: [502, 503, 504]
```

Implemented files:

```txt
apps/api-gateway/src/policies/retry.policy.ts
apps/api-gateway/src/policies/retry.policy.test.ts
```

Status:

Accepted.

---

## 2026-06-29 - Keep Retry Disabled by Default for the Product Route

Decision:

Wire retry foundation into the downstream call flow, but keep retry disabled by default for `GET /api/products`.

Reason:

* Sprint 5 focuses on policy foundation, not changing runtime behavior aggressively.
* Retry can hide real upstream errors if enabled too early.
* The Gateway should first prove that retry policy wiring and tests are stable.
* Product route behavior should remain compatible with previous Sprint 4 behavior.
* Retry can be enabled later when more realistic upstream failure scenarios and metrics are added.

Current behavior:

```txt
Product Service unavailable + cache MISS
  -> 503 DOWNSTREAM_SERVICE_UNAVAILABLE

Product Service timeout + cache MISS
  -> 504 DOWNSTREAM_TIMEOUT

Product Service returns 5xx + cache MISS
  -> 502 DOWNSTREAM_HTTP_ERROR
```

Current retry config:

```txt
enabled: false
attempts: 0
retryOnStatuses: [502, 503, 504]
```

Status:

Accepted.

---

## 2026-06-29 - Add Route Policy Integration Test Coverage

Decision:

Add integration test coverage for route policy behavior in the API Gateway app flow.

Reason:

* Unit tests prove helper behavior, but integration tests prove the real route flow.
* The Gateway should verify that cache policy behavior works through `buildApiGatewayApp()`.
* The test should prove that cache MISS calls downstream and cache HIT avoids another downstream call.
* Integration tests should also confirm `x-cache: BYPASS` when no cache store is configured.

Implemented behavior covered by integration tests:

```txt
GET /api/products with no response cache store
  -> x-cache: BYPASS

GET /api/products with response cache store
  -> First request returns x-cache: MISS
  -> Second request returns x-cache: HIT
  -> Product Service fetch is called only once
```

Implemented file:

```txt
apps/api-gateway/src/app.test.ts
```

Status:

Accepted.

---

## 2026-06-29 - Keep Sprint 5 Focused on Advanced Gateway Policies

Decision:

Keep Sprint 5 focused on advanced Gateway policies only.

Reason:

* The project already had routing, auth, traffic protection, data infrastructure, Redis cache, Prometheus, and Grafana.
* The next production-like Gateway capability was policy-driven route behavior.
* Adding Kafka, RabbitMQ, Kubernetes, Admin Dashboard, Developer Portal, OpenTelemetry, or cloud deployment during Sprint 5 would create scope creep.
* Policy foundation should be stable before adding more infrastructure or UI layers.

Included in Sprint 5:

```txt
Route policy type foundation
Route config validation
Per-route timeout policy
Per-route cache policy
Per-route rate limit policy
Request transformation foundation
Response transformation foundation
Upstream retry policy foundation
Unit tests
Integration tests
Documentation
```

Not included in Sprint 5:

```txt
Kafka
RabbitMQ
Kubernetes
Admin Dashboard
Developer Portal
Advanced OpenTelemetry tracing
Complex service discovery
Production cloud deployment
```

Status:

Accepted.

---

## 2026-06-29 - Keep Sprint 6 Focused on CI/CD Foundation

Decision:

Keep Sprint 6 focused on CI/CD foundation with GitHub Actions.

Reason:

* Sprint 5 already completed the advanced Gateway policy foundation.
* The project now needs automated validation to make the GitHub repository more professional.
* CI/CD is a strong portfolio signal because it proves every push can be checked automatically.
* Automated validation should be added before bigger future changes such as tracing, load testing, multi-route expansion, Kafka, RabbitMQ, Kubernetes, Admin Dashboard, or Developer Portal.
* Keeping Sprint 6 focused prevents scope creep.

Included in Sprint 6:

```txt
GitHub Actions workflow
CI trigger on push to main
CI trigger on pull request to main
npm ci
Prisma Client generation
Automated tests
TypeScript typecheck
Production build
API Gateway Docker image build validation
Product Service Docker image build validation
README CI badge
Final validation
Documentation update
```

Not included in Sprint 6:

```txt
Kafka
RabbitMQ
Kubernetes
OpenTelemetry
Jaeger
Tempo
Loki
k6
Admin Dashboard
Developer Portal
Production cloud deployment
Docker image push to registry
Automatic deployment
```

Status:

Accepted.

---

## 2026-06-29 - Use GitHub Actions for CI

Decision:

Use GitHub Actions as the CI platform for PulseGate.

Reason:

* GitHub Actions integrates directly with the GitHub repository.
* It is easy for reviewers and recruiters to see CI status on the repository page.
* It supports Node.js, npm, Docker, and monorepo workflows well.
* It is enough for the current local-first project stage.
* It avoids adding external CI services too early.

Implemented workflow file:

```txt
.github/workflows/ci.yml
```

Current workflow name:

```txt
CI
```

Current job name:

```txt
Test, Typecheck, and Build
```

Status:

Accepted.

---

## 2026-06-29 - Run CI on Push and Pull Request to Main

Decision:

Run the CI workflow on every push to `main` and every pull request targeting `main`.

Reason:

* Push validation confirms the main branch remains healthy after each checkpoint.
* Pull request validation prepares the project for a more professional collaboration workflow later.
* The `main` branch should represent stable code.
* Automated checks reduce the chance of broken code being pushed unnoticed.

Current trigger behavior:

```txt
push to main
pull_request to main
```

Status:

Accepted.

---

## 2026-06-29 - Use npm ci in CI

Decision:

Use `npm ci` instead of `npm install` in GitHub Actions.

Reason:

* `npm ci` uses `package-lock.json` exactly.
* It gives a clean, reproducible dependency installation.
* It is more suitable for CI environments than `npm install`.
* It helps detect lockfile and dependency problems early.

Current CI install step:

```txt
npm ci
```

Status:

Accepted.

---

## 2026-06-29 - Generate Prisma Client in CI

Decision:

Generate Prisma Client in CI before running typecheck and build.

Reason:

* GitHub Actions runners start from a clean environment.
* Generated Prisma Client files should not be assumed to already exist in CI.
* Product Service typecheck and build depend on Prisma Client being generated.
* Running Prisma generate in CI prevents clean-runner build issues.

Current CI command:

```powershell
npm run db:generate -w apps/product-service
```

Status:

Accepted.

---

## 2026-06-29 - Validate Tests, Typecheck, and Build in CI

Decision:

CI should run automated tests, TypeScript typecheck, and production build.

Reason:

* Tests validate Gateway behavior and policy helper behavior.
* Typecheck validates TypeScript correctness across workspaces.
* Build validation ensures the project can compile successfully.
* These checks match the local validation workflow already used after stable checkpoints.
* Running all three in CI makes the repository safer for future refactoring.

Current CI commands:

```powershell
npm run test
npm run typecheck
npm run build
```

Sprint 6 validation status at the time:

```txt
24 test files passed
139 tests passed
typecheck passed
build passed
```

Status:

Accepted.

---

## 2026-06-29 - Add Docker Image Build Validation to CI

Decision:

Add Docker image build validation for API Gateway and Product Service in GitHub Actions.

Reason:

* Dockerfiles are part of the runtime foundation.
* A project can pass TypeScript build but still have broken Docker image builds.
* Docker build validation catches Dockerfile, workspace, lockfile, and Prisma generation issues early.
* Building images in CI improves confidence that the local Docker Compose stack remains reproducible.

Current CI Docker build commands:

```powershell
docker build -t pulsegate-api-gateway:ci -f apps/api-gateway/Dockerfile .
docker build -t pulsegate-product-service:ci -f apps/product-service/Dockerfile .
```

Current scope:

```txt
Build Docker images only
Do not push Docker images to a registry yet
Do not deploy automatically yet
Do not run full docker compose stack in CI yet
```

Reason full Docker Compose runtime validation is not added to CI yet:

* The current goal is lightweight CI foundation.
* Local Docker Compose runtime validation already covers `/health`, `/metrics`, PostgreSQL, Redis, Prometheus, and Grafana.
* Full runtime CI can be added later when the project needs deeper integration validation.
* Avoid making Sprint 6 too heavy.

Status:

Accepted.

---

## 2026-06-29 - Add README CI Badge

Decision:

Add a live GitHub Actions CI badge to the README.

Reason:

* The README is the first page recruiters and reviewers see.
* A live CI badge shows that the repository has automated validation.
* The badge is connected to the real workflow instead of being a static fake status.
* It improves the professional appearance of the GitHub project.

Current README badge target:

```txt
.github/workflows/ci.yml
```

Current badge behavior:

```txt
CI passing -> README shows passing
CI failing -> README shows failing
```

Status:

Accepted.

---

## 2026-06-29 - Keep Deployment Out of Sprint 6

Decision:

Do not add automatic deployment, Docker registry push, cloud hosting, Kubernetes, or production release automation in Sprint 6.

Reason:

* Sprint 6 is only the CI/CD foundation.
* Deployment requires additional decisions about environment, secrets, hosting, registry, and runtime security.
* The project is still local-first.
* Deployment should come after the Gateway has more stable production-like features and clearer demo requirements.
* Avoiding deployment keeps the sprint focused and safe.

Deferred items:

```txt
Docker image registry push
GitHub Actions deployment job
Cloud deployment
Kubernetes deployment
Production secrets management
Environment promotion
Release versioning automation
```

Status:

Accepted.

---

## 2026-06-30 - Keep Sprint 7 Focused on Multi-Route Gateway Expansion

Decision:

Keep Sprint 7 focused on expanding the Gateway from a single protected Product proxy route into a static multi-route Gateway foundation.

Reason:

* Sprint 6 completed CI/CD validation, so the repository is now safer to refactor.
* The Gateway still behaved like a single-route proxy instead of a real API Gateway with multiple routes.
* A real API Gateway must support multiple Gateway routes with different policies.
* Multi-route routing should be implemented before database-backed dynamic route configuration.
* Keeping Sprint 7 focused avoids mixing route refactor, database persistence, service registry, Admin APIs, and UI concerns in one sprint.

Included in Sprint 7:

```txt
Generic downstream proxy route foundation
Static multi-route downstream route configuration
Product Service health proxy route
Public route policy behavior
Preserve protected Product route behavior
Multi-route tests
Docker runtime validation
Documentation update
```

Not included in Sprint 7:

```txt
Dynamic route config from database
Service registry
API consumer database
API key lifecycle
Usage plans and quotas
Admin Dashboard
Developer Portal
OpenTelemetry
Loki
k6
Kafka
RabbitMQ
Kubernetes
Production cloud deployment
```

Status:

Accepted.

---

## 2026-06-30 - Refactor Product Proxy into Generic Downstream Proxy Route

Decision:

Refactor the Product-specific proxy route into a reusable generic downstream proxy route while preserving the existing Product route behavior.

Reason:

* The existing proxy implementation was tightly coupled to `GET /api/products`.
* Future Gateway routes should reuse the same downstream proxy flow.
* Route behavior should come from `DownstreamRouteConfig` and `RoutePolicies`.
* The Gateway should be able to register multiple route configs without duplicating proxy logic.
* This makes the Gateway closer to production API Gateway architecture.

Implemented behavior:

```txt
downstreamProxyRoute()
  -> accepts routeConfigs
  -> registers each configured route
  -> resolves route-specific policies
  -> applies API key policy when enabled
  -> applies rate limit policy when enabled
  -> applies JWT policy when enabled
  -> applies cache policy when enabled
  -> applies request transform foundation
  -> applies timeout policy helper
  -> applies retry policy foundation
  -> applies response transform foundation
  -> returns normalized downstream errors
```

Current file:

```txt
apps/api-gateway/src/routes/product-proxy.route.ts
```

Status:

Accepted.

---

## 2026-06-30 - Keep productProxyRoute Compatibility Wrapper

Decision:

Keep `productProxyRoute()` as a compatibility wrapper around the new `downstreamProxyRoute()`.

Reason:

* Existing tests and app options still referenced the Product proxy concept.
* Removing the old function immediately would create unnecessary breaking changes.
* Sprint 7 should focus on behavior expansion, not aggressive naming cleanup.
* Keeping the wrapper allows a safe migration toward the generic proxy model.
* A future cleanup sprint can rename files and options when the Gateway is more stable.

Current behavior:

```txt
productProxyRoute()
  -> wraps downstreamProxyRoute()
  -> defaults routeConfigs to [productProductsRouteConfig]
```

Naming note:

```txt
The file name is still product-proxy.route.ts.
The generic downstreamProxyRoute() now lives inside that file.
A future cleanup can rename this file to downstream-proxy.route.ts.
```

Status:

Accepted.

---

## 2026-06-30 - Add Product Service Health Proxy Route

Decision:

Add a new Gateway route:

```txt
GET /api/product-service/health
  -> Product Service GET /health
```

Reason:

* Sprint 7 needs a second real Gateway route to prove multi-route registration works.
* Product Service already has a stable `/health` endpoint.
* A health proxy route is a safe first public route because it does not expose product data.
* This route proves that public and protected routes can coexist.
* It also validates that route policies can disable auth, rate limiting, and cache per route.

Implemented route config:

```txt
productServiceHealthRouteConfig
  -> serviceName: product-service
  -> gatewayPath: /api/product-service/health
  -> downstreamUrl: PRODUCT_SERVICE_URL + /health
  -> method: GET
```

Runtime behavior:

```txt
GET /api/product-service/health
  -> No API key required
  -> No JWT required
  -> No Redis-backed rate limiting
  -> No Redis response cache
  -> Uses downstream timeout policy
  -> Proxies to Product Service GET /health
  -> Returns x-cache: BYPASS
  -> Returns x-request-id
  -> Returns x-response-time-ms
```

Status:

Accepted.

---

## 2026-06-30 - Use Different Policies for Public and Protected Routes

Decision:

Use different route policies for the protected Product route and the public Product Service health proxy route.

Reason:

* A real API Gateway must support different policies for different routes.
* Product data should remain protected.
* Health proxy behavior should be public and lightweight.
* Rate limiting and response caching should not be forced onto every route.
* This proves the policy model can support route-level behavior variation.

Current protected route policy:

```txt
GET /api/products
  -> auth.requireApiKey: true
  -> auth.requireJwt: true
  -> rateLimit.enabled: true
  -> cache.enabled: true
  -> timeout.enabled: true
  -> retry.enabled: false
```

Current public route policy:

```txt
GET /api/product-service/health
  -> auth.requireApiKey: false
  -> auth.requireJwt: false
  -> rateLimit.enabled: false
  -> cache.enabled: false
  -> timeout.enabled: true
  -> retry.enabled: false
```

Status:

Accepted.

---

## 2026-06-30 - Register Downstream Routes from Static Route Config List

Decision:

Register Gateway downstream routes from `downstreamRouteConfigs` instead of registering only one hardcoded Product proxy route.

Reason:

* The Gateway should not be limited to one route.
* Static multi-route config is a safe bridge before database-backed route config.
* `downstreamRouteConfigs` can be validated before being used.
* The app builder can register all configured routes through the generic downstream proxy route.
* This prepares the Gateway for Sprint 8 dynamic route config from database.

Current route config list:

```txt
downstreamRouteConfigs
  -> productProductsRouteConfig
  -> productServiceHealthRouteConfig
```

Current registered Gateway routes:

```txt
GET /api/products
GET /api/product-service/health
```

Implementation:

```txt
apps/api-gateway/src/app.ts
  -> imports downstreamRouteConfigs
  -> registers downstreamProxyRoute()
  -> passes routeConfigs: downstreamRouteConfigs
```

Status:

Accepted.

---

## 2026-06-30 - Preserve Existing Protected Product Route Behavior During Multi-Route Refactor

Decision:

The existing `GET /api/products` route must remain behaviorally stable after the multi-route refactor.

Reason:

* Refactoring the route registration foundation should not break stable user-facing behavior.
* The protected Product route already had API key, JWT, Redis-backed rate limiting, Redis response caching, timeout, retry foundation, transforms, downstream error normalization, metrics, and logs.
* Keeping this route stable proves the refactor is safe.
* Future changes should build on top of stable existing behavior instead of rewriting everything at once.

Validated behavior:

```txt
GET /api/products with valid API key and JWT
  -> 200 OK

First valid request after cache clear
  -> x-cache: MISS

Second valid request within cache TTL
  -> x-cache: HIT

Rate limit headers still exist
  -> x-ratelimit-limit
  -> x-ratelimit-remaining
  -> x-ratelimit-reset

Product response remains unchanged
  -> prod_001 Mechanical Keyboard
  -> prod_002 Gaming Mouse
```

Status:

Accepted.

---

## 2026-06-30 - Keep Route Config Static Before Database-Backed Dynamic Config

Decision:

Keep Sprint 7 route configuration static in code and move database-backed route configuration to Sprint 8.

Reason:

* Multi-route registration and database persistence are separate concerns.
* Static config keeps Sprint 7 safer and easier to validate.
* The project first needs to prove that multiple routes can be registered and handled correctly.
* Database-backed route config will need Prisma model design, migration, seed/bootstrap logic, loading behavior, fallback behavior, and tests.
* Mixing all of that into Sprint 7 would make the sprint too large.

Current status:

```txt
Sprint 7:
  -> Static multi-route config complete

Sprint 8:
  -> Dynamic Route Config from Database
```

Status:

Accepted.

---

## 2026-06-30 - Add Multi-Route Test Coverage

Decision:

Add tests that prove the Gateway supports the new public Product Service health proxy route and the expanded route config list.

Reason:

* The route config list should prove both configured routes exist.
* The public health proxy route should prove no API key or JWT is required.
* The integration test should prove the Gateway proxies to Product Service `/health`.
* Tests should verify route-specific policy behavior through observable headers.
* Existing protected route tests should continue passing.

Implemented coverage:

```txt
downstream-routes.test.ts
  -> Product route policy config
  -> Product Service health route config
  -> downstreamRouteConfigs includes both routes

app.test.ts
  -> GET /api/product-service/health returns 200
  -> Does not require API key
  -> Does not require JWT
  -> Proxies to Product Service /health
  -> Returns x-cache: BYPASS
  -> Returns x-request-id
  -> Returns x-response-time-ms
  -> Does not return rate limit headers
```

Current automated test status after Sprint 7:

```txt
24 test files passed
142 tests passed
```

Status:

Accepted.

---

## 2026-06-30 - Validate Sprint 7 Through Docker Runtime

Decision:

Validate Sprint 7 with the full Docker Compose runtime stack before final documentation.

Reason:

* Unit and integration tests prove code behavior in isolation.
* Docker runtime validation proves the real local stack still works.
* The new route must work with Docker internal service names.
* The existing Product route must continue to work with Redis and PostgreSQL in the real runtime stack.
* Observability routes should still work after the multi-route refactor.

Validated commands:

```powershell
docker compose up -d --build
docker compose ps
Invoke-RestMethod http://localhost:3000/health | ConvertTo-Json -Depth 10
Invoke-WebRequest http://localhost:3000/metrics -UseBasicParsing
Invoke-WebRequest http://localhost:3000/api/product-service/health -UseBasicParsing
```

Validated runtime behavior:

```txt
Docker services started successfully.
PostgreSQL was healthy.
Redis was healthy.
Product Service was healthy.
API Gateway started successfully.
Prometheus started successfully.
Grafana started successfully.
GET /health returned API Gateway status ok.
GET /metrics returned 200 OK with Prometheus text.
GET /api/product-service/health returned 200 OK.
GET /api/product-service/health returned x-cache: BYPASS.
GET /api/product-service/health returned x-request-id.
GET /api/product-service/health returned x-response-time-ms.
```

Status:

Accepted.

---

## 2026-06-30 - Move Next Sprint Toward Dynamic Route Config from Database

Decision:

After Sprint 7 final documentation update, move Sprint 8 toward dynamic route config from database.

Reason:

* Sprint 7 proved static multi-route Gateway routing.
* The next product-like API Gateway capability is database-backed route configuration.
* Dynamic route config is required before future Admin APIs and Admin Dashboard can manage routes.
* Database-backed route config should be implemented before service registry, API key lifecycle, usage plans, or Developer Portal.
* The Gateway should keep a safe static fallback during this transition.

Recommended Sprint 8 direction:

```txt
1. Design route config database model.
2. Add Prisma model and migration for Gateway route config.
3. Seed or bootstrap route config records.
4. Load route config from PostgreSQL.
5. Keep safe static fallback config during rollout.
6. Validate database-backed route config.
7. Add tests for database route config loading.
8. Prepare future Admin API route management.
```

Not included at the beginning of Sprint 8:

```txt
Kafka
RabbitMQ
Kubernetes
Admin Dashboard UI
Developer Portal UI
OpenTelemetry
Loki
k6
Production cloud deployment
```

Status:

Accepted.

---

## 2026-07-01 - Add API Gateway-Owned Prisma Schema

Decision:

Add a dedicated Prisma schema for API Gateway.

Reason:

* Sprint 8 needs API Gateway to own its own route configuration data.
* Product Service already owns product data through its own Prisma schema.
* API Gateway route config should not be mixed into Product Service code.
* A separate API Gateway Prisma schema keeps ownership clearer.
* This prepares the Gateway for future route management APIs and Admin Dashboard features.

Implemented files:

```txt
apps/api-gateway/prisma/schema.prisma
apps/api-gateway/prisma/migrations/20260701063629_add_gateway_routes/migration.sql
apps/api-gateway/prisma/seed.ts
apps/api-gateway/src/database/gateway-prisma.ts
```

Current API Gateway Prisma scripts:

```txt
db:generate
db:migrate
db:migrate:deploy
db:seed
```

Status:

Accepted.

---

## 2026-07-01 - Use Separate PostgreSQL Schema `gateway` for API Gateway Route Config

Decision:

Store API Gateway route config in PostgreSQL schema `gateway` instead of the default `public` schema.

Reason:

* Product Service already uses the `public` schema.
* Product Service already has its own Prisma migration history in `public._prisma_migrations`.
* Running API Gateway Prisma migrations in the same `public` schema caused Prisma migration drift.
* API Gateway route config is owned by API Gateway, not Product Service.
* Using `gateway` schema separates service ownership and migration history.
* This makes the database structure cleaner and safer for future growth.

Current schema ownership:

```txt
public schema
  -> Product Service
  -> public.products
  -> public._prisma_migrations

gateway schema
  -> API Gateway
  -> gateway.gateway_routes
  -> gateway._prisma_migrations
```

Current API Gateway database URL:

```txt
postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway
```

Current Docker API Gateway database URL:

```txt
postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate?schema=gateway
```

Status:

Accepted.

---

## 2026-07-01 - Store Gateway Route Config in `gateway.gateway_routes`

Decision:

Create a `gateway.gateway_routes` table to store API Gateway downstream route configuration.

Reason:

* Static TypeScript route config is not enough for a product-like API Gateway.
* A real API Gateway should be able to persist route definitions.
* Route configuration must include path, method, downstream URL, enabled state, priority, and policies.
* This is required before building route management APIs.
* This is required before building an Admin Dashboard that can manage routes.

Current table:

```txt
gateway.gateway_routes
```

Current route identity after Sprint 10:

```txt
active method + gateway_path where deleted_at IS NULL
```

Current important fields after Sprint 10:

```txt
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
created_by
updated_by
deleted_at
deleted_by
created_at
updated_at
```

Current constraints and indexes after Sprint 10:

```txt
partial unique index on (method, gateway_path) where deleted_at IS NULL
index(deleted_at)
index(enabled, deleted_at, priority)
index(enabled, priority)
```

Sprint 10 note:

```txt
The original full unique constraint on method + gateway_path was replaced by a PostgreSQL partial unique index.

This allows historical soft-deleted route records to remain in the database while still preventing duplicate active routes.
```

Status:

Accepted.

---

## 2026-07-01 - Seed Current Gateway Routes into Database

Decision:

Add an idempotent API Gateway seed script to insert the current Gateway route configs into PostgreSQL.

Reason:

* The Gateway needs initial database route config records.
* Existing stable routes should continue working after switching to DB-backed route config.
* Seed data makes local Docker validation repeatable.
* Idempotent active-route update/create behavior prevents duplicate active routes when the seed command is run multiple times.
* The database route config should start by matching the current stable static routes.

Seeded routes:

```txt
GET /api/products
  -> Product Service /products
  -> Protected
  -> API key required
  -> JWT required
  -> Redis rate limit enabled
  -> Redis response cache enabled

GET /api/product-service/health
  -> Product Service /health
  -> Public
  -> API key not required
  -> JWT not required
  -> Redis rate limit disabled
  -> Redis response cache disabled
```

Current seed command:

```powershell
$env:DATABASE_URL="postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway"

npm run db:seed -w apps/api-gateway
```

Current seed result after Sprint 10:

```txt
Seeded 2 active gateway route config(s).
GET /api/products -> http://product-service:3001/products | enabled=true
GET /api/product-service/health -> http://product-service:3001/health | enabled=true
```

Sprint 10 note:

```txt
The API Gateway seed script no longer depends on Prisma compound upsert for method + gateway_path.

Because active-route uniqueness is now enforced by a PostgreSQL partial unique index, the seed script finds an active route by method + gatewayPath + deletedAt null, then updates or creates as needed.
```

Status:

Accepted.

---

## 2026-07-01 - Use Docker Internal Downstream URLs in Gateway Route Config Seed

Decision:

Seed API Gateway route configs with Docker internal Product Service URLs.

Current seeded downstream URLs:

```txt
http://product-service:3001/products
http://product-service:3001/health
```

Reason:

* The main Sprint 8 runtime validation is done through Docker Compose.
* API Gateway runs inside Docker and should call Product Service through Docker internal DNS.
* Inside a Docker container, `localhost` means the container itself, not the Product Service container.
* `product-service` is the correct Docker Compose service name for container-to-container communication.

Known local npm note:

```txt
If API Gateway is run directly with npm on the host while DB route config points to http://product-service:3001,
the host machine may not resolve product-service.

For local npm mode, either:
1. Use static fallback by making DB loading unavailable, or
2. Update database route config downstream URLs to http://127.0.0.1:3001, or
3. Add an environment-aware seed strategy later.
```

Status:

Accepted.

---

## 2026-07-01 - Map Database Route Records to Runtime `DownstreamRouteConfig[]`

Decision:

Add a mapper that converts `gateway.gateway_routes` database records into runtime `DownstreamRouteConfig[]`.

Reason:

* The existing Gateway route registration already understands `DownstreamRouteConfig`.
* Database rows should be adapted into the existing route config shape instead of rewriting the proxy flow.
* Keeping the runtime type stable reduces risk.
* Mapping gives one place to validate JSON policy fields.
* Mapping gives one place to normalize disabled policy values.

Implemented file:

```txt
apps/api-gateway/src/config/database-route-config.mapper.ts
```

Mapping behavior:

```txt
gateway_routes row
  -> DownstreamRouteConfig
    -> serviceName
    -> gatewayPath
    -> downstreamUrl
    -> method
    -> policies
```

Important normalization:

```txt
cache disabled
  -> runtime ttlSeconds = 0

rate limit disabled
  -> runtime limit = 0
  -> runtime windowMs = 0
```

JSON validation:

```txt
request_add_headers must be an object with string values
response_add_headers must be an object with string values
request_remove_headers must be an array of strings
response_remove_headers must be an array of strings
retry_on_statuses must be an array of integers
```

Status:

Accepted.

---

## 2026-07-01 - Load Route Config from Database at API Gateway Startup

Decision:

API Gateway should try to load route configuration from PostgreSQL during startup.

Reason:

* Sprint 8 goal is database-backed dynamic route configuration.
* The Gateway should no longer depend only on static TypeScript route config.
* Loading at startup is simpler and safer than runtime hot reload for the first DB-backed version.
* This prepares the project for future route management APIs.
* Startup loading keeps runtime behavior predictable.

Implemented files:

```txt
apps/api-gateway/src/config/database-route-config.repository.ts
apps/api-gateway/src/config/runtime-downstream-routes.ts
apps/api-gateway/src/server.ts
apps/api-gateway/src/app.ts
```

Current startup flow:

```txt
API Gateway process starts
  -> loadRuntimeDownstreamRouteConfigs()
    -> try loadDatabaseDownstreamRouteConfigs(gatewayPrisma)
      -> query enabled records from gateway.gateway_routes where deleted_at is null
      -> order by priority ASC and gatewayPath ASC
      -> map records into DownstreamRouteConfig[]
      -> validate mapped route configs
    -> return DB route configs if valid and not empty
  -> buildApiGatewayApp({ routeConfigs })
  -> register downstream proxy routes
  -> connect Redis
  -> listen on port 3000
```

Status:

Accepted.

---

## 2026-07-01 - Keep Static Route Config as Safe Fallback

Decision:

Keep the existing static `downstreamRouteConfigs` as a fallback when database route config loading fails or returns no routes.

Reason:

* Route config is critical for Gateway startup.
* A DB issue should not immediately make the Gateway unusable during early rollout.
* Sprint 8 is the first database-backed route config sprint, so safety is important.
* Existing stable route behavior should remain available.
* This makes DB-backed route config adoption less risky.

Fallback scenarios:

```txt
DATABASE_URL missing
PostgreSQL unavailable
Prisma Client initialization error
gateway.gateway_routes unavailable
DB query error
DB route mapping error
DB route validation error
DB returns zero enabled routes
```

Fallback result:

```txt
API Gateway uses static downstreamRouteConfigs
```

Current fallback static routes:

```txt
GET /api/products
GET /api/product-service/health
```

Status:

Accepted.

---

## 2026-07-01 - Generate API Gateway Prisma Client in CI

Decision:

Update GitHub Actions CI to generate the API Gateway Prisma Client.

Reason:

* API Gateway now imports a generated Prisma Client.
* Generated Prisma Client files should not be committed to Git.
* GitHub Actions runners start from a clean environment.
* Typecheck and build require generated Prisma Client to exist.
* CI must validate both Product Service Prisma and API Gateway Prisma.

Current CI Prisma generate steps:

```txt
npm run db:generate -w apps/product-service
npm run db:generate -w apps/api-gateway
```

Status:

Accepted.

---

## 2026-07-01 - Do Not Commit API Gateway Generated Prisma Client

Decision:

Ignore the generated API Gateway Prisma Client output.

Ignored path:

```txt
apps/api-gateway/src/generated/
```

Reason:

* Generated Prisma Client is build output.
* Generated files depend on the platform where they are generated.
* Committing generated Prisma Client can cause runtime mismatch between Windows host and Linux Docker container.
* Clean CI and Docker builds should generate Prisma Client themselves.
* Keeping generated files out of Git makes the repository cleaner.

Status:

Accepted.

---

## 2026-07-01 - Generate API Gateway Prisma Client Inside Docker Image

Decision:

Update the API Gateway Dockerfile so it generates Prisma Client inside the Docker image build.

Reason:

* The local developer machine is Windows.
* The API Gateway Docker image runs on Linux Alpine.
* Prisma Client generated on Windows is not valid for Linux Alpine runtime.
* Docker runtime produced a Prisma Query Engine mismatch when the container tried to use a Windows-generated client.
* Generating Prisma Client inside the Docker image ensures the correct query engine is available for the container runtime.

Observed problem:

```txt
Prisma Client could not locate the Query Engine for runtime "linux-musl-openssl-3.0.x".

This happened because Prisma Client was generated for "windows",
but the actual deployment required "linux-musl-openssl-3.0.x".
```

Implemented Dockerfile behavior:

```txt
RUN DATABASE_URL="postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate?schema=gateway" npm run db:generate -w apps/api-gateway
```

Validation result:

```txt
docker compose build --no-cache api-gateway -> passed
docker compose up -d api-gateway -> passed
docker compose logs api-gateway -> Loaded downstream route configs from database { routeCount: 2 }
```

Status:

Accepted.

---

## 2026-07-01 - Configure API Gateway Docker Runtime with Database URL

Decision:

Add API Gateway `DATABASE_URL` to Docker Compose.

Docker value:

```txt
postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate?schema=gateway
```

Reason:

* API Gateway now needs PostgreSQL access for route config loading.
* The Gateway container must connect to PostgreSQL using Docker internal service DNS.
* The Gateway must target the `gateway` schema, not the default `public` schema.
* Docker runtime should match the Sprint 8 DB-backed route config architecture.

Also decided:

```txt
API Gateway should depend on healthy postgres, redis, and product-service in Docker Compose.
```

Reason:

* API Gateway needs PostgreSQL for route config loading.
* API Gateway needs Redis for rate limiting and caching.
* API Gateway proxies to Product Service.
* Health-based startup ordering makes local runtime more predictable.

Status:

Accepted.

---

## 2026-07-01 - Keep Runtime Hot Reload Out of Sprint 8

Decision:

Do not add runtime route hot reload in Sprint 8.

Reason:

* Sprint 8 focuses on database-backed route config foundation.
* Runtime hot reload adds complexity around route re-registration, stale routes, cache invalidation, validation errors, and concurrency.
* Startup DB loading is enough to prove the architecture.
* A simple and safe route management API should come before hot reload complexity.
* The Gateway already has static fallback for safety.

Current behavior:

```txt
Routes are loaded from database at API Gateway startup.
Route changes in database require API Gateway restart to take effect.
```

Deferred:

```txt
Runtime route reload
Route config watch mode
Admin-triggered route reload
Zero-downtime route replacement
```

Status:

Accepted.

---

## 2026-07-01 - Keep Admin Dashboard Out of Sprint 8

Decision:

Do not add Admin Dashboard in Sprint 8.

Reason:

* Sprint 8 is a backend architecture sprint.
* The Gateway first needs route config persistence and runtime loading.
* Admin Dashboard requires backend route management APIs first.
* Adding UI before stable backend route management would create scope creep.
* The next correct step is Route Management API foundation.

Deferred:

```txt
Admin Dashboard
Developer Portal
Route management UI
API key request UI
Usage analytics UI
```

Status:

Accepted.

---

## 2026-07-01 - Move Next Sprint Toward Route Management API Foundation

Decision:

After Sprint 8 final documentation update, move Sprint 9 toward Route Management API Foundation.

Reason:

* Sprint 8 added PostgreSQL-backed route config.
* The next product-like API Gateway capability is managing those route configs through APIs.
* Admin Dashboard should not be built until backend route management APIs exist.
* Route management API can reuse the existing route validation logic.
* Route management API can prepare for enable/disable, create, update, and read flows.
* Runtime reload can remain simple at first.

Recommended Sprint 9 direction:

```txt
1. Add internal/admin route config read API.
2. Add route config create/update foundation.
3. Add route config enable/disable behavior.
4. Reuse existing route validation before persisting route data.
5. Keep runtime reload strategy simple.
6. Add route management API tests.
7. Keep Admin Dashboard out of scope until backend route management is stable.
```

Not included at the beginning of Sprint 9:

```txt
Admin Dashboard UI
Developer Portal UI
Kafka
RabbitMQ
Kubernetes
OpenTelemetry
Loki
k6
Docker image registry push
Production cloud deployment
```

Status:

Accepted.

---

## 2026-07-01 - Keep Sprint 9 Focused on Route Management API Foundation

Decision:

Keep Sprint 9 focused on backend Route Management API foundation.

Reason:

* Sprint 8 already added PostgreSQL-backed Gateway route config.
* The next product-like API Gateway capability is managing those route configs through APIs.
* Admin Dashboard should not be built before backend route management APIs are stable.
* Route management should reuse the existing route config validation instead of creating a separate validation path.
* Keeping Sprint 9 backend-only avoids mixing API design, UI, hot reload, audit logs, and stronger admin authentication in one sprint.

Included in Sprint 9:

```txt
Internal/admin route config read API
Route config detail API
Route config create API
Route config update API
Route config enable/disable foundation
Admin API key middleware
Route management repository
Route management mapper
Validation before persistence
Duplicate method + gatewayPath conflict detection
Route management API tests
Environment documentation for admin API key config
Docker runtime validation
```

Not included in Sprint 9:

```txt
Admin Dashboard UI
Developer Portal UI
Runtime route hot reload
Route config delete endpoint
Route management audit log
Kafka
RabbitMQ
Kubernetes
OpenTelemetry
Loki
k6
Docker image registry push
Production cloud deployment
```

Status:

Accepted.

---

## 2026-07-01 - Protect Internal Admin APIs with Admin API Key

Decision:

Protect internal/admin route management APIs with a separate admin API key.

Reason:

* Route management APIs can change Gateway behavior and should not use the same consumer API key as normal clients.
* Consumer `x-api-key` is for protected API routes such as `GET /api/products`.
* Admin `x-admin-api-key` is for internal/admin operations such as reading, creating, and updating route configs.
* A simple admin API key is enough for the local-first Sprint 9 foundation.
* Stronger admin authentication can be added later when Admin Dashboard or real admin users are introduced.

Current internal/admin header:

```txt
x-admin-api-key
```

Current default local admin API key:

```txt
local-admin-key
```

Current environment variables:

```txt
ADMIN_API_KEY_HEADER=x-admin-api-key
ADMIN_API_KEY=local-admin-key
```

Current protected internal/admin APIs after Sprint 10:

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
Missing admin API key
  -> 401 ADMIN_API_KEY_MISSING

Invalid admin API key
  -> 403 ADMIN_API_KEY_INVALID

Valid admin API key
  -> Continue to route management behavior
```

Status:

Accepted.

---

## 2026-07-01 - Add Internal Admin Route Config Read APIs

Decision:

Add internal/admin APIs to read Gateway route configuration records.

Implemented endpoints:

```txt
GET /internal/admin/routes
GET /internal/admin/routes/:id
```

Reason:

* Route config must be observable before it can be safely created or updated through APIs.
* Future Admin Dashboard needs a backend API to list and inspect routes.
* Read APIs are the safest first step for route management.
* Disabled routes should still be visible to admin users even when they are not active at runtime.
* Keeping read APIs internal/admin-only protects route configuration details from normal API consumers.

Current behavior:

```txt
GET /internal/admin/routes
  -> Requires x-admin-api-key
  -> Returns all route configs
  -> Includes enabled and disabled routes
  -> Orders routes by priority and gateway path

GET /internal/admin/routes/:id
  -> Requires x-admin-api-key
  -> Returns one route config by id
  -> Returns 404 ROUTE_CONFIG_NOT_FOUND when route does not exist
```

Status:

Accepted.

---

## 2026-07-01 - Add Route Config Create API

Decision:

Add an internal/admin API to create Gateway route config records.

Implemented endpoint:

```txt
POST /internal/admin/routes
```

Reason:

* A product-like API Gateway should not require manual database edits to add routes.
* Route config creation is required before future Admin Dashboard route management.
* New route configs should be validated before they are persisted.
* The existing `validateDownstreamRoutes()` logic should be reused so runtime route validation and admin API validation stay consistent.
* Duplicate route identities should be rejected before persistence.

Current create flow:

```txt
Admin client
  -> POST /internal/admin/routes
  -> x-admin-api-key
  -> Admin API key middleware
  -> Parse request body
  -> Map request body to DownstreamRouteConfig
  -> validateDownstreamRoutes()
  -> Check duplicate method + gatewayPath
  -> Insert route into gateway.gateway_routes
  -> Return 201 Created
```

Current duplicate rule:

```txt
method + gatewayPath must be unique
```

Current duplicate response:

```txt
409 ROUTE_CONFIG_ALREADY_EXISTS
```

Status:

Accepted.

---

## 2026-07-01 - Add Route Config Update API with Partial PATCH Semantics

Decision:

Add an internal/admin API to update Gateway route config records using PATCH.

Implemented endpoint:

```txt
PATCH /internal/admin/routes/:id
```

Reason:

* Route config updates are required for practical route management.
* PATCH is suitable because admins often update only part of a route config, such as `enabled`, `priority`, or policy values.
* The update API should merge the existing route config with the patch body before validation.
* Reusing `validateDownstreamRoutes()` after merging prevents invalid runtime route configs from being persisted.
* Duplicate `method + gatewayPath` conflicts should be detected when a route is updated.

Current update flow:

```txt
Admin client
  -> PATCH /internal/admin/routes/:id
  -> x-admin-api-key
  -> Admin API key middleware
  -> Find existing route by id
  -> Return 404 if route does not exist
  -> Merge existing route config with PATCH body
  -> Map merged data to DownstreamRouteConfig
  -> validateDownstreamRoutes()
  -> Check method + gatewayPath conflict against other routes
  -> Update route in gateway.gateway_routes
  -> Return 200 OK
```

Current update error behavior:

```txt
Route config not found
  -> 404 ROUTE_CONFIG_NOT_FOUND

Invalid merged route config
  -> 400 ROUTE_CONFIG_INVALID

Conflict with another method + gatewayPath
  -> 409 ROUTE_CONFIG_ALREADY_EXISTS
```

Status:

Accepted.

---

## 2026-07-01 - Use PATCH `enabled` Field for Route Enable/Disable Foundation

Decision:

Use the route config `enabled` field through `PATCH /internal/admin/routes/:id` as the first enable/disable foundation.

Reason:

* The `gateway.gateway_routes` table already has an `enabled` column.
* A separate enable/disable endpoint is not necessary for the Sprint 9 foundation.
* Updating `enabled` through PATCH keeps the API surface small.
* Disabled routes should remain stored in the database and visible to admins.
* Runtime loading already filters enabled routes, so disabling a route is naturally supported after Gateway restart.

Current disable request example:

```json
{
  "enabled": false
}
```

Current behavior:

```txt
Route remains stored in gateway.gateway_routes
Route remains visible in GET /internal/admin/routes
Route is not loaded as an active runtime route after API Gateway restart
Client requests to the disabled route return 404
```

Status:

Accepted.

---

## 2026-07-01 - Keep Runtime Route Reload Restart-Based in Sprint 9

Decision:

Keep route config reload strategy simple in Sprint 9: route config changes take effect after API Gateway restart.

Reason:

* Sprint 9 focuses on route management API foundation, not hot reload.
* Runtime hot reload requires careful handling of route re-registration, stale routes, validation failures, cache behavior, and concurrency.
* Restart-based reload is predictable and safer for the first route management API version.
* The Gateway already loads route configs from PostgreSQL at startup.
* Hot reload can be designed later after create/update/enable/disable behavior is stable.

Current behavior:

```txt
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
  -> Write changes to gateway.gateway_routes

API Gateway restart
  -> loadRuntimeDownstreamRouteConfigs()
  -> Load enabled route configs from database
  -> Register runtime routes
```

Deferred:

```txt
Runtime route hot reload
Admin-triggered route reload endpoint
Route config watch mode
Zero-downtime route replacement
```

Status:

Accepted.

---

## 2026-07-01 - Reuse Existing Route Validation Before Persistence

Decision:

Reuse `validateDownstreamRoutes()` before creating or updating route configs through internal/admin APIs.

Reason:

* Runtime route validation already exists and is tested.
* Admin API validation should match runtime validation.
* Route configs that cannot safely run should not be persisted.
* Reusing the same validation reduces duplicate logic.
* This keeps route management behavior consistent with Gateway startup behavior.

Current validation use:

```txt
POST /internal/admin/routes
  -> Map request body to DownstreamRouteConfig
  -> validateDownstreamRoutes([routeConfig])
  -> Persist only if valid

PATCH /internal/admin/routes/:id
  -> Merge existing route with patch body
  -> Map merged body to DownstreamRouteConfig
  -> validateDownstreamRoutes([routeConfig])
  -> Persist only if valid
```

Current validation failure response:

```txt
400 ROUTE_CONFIG_INVALID
```

Status:

Accepted.

---

## 2026-07-01 - Add Dedicated Route Management Module

Decision:

Add a dedicated `route-management` module for internal/admin route config read, create, and update behavior.

Reason:

* Route management logic should not be mixed directly into generic proxy routing.
* Request/response mapping should be separated from Prisma persistence.
* Repository logic should be abstracted for easier testing.
* Admin route config APIs should be testable without real PostgreSQL.
* This structure prepares the project for future route delete, audit log, hot reload, and Admin Dashboard features.

Implemented files:

```txt
apps/api-gateway/src/route-management/route-management.types.ts
apps/api-gateway/src/route-management/route-management.mapper.ts
apps/api-gateway/src/route-management/route-management.repository.ts
apps/api-gateway/src/routes/admin-route-config.route.ts
apps/api-gateway/src/routes/admin-route-config.route.test.ts
```

Current repository behavior:

```txt
listRoutes()
findRouteById(id)
findRouteByMethodAndGatewayPath(method, gatewayPath)
createRoute(data)
updateRoute(id, data)
```

Status:

Accepted.

---

## 2026-07-01 - Document and Test Admin API Key Environment Configuration

Decision:

Document admin API key environment variables in `.env.example` and add tests for admin env parsing.

Reason:

* Sprint 9 introduced new admin security configuration.
* `.env.example` should stay synchronized with actual runtime env usage.
* Future developers should understand the difference between consumer API key and admin API key.
* Tests should confirm default and custom admin API key values are exposed correctly.
* Keeping env documentation accurate avoids confusion during future Admin Dashboard or deployment work.

Current documented variables:

```txt
ADMIN_API_KEY_HEADER=x-admin-api-key
ADMIN_API_KEY=local-admin-key
```

Current distinction:

```txt
x-api-key
  -> Consumer/client API key for protected routes such as GET /api/products

x-admin-api-key
  -> Internal/admin API key for route management APIs
```

Current env test coverage:

```txt
apps/api-gateway/src/config/env.test.ts
  -> Default admin API key config
  -> Custom admin API key config
```

Status:

Accepted.

---

## 2026-07-01 - Move Next Sprint Toward Route Management Hardening or Admin Dashboard Foundation

Decision:

After Sprint 9 final documentation update, move Sprint 10 toward Route Management Hardening or Admin Dashboard Foundation.

Reason:

* Sprint 9 completed the backend route management API foundation.
* The next step should either strengthen route management backend behavior or begin a small Admin Dashboard foundation.
* Runtime hot reload, soft-delete, stronger admin authentication, and audit logs are natural backend hardening steps.
* Admin Dashboard should only start after backend route management behavior is stable.
* The project should continue with small, stable checkpoints.

Recommended Sprint 10 direction:

```txt
1. Add route config delete or soft-delete strategy.
2. Add safe route config reload endpoint or hot reload foundation.
3. Add stronger admin authentication foundation if needed.
4. Add route management audit fields or audit log foundation.
5. Add Admin Dashboard only after backend route management behavior is stable.
```

Not included automatically:

```txt
Kafka
RabbitMQ
Kubernetes
Developer Portal
OpenTelemetry
Loki
k6
Production cloud deployment
Docker image registry push
Automatic deployment
```

Status:

Accepted.

---

## 2026-07-02 - Keep Sprint 10 Focused on Route Management Hardening

Decision:

Keep Sprint 10 focused on backend Route Management Hardening instead of starting the Admin Dashboard immediately.

Reason:

* Sprint 9 created the route management API foundation, but the backend still needed stronger lifecycle behavior.
* Route delete behavior should be designed before a UI exposes route deletion to admins.
* Route reload behavior should be explicitly validated before attempting runtime hot reload.
* Audit metadata should exist before stronger admin workflows are added.
* Starting Admin Dashboard too early would hide backend lifecycle gaps behind UI work.
* The project should continue to grow like a product-like API Gateway through stable backend checkpoints.

Included in Sprint 10:

```txt
Route config soft delete
Route lifecycle metadata
Active-route uniqueness with PostgreSQL partial unique index
Admin route delete endpoint
Reload validation endpoint
Runtime loader filtering for non-deleted active routes
Route management tests
Docker runtime validation
Documentation update
```

Not included in Sprint 10:

```txt
Admin Dashboard UI
Developer Portal UI
True runtime hot reload
Route management audit log table
Admin users and RBAC
Kafka
RabbitMQ
Kubernetes
OpenTelemetry
Loki
k6
Docker image registry push
Production cloud deployment
```

Status:

Accepted.

---

## 2026-07-02 - Use Soft Delete for Gateway Route Config

Decision:

Use soft delete instead of hard delete for Gateway route config records.

Implemented endpoint:

```txt
DELETE /internal/admin/routes/:id
```

Soft delete behavior:

```txt
Find active route by id
If route does not exist or is already soft-deleted:
  -> 404 ROUTE_CONFIG_NOT_FOUND

If route exists:
  -> enabled = false
  -> deleted_at = current timestamp
  -> deleted_by = admin actor
  -> updated_by = admin actor
  -> return the deleted route config response
```

Reason:

* Route config records are operationally important and should not disappear immediately.
* Soft delete preserves history for debugging and future audit workflows.
* Deleted route configs should no longer be active at runtime.
* Deleted route configs should not be visible through normal admin list/detail APIs.
* Soft delete prepares the project for future restore, audit log, and Admin Dashboard history views.
* It is safer than hard delete for an API Gateway configuration system.

Current behavior:

```txt
GET /internal/admin/routes
  -> returns only routes where deleted_at IS NULL

GET /internal/admin/routes/:id
  -> returns 404 if route is soft-deleted

DELETE /internal/admin/routes/:id
  -> marks route as deleted instead of removing the row

Runtime route loader
  -> loads only enabled=true and deleted_at IS NULL
```

Status:

Accepted.

---

## 2026-07-02 - Add Route Lifecycle Metadata Fields

Decision:

Add basic lifecycle metadata directly to `gateway.gateway_routes`.

Added fields:

```txt
created_by
updated_by
deleted_at
deleted_by
```

Existing fields:

```txt
created_at
updated_at
```

Reason:

* Route management operations should record who created, updated, or deleted a route.
* A simple metadata foundation is useful before adding a full audit log table.
* `deleted_at` is needed to implement soft delete safely.
* `deleted_by` is needed to understand who performed a delete operation.
* `created_by` and `updated_by` make admin route changes easier to inspect.
* These fields are low-complexity and fit the current local-first admin API key model.

Current source for actor attribution:

```txt
x-admin-actor
```

Default actor fallback:

```txt
admin-api-key
```

Status:

Accepted.

---

## 2026-07-02 - Use `x-admin-actor` for Basic Admin Attribution

Decision:

Allow internal/admin route management requests to pass a basic actor identifier through `x-admin-actor`.

Reason:

* Sprint 10 does not introduce full admin users or RBAC yet.
* Route management metadata still needs a basic actor value.
* `x-admin-actor` is simple for local testing and future Admin Dashboard integration.
* The Gateway should still have a safe fallback actor when the header is missing.
* This keeps audit metadata useful without adding authentication complexity too early.

Current behavior:

```txt
x-admin-actor present and non-empty
  -> use it for createdBy, updatedBy, or deletedBy

x-admin-actor missing or empty
  -> use admin-api-key
```

Current affected operations:

```txt
POST /internal/admin/routes
  -> sets created_by and updated_by

PATCH /internal/admin/routes/:id
  -> sets updated_by

DELETE /internal/admin/routes/:id
  -> sets updated_by and deleted_by
```

Status:

Accepted.

---

## 2026-07-02 - Replace Full Route Unique Constraint with Active-Route Partial Unique Index

Decision:

Replace the old full unique constraint on `method + gateway_path` with a PostgreSQL partial unique index for active routes only.

Old rule:

```txt
unique(method, gateway_path)
```

New rule:

```txt
unique(method, gateway_path) where deleted_at IS NULL
```

Implemented index:

```txt
gateway_routes_method_gateway_path_active_key
```

Reason:

* With soft delete, historical deleted rows should remain in the database.
* A full unique constraint would prevent recreating the same route after soft delete.
* Active routes still must not duplicate the same method + gateway path.
* PostgreSQL partial unique indexes solve this correctly.
* Prisma schema cannot express this partial unique index directly, so the migration uses raw SQL.
* Route management repository duplicate checks should also only consider non-deleted routes.

Current behavior:

```txt
Create duplicate active method + gatewayPath
  -> 409 ROUTE_CONFIG_ALREADY_EXISTS

Soft delete existing route
  -> deleted_at is set

Create same method + gatewayPath again
  -> allowed because old row is soft-deleted
```

Status:

Accepted.

---

## 2026-07-02 - Exclude Soft-Deleted Routes from Runtime and Admin Read Logic

Decision:

Exclude soft-deleted route configs from normal admin read behavior and runtime route loading.

Reason:

* Soft-deleted routes should behave as deleted from the normal admin management perspective.
* Runtime should never register a deleted route.
* Duplicate checks should ignore soft-deleted route history and only protect active route identity.
* This keeps soft delete history in the database without confusing the active route management surface.

Current repository behavior:

```txt
listRoutes()
  -> where deletedAt is null

findRouteById(id)
  -> where id matches and deletedAt is null

findRouteByMethodAndGatewayPath(method, gatewayPath)
  -> where method + gatewayPath match and deletedAt is null

softDeleteRoute(id, actor)
  -> update enabled=false, deletedAt, deletedBy, updatedBy
```

Current runtime DB loader behavior:

```txt
where enabled = true and deleted_at is null
```

Current mapper safety behavior:

```txt
filter records where enabled is true and deletedAt is not set
```

Status:

Accepted.

---

## 2026-07-02 - Add Safe Route Reload Validation Endpoint Before True Hot Reload

Decision:

Add an admin route reload validation endpoint, but keep it validation-only for Sprint 10.

Implemented endpoint:

```txt
POST /internal/admin/routes/reload
```

Current response shape:

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
      }
    ]
  }
}
```

Reason:

* Admin users need a way to validate DB route config health before restarting or applying runtime changes.
* True Fastify runtime hot reload requires careful route replacement design.
* Unsafe re-registration can leave stale routes or duplicate handlers.
* A validation-only endpoint provides immediate operational value without pretending to hot reload.
* This endpoint establishes the admin API contract for future reload/hot-swap work.
* It makes current runtime behavior explicit: route changes still require restart to apply.

Current behavior:

```txt
POST /internal/admin/routes/reload
  -> Requires x-admin-api-key
  -> Loads non-deleted route configs through repository
  -> Filters enabled active routes
  -> Maps routes to DownstreamRouteConfig[]
  -> Reuses existing validation path
  -> Returns routeCount and route summary
  -> Does not mutate database
  -> Does not replace runtime routes
```

Current explicit flags:

```txt
mode=validation-only
runtimeApplied=false
requiresRestart=true
```

Status:

Accepted.

---

## 2026-07-02 - Keep Runtime Route Application Restart-Based After Sprint 10

Decision:

Keep actual runtime route application restart-based after Sprint 10, even though a reload validation endpoint now exists.

Reason:

* Sprint 10 validates route config safety but does not implement route hot swapping.
* Fastify runtime route replacement should be treated as a separate controlled design.
* A future hot reload implementation must define stale route removal, concurrency safety, validation failure behavior, metrics impact, and cache/rate-limit implications.
* Restart-based application remains predictable and safe.
* The validation-only endpoint reduces risk by checking DB route config health before restart.

Current route lifecycle:

```txt
Create/update/delete route config
  -> persists immediately in PostgreSQL

POST /internal/admin/routes/reload
  -> validates current active DB route configs
  -> does not apply runtime changes

API Gateway restart
  -> loads enabled=true and deleted_at IS NULL routes
  -> applies route changes to runtime proxy routing
```

Status:

Accepted.

---

## 2026-07-02 - Keep Full Audit Log Table Out of Sprint 10

Decision:

Do not add a separate route management audit log table in Sprint 10.

Reason:

* Sprint 10 already adds basic lifecycle metadata on the route record.
* A full audit log table requires deciding event names, old/new value snapshots, actor model, retention, and querying APIs.
* The current admin auth model is still a local admin API key, not full admin users.
* Soft delete and lifecycle metadata are enough for the current hardening checkpoint.
* A full audit log can be added later after admin users/RBAC or Admin Dashboard workflows are clearer.

Current audit foundation:

```txt
created_by
updated_by
deleted_at
deleted_by
created_at
updated_at
x-admin-actor
```

Deferred:

```txt
gateway.route_audit_logs table
before/after route snapshots
admin user identity model
audit log list/detail APIs
audit log filters
Admin Dashboard audit views
```

Status:

Accepted.

---

## 2026-07-02 - Move Next Sprint Toward Controlled Runtime Reload or Admin Hardening

Decision:

After Sprint 10 final documentation update, move Sprint 11 toward a controlled backend improvement rather than jumping directly into unrelated infrastructure.

Recommended Sprint 11 direction:

```txt
Option A: True route reload/hot-swap foundation
Option B: Route management audit log table
Option C: Stronger admin authentication/RBAC foundation
Option D: Small Admin Dashboard foundation only after choosing the backend readiness target
```

Reason:

* Sprint 10 completed soft delete and reload validation, but true runtime application still requires restart.
* A product-like API Gateway should eventually support safer config reload behavior.
* Audit logs and stronger admin authentication are also natural next backend hardening steps.
* Admin Dashboard should be built on top of stable backend lifecycle and auth behavior.
* Kafka, RabbitMQ, Kubernetes, OpenTelemetry, Loki, k6, and cloud deployment are still later-stage concerns.

Not included automatically:

```txt
Kafka
RabbitMQ
Kubernetes
Developer Portal
OpenTelemetry
Loki
k6
Docker image registry push
Production cloud deployment
Automatic deployment
```

Status:

Accepted.

