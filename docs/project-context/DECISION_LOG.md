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
Sprint 2: Redis / rate limit / cache
Sprint 3: Docker Compose
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
