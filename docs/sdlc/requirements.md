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

* API Gateway separates config, routes, middlewares, and server startup.
* Product Service separates config, routes, middlewares, and server startup.
* `server.ts` mainly creates the app, registers routes/middlewares, and starts the server.
* Business routes live in `routes`.
* Reusable request handling logic lives in `middlewares`.

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

Status:

```txt
Done
```

## 8. Current System Constraints

Current constraints after Sprint 0:

* Product data is hard-coded.
* No database is connected.
* No authentication exists yet.
* No rate limiting exists yet.
* No caching exists yet.
* No Docker setup exists yet.
* No metrics dashboard exists yet.
* No tracing system exists yet.
* API Gateway currently proxies only Product Service.
* API Gateway does not yet normalize downstream service failures.
* API Gateway does not yet apply request timeout to downstream calls.

## 9. Sprint 1 Goal

Sprint 1 focuses on API Gateway core behavior.

The goal is to make the Gateway more production-like before adding infrastructure.

Sprint 1 should improve:

* Downstream service error handling.
* Request timeout handling.
* Gateway route configuration foundation.
* API key authentication.
* JWT authentication later.
* Unit tests.
* Integration tests.

Sprint 1 should still avoid:

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

## 10. Sprint 1 Functional Requirements

### S1-FR-001: Normalize Downstream Service Errors

API Gateway must return a clean and consistent error response when a downstream service is unavailable.

Problem:

Currently, if Product Service is down, `fetch` may throw a low-level error such as `fetch failed`.

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

Status:

```txt
Planned
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

Status:

```txt
Planned
```

---

### S1-FR-003: Route Configuration Foundation

API Gateway should move hard-coded downstream route information toward a route configuration structure.

Acceptance criteria:

* Product Service URL remains configurable.
* Product route config is separated from route handler logic.
* Future services can be added without rewriting Gateway core logic too much.
* Route config should be simple in Sprint 1.

Status:

```txt
Planned
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

Status:

```txt
Planned
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

Status:

```txt
Planned
```

---

### S1-FR-006: Unit Tests

The project should add basic unit tests.

Acceptance criteria:

* Request ID generation is tested.
* Error response builder is tested.
* Gateway utility functions are tested where applicable.
* Tests can be run with an npm script.

Status:

```txt
Planned
```

---

### S1-FR-007: Integration Tests

The project should add basic integration tests for the current flow.

Acceptance criteria:

* Test API Gateway `/health`.
* Test Product Service `/health`.
* Test Product Service `/products`.
* Test API Gateway `/api/products`.
* Test Gateway behavior when downstream service is unavailable.

Status:

```txt
Planned
```

## 11. Future Functional Requirements

These requirements are planned for later sprints.

### Future FR: Rate Limiting

API Gateway should limit excessive requests.

Planned features:

* Limit requests by IP.
* Limit requests by API key.
* Store counters in Redis.
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

## 14. Next Sprint

Next sprint:

```txt
Sprint 1 - API Gateway Core Features
```

Recommended first task:

```txt
Sprint 1 - Step 1: Normalize downstream service errors
```
