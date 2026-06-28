````md
# PulseGate

<p align="center">
  <strong>High-Traffic API Gateway & Observability Platform</strong>
</p>

<p align="center">
  A local-first API Gateway, API Management, and Observability learning project built with Node.js, TypeScript, Fastify, Docker Compose, and a microservice-oriented architecture.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-Sprint%203%20In%20Progress-blue" />
  <img src="https://img.shields.io/badge/version-v0.3.0-blue" />
  <img src="https://img.shields.io/badge/tests-71%20passing-brightgreen" />
  <img src="https://img.shields.io/badge/typecheck-passing-brightgreen" />
  <img src="https://img.shields.io/badge/build-passing-brightgreen" />
  <img src="https://img.shields.io/badge/Node.js-20%2B-green" />
  <img src="https://img.shields.io/badge/TypeScript-strict-blue" />
  <img src="https://img.shields.io/badge/Fastify-API%20Gateway-black" />
  <img src="https://img.shields.io/badge/Auth-API%20Key%20%2B%20JWT-purple" />
  <img src="https://img.shields.io/badge/Traffic%20Protection-Rate%20Limit%20%2B%20Size%20Limit-orange" />
  <img src="https://img.shields.io/badge/Docker%20Compose-enabled-blue" />
  <img src="https://img.shields.io/badge/License-MIT-lightgrey" />
</p>

---

## Overview

**PulseGate** is a mini API Gateway + API Management + Observability Platform inspired by:

* Kong
* Apache APISIX
* Tyk
* Apigee
* AWS API Gateway

The project is designed to demonstrate backend engineering skills around API routing, microservice communication, authentication, traffic protection, request tracing, error handling, testing, observability, scalability, and production-oriented system design.

PulseGate starts small and grows step by step.

Current stable flow:

```txt
Client
  -> API Gateway :3000
    -> Request ID handling
    -> Basic security headers
    -> Request size limit
    -> API key authentication
    -> In-memory rate limiting
    -> JWT authentication
    -> Downstream route configuration
    -> Downstream timeout handling
    -> Normalized downstream error handling
    -> Product Service :3001
      -> Mock Product Response
````

Current version:

```txt
v0.3.0
```

Current sprint status:

```txt
Sprint 3 - Data & Infrastructure Foundation In Progress
```

---

## Project Status

| Area            | Status                                                                                             | Notes                                      |
| --------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Sprint 0        | ![Complete](https://img.shields.io/badge/status-complete-brightgreen)                              | Core setup and basic Gateway flow          |
| Sprint 1        | ![Complete](https://img.shields.io/badge/status-complete-brightgreen)                              | API Gateway core features                  |
| Sprint 2        | ![Complete](https://img.shields.io/badge/status-complete-brightgreen)                              | Gateway traffic protection                 |
| Sprint 3        | ![In Progress](https://img.shields.io/badge/status-in%20progress-blue)                             | Data and infrastructure foundation         |
| Current Version | ![v0.3.0](https://img.shields.io/badge/version-v0.3.0-blue)                                        | Traffic-protected local Gateway foundation |
| Automated Tests | ![71 Passing](https://img.shields.io/badge/tests-71%20passing-brightgreen)                         | Unit and integration tests                 |
| Typecheck       | ![Passing](https://img.shields.io/badge/typecheck-passing-brightgreen)                             | TypeScript validation passes               |
| Build           | ![Passing](https://img.shields.io/badge/build-passing-brightgreen)                                 | Production build passes                    |
| Current Sprint  | ![Sprint 3](https://img.shields.io/badge/Sprint%203-Data%20%26%20Infrastructure%20Foundation-blue) | Docker Compose foundation added            |

---

## Why PulseGate?

Modern backend systems often contain many services. Without an API Gateway, clients may need to call each service directly, which creates problems around routing, security, rate limiting, logging, monitoring, and scaling.

PulseGate aims to solve these problems by acting as a single entry point for APIs.

Long-term goals:

* Route requests to the correct backend service.
* Validate API keys and JWT tokens.
* Apply rate limiting to protect services.
* Add request size protection.
* Add security headers.
* Add Redis caching to reduce backend load.
* Log requests with request IDs.
* Expose metrics for monitoring.
* Add distributed tracing.
* Stream events with Kafka.
* Process background jobs with RabbitMQ.
* Run load tests with k6.
* Support Docker Compose and later Kubernetes.
* Provide an Admin Dashboard and Developer Portal later.

---

## Current Features

### Sprint 0 - Core Setup & Basic Gateway Flow

| Feature                                                      | Status                                                        |
| ------------------------------------------------------------ | ------------------------------------------------------------- |
| API Gateway running on port `3000`                           | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Product Service running on port `3001`                       | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Gateway route: `GET /api/products`                           | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Product Service route: `GET /products`                       | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Health check APIs                                            | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Request ID generation                                        | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Request ID propagation from Gateway to Product Service       | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| JSON logging                                                 | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Basic 404 error handling                                     | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Basic 500 error handling                                     | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| TypeScript strict mode                                       | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| npm workspaces monorepo                                      | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Clean service structure with config, routes, and middlewares | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Project context documentation                                | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Architecture documentation                                   | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Requirements documentation                                   | ![Done](https://img.shields.io/badge/status-done-brightgreen) |

### Sprint 1 - API Gateway Core Features

| Feature                                                                                     | Status                                                        |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Normalized downstream service errors                                                        | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Downstream request timeout using `AbortController`                                          | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Configurable downstream timeout through `DOWNSTREAM_REQUEST_TIMEOUT_MS`                     | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Downstream route configuration foundation                                                   | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| API key authentication                                                                      | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Configurable API key header through `API_KEY_HEADER`                                        | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Local API key list through `API_KEYS`                                                       | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| JWT authentication using `jose`                                                             | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| JWT config through `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`, and `JWT_EXPIRES_IN_SECONDS` | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Protected route with API key and JWT                                                        | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Unit test setup with Vitest                                                                 | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Integration tests using Fastify `app.inject()`                                              | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Manual validation for API key and JWT protected routes                                      | ![Done](https://img.shields.io/badge/status-done-brightgreen) |

### Sprint 2 - Gateway Traffic Protection

| Feature                                   | Status                                                        | Notes                                    |
| ----------------------------------------- | ------------------------------------------------------------- | ---------------------------------------- |
| In-memory rate limiting foundation        | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Behavior first before Redis              |
| Route-level rate limit configuration      | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Per-route traffic rules                  |
| Rate limit response behavior              | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Returns `429 TOO_MANY_REQUESTS`          |
| Request size limit                        | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Protects Gateway from oversized payloads |
| Basic security headers                    | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Adds safer HTTP response defaults        |
| Route-level auth configuration refinement | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Moves auth requirements closer to config |
| Traffic protection tests                  | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Unit and integration tests               |

### Sprint 3 - Data & Infrastructure Foundation

| Feature                      | Status                                                            | Notes                                     |
| ---------------------------- | ----------------------------------------------------------------- | ----------------------------------------- |
| Docker Compose foundation    | ![Done](https://img.shields.io/badge/status-done-brightgreen)     | Runs API Gateway and Product Service      |
| Containerize API Gateway     | ![Done](https://img.shields.io/badge/status-done-brightgreen)     | API Gateway container runs on port `3000` |
| Containerize Product Service | ![Done](https://img.shields.io/badge/status-done-brightgreen)     | Product Service container runs on `3001`  |
| PostgreSQL service           | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) | Planned for next infrastructure step      |
| Prisma setup                 | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) | Planned after PostgreSQL foundation       |
| Database-backed products     | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) | Will replace mock product data            |
| Redis-backed rate limiting   | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) | Will replace in-memory rate limit store   |
| Basic response caching       | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) | Planned after Redis foundation            |

---

## Current Architecture

```mermaid
flowchart LR
    Client[Client / API Consumer] --> Gateway[PulseGate API Gateway<br/>Port 3000]
    Gateway --> ReqId[Request ID Middleware]
    ReqId --> SecurityHeaders[Security Headers Middleware]
    SecurityHeaders --> SizeLimit[Request Size Limit]
    SizeLimit --> ApiKey[API Key Authentication]
    ApiKey --> RateLimit[In-Memory Rate Limiting]
    RateLimit --> Jwt[JWT Authentication]
    Jwt --> RouteConfig[Downstream Route Config]
    RouteConfig --> Product[Product Service<br/>Port 3001]
    Product --> Response[Mock Product Response]
    Response --> Product
    Product --> Gateway
    Gateway --> Client
```

Current protected request flow:

```txt
GET http://localhost:3000/api/products

Client
  -> API Gateway
    -> Create or reuse x-request-id
    -> Add security headers
    -> Apply request size limit
    -> Check x-api-key
      -> Missing: 401 API_KEY_MISSING
      -> Invalid: 403 API_KEY_INVALID
    -> Apply rate limit by API key and route
      -> Exceeded: 429 TOO_MANY_REQUESTS
    -> Check Authorization Bearer token
      -> Missing: 401 JWT_TOKEN_MISSING
      -> Invalid: 403 JWT_TOKEN_INVALID
    -> Call Product Service
      -> Local npm: http://127.0.0.1:3001/products
      -> Docker Compose: http://product-service:3001/products
    -> Product Service returns products
    -> API Gateway returns response to Client
```

Current public request flow:

```txt
GET http://localhost:3000/health

Client
  -> API Gateway
    -> Create or reuse x-request-id
    -> Add security headers
    -> Apply request size limit
    -> Health response
```

---

## Monorepo Structure

```txt
pulsegate/
  apps/
    api-gateway/
      Dockerfile
      src/
        app.ts
        app.test.ts
        config/
          downstream-routes.ts
          downstream-routes.test.ts
          env.ts
          env.test.ts
        errors/
          downstream-service-error.ts
          downstream-service-error.test.ts
        middlewares/
          api-key-auth.middleware.ts
          api-key-auth.middleware.test.ts
          error-handler.middleware.ts
          jwt-auth.middleware.ts
          jwt-auth.middleware.test.ts
          rate-limit.middleware.ts
          rate-limit.middleware.test.ts
          request-id.middleware.ts
          request-id.middleware.test.ts
          request-size-limit.middleware.ts
          request-size-limit.middleware.test.ts
          security-headers.middleware.ts
          security-headers.middleware.test.ts
        rate-limit/
          in-memory-rate-limit-store.ts
          in-memory-rate-limit-store.test.ts
        routes/
          health.route.ts
          product-proxy.route.ts
        server.ts
      package.json
      tsconfig.json
      vitest.config.ts

    product-service/
      Dockerfile
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
      AI_HANDOFF.md
      CURRENT_PROGRESS.md
      DECISION_LOG.md

  infra/

  .dockerignore
  .env.example
  .gitattributes
  .gitignore
  docker-compose.yml
  package.json
  package-lock.json
  README.md
```

---

## Services

### API Gateway

Location:

```txt
apps/api-gateway
```

Port:

```txt
3000
```

Endpoints:

```txt
GET /health
GET /api/products
```

Route protection:

```txt
GET /health
  -> Public

GET /api/products
  -> Requires API key
  -> Requires JWT Bearer token
  -> Rate limited by API key and route
```

Responsibilities:

* Acts as the single entry point.
* Receives client requests.
* Creates or reuses request IDs.
* Adds `x-request-id` response header.
* Adds basic security headers.
* Applies request size limit.
* Routes product API requests to Product Service.
* Forwards `x-request-id` to downstream services.
* Applies API key authentication.
* Applies in-memory rate limiting.
* Applies JWT authentication.
* Attaches verified JWT payload to `request.jwtPayload`.
* Applies downstream request timeout.
* Normalizes downstream service errors.
* Handles basic 404 and 500 errors.
* Logs requests in JSON format.
* Supports automated integration tests using `app.inject()`.
* Supports Docker Compose local development.

---

### Product Service

Location:

```txt
apps/product-service
```

Port:

```txt
3001
```

Endpoints:

```txt
GET /health
GET /products
```

Responsibilities:

* Provides product-related APIs.
* Returns mock product data.
* Creates or reuses request IDs.
* Reuses request ID from API Gateway.
* Handles basic 404 and 500 errors.
* Logs requests in JSON format.
* Supports Docker Compose local development.

---

## Tech Stack

Currently implemented:

| Category           | Technology                       | Status                                                            |
| ------------------ | -------------------------------- | ----------------------------------------------------------------- |
| Runtime            | Node.js                          | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Language           | TypeScript                       | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Web Framework      | Fastify                          | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Monorepo           | npm workspaces                   | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Logging            | Fastify JSON logger              | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Authentication     | API Key, JWT                     | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| JWT Library        | jose                             | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Traffic Protection | In-memory rate limit, size limit | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| HTTP Security      | Basic security headers           | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Containerization   | Docker, Docker Compose           | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Testing            | Vitest                           | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Architecture       | API Gateway + Microservice       | ![Active](https://img.shields.io/badge/status-active-brightgreen) |

Planned later:

| Category        | Technology                   | Status                                                            |
| --------------- | ---------------------------- | ----------------------------------------------------------------- |
| Database        | PostgreSQL                   | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| ORM             | Prisma                       | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Cache           | Redis                        | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Event Streaming | Kafka                        | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Background Jobs | RabbitMQ                     | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Metrics         | Prometheus                   | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Dashboard       | Grafana                      | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Tracing         | OpenTelemetry + Jaeger/Tempo | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Logs            | Loki                         | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Load Testing    | k6                           | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Orchestration   | Kubernetes                   | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| CI/CD           | GitHub Actions               | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |

---

## Environment Configuration

PulseGate uses environment variables for local configuration.

Main API Gateway variables:

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
```

For local npm development, API Gateway uses:

```txt
PRODUCT_SERVICE_URL=http://127.0.0.1:3001
```

For Docker Compose development, API Gateway uses the internal Docker service name:

```txt
PRODUCT_SERVICE_URL=http://product-service:3001
```

See `.env.example` for the full list.

---

## Getting Started

### 1. Clone the repository

```powershell
git clone https://github.com/VuNguyen26/pulsegate.git
cd pulsegate
```

### 2. Install dependencies

```powershell
npm install
```

### 3. Run Product Service

Open terminal 1:

```powershell
npm run dev:product
```

Product Service runs on:

```txt
http://localhost:3001
```

### 4. Run API Gateway

Open terminal 2:

```powershell
npm run dev:gateway
```

API Gateway runs on:

```txt
http://localhost:3000
```

### 5. Run with Docker Compose

PulseGate can also run both services with Docker Compose.

This starts:

```txt
API Gateway      -> http://localhost:3000
Product Service  -> http://localhost:3001
```

Run:

```powershell
docker compose up --build
```

Or run in detached mode:

```powershell
docker compose up --build -d
```

Check running containers:

```powershell
docker compose ps
```

Stop and remove containers:

```powershell
docker compose down
```

When running inside Docker Compose, API Gateway calls Product Service through the internal Docker service name:

```txt
http://product-service:3001
```

This is different from local npm development, where API Gateway calls Product Service through:

```txt
http://127.0.0.1:3001
```

Both workflows are supported:

| Workflow       | Product Service URL inside API Gateway |
| -------------- | -------------------------------------- |
| Local npm      | `http://127.0.0.1:3001`                |
| Docker Compose | `http://product-service:3001`          |

---

## Test APIs Manually

### Product Service Health Check

```powershell
Invoke-RestMethod http://localhost:3001/health | ConvertTo-Json -Depth 10
```

Expected response:

```json
{
  "service": "product-service",
  "status": "ok",
  "timestamp": "2026-06-25T00:00:00.000Z"
}
```

### Product Service Products API

```powershell
Invoke-RestMethod http://localhost:3001/products | ConvertTo-Json -Depth 10
```

Expected response:

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

### API Gateway Health Check

```powershell
Invoke-RestMethod http://localhost:3000/health | ConvertTo-Json -Depth 10
```

Expected response:

```json
{
  "service": "api-gateway",
  "status": "ok",
  "timestamp": "2026-06-25T00:00:00.000Z"
}
```

### Create Local Development JWT Token

```powershell
$token = node --input-type=module -e "import { SignJWT } from 'jose'; const secretKey = new TextEncoder().encode('local-dev-jwt-secret-change-me'); const expiresAt = Math.floor(Date.now() / 1000) + 900; const token = await new SignJWT({ role: 'user' }).setProtectedHeader({ alg: 'HS256' }).setSubject('user_123').setIssuer('pulsegate-api-gateway').setAudience('pulsegate-clients').setExpirationTime(expiresAt).sign(secretKey); console.log(token);"
```

Check token:

```powershell
$token
```

### API Gateway Product Proxy API

This route requires both API key and JWT.

```powershell
Invoke-RestMethod http://localhost:3000/api/products `
  -Headers @{
    "x-api-key" = "dev-api-key"
    "authorization" = "Bearer $token"
  } |
  ConvertTo-Json -Depth 10
```

Expected response:

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

### API Gateway Rate Limit Validation

`GET /api/products` is limited by API key and route.

```powershell
$headers = @{
  "x-api-key" = "dev-api-key"
  "authorization" = "Bearer $token"
}

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

Expected behavior:

```txt
Attempt 1 -> 200, Remaining 4
Attempt 2 -> 200, Remaining 3
Attempt 3 -> 200, Remaining 2
Attempt 4 -> 200, Remaining 1
Attempt 5 -> 200, Remaining 0
Attempt 6 -> 429 TOO_MANY_REQUESTS
```

---

## Authentication Behavior

### API Key Authentication

Protected route:

```txt
GET /api/products
```

Default header:

```txt
x-api-key
```

Default local API key:

```txt
dev-api-key
```

Behavior:

```txt
Missing API key
  -> 401 API_KEY_MISSING

Invalid API key
  -> 403 API_KEY_INVALID

Valid API key
  -> Continue to route-level traffic protection
```

### JWT Authentication

Protected route:

```txt
GET /api/products
```

Default header:

```txt
Authorization: Bearer <jwt-token>
```

Default local JWT config:

```txt
JWT_SECRET=local-dev-jwt-secret-change-me
JWT_ISSUER=pulsegate-api-gateway
JWT_AUDIENCE=pulsegate-clients
JWT_EXPIRES_IN_SECONDS=900
```

Behavior:

```txt
Missing Bearer token
  -> 401 JWT_TOKEN_MISSING

Invalid Bearer token
  -> 403 JWT_TOKEN_INVALID

Valid Bearer token
  -> Continue to Product Service
```

JWT validation checks:

```txt
Signature
Issuer
Audience
Expiration
```

---

## Traffic Protection Behavior

PulseGate protects Gateway routes from excessive or unsafe traffic.

### Rate Limiting

Current product route rate limit:

```txt
GET /api/products
  -> Limited by API key and route
  -> Default: 5 requests per 60 seconds
```

When the limit is exceeded:

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

Rate limit response headers:

```txt
x-ratelimit-limit
x-ratelimit-remaining
x-ratelimit-reset
retry-after
```

### Request Size Limit

Current default request body size limit:

```txt
MAX_REQUEST_BODY_BYTES=1048576
```

That equals:

```txt
1MB
```

When request body is too large:

```json
{
  "error": {
    "code": "REQUEST_BODY_TOO_LARGE",
    "message": "Request body is too large",
    "requestId": "example-request-id"
  }
}
```

Expected status:

```txt
413
```

### Basic Security Headers

API Gateway adds basic security headers to responses:

```txt
x-content-type-options: nosniff
x-frame-options: DENY
referrer-policy: no-referrer
permissions-policy: camera=(), microphone=(), geolocation=()
content-security-policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'
```

---

## Downstream Error Behavior

PulseGate normalizes downstream Product Service failures.

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

Example unavailable response:

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

---

## Request ID Propagation

PulseGate supports request ID propagation from the beginning.

Current behavior:

```txt
Client
  -> API Gateway creates or reuses x-request-id
  -> API Gateway returns x-request-id in response header
  -> API Gateway forwards x-request-id to Product Service
  -> Product Service reuses the same request ID
```

Why this matters:

* Easier debugging.
* Better request tracking.
* Foundation for distributed tracing.
* Helps connect logs across services.

---

## Automated Tests

PulseGate uses Vitest for unit and integration tests.

Run tests:

```powershell
npm run test
```

Current result:

```txt
11 test files passed
71 tests passed
```

Current unit test coverage:

```txt
request-id.middleware.test.ts
  -> Request ID generation and reuse

api-key-auth.middleware.test.ts
  -> Missing, invalid, valid, and array header API key cases

jwt-auth.middleware.test.ts
  -> Bearer token extraction, JWT verification, missing token, invalid token, valid token

rate-limit/in-memory-rate-limit-store.test.ts
  -> In-memory rate limit store behavior, counters, window reset, cleanup, validation

rate-limit.middleware.test.ts
  -> Rate limit key generation, allowed requests, exceeded limit, reset behavior, missing identifier

request-size-limit.middleware.test.ts
  -> Content-Length parsing, allowed body size, exceeded body size, invalid config

security-headers.middleware.test.ts
  -> Basic security headers

downstream-service-error.test.ts
  -> DownstreamServiceError and type guard behavior

env.test.ts
  -> Number, CSV, and string env parsing

downstream-routes.test.ts
  -> Route-level rate limit config and auth requirements
```

Current integration test coverage:

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

## Development Commands

Run API Gateway:

```powershell
npm run dev:gateway
```

Run Product Service:

```powershell
npm run dev:product
```

Run with Docker Compose:

```powershell
docker compose up --build
```

Run with Docker Compose in detached mode:

```powershell
docker compose up --build -d
```

Stop Docker Compose services:

```powershell
docker compose down
```

Run tests:

```powershell
npm run test
```

Typecheck all workspaces:

```powershell
npm run typecheck
```

Build all workspaces:

```powershell
npm run build
```

---

## Documentation

Project documentation is stored in the `docs` folder.

| Document                                   | Description                                |
| ------------------------------------------ | ------------------------------------------ |
| `docs/architecture/overview.md`            | Current and future architecture overview   |
| `docs/sdlc/requirements.md`                | Functional and non-functional requirements |
| `docs/project-context/CURRENT_PROGRESS.md` | Current project progress                   |
| `docs/project-context/DECISION_LOG.md`     | Technical decision records                 |
| `docs/project-context/AI_HANDOFF.md`       | Context file for continuing with AI help   |

---

## Roadmap

### Sprint 0 - Core Setup & Basic Gateway Flow

Status: ![Completed](https://img.shields.io/badge/status-completed-brightgreen)

| Feature                                   | Status                                                        |
| ----------------------------------------- | ------------------------------------------------------------- |
| Create GitHub repository                  | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Set up npm workspaces                     | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Set up TypeScript                         | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Create API Gateway                        | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Create Product Service                    | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add basic Gateway to Product Service flow | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add health check APIs                     | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add request ID handling                   | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add JSON logger                           | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add basic error handlers                  | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Refactor API Gateway structure            | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Refactor Product Service structure        | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add project context docs                  | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add architecture overview                 | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add requirements document                 | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Improve README                            | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add `.env.example`                        | ![Done](https://img.shields.io/badge/status-done-brightgreen) |

### Sprint 1 - API Gateway Core Features

Status: ![Completed](https://img.shields.io/badge/status-completed-brightgreen)

| Feature                                       | Status                                                        |
| --------------------------------------------- | ------------------------------------------------------------- |
| Normalize downstream service errors           | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add downstream request timeout                | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add downstream route configuration foundation | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add API key authentication                    | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add JWT authentication                        | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add basic unit test setup                     | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add request ID unit tests                     | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add API key authentication unit tests         | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add JWT authentication unit tests             | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add downstream error unit tests               | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add environment parsing unit tests            | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add API Gateway integration tests             | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add manual validation for protected routes    | ![Done](https://img.shields.io/badge/status-done-brightgreen) |

### Sprint 2 - Gateway Traffic Protection

Status: ![Completed](https://img.shields.io/badge/status-completed-brightgreen)

| Feature                                       | Status                                                        |
| --------------------------------------------- | ------------------------------------------------------------- |
| Add in-memory rate limiting foundation        | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add route-level rate limit configuration      | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add rate limit response behavior              | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add request size limit                        | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add basic security headers                    | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add route-level auth configuration refinement | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add traffic protection tests                  | ![Done](https://img.shields.io/badge/status-done-brightgreen) |

### Sprint 3 - Data & Infrastructure Foundation

Status: ![In Progress](https://img.shields.io/badge/status-in%20progress-blue)

| Feature                                      | Status                                                            |
| -------------------------------------------- | ----------------------------------------------------------------- |
| Add Docker Compose                           | ![Done](https://img.shields.io/badge/status-done-brightgreen)     |
| Containerize API Gateway                     | ![Done](https://img.shields.io/badge/status-done-brightgreen)     |
| Containerize Product Service                 | ![Done](https://img.shields.io/badge/status-done-brightgreen)     |
| Add PostgreSQL                               | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Add Prisma                                   | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Replace mock product data with database data | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Add Redis-backed rate limiting               | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Add response caching                         | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |

### Sprint 4 - Observability

Status: ![Planned](https://img.shields.io/badge/status-planned-lightgrey)

| Feature                           | Status                                                            |
| --------------------------------- | ----------------------------------------------------------------- |
| Add Prometheus metrics            | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Add Grafana dashboard             | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Add OpenTelemetry                 | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Add Jaeger or Tempo               | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Add structured log pipeline later | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |

### Sprint 5 - Event-Driven Architecture

Status: ![Planned](https://img.shields.io/badge/status-planned-lightgrey)

| Feature                       | Status                                                            |
| ----------------------------- | ----------------------------------------------------------------- |
| Add Kafka event streaming     | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Add RabbitMQ background jobs  | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Add Notification Service      | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Add async processing examples | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |

### Future

| Feature                | Status                                                          |
| ---------------------- | --------------------------------------------------------------- |
| Admin Dashboard        | ![Future](https://img.shields.io/badge/status-future-lightgrey) |
| Developer Portal       | ![Future](https://img.shields.io/badge/status-future-lightgrey) |
| k6 load testing        | ![Future](https://img.shields.io/badge/status-future-lightgrey) |
| GitHub Actions CI/CD   | ![Future](https://img.shields.io/badge/status-future-lightgrey) |
| Kubernetes deployment  | ![Future](https://img.shields.io/badge/status-future-lightgrey) |
| Cloud lightweight demo | ![Future](https://img.shields.io/badge/status-future-lightgrey) |

---

## Current Status

PulseGate currently has a stable local API Gateway foundation with traffic protection and Docker Compose support.

Stable flow:

```txt
Client
  -> API Gateway :3000
    -> Request ID handling
    -> Basic security headers
    -> Request size limit
    -> API key authentication
    -> In-memory rate limiting
    -> JWT authentication
    -> Downstream route configuration
    -> Downstream timeout handling
    -> Normalized downstream error handling
    -> Product Service :3001
      -> Mock Product Response
```

Docker Compose foundation:

```txt
Client
  -> localhost:3000
    -> API Gateway container
      -> http://product-service:3001
        -> Product Service container
          -> Mock Product Response
```

Latest stable Sprint 2 commits:

```txt
7c88936 feat(gateway): add in-memory rate limiting for product route
4aed0ff refactor(gateway): move product rate limit to route config env
a12605f feat(gateway): add request size limit
76fdd2f feat(gateway): add basic security headers
28a9b5e refactor(gateway): add route-level auth config
```

Latest stable Sprint 3 commits:

```txt
7dbb2d2 chore: add docker compose foundation
```

---

## Project Principles

PulseGate follows these principles:

* Local-first.
* Cloud-optional.
* Cost-safe.
* Small steps before complex infrastructure.
* Clean architecture before scaling.
* Observability from the beginning.
* Production-oriented learning.
* Automated tests before major refactors.
* Behavior first, infrastructure later.
* GitHub-ready documentation.

---

## License

This project is licensed under the MIT License.

```
```
