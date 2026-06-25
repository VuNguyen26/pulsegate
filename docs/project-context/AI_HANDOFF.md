# AI Handoff

## Project Name

PulseGate - High-Traffic API Gateway & Observability Platform

## Current Version

v0.1.0

## Current Status

Sprint 0 is complete.

The project is ready to move to:

```txt
Sprint 1 - API Gateway Core Features
```

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
10. Keep this handoff file updated when the project grows.

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
* Validate JWT or API keys.
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

Current Sprint 0 architecture:

```txt
Client
  -> API Gateway :3000
    -> Product Service :3001
      -> Mock product response
```

Current working endpoint through Gateway:

```txt
GET http://localhost:3000/api/products
```

Gateway forwards the request to:

```txt
GET http://127.0.0.1:3001/products
```

---

## Current Tech Stack

Currently used:

* Node.js
* TypeScript
* Fastify
* npm workspaces

Added in Sprint 0:

* `.gitignore`
* `.gitattributes`
* `.env.example`
* Project context documentation
* Architecture documentation
* Requirements documentation
* GitHub-ready README

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
* Unit tests
* Integration tests
* Admin Dashboard
* Developer Portal

---

## Repository Structure

```txt
pulsegate/
  apps/
    api-gateway/
      src/
        config/
          env.ts
        middlewares/
          error-handler.middleware.ts
          request-id.middleware.ts
        routes/
          health.route.ts
          product-proxy.route.ts
        server.ts
      package.json
      tsconfig.json

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

Current structure:

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

Current structure:

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

Test API Gateway:

```powershell
Invoke-RestMethod http://localhost:3000/health | ConvertTo-Json -Depth 10
Invoke-RestMethod http://localhost:3000/api/products | ConvertTo-Json -Depth 10
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
```

---

## Current Next Step

Start:

```txt
Sprint 1 - API Gateway Core Features
```

Recommended Sprint 1 order:

1. Improve downstream service error handling.
2. Add request timeout when Gateway calls Product Service.
3. Add route configuration foundation.
4. Add API key authentication.
5. Add JWT authentication later.
6. Add unit tests.
7. Add integration tests.

Recommended first Sprint 1 task:

```txt
Sprint 1 - Step 1: Normalize downstream service errors
```

Goal:

When Product Service is down or returns an error, API Gateway should return a clean, consistent error response instead of a raw `fetch failed` or generic internal error.

---

## Important Development Rules

Do not add complex infrastructure yet.

Do not add these before Gateway core features are stable:

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

The immediate goal is to make API Gateway behavior more production-like first.

---

## How the Assistant Should Continue

When continuing from this file, the assistant should continue with:

```txt
Sprint 1 - Step 1: Normalize downstream service errors
```

The assistant should continue slowly, one file or one small feature at a time.

Before coding Sprint 1, the assistant should explain:

* What problem the step solves.
* What the expected behavior is.
* What files will be changed.
* How to test success and failure cases.
