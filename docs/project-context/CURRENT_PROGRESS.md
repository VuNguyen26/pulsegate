# Current Progress

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

## Current Sprint

Sprint 1 - API Gateway Core Features

## Current Version

v0.2.0-in-progress

## Sprint Status

Sprint 1 is in progress.

Sprint 0 is complete.

Sprint 1 has completed the first four Gateway core feature checkpoints:

1. Normalize downstream service errors.
2. Add downstream request timeout.
3. Add downstream route configuration foundation.
4. Add API key authentication.

## Completed

### Repository Setup

* GitHub repository created.
* Local repository cloned.
* npm workspaces configured.
* TypeScript configured.
* Basic monorepo structure created.
* `.gitignore` added.
* `.gitattributes` added.
* `.env.example` added.

### API Gateway

Location:

```txt
apps/api-gateway
```

Current port:

```txt
3000
```

Implemented:

* Fastify server.
* Health check endpoint.
* Product proxy endpoint.
* Request ID generation.
* Request ID response header.
* Request ID forwarding to Product Service.
* JSON logger.
* Basic 404 handler.
* Basic 500 error handler.
* Config separated into `config/env.ts`.
* Routes separated into `routes`.
* Middlewares separated into `middlewares`.
* Normalized downstream service errors.
* Downstream request timeout using `AbortController`.
* Configurable downstream request timeout through `DOWNSTREAM_REQUEST_TIMEOUT_MS`.
* Downstream route configuration foundation.
* API key authentication middleware.
* Configurable API key header through `API_KEY_HEADER`.
* Local development API key list through `API_KEYS`.

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
```

Current API key header:

```txt
x-api-key
```

Default local development API key:

```txt
dev-api-key
```

Current structure:

```txt
apps/api-gateway/src/
  config/
    downstream-routes.ts
    env.ts
  errors/
    downstream-service-error.ts
  middlewares/
    api-key-auth.middleware.ts
    error-handler.middleware.ts
    request-id.middleware.ts
  routes/
    health.route.ts
    product-proxy.route.ts
  server.ts
```

### Product Service

Location:

```txt
apps/product-service
```

Current port:

```txt
3001
```

Implemented:

* Fastify server.
* Health check endpoint.
* Products endpoint with mock data.
* Request ID generation and reuse.
* Request ID reuse from API Gateway.
* JSON logger.
* Basic 404 handler.
* Basic 500 error handler.
* Config separated into `config/env.ts`.
* Routes separated into `routes`.
* Middlewares separated into `middlewares`.

Current endpoints:

```txt
GET /health
GET /products
```

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

## Current Working Flow

```txt
Client
  -> API Gateway :3000
    -> API key check for protected routes
      -> Product Service :3001
        -> Mock Product Response
```

Current product request flow:

```txt
Client
  -> GET http://localhost:3000/api/products
    -> API Gateway checks x-api-key
      -> If missing: 401 API_KEY_MISSING
      -> If invalid: 403 API_KEY_INVALID
      -> If valid:
        -> API Gateway calls Product Service
          -> GET http://127.0.0.1:3001/products
        -> Product Service returns mock product data
    -> API Gateway returns response to Client
```

## Main Test Commands

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

Test API Gateway health:

```powershell
Invoke-RestMethod http://localhost:3000/health | ConvertTo-Json -Depth 10
```

Test API Gateway products with valid API key:

```powershell
Invoke-RestMethod http://localhost:3000/api/products `
  -Headers @{ "x-api-key" = "dev-api-key" } |
  ConvertTo-Json -Depth 10
```

Test missing API key:

```powershell
try {
  Invoke-RestMethod http://localhost:3000/api/products | ConvertTo-Json -Depth 10
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}
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

Expected status:

```txt
401
```

Test invalid API key:

```powershell
try {
  Invoke-RestMethod http://localhost:3000/api/products `
    -Headers @{ "x-api-key" = "wrong-key" } |
    ConvertTo-Json -Depth 10
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
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

Expected status:

```txt
403
```

Expected products response with valid API key:

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

## Downstream Error Behavior

When Product Service is unavailable, API Gateway returns:

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

When Product Service is too slow, API Gateway returns:

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

## Validation Status

Latest validation:

* `npm run typecheck` passed.
* `npm run build` passed.
* Product Service `/health` passed.
* Product Service `/products` passed.
* API Gateway `/health` passed without API key.
* API Gateway `/api/products` passed with valid API key.
* API Gateway `/api/products` returned `401 API_KEY_MISSING` without API key.
* API Gateway `/api/products` returned `403 API_KEY_INVALID` with invalid API key.
* API Gateway `/api/products` returned `503 DOWNSTREAM_SERVICE_UNAVAILABLE` when Product Service was down.
* API Gateway `/api/products` returned `504 DOWNSTREAM_TIMEOUT` when Product Service was intentionally delayed.
* Code pushed to GitHub.
* Git working tree was clean after latest commit.

## Documentation Status

Completed documentation:

* `README.md`
* `.env.example`
* `docs/project-context/CURRENT_PROGRESS.md`
* `docs/project-context/DECISION_LOG.md`
* `docs/project-context/AI_HANDOFF.md`
* `docs/architecture/overview.md`
* `docs/sdlc/requirements.md`

## Latest Stable Commits

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
```

## Current Status

Sprint 0 is complete.

Sprint 1 is in progress.

PulseGate currently has a stable local-first API Gateway foundation with basic production-oriented Gateway behavior:

```txt
Client
  -> API Gateway
    -> Request ID handling
    -> API key authentication for protected routes
    -> Downstream route configuration
    -> Downstream timeout handling
    -> Normalized downstream error handling
    -> Product Service
      -> Mock product response
```

## Sprint 1 Progress

### Done

1. Normalize downstream service errors.
2. Add downstream request timeout.
3. Add route configuration foundation.
4. Add API key authentication.

### Remaining

1. JWT authentication later.
2. Unit tests.
3. Integration tests.

## Recommended Next Step

Recommended next step:

```txt
Sprint 1 - Step 5: Add basic unit test setup
```

Reason:

The Gateway now has enough core logic to justify adding tests before adding more authentication complexity.

Important logic that should be protected by tests:

* Environment parsing.
* API key authentication.
* Downstream error response behavior.
* Request ID behavior.
* Gateway proxy behavior.

JWT authentication can be added later after the test foundation is in place.

## Do Not Add Yet

Do not add these before Gateway core features and tests are stable:

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

## Notes

The project should continue with small, stable checkpoints.

Each new feature should follow this workflow:

1. Implement code in small steps.
2. Explain purpose and request flow.
3. Run local tests.
4. Run `npm run typecheck`.
5. Run `npm run build`.
6. Commit after stable checkpoint.
7. Update project context docs when needed.

Current preferred development style:

* Code sample first.
* Explain each file.
* Explain the request flow.
* Test manually.
* Run typecheck and build.
* Commit only after a stable checkpoint.
* Push after each stable commit.
