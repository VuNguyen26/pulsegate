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
