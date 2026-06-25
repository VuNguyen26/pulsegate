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
