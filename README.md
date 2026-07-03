# PulseGate

<p align="center">
  <strong>High-Traffic API Gateway & Observability Platform</strong>
</p>

<p align="center">
  A local-first API Gateway, API Management, and Observability learning project built with Node.js, TypeScript, Fastify, Docker Compose, PostgreSQL, Prisma, Redis, Prometheus, Grafana, GitHub Actions CI/CD, route policies, database-backed dynamic route configuration, internal/admin route management APIs, soft delete, runtime route registry reload, and a catch-all dynamic router for no-restart DB-backed /api/* route activation.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-Sprint%2012%20Complete-brightgreen" />
  <img src="https://img.shields.io/badge/version-v0.13.0-blue" />
  <a href="https://github.com/VuNguyen26/pulsegate/actions/workflows/ci.yml">
    <img src="https://github.com/VuNguyen26/pulsegate/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI" />
  </a>
  <img src="https://img.shields.io/badge/tests-190%20passing-brightgreen" />
  <img src="https://img.shields.io/badge/typecheck-passing-brightgreen" />
  <img src="https://img.shields.io/badge/build-passing-brightgreen" />
  <img src="https://img.shields.io/badge/Node.js-20%2B-green" />
  <img src="https://img.shields.io/badge/TypeScript-strict-blue" />
  <img src="https://img.shields.io/badge/Fastify-API%20Gateway-black" />
  <img src="https://img.shields.io/badge/Auth-API%20Key%20%2B%20JWT-purple" />
  <img src="https://img.shields.io/badge/Admin%20Auth-Admin%20API%20Key-purple" />
  <img src="https://img.shields.io/badge/Rate%20Limit-Redis-red" />
  <img src="https://img.shields.io/badge/Cache-Redis-red" />
  <img src="https://img.shields.io/badge/Dynamic%20Routes-PostgreSQL-blue" />
  <img src="https://img.shields.io/badge/Runtime%20Registry-Route%20Snapshot-blueviolet" />
  <img src="https://img.shields.io/badge/Reload-Dynamic%20Router-blueviolet" />
  <img src="https://img.shields.io/badge/New%20Routes-No%20Restart-brightgreen" />
  <img src="https://img.shields.io/badge/Route%20Management-Internal%20Admin%20API-blueviolet" />
  <img src="https://img.shields.io/badge/Soft%20Delete-Route%20Config-blueviolet" />
  <img src="https://img.shields.io/badge/Fallback-Static%20Routes-indigo" />
  <img src="https://img.shields.io/badge/Policies-Route%20Policies-indigo" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-blue" />
  <img src="https://img.shields.io/badge/ORM-Prisma-2D3748" />
  <img src="https://img.shields.io/badge/Metrics-Prometheus-orange" />
  <img src="https://img.shields.io/badge/Dashboard-Grafana-F46800" />
  <img src="https://img.shields.io/badge/Docker%20Compose-enabled-blue" />
  <img src="https://img.shields.io/badge/License-MIT-lightgrey" />
</p>

---

## Overview

**PulseGate** is a mini API Gateway, API Management, and Observability Platform inspired by:

* Kong
* Apache APISIX
* Tyk
* Apigee
* AWS API Gateway

The project is designed to demonstrate backend engineering skills around API routing, microservice communication, authentication, traffic protection, caching, data persistence, dynamic route configuration, route management APIs, runtime reload strategy, observability, testing, CI/CD, and production-oriented system design.

PulseGate starts small and grows in stable sprints. The current version is:

```txt
v0.13.0
```

Current sprint status:

```txt
Sprint 12 - Catch-All Dynamic Router Foundation Complete
```

Current automated validation:

```txt
29 test files passed
190 tests passed
npm run typecheck passed
npm run build passed
Docker runtime validation passed
```

Sprint 12 key result:

```txt
Brand-new DB-backed /api/* Gateway paths can be created through Admin API,
loaded through POST /internal/admin/routes/reload,
and served without restarting API Gateway.
```

---

## Project Status

| Area | Status | Notes |
| --- | --- | --- |
| Sprint 0 | Complete | Core setup and basic Gateway flow |
| Sprint 1 | Complete | API Gateway core features |
| Sprint 2 | Complete | Gateway traffic protection |
| Sprint 3 | Complete | Data and infrastructure foundation |
| Sprint 4 | Complete | Observability foundation |
| Sprint 5 | Complete | Advanced Gateway policies |
| Sprint 6 | Complete | CI/CD foundation with GitHub Actions |
| Sprint 7 | Complete | Multi-route Gateway expansion |
| Sprint 8 | Complete | Database-backed dynamic route config with safe static fallback |
| Sprint 9 | Complete | Internal/admin route management API foundation |
| Sprint 10 | Complete | Route management hardening with soft delete, audit metadata, active-route uniqueness, and reload validation |
| Sprint 11 | Complete | Runtime route registry, runtime status endpoint, and controlled reload for existing registered routes |
| Sprint 12 | Complete | Catch-all dynamic router for no-restart brand-new DB-backed /api/* route activation |
| Current Version | v0.13.0 | Docker, PostgreSQL, Prisma, Redis, Prometheus, Grafana, route policies, CI/CD, DB route config, admin route management, runtime registry, dynamic router |
| Automated Tests | 190 passing | Unit, integration, runtime config, route management, soft delete, reload, runtime registry, and dynamic proxy tests |
| Recommended Next Sprint | Sprint 13 | API Consumer and API Key Lifecycle Foundation |

---

## Why PulseGate?

Modern backend systems often contain many services. Without an API Gateway, clients may need to call each service directly, which creates problems around routing, security, rate limiting, logging, monitoring, caching, resilience, traffic control, dynamic configuration, and scaling.

PulseGate aims to solve these problems by acting as a single entry point for APIs.

Long-term goals:

* Route requests to the correct backend service.
* Support multiple Gateway routes and multiple downstream services.
* Load Gateway route configuration dynamically from PostgreSQL.
* Keep safe fallback behavior when dynamic route loading fails.
* Manage Gateway route configuration through internal/admin APIs.
* Validate route configs before persistence.
* Enable, disable, update, and soft delete route configs safely.
* Maintain a runtime registry snapshot for route config reload behavior.
* Apply config changes to existing registered routes without restarting the API Gateway.
* Apply brand-new DB-backed `/api/*` routes after reload without restarting the API Gateway.
* Avoid unsafe Fastify runtime unregister/register behavior.
* Validate API keys and JWT tokens.
* Protect internal/admin APIs with separate admin authentication.
* Apply Redis-backed rate limiting and response caching.
* Store service data and Gateway route config in PostgreSQL.
* Produce request IDs, structured logs, Prometheus metrics, and Grafana dashboards.
* Centralize route behavior through policies.
* Validate tests, typecheck, build, Prisma generation, and Docker image builds automatically with GitHub Actions.
* Add API consumer management, API key lifecycle, usage plans, Admin Dashboard, Developer Portal, tracing, load testing, Kubernetes, and cloud deployment later.

---

## Current Architecture

```mermaid
flowchart LR
    Client[Client / API Consumer] --> Gateway[PulseGate API Gateway<br/>Port 3000]
    AdminClient[Admin Client / Future Admin Dashboard] --> AdminRoutes[Internal Admin Route Management APIs<br/>/internal/admin/routes]

    Gateway --> StartupLoader[Startup Route Config Loader]
    StartupLoader --> GatewayPrisma[API Gateway Prisma Client]
    GatewayPrisma --> GatewaySchema[(PostgreSQL gateway schema<br/>gateway_routes)]
    StartupLoader -->|DB load success| DbRoutes[Database-backed Route Configs]
    StartupLoader -->|DB error or empty| StaticRoutes[Static Route Config Fallback]

    DbRoutes --> RuntimeRegistry[Runtime Route Registry<br/>Snapshot Version / LoadedAt / Route Count]
    StaticRoutes --> RuntimeRegistry

    Gateway --> ReqId[Request ID Middleware]
    ReqId --> AccessLogStart[Access Log Timer]
    AccessLogStart --> MetricsStart[Metrics Timer]
    MetricsStart --> SecurityHeaders[Security Headers Middleware]
    SecurityHeaders --> SizeLimit[Request Size Limit]

    SizeLimit --> RegisteredRoutes[Startup Registered Routes<br/>GET /api/products<br/>GET /api/product-service/health]
    SizeLimit --> DynamicRouter[Catch-All Dynamic Router<br/>GET/POST/PUT/PATCH/DELETE /api/*]

    RegisteredRoutes --> RouteLookup[Per-request Runtime Route Lookup]
    DynamicRouter --> DynamicLookup[Resolve Method + Request Path]
    DynamicLookup --> RouteLookup

    RouteLookup --> RouteFound{Runtime Route Found?}
    RouteFound -->|No| RouteNotFound[404 ROUTE_NOT_FOUND]
    RouteFound -->|Yes| ProxyPipeline[Shared Downstream Proxy Pipeline]

    ProxyPipeline --> RoutePolicy[Latest Route Policy from Registry<br/>Auth / Timeout / Cache / Rate Limit / Transform / Retry]
    RoutePolicy --> ApiKey[API Key Authentication<br/>when required]
    ApiKey --> RateLimit[Redis-Backed Rate Limiting<br/>when enabled]
    RateLimit --> Jwt[JWT Authentication<br/>when required]
    Jwt --> Cache{Redis Response Cache<br/>when enabled}

    Cache -->|HIT| ResponseTransformHit[Response Transform Foundation]
    ResponseTransformHit --> CachedResponse[Cached Response]
    CachedResponse --> ResponseHeaders[Response Headers<br/>x-cache / x-response-time-ms]

    Cache -->|MISS or BYPASS| RequestTransform[Request Transform Foundation]
    RequestTransform --> RetryPolicy[Upstream Retry Policy Foundation]
    RetryPolicy --> TimeoutPolicy[Downstream Timeout Policy]
    TimeoutPolicy --> ProductService[Product Service<br/>Port 3001]

    ProductService --> ProductProducts[GET /products]
    ProductService --> ProductHealth[GET /health]
    ProductProducts --> ProductPrisma[Product Service Prisma Client]
    ProductPrisma --> PublicSchema[(PostgreSQL public schema<br/>products)]
    PublicSchema --> ProductPrisma
    ProductPrisma --> ProductProducts

    ProductProducts --> DownstreamResponse[Downstream Response]
    ProductHealth --> DownstreamResponse
    DownstreamResponse --> CacheStore[Store Response in Redis Cache<br/>when enabled]
    CacheStore --> ResponseTransformMiss[Response Transform Foundation]
    ResponseTransformMiss --> ResponseHeaders

    AdminRoutes --> AdminApiKey[Admin API Key Authentication<br/>x-admin-api-key]
    AdminApiKey --> RouteManagement[Route Management Module]
    RouteManagement --> RouteManagementRepo[Prisma Route Management Repository]
    RouteManagementRepo --> GatewaySchema
    RouteManagement --> RouteValidation[Route Config Validation<br/>validateDownstreamRoutes]
    RouteManagement --> ReloadEndpoint[POST /internal/admin/routes/reload]
    RouteManagement --> RuntimeEndpoint[GET /internal/admin/routes/runtime]
    ReloadEndpoint --> ActiveRoutes[Read Active DB Routes]
    ActiveRoutes --> RegistryReplace[Validate + Replace Runtime Registry Snapshot]
    RegistryReplace --> RuntimeRegistry
    RuntimeEndpoint --> RuntimeRegistry

    RateLimit --> Redis[(Redis<br/>Port 6379)]
    Cache --> Redis
    CacheStore --> Redis

    RouteNotFound --> MetricsRecord[Record HTTP Metrics]
    ResponseHeaders --> MetricsRecord
    MetricsRecord --> AccessLogWrite[Write Structured Access Log]
    AccessLogWrite --> Client
    AccessLogWrite --> AdminClient

    Gateway --> MetricsEndpoint[/GET /metrics/]
    Prometheus[Prometheus<br/>Port 9090] -->|Scrapes| MetricsEndpoint
    Grafana[Grafana<br/>Port 3002] -->|Reads datasource| Prometheus

    classDef gateway fill:#111827,stroke:#4f46e5,stroke-width:2px,color:#ffffff
    classDef client fill:#ecfeff,stroke:#0891b2,stroke-width:2px,color:#164e63
    classDef admin fill:#f5f3ff,stroke:#7c3aed,stroke-width:2px,color:#4c1d95
    classDef database fill:#eff6ff,stroke:#2563eb,stroke-width:2px,color:#1e3a8a
    classDef redis fill:#fef2f2,stroke:#dc2626,stroke-width:2px,color:#7f1d1d
    classDef observability fill:#fff7ed,stroke:#ea580c,stroke-width:2px,color:#7c2d12
    classDef runtime fill:#faf5ff,stroke:#9333ea,stroke-width:2px,color:#581c87
    classDef policy fill:#eef2ff,stroke:#4f46e5,stroke-width:2px,color:#312e81
    classDef service fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#064e3b

    class Gateway gateway
    class Client client
    class AdminClient,AdminRoutes,AdminApiKey,RouteManagement,RouteManagementRepo,ReloadEndpoint,RuntimeEndpoint admin
    class GatewaySchema,PublicSchema,GatewayPrisma,ProductPrisma database
    class Redis,RateLimit,Cache,CacheStore redis
    class Prometheus,Grafana,MetricsEndpoint,MetricsRecord,AccessLogWrite,AccessLogStart,MetricsStart observability
    class StartupLoader,DbRoutes,StaticRoutes,RuntimeRegistry,RouteLookup,DynamicRouter,DynamicLookup,RegisteredRoutes runtime
    class RoutePolicy,RequestTransform,ResponseTransformHit,ResponseTransformMiss,RetryPolicy,TimeoutPolicy,RouteValidation,ProxyPipeline policy
    class ProductService,ProductProducts,ProductHealth,CachedResponse,DownstreamResponse,ReqId,SecurityHeaders,SizeLimit,ResponseHeaders,RouteFound,RouteNotFound service
```

Current runtime rule:

```txt
Existing registered Gateway paths
  -> Can use updated route config after POST /internal/admin/routes/reload

Brand-new DB-backed /api/* Gateway paths
  -> Can be created through POST /internal/admin/routes
  -> Can be loaded into runtime registry through POST /internal/admin/routes/reload
  -> Can be served through the /api/* catch-all dynamic router
  -> Do not require API Gateway restart after successful reload
```

---

## Runtime Reload Scope

Sprint 12 uses a **runtime route registry** and a stable **catch-all dynamic router**.

This is not unsafe Fastify runtime route re-registration.

Important behavior:

```txt
Existing registered Gateway paths
  -> Can receive updated route config after admin reload
  -> Example:
       GET /api/product-service/health already exists at startup
       Disable it in DB
       POST /internal/admin/routes/reload
       Request returns 404 ROUTE_NOT_FOUND without API Gateway restart

Brand-new DB-backed /api/* Gateway paths
  -> Can be created in DB
  -> Before reload, request returns 404 ROUTE_NOT_FOUND
  -> After reload, /api/* dynamic router resolves the new path from runtime registry
  -> No API Gateway restart required
```

Reload response is intentionally explicit:

```txt
mode = runtime-registry-refresh
registryAvailable = true
registryApplied = true
runtimeApplied = true
runtimeScope = dynamic-router
newRoutesRequireRestart = false
requiresRestart = false
```

Current dynamic routing limitation:

```txt
The catch-all dynamic router supports exact method + exact path matching only.
Path params, wildcard upstream mapping, host-based routing, weighted upstreams, and service discovery are planned for later.
```

---

## Current Endpoints

### API Gateway

```txt
GET /health
GET /metrics
GET /api/products
GET /api/product-service/health
GET /api/*
POST /api/*
PUT /api/*
PATCH /api/*
DELETE /api/*
GET /internal/admin/routes
GET /internal/admin/routes/runtime
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
```

### Product Service

```txt
GET /health
GET /products
```

---

## Current Route Protection

```txt
GET /health
  -> Public

GET /metrics
  -> Public for local Docker observability

GET /api/products
  -> Requires x-api-key
  -> Requires Authorization: Bearer <jwt-token>
  -> Uses Redis-backed rate limiting
  -> Uses Redis response cache

GET /api/product-service/health
  -> Public
  -> No API key
  -> No JWT
  -> No Redis-backed rate limiting
  -> No Redis response cache

GET/POST/PUT/PATCH/DELETE /api/*
  -> Dynamic route dispatcher
  -> Uses DB-backed route policy when runtime route exists
  -> Can require API key/JWT/rate limit/cache depending on route policy
  -> Returns 404 ROUTE_NOT_FOUND when no runtime route exists

GET /internal/admin/routes
GET /internal/admin/routes/runtime
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
  -> Require x-admin-api-key
  -> Do not use consumer x-api-key
  -> Do not use consumer JWT
  -> Do not use Product response cache
```

---

## Current Features

### Gateway Core

* Fastify API Gateway.
* Request ID generation and propagation.
* JSON logging.
* Structured access logs.
* Basic error handling.
* Normalized downstream errors.
* Downstream request timeout.
* API key authentication.
* JWT authentication.
* Request size limit.
* Basic security headers.
* Multi-route Gateway routing.
* Generic downstream proxy foundation.
* Shared downstream proxy handler.
* Route resolver support.
* Policy-driven route behavior.
* Database-backed route config loading.
* Static route config fallback.
* Runtime route registry snapshot.
* Runtime route registry status API.
* Runtime registry refresh through admin reload.
* Catch-all dynamic router for `/api/*`.
* No-restart apply for brand-new DB-backed `/api/*` paths.

### Route Policies

Current route policy model:

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

Current protected Product route policy:

```txt
GET /api/products
  -> requireApiKey: true
  -> requireJwt: true
  -> timeout enabled
  -> cache enabled
  -> Redis rate limit enabled
  -> request transform disabled
  -> response transform disabled
  -> retry foundation disabled by default
```

Current public health proxy policy:

```txt
GET /api/product-service/health
  -> requireApiKey: false
  -> requireJwt: false
  -> timeout enabled
  -> cache disabled
  -> Redis rate limit disabled
  -> retry disabled
```

Dynamic DB-backed routes use the same policy model.

### Route Management

Current internal/admin route management APIs:

```txt
GET /internal/admin/routes
GET /internal/admin/routes/runtime
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
```

Current route management behavior:

* Protected by admin API key.
* Supports optional `x-admin-actor`.
* Lists non-deleted route configs.
* Reads non-deleted route config detail.
* Creates route configs.
* Updates route configs.
* Enables or disables route configs through PATCH.
* Soft deletes route configs through DELETE.
* Validates route config before persistence.
* Rejects duplicate active `method + gatewayPath`.
* Excludes soft-deleted routes from duplicate checks.
* Excludes soft-deleted routes from runtime loading.
* Reports runtime registry snapshot status.
* Refreshes runtime registry from active DB routes.
* Applies config updates for existing registered Gateway paths.
* Applies brand-new DB-backed `/api/*` Gateway paths through dynamic router after reload.

### Data and Infrastructure

* Docker Compose.
* PostgreSQL.
* Prisma.
* Product Service database-backed products.
* API Gateway database-backed route config.
* Separate PostgreSQL schemas:
  * `public` for Product Service.
  * `gateway` for API Gateway.
* Redis-backed rate limiting.
* Redis response caching.
* Prometheus service.
* Grafana service.
* Provisioned Prometheus datasource.
* Provisioned Grafana dashboard.

### Observability

* Request ID.
* Structured access logs.
* `x-response-time-ms`.
* Prometheus metrics registry.
* `/metrics` endpoint.
* Prometheus scraping.
* Grafana dashboard.

Current metrics:

```txt
http_requests_total
http_request_duration_seconds
http_response_cache_total
```

Current dashboard panels:

```txt
Request Rate
Request Count by Route
Latency p95 by Route
Cache Outcomes
```

### CI/CD

GitHub Actions validates:

* `npm ci`
* Product Service Prisma Client generation.
* API Gateway Prisma Client generation.
* Automated tests.
* TypeScript typecheck.
* Production build.
* API Gateway Docker image build.
* Product Service Docker image build.

---

## Tech Stack

| Category | Technology |
| --- | --- |
| Runtime | Node.js 20+ |
| Language | TypeScript |
| Web Framework | Fastify |
| Monorepo | npm workspaces |
| Database | PostgreSQL |
| ORM | Prisma |
| Cache / Rate Limit Store | Redis |
| Metrics | prom-client |
| Metrics Backend | Prometheus |
| Dashboard | Grafana |
| Testing | Vitest |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Auth | API key, JWT, admin API key |
| Architecture | API Gateway + Microservice |

Planned later:

| Category | Planned Technology / Feature |
| --- | --- |
| API Management | API consumers, API key lifecycle, usage plans, quotas |
| Advanced Routing | Path params, wildcard upstream mapping, host-based routing, weighted upstreams |
| Admin Hardening | Stronger admin auth, RBAC, audit log table |
| Developer Experience | Admin Dashboard, Developer Portal, OpenAPI docs |
| Tracing | OpenTelemetry + Jaeger or Tempo |
| Logs | Loki |
| Load Testing | k6 |
| Event Streaming | Kafka |
| Background Jobs | RabbitMQ |
| Orchestration | Kubernetes |
| Deployment | Docker image registry, cloud deployment, CD pipeline |

---

## Environment Configuration

### API Gateway

```txt
PORT=3000
HOST=0.0.0.0
PRODUCT_SERVICE_URL=http://127.0.0.1:3001
DATABASE_URL=postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway
DOWNSTREAM_REQUEST_TIMEOUT_MS=3000
MAX_REQUEST_BODY_BYTES=1048576
API_KEY_HEADER=x-api-key
API_KEYS=dev-api-key
ADMIN_API_KEY_HEADER=x-admin-api-key
ADMIN_API_KEY=local-admin-key
JWT_SECRET=local-dev-jwt-secret-change-me
JWT_ISSUER=pulsegate-api-gateway
JWT_AUDIENCE=pulsegate-clients
JWT_EXPIRES_IN_SECONDS=900
PRODUCT_PRODUCTS_RATE_LIMIT_MAX_REQUESTS=5
PRODUCT_PRODUCTS_RATE_LIMIT_WINDOW_MS=60000
REDIS_URL=redis://localhost:6379
```

Important note:

```txt
DATABASE_URL is used by Prisma.
API Gateway DATABASE_URL is not currently parsed through apps/api-gateway/src/config/env.ts.
```

### Product Service

```txt
PORT=3001
HOST=0.0.0.0
DATABASE_URL=postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate
```

### Docker Compose Internal Values

```txt
PRODUCT_SERVICE_URL=http://product-service:3001
API_GATEWAY_DATABASE_URL=postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate?schema=gateway
PRODUCT_SERVICE_DATABASE_URL=postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate
REDIS_URL=redis://redis:6379
ADMIN_API_KEY_HEADER=x-admin-api-key
ADMIN_API_KEY=local-admin-key
Prometheus scrape target=http://api-gateway:3000/metrics
Grafana Prometheus datasource=http://prometheus:9090
```

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

---

## Run with Docker Compose

This is the recommended workflow.

### 1. Start PostgreSQL and Redis

```powershell
docker compose up -d postgres redis
docker compose ps
```

Expected:

```txt
pulsegate-postgres  healthy
pulsegate-redis     healthy
```

### 2. Prepare Product Service database

```powershell
$env:DATABASE_URL="postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate"

npx prisma migrate deploy --schema apps/product-service/prisma/schema.prisma

npm run db:seed -w apps/product-service
```

### 3. Prepare API Gateway route config database

```powershell
$env:DATABASE_URL="postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway"

npm run db:migrate:deploy -w apps/api-gateway

npm run db:seed -w apps/api-gateway
```

Expected API Gateway seed result:

```txt
Seeded 2 active gateway route config(s).
GET /api/products -> http://product-service:3001/products | enabled=true
GET /api/product-service/health -> http://product-service:3001/health | enabled=true
```

### 4. Start the full stack

```powershell
docker compose up --build -d
docker compose ps
```

Expected services:

```txt
pulsegate-postgres         healthy
pulsegate-redis            healthy
pulsegate-product-service  healthy
pulsegate-api-gateway      up
pulsegate-prometheus       up
pulsegate-grafana          up
```

### 5. Confirm API Gateway loaded route configs from database

```powershell
docker compose logs api-gateway --tail=80
```

Expected log:

```txt
Loaded downstream route configs from database { routeCount: 2 }
```

### 6. Validate API Gateway runtime

```powershell
Invoke-RestMethod http://localhost:3000/health | ConvertTo-Json -Depth 10

Invoke-WebRequest http://localhost:3000/metrics -UseBasicParsing

Invoke-WebRequest http://localhost:3000/api/product-service/health -UseBasicParsing
```

Expected:

```txt
GET /health                      -> status ok
GET /metrics                     -> 200 OK with Prometheus text format
GET /api/product-service/health  -> 200 OK with Product Service health response and x-cache: BYPASS
```

---

## Manual API Testing

### Create Local Development JWT Token

```powershell
$token = node --input-type=module -e "import { SignJWT } from 'jose'; const secretKey = new TextEncoder().encode('local-dev-jwt-secret-change-me'); const expiresAt = Math.floor(Date.now() / 1000) + 900; const token = await new SignJWT({ role: 'user' }).setProtectedHeader({ alg: 'HS256' }).setSubject('user_123').setIssuer('pulsegate-api-gateway').setAudience('pulsegate-clients').setExpirationTime(expiresAt).sign(secretKey); console.log(token);"

$headers = @{
  "x-api-key" = "dev-api-key"
  "authorization" = "Bearer $token"
}
```

### Test Protected Product Route

```powershell
Invoke-WebRequest http://localhost:3000/api/products `
  -Headers $headers `
  -UseBasicParsing
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

Expected headers:

```txt
x-request-id
x-response-time-ms
x-cache
x-ratelimit-limit
x-ratelimit-remaining
x-ratelimit-reset
```

### Test Public Product Service Health Proxy

```powershell
Invoke-WebRequest http://localhost:3000/api/product-service/health -UseBasicParsing
```

Expected headers:

```txt
x-request-id
x-response-time-ms
x-cache: BYPASS
```

---

## Internal Admin Route Management API

Current admin API key header:

```txt
x-admin-api-key
```

Current local admin API key:

```txt
local-admin-key
```

Optional actor header:

```txt
x-admin-actor
```

### List Route Configs

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } |
  ConvertTo-Json -Depth 10
```

### Get Runtime Registry Status

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes/runtime `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } |
  ConvertTo-Json -Depth 10
```

Expected response includes:

```txt
version
loadedAt
routeCount
routes
```

### Create Route Config

```powershell
$body = @{
  serviceName = "product-service"
  gatewayPath = "/api/product-service/health-copy"
  downstreamUrl = "http://product-service:3001/health"
  method = "GET"
  enabled = $true
  priority = 300
  policies = @{
    auth = @{
      requireApiKey = $false
      requireJwt = $false
    }
    timeout = @{
      enabled = $true
      timeoutMs = 3000
    }
    cache = @{
      enabled = $false
      ttlSeconds = 0
    }
    rateLimit = @{
      enabled = $false
      limit = 0
      windowMs = 0
    }
    requestTransform = @{
      enabled = $false
    }
    responseTransform = @{
      enabled = $false
    }
    retry = @{
      enabled = $false
      attempts = 0
      retryOnStatuses = @(502, 503, 504)
    }
  }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod http://localhost:3000/internal/admin/routes `
  -Method POST `
  -Headers @{
    "x-admin-api-key" = "local-admin-key"
    "x-admin-actor" = "local-admin"
    "content-type" = "application/json"
  } `
  -Body $body |
  ConvertTo-Json -Depth 10
```

Expected:

```txt
201 Created
createdBy = local-admin
updatedBy = local-admin
```

Important after Sprint 12:

```txt
A brand-new /api/* Gateway path does not require API Gateway restart after reload.
It still requires POST /internal/admin/routes/reload before traffic can use the new runtime config.
```

### Update Route Config

```powershell
$patchBody = @{
  enabled = $false
  priority = 350
} | ConvertTo-Json -Depth 10

Invoke-RestMethod http://localhost:3000/internal/admin/routes/<route-id> `
  -Method PATCH `
  -Headers @{
    "x-admin-api-key" = "local-admin-key"
    "x-admin-actor" = "local-admin"
    "content-type" = "application/json"
  } `
  -Body $patchBody |
  ConvertTo-Json -Depth 10
```

### Soft Delete Route Config

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes/<route-id> `
  -Method DELETE `
  -Headers @{
    "x-admin-api-key" = "local-admin-key"
    "x-admin-actor" = "local-admin"
  } |
  ConvertTo-Json -Depth 10
```

Soft delete behavior:

```txt
Route remains stored in gateway.gateway_routes.
Route is hidden from GET /internal/admin/routes.
Route detail returns 404 ROUTE_CONFIG_NOT_FOUND.
Runtime loader ignores the route.
A new route can reuse the same method + gatewayPath because uniqueness applies only to active routes.
```

### Reload Runtime Registry

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes/reload `
  -Method POST `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } `
  -ContentType "application/json" `
  -Body "{}" |
  ConvertTo-Json -Depth 10
```

Expected result after Sprint 12:

```txt
mode = runtime-registry-refresh
registryAvailable = true
registryApplied = true
runtimeApplied = true
runtimeScope = dynamic-router
newRoutesRequireRestart = false
requiresRestart = false
```

---

## Validate Runtime Reload Without Restart

### Existing Registered Route

This validates runtime registry behavior for an already registered route.

```powershell
# 1. Find the /api/product-service/health route id
$routes = Invoke-RestMethod http://localhost:3000/internal/admin/routes `
  -Headers @{ "x-admin-api-key" = "local-admin-key" }

$healthRoute = $routes.data | Where-Object { $_.gatewayPath -eq "/api/product-service/health" }

# 2. Disable it in DB
$patchBody = @{ enabled = $false } | ConvertTo-Json -Depth 10

Invoke-RestMethod "http://localhost:3000/internal/admin/routes/$($healthRoute.id)" `
  -Method PATCH `
  -Headers @{
    "x-admin-api-key" = "local-admin-key"
    "x-admin-actor" = "local-admin"
    "content-type" = "application/json"
  } `
  -Body $patchBody |
  ConvertTo-Json -Depth 10

# 3. Reload runtime registry
Invoke-RestMethod http://localhost:3000/internal/admin/routes/reload `
  -Method POST `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } `
  -ContentType "application/json" `
  -Body "{}" |
  ConvertTo-Json -Depth 10

# 4. Existing registered path now resolves latest registry config and returns 404
try {
  Invoke-WebRequest http://localhost:3000/api/product-service/health -UseBasicParsing
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}
```

Expected result:

```txt
404
ROUTE_NOT_FOUND
```

Re-enable after validation:

```powershell
$patchBody = @{ enabled = $true } | ConvertTo-Json -Depth 10

Invoke-RestMethod "http://localhost:3000/internal/admin/routes/$($healthRoute.id)" `
  -Method PATCH `
  -Headers @{
    "x-admin-api-key" = "local-admin-key"
    "x-admin-actor" = "local-admin"
    "content-type" = "application/json"
  } `
  -Body $patchBody |
  ConvertTo-Json -Depth 10

Invoke-RestMethod http://localhost:3000/internal/admin/routes/reload `
  -Method POST `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } `
  -ContentType "application/json" `
  -Body "{}" |
  ConvertTo-Json -Depth 10
```

### Brand-New Dynamic Route

This validates Sprint 12 catch-all dynamic router behavior.

```powershell
$dynamicPath = "/api/manual-dynamic-health-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"

$body = @{
  serviceName = "product-service"
  gatewayPath = $dynamicPath
  downstreamUrl = "http://product-service:3001/health"
  method = "GET"
  enabled = $true
  priority = 300
  policies = @{
    auth = @{
      requireApiKey = $false
      requireJwt = $false
    }
    timeout = @{
      enabled = $true
      timeoutMs = 3000
    }
    cache = @{
      enabled = $false
    }
    rateLimit = @{
      enabled = $false
    }
  }
} | ConvertTo-Json -Depth 10

$createResponse = Invoke-RestMethod http://localhost:3000/internal/admin/routes `
  -Method POST `
  -Headers @{
    "x-admin-api-key" = "local-admin-key"
    "x-admin-actor" = "manual-dynamic-validation"
    "content-type" = "application/json"
  } `
  -Body $body

$createdRouteId = $createResponse.data.id

# Before reload, the runtime registry does not know this path yet.
try {
  Invoke-RestMethod "http://localhost:3000$dynamicPath" |
    ConvertTo-Json -Depth 10
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}

# Reload runtime registry.
Invoke-RestMethod http://localhost:3000/internal/admin/routes/reload `
  -Method POST `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } `
  -ContentType "application/json" `
  -Body "{}" |
  ConvertTo-Json -Depth 10

# After reload, the brand-new path is served without API Gateway restart.
Invoke-RestMethod "http://localhost:3000$dynamicPath" |
  ConvertTo-Json -Depth 10
```

Expected before reload:

```txt
404
ROUTE_NOT_FOUND
```

Expected reload metadata:

```txt
runtimeScope = dynamic-router
newRoutesRequireRestart = false
requiresRestart = false
```

Expected after reload:

```json
{
  "service": "product-service",
  "status": "ok",
  "timestamp": "..."
}
```

Cleanup manual dynamic route:

```powershell
Invoke-RestMethod "http://localhost:3000/internal/admin/routes/$createdRouteId" `
  -Method DELETE `
  -Headers @{
    "x-admin-api-key" = "local-admin-key"
    "x-admin-actor" = "manual-dynamic-validation"
  } |
  ConvertTo-Json -Depth 10

Invoke-RestMethod http://localhost:3000/internal/admin/routes/reload `
  -Method POST `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } `
  -ContentType "application/json" `
  -Body "{}" |
  ConvertTo-Json -Depth 10
```

---

## Redis Response Cache Behavior

PulseGate caches `GET /api/products` responses in Redis.

Current response cache key:

```txt
response-cache:GET:/api/products
```

Current cache TTL:

```txt
30 seconds
```

Validate cache MISS/HIT:

```powershell
docker compose exec redis redis-cli DEL "response-cache:GET:/api/products"
docker compose exec redis redis-cli DEL "rate-limit:api-key:dev-api-key:route:GET:/api/products"

$res1 = Invoke-WebRequest http://localhost:3000/api/products `
  -Headers $headers `
  -UseBasicParsing

$res1.StatusCode
$res1.Headers["x-cache"]

$res2 = Invoke-WebRequest http://localhost:3000/api/products `
  -Headers $headers `
  -UseBasicParsing

$res2.StatusCode
$res2.Headers["x-cache"]
```

Expected:

```txt
Request 1 -> 200, x-cache: MISS
Request 2 -> 200, x-cache: HIT
```

---

## Observability

### Prometheus

Local URL:

```txt
http://localhost:9090
```

Prometheus scrapes:

```txt
http://api-gateway:3000/metrics
```

Test target status:

```powershell
Invoke-RestMethod http://localhost:9090/api/v1/targets | ConvertTo-Json -Depth 10
```

Expected target:

```txt
job: pulsegate-api-gateway
health: up
```

### Grafana

Local URL:

```txt
http://localhost:3002
```

Login:

```txt
username: admin
password: admin
```

Provisioned dashboard:

```txt
PulseGate API Gateway Overview
```

---

## Database and Prisma

PulseGate uses PostgreSQL and Prisma in two ownership areas:

```txt
Product Service
  -> apps/product-service/prisma/schema.prisma
  -> PostgreSQL schema: public
  -> Table: public.products

API Gateway
  -> apps/api-gateway/prisma/schema.prisma
  -> PostgreSQL schema: gateway
  -> Table: gateway.gateway_routes
```

Current API Gateway route config fields include:

```txt
id
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
created_at
updated_at
created_by
updated_by
deleted_at
deleted_by
```

Current active route uniqueness rule:

```txt
method + gateway_path must be unique only when deleted_at IS NULL
```

Validate Gateway route config rows:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "SELECT method, gateway_path, downstream_url, enabled, priority, deleted_at FROM gateway.gateway_routes ORDER BY priority;"
```

---

## Automated Tests

PulseGate uses Vitest for unit and integration tests.

Run tests:

```powershell
npm run test
```

Current result:

```txt
29 test files passed
190 tests passed
```

Current important test areas:

* Request ID middleware.
* Access log middleware.
* API key authentication.
* Admin API key authentication.
* JWT authentication.
* Metrics middleware.
* Rate limit stores.
* Rate limit middleware.
* Redis response cache store.
* Request size limit.
* Security headers.
* Downstream service errors.
* Environment config parsing.
* Downstream route config.
* Route config validation.
* Database route config mapper.
* Runtime route config loader and fallback.
* Runtime route registry.
* Admin route config API.
* Runtime registry status endpoint.
* Runtime registry reload endpoint.
* Route config soft delete behavior.
* Route reload behavior.
* Dynamic proxy route behavior.
* Metrics registry.
* Metrics route.
* Timeout policy.
* Cache policy.
* Rate limit policy.
* Request transform policy.
* Response transform policy.
* Retry policy.
* API Gateway integration flow.

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
docker compose up --build -d
```

Check Docker Compose services:

```powershell
docker compose ps
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

Generate Product Service Prisma Client:

```powershell
npm run db:generate -w apps/product-service
```

Generate API Gateway Prisma Client:

```powershell
npm run db:generate -w apps/api-gateway
```

Run CI-equivalent validation locally:

```powershell
npm ci
npm run db:generate -w apps/product-service
npm run db:generate -w apps/api-gateway
npm run test
npm run typecheck
npm run build
docker build -t pulsegate-api-gateway:ci -f apps/api-gateway/Dockerfile .
docker build -t pulsegate-product-service:ci -f apps/product-service/Dockerfile .
```

---

## Documentation

Project documentation is stored in the `docs` folder.

| Document | Description |
| --- | --- |
| `docs/architecture/overview.md` | Current and future architecture overview |
| `docs/sdlc/requirements.md` | Functional and non-functional requirements |
| `docs/project-context/CURRENT_PROGRESS.md` | Current project progress |
| `docs/project-context/DECISION_LOG.md` | Technical decision records |
| `docs/project-context/AI_HANDOFF.md` | Context file for continuing with AI help |

---

## Roadmap

### Completed

```txt
Sprint 0  -> Core setup and basic Gateway flow
Sprint 1  -> API Gateway core features
Sprint 2  -> Gateway traffic protection
Sprint 3  -> Data and infrastructure foundation
Sprint 4  -> Observability foundation
Sprint 5  -> Advanced Gateway policies
Sprint 6  -> CI/CD foundation
Sprint 7  -> Multi-route Gateway expansion
Sprint 8  -> Dynamic route config from database
Sprint 9  -> Route Management API foundation
Sprint 10 -> Route Management Hardening
Sprint 11 -> Route Runtime Reload / Admin Hardening Foundation
Sprint 12 -> Catch-All Dynamic Router Foundation
```

### Recommended Next

```txt
Sprint 13 -> API Consumer and API Key Lifecycle Foundation
```

Recommended Sprint 13 direction:

* Add API consumer model.
* Add issued API key storage.
* Add API key hashing strategy.
* Add active/revoked key status.
* Add admin API to list/create/revoke API keys.
* Keep local dev API key fallback if needed.
* Update API key middleware to support DB-backed keys carefully.
* Add tests for valid, missing, invalid, and revoked API keys.
* Run Docker runtime validation.

### Later

```txt
Advanced route matching
Route management audit log
Stronger admin authentication
Service registry
Usage plans and quotas
OpenAPI documentation
Admin Dashboard
Developer Portal
OpenTelemetry tracing
Loki logs
k6 load testing
Kafka event streaming
RabbitMQ background jobs
Docker image registry
Kubernetes deployment
Production cloud deployment
```

---

## Latest Stable Commits

Sprint 12:

```txt
285fbf7 refactor(gateway): extract downstream proxy handler
32289cc refactor(gateway): support downstream route resolver
4eac32e feat(gateway): add catch-all dynamic proxy route
```

Sprint 11:

```txt
83c8f62 feat(gateway): add route runtime registry foundation
5c55c08 feat(gateway): expose route runtime registry status
1c759bf feat(gateway): refresh route runtime registry on reload
d96914a feat(gateway): resolve downstream routes from runtime registry
6ee93e0 feat(gateway): report partial runtime reload scope
```

Sprint 10:

```txt
8052742 feat(gateway): add route config soft delete
1f7443d feat(gateway): add route config reload validation
```

Sprint 9:

```txt
2e0faee feat(gateway): add admin route config read api
0d6aa66 feat(gateway): add route config create api
7a828ba feat(gateway): add route config update api
4f660d6 chore(gateway): document admin route config env
```

Sprint 8:

```txt
01a32ac feat(gateway): add route config database schema
ff105f6 feat(gateway): seed route config data
a1785dc feat(gateway): map database route configs
6f67cb7 feat(gateway): load runtime route configs with fallback
951139c chore(gateway): configure database route config runtime
6d8f6ab docs: finalize sprint 8 documentation
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
* Policy foundation before Admin UI.
* Static route config fallback before dynamic database route config rollout.
* Database-backed config before Admin Dashboard.
* Backend route management APIs before Admin Dashboard.
* Validation before runtime reload.
* Runtime registry snapshot before runtime route behavior changes.
* Catch-all dynamic router instead of unsafe Fastify runtime unregister/register.
* Clear limitation reporting instead of pretending advanced routing exists.
* GitHub-ready documentation.
* Reproducible infrastructure through configuration files.

---

## License

This project is licensed under the MIT License.