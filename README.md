# PulseGate

<p align="center">
  <strong>High-Traffic API Gateway & Observability Platform</strong>
</p>

<p align="center">
  A local-first API Gateway, API Management, and Observability learning project built with Node.js, TypeScript, Fastify, Docker Compose, PostgreSQL, Prisma, Redis, Prometheus, Grafana, and a microservice-oriented architecture.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-Sprint%204%20Complete-brightgreen" />
  <img src="https://img.shields.io/badge/version-v0.5.0-blue" />
  <img src="https://img.shields.io/badge/tests-101%20passing-brightgreen" />
  <img src="https://img.shields.io/badge/typecheck-passing-brightgreen" />
  <img src="https://img.shields.io/badge/build-passing-brightgreen" />
  <img src="https://img.shields.io/badge/Node.js-20%2B-green" />
  <img src="https://img.shields.io/badge/TypeScript-strict-blue" />
  <img src="https://img.shields.io/badge/Fastify-API%20Gateway-black" />
  <img src="https://img.shields.io/badge/Auth-API%20Key%20%2B%20JWT-purple" />
  <img src="https://img.shields.io/badge/Rate%20Limit-Redis-red" />
  <img src="https://img.shields.io/badge/Cache-Redis-red" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-blue" />
  <img src="https://img.shields.io/badge/ORM-Prisma-2D3748" />
  <img src="https://img.shields.io/badge/Metrics-Prometheus-orange" />
  <img src="https://img.shields.io/badge/Dashboard-Grafana-F46800" />
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

The project is designed to demonstrate backend engineering skills around API routing, microservice communication, authentication, traffic protection, caching, data persistence, request tracing, error handling, testing, observability, scalability, and production-oriented system design.

PulseGate starts small and grows step by step.

Current stable flow:

```txt
Client
  -> API Gateway :3000
    -> Request ID handling
    -> Structured access log timer
    -> Metrics timer
    -> Basic security headers
    -> Request size limit
    -> API key authentication
    -> Redis-backed rate limiting
    -> JWT authentication
    -> Redis response cache
      -> Cache HIT:
           -> Return cached Product response
      -> Cache MISS:
           -> Downstream route configuration
           -> Downstream timeout handling
           -> Normalized downstream error handling
           -> Product Service :3001
             -> Prisma Client
             -> PostgreSQL :5432
             -> Database-backed Product response
           -> Store response in Redis cache
    -> Add x-response-time-ms
    -> Record Prometheus metrics
    -> Write structured access log
    -> Return response to Client

API Gateway
  -> Exposes /metrics

Prometheus :9090
  -> Scrapes API Gateway /metrics

Grafana :3002
  -> Uses Prometheus datasource
  -> Displays PulseGate API Gateway Overview dashboard
```

Current version:

```txt
v0.5.0
```

Current sprint status:

```txt
Sprint 4 - Observability Foundation Complete
```

---

## Project Status

| Area            | Status                                                                                  | Notes                                                  |
| --------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Sprint 0        | ![Complete](https://img.shields.io/badge/status-complete-brightgreen)                   | Core setup and basic Gateway flow                      |
| Sprint 1        | ![Complete](https://img.shields.io/badge/status-complete-brightgreen)                   | API Gateway core features                              |
| Sprint 2        | ![Complete](https://img.shields.io/badge/status-complete-brightgreen)                   | Gateway traffic protection                             |
| Sprint 3        | ![Complete](https://img.shields.io/badge/status-complete-brightgreen)                   | Data and infrastructure foundation                     |
| Sprint 4        | ![Complete](https://img.shields.io/badge/status-complete-brightgreen)                   | Observability foundation                               |
| Current Version | ![v0.5.0](https://img.shields.io/badge/version-v0.5.0-blue)                             | Docker, PostgreSQL, Prisma, Redis, Prometheus, Grafana |
| Automated Tests | ![101 Passing](https://img.shields.io/badge/tests-101%20passing-brightgreen)            | Unit and integration tests                             |
| Typecheck       | ![Passing](https://img.shields.io/badge/typecheck-passing-brightgreen)                  | TypeScript validation passes                           |
| Build           | ![Passing](https://img.shields.io/badge/build-passing-brightgreen)                      | Production build passes                                |
| Next Sprint     | ![Sprint 5](https://img.shields.io/badge/Sprint%205-Advanced%20Gateway%20Policies-blue) | Route policies, transformations, retry foundation      |

---

## Why PulseGate?

Modern backend systems often contain many services. Without an API Gateway, clients may need to call each service directly, which creates problems around routing, security, rate limiting, logging, monitoring, caching, resilience, and scaling.

PulseGate aims to solve these problems by acting as a single entry point for APIs.

Long-term goals:

* Route requests to the correct backend service.
* Validate API keys and JWT tokens.
* Apply rate limiting to protect services.
* Add request size protection.
* Add security headers.
* Add Redis caching to reduce backend load.
* Store service data in PostgreSQL.
* Log requests with request IDs.
* Produce structured access logs.
* Expose metrics for monitoring.
* Visualize Gateway behavior with Grafana dashboards.
* Add distributed tracing later.
* Stream events with Kafka later.
* Process background jobs with RabbitMQ later.
* Run load tests with k6 later.
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

| Feature                                | Status                                                        | Notes                                                |
| -------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| Docker Compose foundation              | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Runs API Gateway, Product Service, PostgreSQL, Redis |
| Containerize API Gateway               | ![Done](https://img.shields.io/badge/status-done-brightgreen) | API Gateway container runs on port `3000`            |
| Containerize Product Service           | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Product Service container runs on port `3001`        |
| PostgreSQL service                     | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Local database through Docker Compose                |
| Prisma setup                           | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Prisma schema, migration, client generation          |
| Product seed script                    | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Idempotent seed with `upsert`                        |
| Database-backed products               | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Replaced mock Product Service data                   |
| Redis service                          | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Local Redis through Docker Compose                   |
| Redis client foundation                | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Shared Redis connection lifecycle                    |
| Redis-backed rate limiting             | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Replaced runtime in-memory rate limit store          |
| Redis rate limit fail-fast behavior    | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Prevents long request hangs when Redis is down       |
| Redis response cache store             | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Cache get/set with TTL and timeout                   |
| Product response caching               | ![Done](https://img.shields.io/badge/status-done-brightgreen) | `x-cache: MISS` and `x-cache: HIT`                   |
| Cache HIT when Product Service is down | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Cached response survives downstream outage           |
| Cache write failure isolation          | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Cache write errors do not break valid responses      |

### Sprint 4 - Observability Foundation

| Feature                             | Status                                                        | Notes                                                    |
| ----------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| Structured access logs              | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Logs method, path, route, status, latency, cache status  |
| Sensitive header protection in logs | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Does not log API keys, JWT tokens, or cookies            |
| Request latency measurement         | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Uses high-resolution timing                              |
| `x-response-time-ms` header         | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Returns latency in milliseconds                          |
| HTTP metrics registry               | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Uses `prom-client`                                       |
| Request count metric                | ![Done](https://img.shields.io/badge/status-done-brightgreen) | `http_requests_total`                                    |
| Request duration metric             | ![Done](https://img.shields.io/badge/status-done-brightgreen) | `http_request_duration_seconds`                          |
| Cache outcome metric                | ![Done](https://img.shields.io/badge/status-done-brightgreen) | `http_response_cache_total`                              |
| Metrics middleware                  | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Records metrics after response completion                |
| Prometheus `/metrics` endpoint      | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Exposes Prometheus text format                           |
| Prometheus Docker service           | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Scrapes API Gateway through Docker internal DNS          |
| Grafana Docker service              | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Runs on local port `3002`                                |
| Grafana Prometheus datasource       | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Provisioned from repository config                       |
| Grafana dashboard foundation        | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Provisioned dashboard JSON                               |
| API Gateway overview dashboard      | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Request rate, request count, p95 latency, cache outcomes |

---

## Current Architecture

```mermaid
flowchart LR
    Client[Client / API Consumer] --> Gateway[PulseGate API Gateway<br/>Port 3000]

    Gateway --> ReqId[Request ID Middleware]
    ReqId --> AccessLogStart[Access Log Timer]
    AccessLogStart --> MetricsStart[Metrics Timer]
    MetricsStart --> SecurityHeaders[Security Headers Middleware]
    SecurityHeaders --> SizeLimit[Request Size Limit]
    SizeLimit --> ApiKey[API Key Authentication]
    ApiKey --> RateLimit[Redis-Backed Rate Limiting]
    RateLimit --> Jwt[JWT Authentication]
    Jwt --> Cache{Redis Response Cache}

    Cache -->|HIT| CachedResponse[Cached Product Response]
    CachedResponse --> ResponseHeaders[Response Headers<br/>x-response-time-ms]

    Cache -->|MISS| RouteConfig[Downstream Route Config]
    RouteConfig --> Product[Product Service<br/>Port 3001]
    Product --> Prisma[Prisma Client]
    Prisma --> Postgres[(PostgreSQL<br/>Port 5432)]
    Postgres --> Prisma
    Prisma --> Product
    Product --> CacheStore[Store Response in Redis Cache]
    CacheStore --> ResponseHeaders

    RateLimit --> Redis[(Redis<br/>Port 6379)]
    Cache --> Redis
    CacheStore --> Redis

    ResponseHeaders --> MetricsRecord[Record HTTP Metrics]
    MetricsRecord --> AccessLogWrite[Write Structured Access Log]
    AccessLogWrite --> Client

    Gateway --> MetricsEndpoint[/GET /metrics/]
    Prometheus[Prometheus<br/>Port 9090] -->|Scrapes| MetricsEndpoint
    Grafana[Grafana<br/>Port 3002] -->|Reads datasource| Prometheus
```

Current protected request flow:

```txt
GET http://localhost:3000/api/products

Client
  -> API Gateway
    -> Create or reuse x-request-id
    -> Start structured access log timer
    -> Start metrics timer
    -> Add security headers
    -> Apply request size limit
    -> Check x-api-key
      -> Missing: 401 API_KEY_MISSING
      -> Invalid: 403 API_KEY_INVALID
    -> Apply Redis-backed rate limit by API key and route
      -> Exceeded: 429 TOO_MANY_REQUESTS
    -> Check Authorization Bearer token
      -> Missing: 401 JWT_TOKEN_MISSING
      -> Invalid: 403 JWT_TOKEN_INVALID
    -> Check Redis response cache
      -> HIT:
           -> Return cached products
           -> x-cache: HIT
      -> MISS:
           -> Call Product Service
              -> Local npm: http://127.0.0.1:3001/products
              -> Docker Compose: http://product-service:3001/products
           -> Product Service reads PostgreSQL through Prisma
           -> API Gateway stores response in Redis cache
           -> Return products
           -> x-cache: MISS
    -> Add x-response-time-ms
    -> Record Prometheus metrics
    -> Write structured access log
```

Current public request flow:

```txt
GET http://localhost:3000/health

Client
  -> API Gateway
    -> Create or reuse x-request-id
    -> Start structured access log timer
    -> Start metrics timer
    -> Add security headers
    -> Apply request size limit
    -> Health response
    -> Add x-response-time-ms
    -> Record Prometheus metrics
    -> Write structured access log
```

Current observability flow:

```txt
Prometheus
  -> GET http://api-gateway:3000/metrics inside Docker network
    -> API Gateway returns Prometheus text format
    -> Prometheus stores time-series metrics
    -> Grafana reads metrics from Prometheus datasource
    -> Grafana displays PulseGate API Gateway Overview dashboard
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
        cache/
          redis-response-cache-store.ts
          redis-response-cache-store.test.ts
        config/
          downstream-routes.ts
          downstream-routes.test.ts
          env.ts
          env.test.ts
        errors/
          downstream-service-error.ts
          downstream-service-error.test.ts
        middlewares/
          access-log.middleware.ts
          access-log.middleware.test.ts
          api-key-auth.middleware.ts
          api-key-auth.middleware.test.ts
          error-handler.middleware.ts
          jwt-auth.middleware.ts
          jwt-auth.middleware.test.ts
          metrics.middleware.ts
          metrics.middleware.test.ts
          rate-limit.middleware.ts
          rate-limit.middleware.test.ts
          request-id.middleware.ts
          request-id.middleware.test.ts
          request-size-limit.middleware.ts
          request-size-limit.middleware.test.ts
          security-headers.middleware.ts
          security-headers.middleware.test.ts
        observability/
          metrics.ts
          metrics.test.ts
        rate-limit/
          in-memory-rate-limit-store.ts
          in-memory-rate-limit-store.test.ts
          redis-rate-limit-store.ts
          redis-rate-limit-store.test.ts
        redis/
          redis-client.ts
        routes/
          health.route.ts
          metrics.route.ts
          metrics.route.test.ts
          product-proxy.route.ts
        server.ts
      package.json
      tsconfig.json
      vitest.config.ts

    product-service/
      Dockerfile
      prisma/
        migrations/
          20260628092746_init_products/
            migration.sql
          migration_lock.toml
        schema.prisma
        seed.ts
        tsconfig.json
      src/
        config/
          env.ts
        database/
          prisma.ts
        middlewares/
          error-handler.middleware.ts
          request-id.middleware.ts
        products/
          product.repository.ts
        routes/
          health.route.ts
          product.route.ts
        server.ts
      package.json
      tsconfig.json

  observability/
    prometheus/
      prometheus.yml
    grafana/
      dashboards/
        api-gateway-overview.json
      provisioning/
        dashboards/
          dashboards.yml
        datasources/
          prometheus.yml

  docs/
    architecture/
      overview.md
    sdlc/
      requirements.md
    project-context/
      AI_HANDOFF.md
      CURRENT_PROGRESS.md
      DECISION_LOG.md

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
GET /metrics
GET /api/products
```

Route protection:

```txt
GET /health
  -> Public

GET /metrics
  -> Public for local Docker observability

GET /api/products
  -> Requires API key
  -> Redis-backed rate limited by API key and route
  -> Requires JWT Bearer token
  -> Uses Redis response cache
```

Responsibilities:

* Acts as the single entry point.
* Receives client requests.
* Creates or reuses request IDs.
* Adds `x-request-id` response header.
* Adds `x-response-time-ms` response header.
* Adds basic security headers.
* Applies request size limit.
* Routes product API requests to Product Service on cache MISS.
* Returns cached response on cache HIT.
* Forwards `x-request-id` to downstream services.
* Applies API key authentication.
* Applies Redis-backed rate limiting.
* Applies JWT authentication.
* Attaches verified JWT payload to `request.jwtPayload`.
* Applies downstream request timeout.
* Normalizes downstream service errors.
* Handles basic 404 and 500 errors.
* Logs requests in JSON format.
* Writes structured access logs.
* Records Prometheus metrics.
* Exposes metrics at `/metrics`.
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
* Reads product data from PostgreSQL.
* Uses Prisma Client for database access.
* Returns database-backed product data.
* Creates or reuses request IDs.
* Reuses request ID from API Gateway.
* Handles basic 404 and 500 errors.
* Logs requests in JSON format.
* Supports Docker Compose local development.

---

### PostgreSQL

Port:

```txt
5432
```

Responsibilities:

* Stores Product Service data.
* Holds the `products` table.
* Stores Prisma migration metadata.
* Runs locally through Docker Compose.

Current database:

```txt
pulsegate
```

Current user:

```txt
pulsegate
```

Current Product table:

```txt
products
```

Current seeded products:

```txt
prod_001 - Mechanical Keyboard - 120
prod_002 - Gaming Mouse - 45
```

---

### Redis

Port:

```txt
6379
```

Responsibilities:

* Stores API Gateway rate limit counters.
* Stores API Gateway response cache payloads.
* Supports Redis-backed traffic protection.
* Supports Redis-backed response caching.

Current Redis key examples:

```txt
rate-limit:api-key:dev-api-key:route:GET:/api/products
response-cache:GET:/api/products
```

---

### Prometheus

Port:

```txt
9090
```

Responsibilities:

* Scrapes API Gateway metrics.
* Stores time-series metrics.
* Provides PromQL query API.
* Provides metrics datasource for Grafana.

Current local URL:

```txt
http://localhost:9090
```

Current scrape target inside Docker:

```txt
http://api-gateway:3000/metrics
```

Config file:

```txt
observability/prometheus/prometheus.yml
```

---

### Grafana

Port:

```txt
3002
```

Responsibilities:

* Reads metrics from Prometheus.
* Provides local observability dashboard.
* Loads datasource from provisioning config.
* Loads dashboard from repository JSON.

Current local URL:

```txt
http://localhost:3002
```

Local development login:

```txt
username: admin
password: admin
```

Provisioned datasource:

```txt
name: Prometheus
uid: pulsegate-prometheus
type: prometheus
url: http://prometheus:9090
isDefault: true
```

Provisioned dashboard:

```txt
title: PulseGate API Gateway Overview
uid: pulsegate-api-gateway-overview
folder: PulseGate
```

Dashboard panels:

```txt
Request Rate
Request Count by Route
Latency p95 by Route
Cache Outcomes
```

---

## Tech Stack

Currently implemented:

| Category           | Technology                          | Status                                                            |
| ------------------ | ----------------------------------- | ----------------------------------------------------------------- |
| Runtime            | Node.js 20+                         | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Language           | TypeScript strict mode              | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Web Framework      | Fastify                             | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Monorepo           | npm workspaces                      | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Logging            | Fastify JSON logger                 | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Access Logs        | Structured JSON logs                | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Authentication     | API Key, JWT                        | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| JWT Library        | jose                                | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Traffic Protection | Redis-backed rate limit, size limit | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| HTTP Security      | Basic security headers              | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Cache              | Redis response cache                | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Database           | PostgreSQL                          | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| ORM                | Prisma                              | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Metrics Library    | prom-client                         | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Metrics Backend    | Prometheus                          | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Dashboard          | Grafana                             | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Containerization   | Docker, Docker Compose              | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Testing            | Vitest                              | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Architecture       | API Gateway + Microservice          | ![Active](https://img.shields.io/badge/status-active-brightgreen) |

Planned later:

| Category         | Technology                               | Status                                                            |
| ---------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| Gateway Policies | Route policies, transformations, retries | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Tracing          | OpenTelemetry + Jaeger/Tempo             | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Logs             | Loki                                     | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Event Streaming  | Kafka                                    | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Background Jobs  | RabbitMQ                                 | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Load Testing     | k6                                       | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Orchestration    | Kubernetes                               | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| CI/CD            | GitHub Actions                           | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |

---

## Environment Configuration

PulseGate uses environment variables for local configuration.

### API Gateway Variables

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
REDIS_URL=redis://localhost:6379
```

### Product Service Variables

```txt
PORT=3001
HOST=0.0.0.0
DATABASE_URL=postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate
```

### Docker Compose Internal Values

Inside Docker Compose, services use internal service names:

```txt
PRODUCT_SERVICE_URL=http://product-service:3001
DATABASE_URL=postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate
REDIS_URL=redis://redis:6379
Prometheus scrape target=http://api-gateway:3000/metrics
Grafana Prometheus datasource=http://prometheus:9090
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

---

## Run with Docker Compose

This is the recommended workflow after Sprint 4.

### 1. Start PostgreSQL and Redis

```powershell
docker compose up -d postgres redis
```

Check services:

```powershell
docker compose ps
```

Expected:

```txt
pulsegate-postgres  healthy
pulsegate-redis     healthy
```

### 2. Run database migration

Set local database URL:

```powershell
$env:DATABASE_URL="postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate"
```

Apply Prisma migrations:

```powershell
npx prisma migrate deploy --schema apps/product-service/prisma/schema.prisma
```

### 3. Seed product data

```powershell
npm run db:seed -w apps/product-service
```

Validate product data:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "SELECT id, name, price FROM products ORDER BY id;"
```

Expected result:

```txt
prod_001 | Mechanical Keyboard | 120
prod_002 | Gaming Mouse        | 45
```

### 4. Start the full stack

```powershell
docker compose up --build -d
```

Check running containers:

```powershell
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

### 5. Open observability tools

Prometheus:

```txt
http://localhost:9090
```

Grafana:

```txt
http://localhost:3002
```

Grafana local login:

```txt
username: admin
password: admin
```

### 6. Stop the stack

```powershell
docker compose down
```

---

## Run Locally with npm

For local npm development, keep PostgreSQL and Redis running in Docker, then run API Gateway and Product Service directly with npm.

### 1. Start infrastructure

```powershell
docker compose up -d postgres redis
```

### 2. Prepare database

```powershell
$env:DATABASE_URL="postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate"

npx prisma migrate deploy --schema apps/product-service/prisma/schema.prisma

npm run db:seed -w apps/product-service
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
Invoke-WebRequest http://localhost:3000/health -UseBasicParsing
```

Expected response body:

```json
{
  "service": "api-gateway",
  "status": "ok",
  "timestamp": "2026-06-25T00:00:00.000Z"
}
```

Expected response headers include:

```txt
x-request-id
x-response-time-ms
x-content-type-options
x-frame-options
referrer-policy
permissions-policy
content-security-policy
```

---

## Create Local Development JWT Token

```powershell
$token = node --input-type=module -e "import { SignJWT } from 'jose'; const secretKey = new TextEncoder().encode('local-dev-jwt-secret-change-me'); const expiresAt = Math.floor(Date.now() / 1000) + 900; const token = await new SignJWT({ role: 'user' }).setProtectedHeader({ alg: 'HS256' }).setSubject('user_123').setIssuer('pulsegate-api-gateway').setAudience('pulsegate-clients').setExpirationTime(expiresAt).sign(secretKey); console.log(token);"
```

Create request headers:

```powershell
$headers = @{
  "x-api-key" = "dev-api-key"
  "authorization" = "Bearer $token"
}
```

---

## API Gateway Product Proxy API

This route requires both API key and JWT.

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

Expected response headers include:

```txt
x-request-id
x-response-time-ms
x-cache
x-ratelimit-limit
x-ratelimit-remaining
x-ratelimit-reset
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
  -> Continue to Redis-backed rate limiting
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
  -> Continue to Redis response cache
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

### Redis-Backed Rate Limiting

Current product route rate limit:

```txt
GET /api/products
  -> Limited by API key and route
  -> Default: 5 requests per 60 seconds
```

Logical rate limit key:

```txt
api-key:<api-key>:route:<method>:<route-path>
```

Redis rate limit key:

```txt
rate-limit:api-key:dev-api-key:route:GET:/api/products
```

Validate rate limiting:

```powershell
docker compose exec redis redis-cli DEL "rate-limit:api-key:dev-api-key:route:GET:/api/products"

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

## Redis Response Cache Behavior

PulseGate currently caches `GET /api/products` responses in Redis.

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
$res1.Headers["x-response-time-ms"]
$res1.Content

$res2 = Invoke-WebRequest http://localhost:3000/api/products `
  -Headers $headers `
  -UseBasicParsing

$res2.StatusCode
$res2.Headers["x-cache"]
$res2.Headers["x-response-time-ms"]
$res2.Content
```

Expected behavior:

```txt
Request 1 -> 200, x-cache: MISS
Request 2 -> 200, x-cache: HIT
Both responses include x-response-time-ms
```

Check Redis cache key:

```powershell
docker compose exec redis redis-cli GET "response-cache:GET:/api/products"
docker compose exec redis redis-cli TTL "response-cache:GET:/api/products"
```

### Cache HIT when Product Service is down

```powershell
docker compose exec redis redis-cli DEL "response-cache:GET:/api/products"
docker compose exec redis redis-cli DEL "rate-limit:api-key:dev-api-key:route:GET:/api/products"

$res1 = Invoke-WebRequest http://localhost:3000/api/products `
  -Headers $headers `
  -UseBasicParsing

$res1.StatusCode
$res1.Headers["x-cache"]

docker compose stop product-service

$res2 = Invoke-WebRequest http://localhost:3000/api/products `
  -Headers $headers `
  -UseBasicParsing

$res2.StatusCode
$res2.Headers["x-cache"]
$res2.Content

docker compose start product-service
```

Expected behavior:

```txt
Request 1 -> 200, x-cache: MISS
Product Service stopped
Request 2 -> 200, x-cache: HIT
```

This confirms that a valid Redis cache HIT can serve data even when Product Service is temporarily unavailable.

---

## Observability Behavior

Sprint 4 adds the first production-oriented observability foundation.

Current observability layers:

```txt
Request ID
Structured access logs
Response latency header
Prometheus metrics registry
/metrics endpoint
Prometheus scraping
Grafana datasource
Grafana dashboard
```

### Structured Access Logs

API Gateway writes structured access logs after requests complete.

Current event name:

```txt
http_request_completed
```

Current log fields:

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

Sensitive values are intentionally not logged:

```txt
x-api-key
authorization
cookie
```

Conceptual log payload:

```json
{
  "event": "http_request_completed",
  "requestId": "example-request-id",
  "method": "GET",
  "path": "/health",
  "route": "/health",
  "statusCode": 200,
  "durationMs": 3.25,
  "userAgent": "PowerShell",
  "remoteAddress": "127.0.0.1"
}
```

### Response Time Header

API Gateway adds:

```txt
x-response-time-ms
```

Example:

```txt
x-response-time-ms: 4.32
```

The value is measured in milliseconds and formatted with two decimal places.

### Metrics Endpoint

API Gateway exposes Prometheus-compatible metrics:

```txt
GET /metrics
```

Test metrics:

```powershell
Invoke-WebRequest http://localhost:3000/metrics -UseBasicParsing
```

Expected metric names include:

```txt
http_requests_total
http_request_duration_seconds
http_response_cache_total
```

Current metric behavior:

```txt
http_requests_total
  -> Counts requests by method, route, and status_code

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

### Prometheus

Prometheus runs through Docker Compose.

Local URL:

```txt
http://localhost:9090
```

Config file:

```txt
observability/prometheus/prometheus.yml
```

Current scrape target inside Docker:

```txt
http://api-gateway:3000/metrics
```

Test Prometheus health:

```powershell
Invoke-WebRequest http://localhost:9090/-/healthy -UseBasicParsing
```

Expected result:

```txt
Prometheus Server is Healthy.
```

Test Prometheus targets:

```powershell
Invoke-RestMethod http://localhost:9090/api/v1/targets | ConvertTo-Json -Depth 10
```

Expected target:

```txt
job: pulsegate-api-gateway
scrapeUrl: http://api-gateway:3000/metrics
health: up
```

### Grafana

Grafana runs through Docker Compose.

Local URL:

```txt
http://localhost:3002
```

Local development login:

```txt
username: admin
password: admin
```

Datasource config:

```txt
observability/grafana/provisioning/datasources/prometheus.yml
```

Dashboard provider config:

```txt
observability/grafana/provisioning/dashboards/dashboards.yml
```

Dashboard JSON:

```txt
observability/grafana/dashboards/api-gateway-overview.json
```

Provisioned datasource:

```txt
name: Prometheus
uid: pulsegate-prometheus
type: prometheus
url: http://prometheus:9090
isDefault: true
```

Provisioned dashboard:

```txt
title: PulseGate API Gateway Overview
uid: pulsegate-api-gateway-overview
folder: PulseGate
```

Dashboard panels:

```txt
Request Rate
Request Count by Route
Latency p95 by Route
Cache Outcomes
```

Test Grafana health:

```powershell
Invoke-RestMethod http://localhost:3002/api/health | ConvertTo-Json -Depth 10
```

Test Grafana datasource:

```powershell
$pair = "admin:admin"
$encoded = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($pair))
$headers = @{
  Authorization = "Basic $encoded"
}

Invoke-RestMethod http://localhost:3002/api/datasources `
  -Headers $headers |
  ConvertTo-Json -Depth 10
```

Test Grafana dashboard search:

```powershell
Invoke-RestMethod http://localhost:3002/api/search?query=PulseGate `
  -Headers $headers |
  ConvertTo-Json -Depth 10
```

Test Grafana dashboard detail:

```powershell
Invoke-RestMethod http://localhost:3002/api/dashboards/uid/pulsegate-api-gateway-overview `
  -Headers $headers |
  ConvertTo-Json -Depth 10
```

---

## Downstream Error Behavior

PulseGate normalizes downstream Product Service failures.

```txt
Product Service unavailable + cache MISS
  -> 503 DOWNSTREAM_SERVICE_UNAVAILABLE

Product Service unavailable + cache HIT
  -> 200 from Redis cache

Product Service timeout + cache MISS
  -> 504 DOWNSTREAM_TIMEOUT

Product Service returns error status + cache MISS
  -> 502 DOWNSTREAM_HTTP_ERROR

Product Service returns invalid JSON + cache MISS
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

## Redis Failure Behavior

When Redis is unavailable, API Gateway fails fast instead of hanging for a long time.

```powershell
docker compose stop redis

try {
  Invoke-RestMethod http://localhost:3000/api/products `
    -Headers $headers |
    ConvertTo-Json -Depth 10
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}

docker compose start redis
docker compose restart api-gateway
```

Expected result:

```txt
500
{"error":{"message":"Internal Server Error","requestId":"example-request-id"}}
```

Redis internal errors are not exposed to clients.

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
* Helps connect Gateway access logs with downstream service logs.

---

## Database and Prisma

Product Service uses PostgreSQL and Prisma.

Prisma schema:

```txt
apps/product-service/prisma/schema.prisma
```

Current migration:

```txt
apps/product-service/prisma/migrations/20260628092746_init_products/migration.sql
```

Seed script:

```txt
apps/product-service/prisma/seed.ts
```

Generate Prisma Client:

```powershell
npm run db:generate -w apps/product-service
```

Run seed:

```powershell
npm run db:seed -w apps/product-service
```

Validate tables:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "\dt"
```

Validate products:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "SELECT id, name, price FROM products ORDER BY id;"
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
17 test files passed
101 tests passed
```

Current unit test coverage:

```txt
request-id.middleware.test.ts
  -> Request ID generation and reuse

access-log.middleware.test.ts
  -> Duration calculation, safe access log payload, response time header behavior

api-key-auth.middleware.test.ts
  -> Missing, invalid, valid, and array header API key cases

jwt-auth.middleware.test.ts
  -> Bearer token extraction, JWT verification, missing token, invalid token, valid token

metrics.middleware.test.ts
  -> Route label extraction, cache header reading, request metrics, cache metrics

rate-limit/in-memory-rate-limit-store.test.ts
  -> In-memory rate limit store behavior, counters, window reset, cleanup, validation

rate-limit/redis-rate-limit-store.test.ts
  -> Redis rate limit store behavior and fail-fast timeout

rate-limit.middleware.test.ts
  -> Rate limit key generation, allowed requests, exceeded limit, reset behavior, missing identifier

cache/redis-response-cache-store.test.ts
  -> Redis response cache store MISS/HIT, set with TTL, validation, and fail-fast timeout

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

observability/metrics.test.ts
  -> Metrics registry, request metrics, cache metrics, cache status normalization

routes/metrics.route.test.ts
  -> /metrics endpoint and Prometheus text format
```

Current integration test coverage:

```txt
GET /health
  -> 200 OK
  -> includes x-request-id
  -> includes basic security headers

GET /metrics
  -> 200 OK
  -> returns Prometheus text format

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

Generate Prisma Client:

```powershell
npm run db:generate -w apps/product-service
```

Seed database:

```powershell
npm run db:seed -w apps/product-service
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

Status: ![Completed](https://img.shields.io/badge/status-completed-brightgreen)

| Feature                                      | Status                                                        |
| -------------------------------------------- | ------------------------------------------------------------- |
| Add Docker Compose                           | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Containerize API Gateway                     | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Containerize Product Service                 | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add PostgreSQL                               | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add Prisma                                   | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add Product seed script                      | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Replace mock product data with database data | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add Redis service                            | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add Redis-backed rate limiting               | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add response caching                         | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Validate cache HIT when Product Service down | ![Done](https://img.shields.io/badge/status-done-brightgreen) |

### Sprint 4 - Observability Foundation

Status: ![Completed](https://img.shields.io/badge/status-completed-brightgreen)

| Feature                         | Status                                                        |
| ------------------------------- | ------------------------------------------------------------- |
| Add structured access logs      | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add request latency tracking    | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add `x-response-time-ms` header | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add basic metrics registry      | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add metrics middleware          | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add `/metrics` endpoint         | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add Prometheus service          | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add Grafana service             | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add Grafana datasource          | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add dashboard foundation        | ![Done](https://img.shields.io/badge/status-done-brightgreen) |

### Sprint 5 - Advanced Gateway Policies

Status: ![Planned](https://img.shields.io/badge/status-planned-lightgrey)

| Feature                                | Status                                                            |
| -------------------------------------- | ----------------------------------------------------------------- |
| Review current route config model      | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Add route policy type foundation       | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Add per-route timeout policy           | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Add per-route cache policy             | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Add per-route rate limit policy        | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Add request transformation foundation  | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Add response transformation foundation | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Add upstream retry policy foundation   | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |

### Later - Event-Driven Architecture

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
| OpenTelemetry tracing  | ![Future](https://img.shields.io/badge/status-future-lightgrey) |
| Loki log aggregation   | ![Future](https://img.shields.io/badge/status-future-lightgrey) |
| k6 load testing        | ![Future](https://img.shields.io/badge/status-future-lightgrey) |
| GitHub Actions CI/CD   | ![Future](https://img.shields.io/badge/status-future-lightgrey) |
| Kubernetes deployment  | ![Future](https://img.shields.io/badge/status-future-lightgrey) |
| Cloud lightweight demo | ![Future](https://img.shields.io/badge/status-future-lightgrey) |

---

## Current Status

PulseGate currently has a stable local-first API Gateway and infrastructure foundation with Docker Compose, PostgreSQL, Prisma, Redis-backed traffic protection, database-backed Product Service data, Redis response caching, structured access logs, Prometheus metrics, Prometheus scraping, Grafana datasource provisioning, and Grafana dashboard provisioning.

Stable flow:

```txt
Client
  -> API Gateway :3000
    -> Request ID handling
    -> Structured access logs
    -> Response time measurement
    -> Basic security headers
    -> Request size limit
    -> API key authentication
    -> Redis-backed rate limiting
    -> JWT authentication
    -> Redis response cache
    -> Downstream route configuration
    -> Downstream timeout handling
    -> Normalized downstream error handling
    -> Product Service :3001
      -> Prisma
      -> PostgreSQL
      -> Database-backed Product Response

API Gateway
  -> /metrics

Prometheus
  -> Scrapes API Gateway /metrics

Grafana
  -> Reads Prometheus datasource
  -> Displays PulseGate API Gateway Overview dashboard
```

Docker Compose flow:

```txt
Client
  -> localhost:3000
    -> API Gateway container
      -> Redis container for rate limiting and caching
      -> Product Service container
        -> PostgreSQL container

Prometheus container
  -> Scrapes API Gateway container

Grafana container
  -> Reads Prometheus container
```

Latest stable Sprint 4 commits:

```txt
75eacfb feat(gateway): add structured access logs
b0da511 feat(gateway): add response time header
fb17516 feat(gateway): add basic http metrics registry
31cae03 feat(gateway): expose prometheus metrics endpoint
13789a3 chore(observability): add prometheus service
6bb7de2 chore(observability): add grafana service
87490cf chore(observability): add grafana dashboard foundation
```

Latest stable Sprint 3 commits:

```txt
7dbb2d2 chore: add docker compose foundation
84a277b docs: document docker compose workflow
75edf46 chore: add postgres service to docker compose
934532b chore(product): add database url config
f390694 chore(product): add prisma schema foundation
10a3101 chore(product): add initial products migration
f247260 chore(product): add product seed script
23b5903 feat(product): read products from database
ccccda5 chore: add redis service to docker compose
94443a3 chore(gateway): add redis client foundation
25bff78 feat(gateway): add redis rate limit store
ff06658 feat(gateway): use redis backed rate limiting
411d13a feat(gateway): add redis response cache store
cf0f2b9 feat(gateway): cache product responses in redis
176bcfe fix(gateway): isolate response cache write failures
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
* Reproducible infrastructure through configuration files.

---

## License

This project is licensed under the MIT License.
