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

Sprint 0 focuses on the smallest working system.

The goal is to prove this flow:

```txt
Client
  -> API Gateway
    -> Product Service
      -> Response
```

Sprint 0 should not include complex infrastructure yet.

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

Current status:

```txt
In progress
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
* `server.ts` should mainly create the app, register routes/middlewares, and start the server.
* Business routes should live in `routes`.
* Reusable request handling logic should live in `middlewares`.

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

Current Sprint 0 constraints:

* Product data is hard-coded.
* No database is connected.
* No authentication exists yet.
* No rate limiting exists yet.
* No caching exists yet.
* No Docker setup exists yet.
* No metrics dashboard exists yet.
* No tracing system exists yet.
* API Gateway currently proxies only Product Service.

## 9. Future Functional Requirements

These requirements are planned for later sprints.

### Future FR: API Key Authentication

API Gateway should validate API keys before forwarding requests.

Planned features:

* Generate API keys.
* Store API keys.
* Validate API keys from request headers.
* Reject invalid API keys.

Status:

```txt
Planned
```

---

### Future FR: JWT Authentication

API Gateway should validate JWT access tokens.

Planned features:

* Validate Bearer token.
* Reject missing or invalid token.
* Forward user context to downstream services.

Status:

```txt
Planned
```

---

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

## 10. Current Test Commands

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

## 11. Sprint 0 Definition of Done

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
* Code is pushed to GitHub.

Current Sprint 0 status:

```txt
In progress
```
