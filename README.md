# PulseGate

<p align="center">
  <strong>High-Traffic API Gateway & Observability Platform</strong>
</p>

<p align="center">
  A local-first API Gateway, API Management, and Observability learning project built with Node.js, TypeScript, Fastify, Docker Compose, PostgreSQL, Prisma, Redis, Prometheus, Grafana, GitHub Actions CI/CD, route policy foundations, database-backed dynamic route configuration, safe static fallback, internal/admin route management APIs, route config soft delete, reload validation, and a microservice-oriented architecture.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-Sprint%2010%20Complete-brightgreen" />
  <img src="https://img.shields.io/badge/version-v0.11.0-blue" />
  <a href="https://github.com/VuNguyen26/pulsegate/actions/workflows/ci.yml">
    <img src="https://github.com/VuNguyen26/pulsegate/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI" />
  </a>
  <img src="https://img.shields.io/badge/tests-176%20passing-brightgreen" />
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
  <img src="https://img.shields.io/badge/Route%20Management-Internal%20Admin%20API-blueviolet" />
  <img src="https://img.shields.io/badge/Soft%20Delete-Route%20Config-blueviolet" />
  <img src="https://img.shields.io/badge/Reload%20Validation-Validation%20Only-blueviolet" />
  <img src="https://img.shields.io/badge/Fallback-Static%20Routes-indigo" />
  <img src="https://img.shields.io/badge/Policies-Route%20Policies-indigo" />
  <img src="https://img.shields.io/badge/Retry-Foundation-blueviolet" />
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

The project is designed to demonstrate backend engineering skills around API routing, microservice communication, authentication, traffic protection, caching, data persistence, dynamic route configuration, route management APIs, request tracing, error handling, testing, observability, route policies, gateway resilience, scalability, CI/CD, and production-oriented system design.

PulseGate starts small and grows step by step.

Current stable flow:

```txt
Client
  -> API Gateway :3000
    -> Runtime route config loading
      -> Try loading database-backed route configs from PostgreSQL gateway.gateway_routes
      -> If database route configs are valid and not empty:
           -> Use database-backed route configs
      -> If database loading fails or returns no enabled, non-deleted routes:
           -> Safely fall back to static downstream route configs
    -> Request ID handling
    -> Structured access log timer
    -> Metrics timer
    -> Basic security headers
    -> Request size limit
    -> Downstream route configuration
      -> GET /api/products
      -> GET /api/product-service/health
    -> Downstream route policy configuration
      -> Auth policy
      -> Timeout policy
      -> Cache policy
      -> Rate limit policy
      -> Request transform policy
      -> Response transform policy
      -> Retry policy foundation

    -> Route: GET /api/products
      -> API key authentication
      -> Redis-backed rate limiting
      -> JWT authentication
      -> Redis response cache
        -> Cache HIT:
             -> Apply response transform foundation
             -> Return cached Product response
             -> x-cache: HIT
        -> Cache MISS:
             -> Apply request transform foundation
             -> Downstream timeout policy helper
             -> Upstream retry policy foundation
             -> Normalized downstream error handling
             -> Product Service :3001 /products
               -> Prisma Client
               -> PostgreSQL public.products
               -> Database-backed Product response
             -> Store response in Redis cache
             -> Apply response transform foundation
             -> x-cache: MISS

    -> Route: GET /api/product-service/health
      -> Public route
      -> No API key required
      -> No JWT required
      -> No Redis rate limit
      -> No Redis response cache
      -> Downstream timeout policy helper
      -> Product Service :3001 /health
      -> x-cache: BYPASS

    -> Internal/admin route management APIs
      -> GET /internal/admin/routes
      -> GET /internal/admin/routes/:id
      -> POST /internal/admin/routes
      -> PATCH /internal/admin/routes/:id
      -> DELETE /internal/admin/routes/:id
      -> POST /internal/admin/routes/reload
      -> Admin API key authentication
      -> Optional x-admin-actor audit metadata
      -> Route management repository
      -> Route management mapper
      -> PostgreSQL gateway.gateway_routes
      -> Route config validation before persistence
      -> Duplicate active method + gatewayPath conflict detection
      -> Enable/disable route config through PATCH
      -> Soft delete route config through DELETE
      -> Validation-only route reload check
      -> Restart-based runtime route application

    -> Add x-cache when applicable
    -> Add x-response-time-ms
    -> Record Prometheus metrics
    -> Write structured access log
    -> Return response to Client

PostgreSQL :5432
  -> public schema
       -> Product Service tables
       -> products
       -> public._prisma_migrations
  -> gateway schema
       -> API Gateway route config tables
       -> gateway_routes
       -> gateway._prisma_migrations

Redis :6379
  -> API Gateway rate limit counters
  -> API Gateway response cache payloads

API Gateway
  -> Exposes /metrics

Prometheus :9090
  -> Scrapes API Gateway /metrics

Grafana :3002
  -> Uses Prometheus datasource
  -> Displays PulseGate API Gateway Overview dashboard

GitHub Actions
  -> Runs on push and pull request to main
  -> Installs dependencies with npm ci
  -> Generates Product Service Prisma Client
  -> Generates API Gateway Prisma Client
  -> Runs tests, typecheck, and build
  -> Builds API Gateway and Product Service Docker images
```

Current version:

```txt
v0.11.0
```

Current sprint status:

```txt
Sprint 10 - Route Management Hardening Complete
```

---

## Project Status

| Area            | Status                                                                          | Notes                                                                                                                               |
| --------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Sprint 0        | ![Complete](https://img.shields.io/badge/status-complete-brightgreen)           | Core setup and basic Gateway flow                                                                                                   |
| Sprint 1        | ![Complete](https://img.shields.io/badge/status-complete-brightgreen)           | API Gateway core features                                                                                                           |
| Sprint 2        | ![Complete](https://img.shields.io/badge/status-complete-brightgreen)           | Gateway traffic protection                                                                                                          |
| Sprint 3        | ![Complete](https://img.shields.io/badge/status-complete-brightgreen)           | Data and infrastructure foundation                                                                                                  |
| Sprint 4        | ![Complete](https://img.shields.io/badge/status-complete-brightgreen)           | Observability foundation                                                                                                            |
| Sprint 5        | ![Complete](https://img.shields.io/badge/status-complete-brightgreen)           | Advanced Gateway policies                                                                                                           |
| Sprint 6        | ![Complete](https://img.shields.io/badge/status-complete-brightgreen)           | CI/CD foundation with GitHub Actions                                                                                                 |
| Sprint 7        | ![Complete](https://img.shields.io/badge/status-complete-brightgreen)           | Multi-route Gateway expansion from downstream route config                                                                           |
| Sprint 8        | ![Complete](https://img.shields.io/badge/status-complete-brightgreen)           | Database-backed dynamic route config with safe static fallback                                                                       |
| Sprint 9        | ![Complete](https://img.shields.io/badge/status-complete-brightgreen)           | Internal/admin route management API foundation                                                                                       |
| Sprint 10       | ![Complete](https://img.shields.io/badge/status-complete-brightgreen)           | Route management hardening with soft delete, audit metadata, active-route uniqueness, and reload validation                          |
| Current Version | ![v0.11.0](https://img.shields.io/badge/version-v0.11.0-blue)                   | Docker, PostgreSQL, Prisma, Redis, Prometheus, Grafana, Gateway policies, CI/CD, DB route config, hardened route management APIs      |
| Automated Tests | ![176 Passing](https://img.shields.io/badge/tests-176%20passing-brightgreen)    | Unit, integration, runtime config, route management API, soft delete, and reload validation tests                                     |
| Typecheck       | ![Passing](https://img.shields.io/badge/typecheck-passing-brightgreen)          | TypeScript validation passes                                                                                                         |
| Build           | ![Passing](https://img.shields.io/badge/build-passing-brightgreen)              | Production build passes                                                                                                              |
| CI/CD           | ![Passing](https://img.shields.io/badge/ci-passing-brightgreen)                 | GitHub Actions validates npm, Prisma, tests, typecheck, build, and Docker builds                                                     |
| Next Sprint     | ![Sprint 11](https://img.shields.io/badge/next%20sprint-admin%20foundation-blue) | Admin Dashboard Foundation, API key lifecycle foundation, service registry foundation, or additional route management hardening       |

---

## Why PulseGate?

Modern backend systems often contain many services. Without an API Gateway, clients may need to call each service directly, which creates problems around routing, security, rate limiting, logging, monitoring, caching, resilience, traffic control, policy management, dynamic configuration, and scaling.

PulseGate aims to solve these problems by acting as a single entry point for APIs.

Long-term goals:

* Route requests to the correct backend service.
* Support multiple Gateway routes and multiple downstream services.
* Load Gateway route configuration dynamically from PostgreSQL.
* Keep safe fallback behavior when dynamic route loading fails.
* Manage Gateway route configuration through internal/admin APIs.
* Validate route configs before persistence.
* Detect duplicate active route config conflicts.
* Enable and disable routes safely.
* Soft delete route configs without losing operational history.
* Validate route configs through an admin reload validation endpoint before restart-based application.
* Validate API keys and JWT tokens.
* Protect internal/admin APIs with separate admin authentication.
* Apply rate limiting to protect services.
* Add request size protection.
* Add security headers.
* Add Redis caching to reduce backend load.
* Store service data in PostgreSQL.
* Store Gateway route configuration in PostgreSQL.
* Log requests with request IDs.
* Produce structured access logs.
* Expose metrics for monitoring.
* Visualize Gateway behavior with Grafana dashboards.
* Validate test, typecheck, build, Prisma generation, and Docker image build automatically with GitHub Actions.
* Centralize route behavior through policies.
* Support per-route timeout, cache, rate limit, transform, and retry rules.
* Add true runtime hot reload later after validation-only reload foundation.
* Add service registry foundation later.
* Add API consumer management later.
* Add API key lifecycle and usage plans later.
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
| Sensitive header protection in logs | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Does not log API keys, admin API keys, JWT tokens, or cookies |
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

### Sprint 5 - Advanced Gateway Policies

| Feature                                   | Status                                                        | Notes                                                             |
| ----------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- |
| Current route configuration review        | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Identified hardcoded route behavior that should be policy-driven  |
| Route policy type foundation              | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Central `RoutePolicies` model                                     |
| Route config validation improvements      | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Validates route URL, method, policy values, headers, retry config |
| Per-route timeout policy helper           | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Isolates downstream timeout creation and cleanup                  |
| Per-route cache policy helper             | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Resolves cache enabled state, TTL, and cache key behavior         |
| Per-route rate limit policy helper        | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Resolves rate limit runtime configuration                         |
| Request transformation policy foundation  | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Supports add/remove request headers through policy helper         |
| Response transformation policy foundation | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Supports add/remove response headers through policy helper        |
| Upstream retry policy foundation          | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Supports retry helper for safe GET retry scenarios                |
| Route policy integration tests            | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Covers cache MISS/HIT flow and policy-driven app behavior         |

### Sprint 6 - CI/CD Foundation

| Feature                                      | Status                                                        | Notes                                                            |
| -------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------- |
| Review current package scripts               | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Confirmed npm workspace scripts are CI-ready                     |
| Add GitHub Actions workflow                  | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Runs on push and pull request to `main`                          |
| Install dependencies with `npm ci`           | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Uses lockfile-based clean install                                |
| Generate Product Service Prisma Client in CI | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Prevents Product Service Prisma Client issues on clean runners   |
| Run automated tests in CI                    | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Runs `npm run test`                                              |
| Run TypeScript typecheck in CI               | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Runs `npm run typecheck`                                         |
| Run production build in CI                   | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Runs `npm run build`                                             |
| Build API Gateway Docker image               | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Validates `apps/api-gateway/Dockerfile`                          |
| Build Product Service Docker image           | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Validates `apps/product-service/Dockerfile` and Prisma flow      |
| Add CI badge to README                       | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Shows live GitHub Actions status on the repository page          |

### Sprint 7 - Multi-Route Gateway Expansion

| Feature                                              | Status                                                        | Notes                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Refactor Product proxy into generic downstream proxy | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Adds reusable `downstreamProxyRoute()` while keeping existing behavior stable |
| Add Product Service health route config              | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Adds `GET /api/product-service/health -> Product Service /health`             |
| Register downstream routes from config               | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Gateway registers multiple routes from `downstreamRouteConfigs`               |
| Preserve protected product route behavior            | ![Done](https://img.shields.io/badge/status-done-brightgreen) | `/api/products` still uses API key, JWT, Redis rate limit, and Redis cache    |
| Add integration test for health proxy route          | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Covers public multi-route Gateway behavior through Fastify `app.inject()`     |
| Validate Docker runtime for new route                | ![Done](https://img.shields.io/badge/status-done-brightgreen) | `/api/product-service/health` returns Product Service health through Gateway  |
| Validate existing protected product route runtime    | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Confirmed cache MISS/HIT, rate limit headers, JWT, and API key still work     |
| Final Sprint 7 validation                            | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Tests, typecheck, build, Docker runtime, `/health`, `/metrics`, route passed  |

### Sprint 8 - Dynamic Route Config from Database

| Feature                                                   | Status                                                        | Notes                                                                                      |
| --------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Add API Gateway Prisma schema                             | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Adds Gateway-owned Prisma schema under `apps/api-gateway/prisma`                           |
| Separate Gateway DB schema from Product Service schema     | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Product Service uses `public`; API Gateway route config uses PostgreSQL schema `gateway`   |
| Add `gateway_routes` database model                        | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Stores route path, downstream URL, method, enable flag, priority, and route policies        |
| Add Gateway route config migration                         | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Adds `gateway.gateway_routes` and `gateway._prisma_migrations`                             |
| Add idempotent Gateway route config seed                   | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Seeds `GET /api/products` and `GET /api/product-service/health` with `upsert`               |
| Add database route config mapper                           | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Maps `gateway_routes` rows into `DownstreamRouteConfig[]`                                   |
| Add database route config repository                       | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Loads enabled routes from PostgreSQL and validates mapped route configs                     |
| Add runtime DB route config loader                         | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Gateway startup now tries DB route config first                                             |
| Add safe static fallback                                   | ![Done](https://img.shields.io/badge/status-done-brightgreen) | If DB loading fails or returns zero routes, Gateway falls back to static route configs      |
| Add tests for mapper and runtime fallback                  | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Test count increased to 26 files / 152 tests                                                |
| Generate API Gateway Prisma Client in CI                   | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Clean GitHub runner can typecheck/build API Gateway Prisma imports                         |
| Generate API Gateway Prisma Client inside Docker image     | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Prevents Windows-generated Prisma Client from being used inside Linux Alpine container      |
| Configure API Gateway Docker runtime `DATABASE_URL`        | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Uses `postgres:5432/pulsegate?schema=gateway` inside Docker Compose                        |
| Validate Docker DB route config loading                    | ![Done](https://img.shields.io/badge/status-done-brightgreen) | API Gateway logs `Loaded downstream route configs from database { routeCount: 2 }`          |
| Validate public DB-backed health proxy route               | ![Done](https://img.shields.io/badge/status-done-brightgreen) | `/api/product-service/health` returns `200`, `x-cache: BYPASS`, request ID, response time   |
| Validate protected DB-backed product route                 | ![Done](https://img.shields.io/badge/status-done-brightgreen) | `/api/products` still returns `MISS -> HIT` with API key, JWT, Redis rate limit, and cache  |
| Final Sprint 8 validation                                  | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Tests, typecheck, build, Docker runtime, DB config loading, public/protected routes passed  |

### Sprint 9 - Route Management API Foundation

| Feature                                                | Status                                                        | Notes                                                                                       |
| ------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Add admin API key environment config                   | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Adds `ADMIN_API_KEY_HEADER` and `ADMIN_API_KEY`                                             |
| Add admin API key middleware                           | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Protects internal/admin route management APIs                                               |
| Add internal/admin route config list API               | ![Done](https://img.shields.io/badge/status-done-brightgreen) | `GET /internal/admin/routes`                                                               |
| Add internal/admin route config detail API             | ![Done](https://img.shields.io/badge/status-done-brightgreen) | `GET /internal/admin/routes/:id`                                                           |
| Add route config create API                            | ![Done](https://img.shields.io/badge/status-done-brightgreen) | `POST /internal/admin/routes`                                                              |
| Add route config update API                            | ![Done](https://img.shields.io/badge/status-done-brightgreen) | `PATCH /internal/admin/routes/:id`                                                         |
| Add route config enable/disable foundation             | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Uses `enabled` field through PATCH                                                          |
| Add route management repository                        | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Prisma-backed read/create/update behavior                                                   |
| Add route management mapper                            | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Maps admin request/response shapes                                                          |
| Reuse route validation before persistence              | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Reuses `validateDownstreamRoutes()` for create and update                                    |
| Add duplicate route conflict detection                 | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Rejects duplicate `method + gatewayPath`                                                    |
| Add route management API tests                         | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Covers auth, list, detail, create, update, validation, not found, and duplicate conflicts    |
| Add admin env config tests                             | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Covers default and custom admin API key config                                               |
| Validate Docker runtime route create/update/disable    | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Created test route, rejected duplicate, disabled route, restarted Gateway, confirmed 404     |
| Clean temporary test route                             | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Database returned to 2 seeded route configs                                                 |
| Final Sprint 9 validation                              | ![Done](https://img.shields.io/badge/status-done-brightgreen) | 27 test files / 168 tests, typecheck, build, Docker runtime validation passed                |

### Sprint 10 - Route Management Hardening

| Feature                                                   | Status                                                        | Notes                                                                                                  |
| --------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Add route config soft delete fields                        | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Adds `deleted_at`, `deleted_by`, `created_by`, and `updated_by` to `gateway.gateway_routes`             |
| Replace full route uniqueness with active-route uniqueness | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Uses PostgreSQL partial unique index for `method + gateway_path` where `deleted_at IS NULL`             |
| Update Gateway route config seed behavior                  | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Seeds active route configs without relying on Prisma compound unique upsert                            |
| Exclude soft-deleted routes from admin read APIs           | ![Done](https://img.shields.io/badge/status-done-brightgreen) | `GET /internal/admin/routes` and detail reads only return non-deleted route configs                     |
| Exclude soft-deleted routes from duplicate checks           | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Allows a new active route to reuse the same `method + gatewayPath` after the previous route is deleted  |
| Exclude soft-deleted routes from runtime loading            | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Runtime loader only loads `enabled=true` and `deleted_at IS NULL` route configs                         |
| Add route config soft delete API                           | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Adds `DELETE /internal/admin/routes/:id`                                                               |
| Add admin actor metadata                                   | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Supports optional `x-admin-actor` with fallback to `admin-api-key`                                      |
| Add route reload validation endpoint                       | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Adds `POST /internal/admin/routes/reload` as validation-only reload check                               |
| Keep runtime route application restart-based               | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Reload endpoint validates configs but does not hot-apply routes yet                                     |
| Add soft delete and reload validation tests                | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Test count increased to 27 files / 176 tests                                                           |
| Validate Docker runtime soft delete and reload behavior    | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Confirmed create, delete, restart, hidden deleted routes, recreate after delete, and reload validation  |
| Final Sprint 10 validation                                 | ![Done](https://img.shields.io/badge/status-done-brightgreen) | Tests, typecheck, build, Docker runtime validation, and Git push passed                                 |

---

## Current Architecture

```mermaid
flowchart LR
    Client[Client / API Consumer] --> Gateway[PulseGate API Gateway<br/>Port 3000]
    AdminClient[Admin Client / Future Admin Dashboard] --> AdminRoutes[Internal Admin Route Management APIs<br/>/internal/admin/routes]

    Gateway --> RuntimeConfig[Runtime Route Config Loader]
    RuntimeConfig --> GatewayPrisma[API Gateway Prisma Client]
    GatewayPrisma --> GatewaySchema[(PostgreSQL gateway schema<br/>gateway_routes)]
    RuntimeConfig -->|DB load success| DbRoutes[Database-backed Route Configs]
    RuntimeConfig -->|DB error or empty| StaticRoutes[Static Route Config Fallback]

    DbRoutes --> RouteConfig[Downstream Route Configs<br/>/api/products<br/>/api/product-service/health]
    StaticRoutes --> RouteConfig

    RouteConfig --> ReqId[Request ID Middleware]
    ReqId --> AccessLogStart[Access Log Timer]
    AccessLogStart --> MetricsStart[Metrics Timer]
    MetricsStart --> SecurityHeaders[Security Headers Middleware]
    SecurityHeaders --> SizeLimit[Request Size Limit]

    SizeLimit --> ProductRoute[Protected Product Route<br/>GET /api/products]
    SizeLimit --> ProductHealthRoute[Public Product Service Health Proxy<br/>GET /api/product-service/health]

    ProductRoute --> RoutePolicy[Route Policy Configuration<br/>Auth / Timeout / Cache / Rate Limit / Transform / Retry]
    RoutePolicy --> ApiKey[API Key Authentication]
    ApiKey --> RateLimit[Redis-Backed Rate Limiting]
    RateLimit --> Jwt[JWT Authentication]
    Jwt --> Cache{Redis Response Cache}

    Cache -->|HIT| ResponseTransformHit[Response Transform Foundation]
    ResponseTransformHit --> CachedResponse[Cached Product Response]
    CachedResponse --> ResponseHeaders[Response Headers<br/>x-cache / x-response-time-ms]

    Cache -->|MISS| RequestTransform[Request Transform Foundation]
    RequestTransform --> RetryPolicy[Upstream Retry Policy Foundation]
    RetryPolicy --> TimeoutPolicy[Downstream Timeout Policy]
    TimeoutPolicy --> ProductProducts[Product Service<br/>GET /products<br/>Port 3001]
    ProductProducts --> ProductPrisma[Product Service Prisma Client]
    ProductPrisma --> PublicSchema[(PostgreSQL public schema<br/>products)]
    PublicSchema --> ProductPrisma
    ProductPrisma --> ProductProducts
    ProductProducts --> CacheStore[Store Response in Redis Cache]
    CacheStore --> ResponseTransformMiss[Response Transform Foundation]
    ResponseTransformMiss --> ResponseHeaders

    ProductHealthRoute --> HealthTimeout[Downstream Timeout Policy]
    HealthTimeout --> ProductHealth[Product Service<br/>GET /health<br/>Port 3001]
    ProductHealth --> HealthResponse[Health Response<br/>x-cache: BYPASS]
    HealthResponse --> ResponseHeaders

    AdminRoutes --> AdminApiKey[Admin API Key Authentication<br/>x-admin-api-key]
    AdminApiKey --> RouteManagement[Route Management Module]
    RouteManagement --> RouteManagementRepo[Prisma Route Management Repository]
    RouteManagementRepo --> GatewaySchema
    RouteManagement --> RouteValidation[Route Config Validation<br/>validateDownstreamRoutes]
    RouteManagement --> AdminResponse[Admin Route Config Response<br/>List / Detail / Create / Update / Soft Delete / Reload Validation]

    RateLimit --> Redis[(Redis<br/>Port 6379)]
    Cache --> Redis
    CacheStore --> Redis

    ResponseHeaders --> MetricsRecord[Record HTTP Metrics]
    AdminResponse --> MetricsRecord
    MetricsRecord --> AccessLogWrite[Write Structured Access Log]
    AccessLogWrite --> Client
    AccessLogWrite --> AdminClient

    Gateway --> MetricsEndpoint[/GET /metrics/]
    Prometheus[Prometheus<br/>Port 9090] -->|Scrapes| MetricsEndpoint
    Grafana[Grafana<br/>Port 3002] -->|Reads datasource| Prometheus
```

Current DB-backed route config startup flow:

```txt
API Gateway startup
  -> loadRuntimeDownstreamRouteConfigs()
    -> loadDatabaseDownstreamRouteConfigs(gatewayPrisma)
      -> SELECT enabled, non-deleted routes from gateway.gateway_routes
      -> order by priority asc, gatewayPath asc
      -> map database rows to DownstreamRouteConfig[]
      -> validate mapped route configs
    -> If database route configs exist:
         -> Use database-backed route configs
         -> Log: Loaded downstream route configs from database { routeCount: 2 }
    -> If database loading fails:
         -> Fall back to static downstreamRouteConfigs
         -> Log fallback warning
    -> If database returns no routes:
         -> Fall back to static downstreamRouteConfigs
         -> Log fallback warning
  -> buildApiGatewayApp({ routeConfigs })
  -> register healthRoute()
  -> register metricsRoute()
  -> register adminRouteConfigRoute()
  -> register downstreamProxyRoute() with resolved route configs
  -> connect Redis
  -> listen on port 3000
```

Current protected request flow:

```txt
GET http://localhost:3000/api/products

Client
  -> API Gateway
    -> Route was loaded from PostgreSQL gateway.gateway_routes during startup
    -> Create or reuse x-request-id
    -> Start structured access log timer
    -> Start metrics timer
    -> Add security headers
    -> Apply request size limit
    -> Match downstream route config: GET /api/products
    -> Load route policy configuration
    -> Check x-api-key
      -> Missing: 401 API_KEY_MISSING
      -> Invalid: 403 API_KEY_INVALID
    -> Apply Redis-backed rate limit by API key and route
      -> Exceeded: 429 TOO_MANY_REQUESTS
    -> Check Authorization Bearer token
      -> Missing: 401 JWT_TOKEN_MISSING
      -> Invalid: 403 JWT_TOKEN_INVALID
    -> Resolve response cache policy
    -> Check Redis response cache
      -> HIT:
           -> Apply response transform foundation
           -> Return cached products
           -> x-cache: HIT
      -> MISS:
           -> Apply request transform foundation
           -> Call Product Service through timeout and retry helpers
              -> Docker Compose: http://product-service:3001/products
              -> Local npm: http://127.0.0.1:3001/products when route config points to local URL
           -> Product Service reads PostgreSQL public.products through Prisma
           -> API Gateway stores response in Redis cache
           -> Apply response transform foundation
           -> Return products
           -> x-cache: MISS
    -> Add x-response-time-ms
    -> Record Prometheus metrics
    -> Write structured access log
```

Current public downstream health proxy flow:

```txt
GET http://localhost:3000/api/product-service/health

Client
  -> API Gateway
    -> Route was loaded from PostgreSQL gateway.gateway_routes during startup
    -> Create or reuse x-request-id
    -> Start structured access log timer
    -> Start metrics timer
    -> Add security headers
    -> Apply request size limit
    -> Match downstream route config: GET /api/product-service/health
    -> No API key required
    -> No JWT required
    -> No Redis-backed rate limit
    -> No Redis response cache
    -> Apply request transform foundation
    -> Call Product Service through timeout helper
       -> Docker Compose: http://product-service:3001/health
       -> Local npm: http://127.0.0.1:3001/health when route config points to local URL
    -> Product Service returns health response
    -> API Gateway returns response
    -> x-cache: BYPASS
    -> Add x-response-time-ms
    -> Record Prometheus metrics
    -> Write structured access log
```

Current internal/admin route management flow:

```txt
Admin Client / Future Admin Dashboard
  -> GET http://localhost:3000/internal/admin/routes
    -> API Gateway checks x-admin-api-key
    -> Reads non-deleted route configs from gateway.gateway_routes
    -> Returns non-deleted route configs, including disabled route configs

Admin Client / Future Admin Dashboard
  -> GET http://localhost:3000/internal/admin/routes/:id
    -> API Gateway checks x-admin-api-key
    -> Reads one non-deleted route config by id
    -> If route does not exist or is soft-deleted:
         -> 404 ROUTE_CONFIG_NOT_FOUND
    -> If route exists and is not deleted:
         -> 200 with route config response

Admin Client / Future Admin Dashboard
  -> POST http://localhost:3000/internal/admin/routes
    -> API Gateway checks x-admin-api-key
    -> Reads optional x-admin-actor
    -> Parses request body
    -> Maps request body to DownstreamRouteConfig
    -> Reuses validateDownstreamRoutes()
    -> Checks duplicate active method + gatewayPath
    -> If invalid:
         -> 400 ROUTE_CONFIG_INVALID
    -> If duplicate active route exists:
         -> 409 ROUTE_CONFIG_ALREADY_EXISTS
    -> If valid:
         -> Creates route config in gateway.gateway_routes
         -> Sets createdBy and updatedBy metadata
         -> Returns 201 Created

Admin Client / Future Admin Dashboard
  -> PATCH http://localhost:3000/internal/admin/routes/:id
    -> API Gateway checks x-admin-api-key
    -> Reads optional x-admin-actor
    -> Finds existing non-deleted route by id
    -> If route does not exist or is soft-deleted:
         -> 404 ROUTE_CONFIG_NOT_FOUND
    -> If route exists:
         -> Merges existing route with patch body
         -> Maps merged body to DownstreamRouteConfig
         -> Reuses validateDownstreamRoutes()
         -> Checks conflict with another active method + gatewayPath
         -> If invalid:
              -> 400 ROUTE_CONFIG_INVALID
         -> If conflict:
              -> 409 ROUTE_CONFIG_ALREADY_EXISTS
         -> If valid:
              -> Updates route config in gateway.gateway_routes
              -> Sets updatedBy metadata
              -> Returns 200 OK

Admin Client / Future Admin Dashboard
  -> DELETE http://localhost:3000/internal/admin/routes/:id
    -> API Gateway checks x-admin-api-key
    -> Reads optional x-admin-actor
    -> Finds existing non-deleted route by id
    -> If route does not exist or is already soft-deleted:
         -> 404 ROUTE_CONFIG_NOT_FOUND
    -> If route exists:
         -> Sets enabled=false
         -> Sets deleted_at, deleted_by, updated_by
         -> Keeps the row in gateway.gateway_routes for history
         -> Returns 200 OK

Admin Client / Future Admin Dashboard
  -> POST http://localhost:3000/internal/admin/routes/reload
    -> API Gateway checks x-admin-api-key
    -> Loads non-deleted route configs from repository
    -> Filters enabled active route configs
    -> Maps active records to DownstreamRouteConfig[]
    -> Reuses validateDownstreamRoutes()
    -> Returns validation summary
    -> Does not hot-apply runtime route changes yet
```

Current route enable/disable behavior:

```txt
PATCH /internal/admin/routes/:id
Body: { "enabled": false }

Result:
  -> Route remains stored in gateway.gateway_routes
  -> Route remains visible in GET /internal/admin/routes as long as it is not soft-deleted
  -> API Gateway restart loads only enabled and non-deleted route configs
  -> Disabled route is not registered as an active runtime route
  -> Client request to disabled route returns 404 Route not found
```

Current route soft delete behavior:

```txt
DELETE /internal/admin/routes/:id
Header: x-admin-actor optional

Result:
  -> Route remains stored in gateway.gateway_routes
  -> Route is marked deleted through deleted_at and deleted_by
  -> Route is forced to enabled=false
  -> Route is hidden from GET /internal/admin/routes
  -> Route detail returns 404 ROUTE_CONFIG_NOT_FOUND
  -> Runtime loader ignores the deleted route after API Gateway restart
  -> A new active route may reuse the same method + gatewayPath
```

Current route reload validation behavior:

```txt
POST /internal/admin/routes/reload
Body: {}

Result:
  -> Validates active DB route configs
  -> Returns mode: validation-only
  -> Returns runtimeApplied: false
  -> Returns requiresRestart: true
  -> Does not hot-apply route changes yet
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
  .github/
    workflows/
      ci.yml
  apps/
    api-gateway/
      Dockerfile
      prisma/
        migrations/
          20260701063629_add_gateway_routes/
            migration.sql
          20260702090000_add_gateway_route_soft_delete/
            migration.sql
          migration_lock.toml
        schema.prisma
        seed.ts
      src/
        app.ts
        app.test.ts
        cache/
          redis-response-cache-store.ts
          redis-response-cache-store.test.ts
        config/
          database-route-config.mapper.ts
          database-route-config.mapper.test.ts
          database-route-config.repository.ts
          downstream-routes.ts
          downstream-routes.test.ts
          env.ts
          env.test.ts
          runtime-downstream-routes.ts
          runtime-downstream-routes.test.ts
          validate-downstream-routes.ts
          validate-downstream-routes.test.ts
        database/
          gateway-prisma.ts
        errors/
          downstream-service-error.ts
          downstream-service-error.test.ts
        middlewares/
          access-log.middleware.ts
          access-log.middleware.test.ts
          admin-api-key-auth.middleware.ts
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
        policies/
          cache.policy.ts
          cache.policy.test.ts
          rate-limit.policy.ts
          rate-limit.policy.test.ts
          request-transform.policy.ts
          request-transform.policy.test.ts
          response-transform.policy.ts
          response-transform.policy.test.ts
          retry.policy.ts
          retry.policy.test.ts
          route-policy.types.ts
          timeout.policy.ts
          timeout.policy.test.ts
        rate-limit/
          in-memory-rate-limit-store.ts
          in-memory-rate-limit-store.test.ts
          redis-rate-limit-store.ts
          redis-rate-limit-store.test.ts
        redis/
          redis-client.ts
        route-management/
          route-management.mapper.ts
          route-management.repository.ts
          route-management.types.ts
        routes/
          admin-route-config.route.ts
          admin-route-config.route.test.ts
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
GET /api/product-service/health
GET /internal/admin/routes
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
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
  -> Uses route policy configuration loaded from database route config
  -> Proxies to Product Service GET /products

GET /api/product-service/health
  -> Public
  -> Does not require API key
  -> Does not require JWT
  -> Does not use Redis-backed rate limiting
  -> Does not use Redis response cache
  -> Uses route policy configuration loaded from database route config
  -> Uses downstream timeout policy
  -> Proxies to Product Service GET /health

GET /internal/admin/routes
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
  -> Internal/admin APIs
  -> Require x-admin-api-key
  -> Do not use consumer x-api-key
  -> Do not use consumer JWT
  -> Do not use Product response cache
```

Responsibilities:

* Acts as the single entry point.
* Receives client requests.
* Creates or reuses request IDs.
* Adds `x-request-id` response header.
* Adds `x-response-time-ms` response header.
* Adds basic security headers.
* Applies request size limit.
* Loads downstream route configs from PostgreSQL `gateway.gateway_routes` at startup.
* Falls back to static route config when DB route config loading fails or returns no routes.
* Registers multiple downstream routes through the generic downstream proxy route.
* Routes product API requests to Product Service `/products` on cache MISS.
* Routes product service health proxy requests to Product Service `/health`.
* Returns cached product response on cache HIT.
* Forwards `x-request-id` to downstream services.
* Applies API key authentication where route policy requires it.
* Applies Redis-backed rate limiting where route policy requires it.
* Applies JWT authentication where route policy requires it.
* Attaches verified JWT payload to `request.jwtPayload`.
* Applies route policy configuration.
* Validates downstream route configuration after mapping DB route records.
* Resolves per-route timeout policy.
* Resolves per-route cache policy.
* Resolves per-route rate limit policy.
* Supports request header transformation foundation.
* Supports response header transformation foundation.
* Supports upstream retry policy foundation.
* Applies downstream request timeout.
* Normalizes downstream service errors.
* Protects internal/admin route management APIs with admin API key.
* Lists route configs through internal/admin API.
* Reads route config detail through internal/admin API.
* Creates route configs through internal/admin API.
* Updates route configs through internal/admin API.
* Enables or disables route configs through PATCH.
* Soft deletes route configs through DELETE.
* Tracks admin actor metadata with `createdBy`, `updatedBy`, and `deletedBy`.
* Validates route configs before persistence.
* Rejects duplicate active `method + gatewayPath` route conflicts.
* Validates active route configs through `POST /internal/admin/routes/reload`.
* Uses restart-based runtime route application after validation.
* Handles basic 404 and 500 errors.
* Logs requests in JSON format.
* Writes structured access logs.
* Records Prometheus metrics.
* Exposes metrics at `/metrics`.
* Supports automated integration tests using `app.inject()`.
* Supports Docker Compose local development.
* Generates Prisma Client in CI and Docker image builds.

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
* Provides service health response.
* Reads product data from PostgreSQL `public.products`.
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

* Stores Product Service data in the `public` schema.
* Stores API Gateway route configuration in the `gateway` schema.
* Holds the `public.products` table.
* Holds the `gateway.gateway_routes` table.
* Stores separate Prisma migration metadata per schema.
* Runs locally through Docker Compose.

Current database:

```txt
pulsegate
```

Current user:

```txt
pulsegate
```

Current schemas:

```txt
public
gateway
```

Current Product Service table:

```txt
public.products
```

Current API Gateway route config table:

```txt
gateway.gateway_routes
```

Current active route uniqueness rule:

```txt
method + gateway_path must be unique only when deleted_at IS NULL
```

This is implemented through a PostgreSQL partial unique index:

```txt
gateway_routes_method_gateway_path_active_key
```

Current seeded products:

```txt
prod_001 - Mechanical Keyboard - 120
prod_002 - Gaming Mouse - 45
```

Current seeded Gateway route configs:

```txt
GET /api/products
  -> Product Service /products
  -> API key required
  -> JWT required
  -> Redis rate limit enabled
  -> Redis response cache enabled

GET /api/product-service/health
  -> Product Service /health
  -> Public route
  -> API key not required
  -> JWT not required
  -> Redis rate limit disabled
  -> Redis response cache disabled
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

| Category             | Technology / Feature                                             | Status                                                            |
| -------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------- |
| Runtime              | Node.js 20+                                                      | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Language             | TypeScript strict mode                                           | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Web Framework        | Fastify                                                          | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Monorepo             | npm workspaces                                                   | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Logging              | Fastify JSON logger                                              | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Access Logs          | Structured JSON logs                                             | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Consumer Auth        | API Key, JWT                                                     | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Admin Auth           | Admin API key                                                    | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| JWT Library          | jose                                                             | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Traffic Protection   | Redis-backed rate limit, size limit                              | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| HTTP Security        | Basic security headers                                           | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Cache                | Redis response cache                                             | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Gateway Routing      | Database-backed route config with static fallback                | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Route Management     | Internal/admin route config read/create/update/delete/reload validation APIs | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Gateway Policies     | Route policies, transformations, retry foundation                | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Database             | PostgreSQL                                                       | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| ORM                  | Prisma                                                           | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Metrics Library      | prom-client                                                      | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Metrics Backend      | Prometheus                                                       | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Dashboard            | Grafana                                                          | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Containerization     | Docker, Docker Compose                                           | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| CI/CD                | GitHub Actions                                                   | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Testing              | Vitest                                                           | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Architecture         | API Gateway + Microservice                                       | ![Active](https://img.shields.io/badge/status-active-brightgreen) |

Planned later:

| Category             | Technology / Feature          | Status                                                            |
| -------------------- | ----------------------------- | ----------------------------------------------------------------- |
| Runtime Hot Reload   | True in-process route hot reload | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Route Reload         | Validation-only reload endpoint | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Route Soft Delete    | Soft delete route config        | ![Active](https://img.shields.io/badge/status-active-brightgreen) |
| Audit Log            | Route management audit log     | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Service Registry     | Service registry foundation    | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| API Consumers        | Consumer database              | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| API Key Lifecycle    | Key creation, revoke, rotate   | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Tracing              | OpenTelemetry + Jaeger/Tempo   | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Logs                 | Loki                           | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Event Streaming      | Kafka                          | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Background Jobs      | RabbitMQ                       | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Load Testing         | k6                             | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Admin Dashboard      | Web UI for route/API management | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Developer Portal     | Developer-facing API portal     | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |
| Orchestration        | Kubernetes                     | ![Planned](https://img.shields.io/badge/status-planned-lightgrey) |

---

## Environment Configuration

PulseGate uses environment variables for local configuration.

### API Gateway Variables

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
API_GATEWAY_DATABASE_URL=postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate?schema=gateway
PRODUCT_SERVICE_DATABASE_URL=postgresql://pulsegate:pulsegate_password@postgres:5432/pulsegate
REDIS_URL=redis://redis:6379
ADMIN_API_KEY_HEADER=x-admin-api-key
ADMIN_API_KEY=local-admin-key
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

This is the recommended workflow after Sprint 10.

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

### 2. Run Product Service database migration

Set local Product Service database URL:

```powershell
$env:DATABASE_URL="postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate"
```

Apply Product Service Prisma migrations:

```powershell
npx prisma migrate deploy --schema apps/product-service/prisma/schema.prisma
```

### 3. Seed Product Service data

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

### 4. Run API Gateway route config migration

Set local API Gateway database URL:

```powershell
$env:DATABASE_URL="postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway"
```

Apply API Gateway Prisma migrations:

```powershell
npm run db:migrate:deploy -w apps/api-gateway
```

### 5. Seed API Gateway route config data

```powershell
npm run db:seed -w apps/api-gateway
```

Expected result:

```txt
Seeded 2 active gateway route config(s).
GET /api/products -> http://product-service:3001/products | enabled=true
GET /api/product-service/health -> http://product-service:3001/health | enabled=true
```

Validate Gateway route configs:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "SELECT method, gateway_path, downstream_url, enabled, priority, require_api_key, require_jwt, cache_enabled, rate_limit_enabled, deleted_at FROM gateway.gateway_routes WHERE deleted_at IS NULL ORDER BY priority;"
```

Expected result:

```txt
GET | /api/products               | http://product-service:3001/products | true | 100 | true  | true  | true  | true  | null
GET | /api/product-service/health | http://product-service:3001/health   | true | 200 | false | false | false | false | null
```

### 6. Start the full stack

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

### 7. Confirm API Gateway loaded route configs from database

```powershell
docker compose logs api-gateway --tail=80
```

Expected log:

```txt
Loaded downstream route configs from database { routeCount: 2 }
```

### 8. Validate API Gateway runtime

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

### 9. Validate internal/admin route management API

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } |
  ConvertTo-Json -Depth 10
```

Expected:

```txt
Returns the 2 active seeded Gateway route configs.
```

Validate route reload check:

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes/reload `
  -Method POST `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } `
  -ContentType "application/json" `
  -Body "{}" |
  ConvertTo-Json -Depth 10
```

Expected:

```txt
mode = validation-only
runtimeApplied = false
requiresRestart = true
routeCount = 2
```

### 10. Open observability tools

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

### 11. Stop the stack

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

### 2. Prepare Product Service database

```powershell
$env:DATABASE_URL="postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate"

npx prisma migrate deploy --schema apps/product-service/prisma/schema.prisma

npm run db:seed -w apps/product-service
```

### 3. Prepare API Gateway route config database

For local npm mode, seed route configs with local downstream URLs if you want API Gateway to call local Product Service:

```powershell
$env:DATABASE_URL="postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway"

npm run db:migrate:deploy -w apps/api-gateway
npm run db:seed -w apps/api-gateway
```

Current default API Gateway seed uses Docker internal downstream URLs:

```txt
http://product-service:3001/products
http://product-service:3001/health
```

For the most reliable runtime validation, use Docker Compose. For local npm mode, update DB route config downstream URLs to `http://127.0.0.1:3001` before starting the API Gateway, or rely on static fallback when database route config loading is unavailable.

### 4. Run Product Service

Open terminal 1:

```powershell
npm run dev:product
```

Product Service runs on:

```txt
http://localhost:3001
```

### 5. Run API Gateway

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
  "timestamp": "2026-07-01T00:00:00.000Z"
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
  "timestamp": "2026-07-01T00:00:00.000Z"
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

### API Gateway Product Service Health Proxy

This route is public and does not require API key or JWT.

```powershell
Invoke-WebRequest http://localhost:3000/api/product-service/health -UseBasicParsing
```

Expected response body:

```json
{
  "service": "product-service",
  "status": "ok",
  "timestamp": "2026-07-01T00:00:00.000Z"
}
```

Expected response headers include:

```txt
x-request-id
x-response-time-ms
x-cache: BYPASS
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

## Gateway Route Config Behavior

Sprint 8 added database-backed route configuration for the API Gateway.

Sprint 9 added internal/admin APIs to read, create, and update route configuration records.

Sprint 10 hardened route management with soft delete, admin actor metadata, active-route uniqueness, runtime exclusion for deleted routes, and a validation-only reload endpoint.

Current route config source priority:

```txt
1. PostgreSQL gateway.gateway_routes
2. Static downstreamRouteConfigs fallback
```

Startup behavior:

```txt
API Gateway starts
  -> Try loading enabled routes where deleted_at IS NULL from gateway.gateway_routes
  -> Map database rows to DownstreamRouteConfig[]
  -> Validate mapped route configs
  -> If valid routes exist:
       -> Register routes from database config
       -> Log: Loaded downstream route configs from database { routeCount: 2 }
  -> If database load fails:
       -> Fall back to static route config
       -> Log fallback warning
  -> If database returns no enabled, non-deleted routes:
       -> Fall back to static route config
       -> Log fallback warning
```

Current Gateway route config table:

```txt
gateway.gateway_routes
```

Current route config fields include:

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

Current seeded database route configs:

```txt
GET /api/products
  -> downstreamUrl: http://product-service:3001/products
  -> requireApiKey: true
  -> requireJwt: true
  -> cacheEnabled: true
  -> rateLimitEnabled: true

GET /api/product-service/health
  -> downstreamUrl: http://product-service:3001/health
  -> requireApiKey: false
  -> requireJwt: false
  -> cacheEnabled: false
  -> rateLimitEnabled: false
```

Validate database route configs:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "SELECT method, gateway_path, downstream_url, enabled, priority, require_api_key, require_jwt, cache_enabled, rate_limit_enabled, deleted_at FROM gateway.gateway_routes WHERE deleted_at IS NULL ORDER BY priority;"
```

Expected result:

```txt
GET | /api/products               | http://product-service:3001/products | true | 100 | true  | true  | true  | true  | null
GET | /api/product-service/health | http://product-service:3001/health   | true | 200 | false | false | false | false | null
```

---

## Internal Admin Route Management API

Sprint 9 added the internal/admin Route Management API foundation.

Sprint 10 hardened the route management API with soft delete, audit metadata, active-route uniqueness, and reload validation.

Current internal/admin endpoints:

```txt
GET /internal/admin/routes
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
```

Current admin API key header:

```txt
x-admin-api-key
```

Current optional admin actor header:

```txt
x-admin-actor
```

Current default local admin API key:

```txt
local-admin-key
```

Current environment variables:

```txt
ADMIN_API_KEY_HEADER=x-admin-api-key
ADMIN_API_KEY=local-admin-key
```

### Admin Auth Behavior

```txt
Missing admin API key
  -> 401 ADMIN_API_KEY_MISSING

Invalid admin API key
  -> 403 ADMIN_API_KEY_INVALID

Valid admin API key
  -> Continue to route management behavior
```

Test valid admin key:

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } |
  ConvertTo-Json -Depth 10
```

Test missing admin key:

```powershell
try {
  Invoke-WebRequest http://localhost:3000/internal/admin/routes `
    -UseBasicParsing
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}
```

Expected:

```txt
401
ADMIN_API_KEY_MISSING
```

Test invalid admin key:

```powershell
try {
  Invoke-WebRequest http://localhost:3000/internal/admin/routes `
    -Headers @{ "x-admin-api-key" = "wrong-admin-key" } `
    -UseBasicParsing
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.ErrorDetails.Message
}
```

Expected:

```txt
403
ADMIN_API_KEY_INVALID
```

### List Route Configs

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } |
  ConvertTo-Json -Depth 10
```

Expected:

```txt
Returns non-deleted route configs, including disabled route configs.
Soft-deleted route configs are hidden from the admin list.
```

### Get Route Config Detail

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes/<route-id> `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } |
  ConvertTo-Json -Depth 10
```

Missing or soft-deleted route behavior:

```txt
404 ROUTE_CONFIG_NOT_FOUND
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
  -Method Post `
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

Duplicate active route behavior:

```txt
409 ROUTE_CONFIG_ALREADY_EXISTS
```

Invalid route config behavior:

```txt
400 ROUTE_CONFIG_INVALID
```

### Update Route Config

```powershell
$patchBody = @{
  enabled = $false
  priority = 350
} | ConvertTo-Json -Depth 10

Invoke-RestMethod http://localhost:3000/internal/admin/routes/<route-id> `
  -Method Patch `
  -Headers @{
    "x-admin-api-key" = "local-admin-key"
    "x-admin-actor" = "local-admin"
    "content-type" = "application/json"
  } `
  -Body $patchBody |
  ConvertTo-Json -Depth 10
```

Expected:

```txt
200 OK
updatedBy = local-admin
```

Missing or soft-deleted route behavior:

```txt
404 ROUTE_CONFIG_NOT_FOUND
```

Invalid merged route behavior:

```txt
400 ROUTE_CONFIG_INVALID
```

Duplicate active route conflict behavior:

```txt
409 ROUTE_CONFIG_ALREADY_EXISTS
```

### Enable or Disable Route Config

Disable request:

```json
{
  "enabled": false
}
```

Behavior:

```txt
Route remains stored in gateway.gateway_routes.
Route remains visible in GET /internal/admin/routes as long as deleted_at IS NULL.
Route is not loaded as an active runtime route after API Gateway restart.
Client request to disabled route returns 404 Route not found.
```

### Soft Delete Route Config

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes/<route-id> `
  -Method Delete `
  -Headers @{
    "x-admin-api-key" = "local-admin-key"
    "x-admin-actor" = "local-admin"
  } |
  ConvertTo-Json -Depth 10
```

Expected:

```txt
200 OK
enabled = false
deletedAt != null
deletedBy = local-admin
updatedBy = local-admin
```

Soft delete behavior:

```txt
Route remains stored in gateway.gateway_routes.
Route is hidden from GET /internal/admin/routes.
Route detail returns 404 ROUTE_CONFIG_NOT_FOUND.
Runtime loader ignores the route after API Gateway restart.
A new route can reuse the same method + gatewayPath because uniqueness applies only to active routes.
```

### Validate Route Reload

```powershell
Invoke-RestMethod http://localhost:3000/internal/admin/routes/reload `
  -Method POST `
  -Headers @{ "x-admin-api-key" = "local-admin-key" } `
  -ContentType "application/json" `
  -Body "{}" |
  ConvertTo-Json -Depth 10
```

Expected:

```txt
mode = validation-only
runtimeApplied = false
requiresRestart = true
routeCount = 2
```

Current reload strategy:

```txt
Route config create/update/delete changes are persisted immediately.
POST /internal/admin/routes/reload validates active DB route configs.
The reload endpoint does not hot-apply route changes yet.
Runtime proxy route changes still take effect after API Gateway restart.
True hot reload is intentionally deferred to a later sprint.
```

---

## Gateway Route Policy Behavior

Sprint 5 added the route policy foundation. Sprint 7 expanded the Gateway so multiple downstream routes can be registered. Sprint 8 moved the runtime route config source to PostgreSQL while keeping a safe static fallback. Sprint 9 reused route validation before route configs are created or updated through internal/admin APIs. Sprint 10 also reuses validation for reload checks and ignores soft-deleted routes in runtime and duplicate checks.

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

Current protected product route policy:

```txt
GET /api/products
  -> auth:
       requireApiKey: true
       requireJwt: true
  -> timeout:
       enabled: true
       timeoutMs: 3000
  -> cache:
       enabled: true
       ttlSeconds: 30
  -> rateLimit:
       enabled: true
       limit: 5
       windowMs: 60000
  -> requestTransform:
       enabled: false
  -> responseTransform:
       enabled: false
  -> retry:
       enabled: false
       attempts: 0
       retryOnStatuses: [502, 503, 504]
```

Current public product service health proxy route policy:

```txt
GET /api/product-service/health
  -> auth:
       requireApiKey: false
       requireJwt: false
  -> timeout:
       enabled: true
       timeoutMs: 3000
  -> cache:
       enabled: false
       ttlSeconds: 0
  -> rateLimit:
       enabled: false
       limit: 0
       windowMs: 0
  -> requestTransform:
       enabled: false
  -> responseTransform:
       enabled: false
  -> retry:
       enabled: false
       attempts: 0
       retryOnStatuses: [502, 503, 504]
```

Current route policy validation checks:

```txt
serviceName must be present
gatewayPath must start with /
method must be supported
downstreamUrl must be valid http or https URL
timeoutMs must be positive when timeout policy is enabled
cache ttlSeconds must be positive when cache policy is enabled
rate limit limit/windowMs must be positive when rate limit policy is enabled
request transform header names must be valid HTTP header names
response transform header names must be valid HTTP header names
retry attempts must be non-negative
retry attempts must be greater than 0 when retry is enabled
retryOnStatuses must not be empty when retry is enabled
retryOnStatuses must contain valid HTTP status codes
duplicate method + gatewayPath routes are rejected
```

Current policy helper behavior:

```txt
timeout.policy.ts
  -> Creates per-request AbortController when timeout is enabled
  -> Returns cleanup function to clear timeout safely

cache.policy.ts
  -> Builds stable response cache keys
  -> Resolves cache enabled state from route policy and runtime cache store
  -> Supports TTL override for tests

rate-limit.policy.ts
  -> Resolves route rate limit policy into runtime middleware config

request-transform.policy.ts
  -> Adds configured request headers
  -> Removes configured request headers case-insensitively
  -> Does not mutate original header object

response-transform.policy.ts
  -> Adds configured response headers
  -> Removes configured response headers case-insensitively
  -> Does not mutate original header object

retry.policy.ts
  -> Allows retry only for GET requests
  -> Supports retry by result or error predicate
  -> Treats attempts as additional retries after the first request
```

Retry note:

```txt
The current product route has retry foundation wired into the route flow,
but retry is disabled in the default route policy.

This keeps runtime behavior stable while preparing the Gateway for future safe retry scenarios.
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

### Admin API Key Authentication

Internal/admin routes:

```txt
GET /internal/admin/routes
GET /internal/admin/routes/:id
POST /internal/admin/routes
PATCH /internal/admin/routes/:id
DELETE /internal/admin/routes/:id
POST /internal/admin/routes/reload
```

Default header:

```txt
x-admin-api-key
```

Default local admin API key:

```txt
local-admin-key
```

Behavior:

```txt
Missing admin API key
  -> 401 ADMIN_API_KEY_MISSING

Invalid admin API key
  -> 403 ADMIN_API_KEY_INVALID

Valid admin API key
  -> Continue to route management behavior
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

Sprint 4 added the first production-oriented observability foundation.

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
x-admin-api-key
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

Current route labels include:

```txt
/health
/metrics
/api/products
/api/product-service/health
/internal/admin/routes
/internal/admin/routes/:id
/internal/admin/routes/reload
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

## CI/CD Foundation

Sprint 6 added GitHub Actions CI for automated validation. Sprint 8 extended CI so API Gateway Prisma Client is also generated in clean runners.

Workflow file:

```txt
.github/workflows/ci.yml
```

Current workflow name:

```txt
CI
```

Current trigger behavior:

```txt
push to main
pull_request to main
```

Current CI steps:

```txt
Checkout repository
Setup Node.js 20
npm ci
Generate Product Service Prisma Client
Generate API Gateway Prisma Client
npm run test
npm run typecheck
npm run build
docker build -t pulsegate-api-gateway:ci -f apps/api-gateway/Dockerfile .
docker build -t pulsegate-product-service:ci -f apps/product-service/Dockerfile .
```

Current CI validates:

* Clean dependency installation through `npm ci`.
* Product Service Prisma Client generation in a clean runner.
* API Gateway Prisma Client generation in a clean runner.
* Automated unit and integration tests.
* TypeScript type safety.
* Production build for all workspaces.
* API Gateway Docker image build.
* Product Service Docker image build.
* README CI badge status.

This makes the repository more professional because every push and pull request must pass the same core validation before the code is considered healthy.

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

PulseGate currently uses PostgreSQL and Prisma in two areas:

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

### Product Service Prisma

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

Validate products:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "SELECT id, name, price FROM products ORDER BY id;"
```

### API Gateway Prisma

Prisma schema:

```txt
apps/api-gateway/prisma/schema.prisma
```

Current migrations:

```txt
apps/api-gateway/prisma/migrations/20260701063629_add_gateway_routes/migration.sql
apps/api-gateway/prisma/migrations/20260702090000_add_gateway_route_soft_delete/migration.sql
```

Seed script:

```txt
apps/api-gateway/prisma/seed.ts
```

Generate Prisma Client:

```powershell
npm run db:generate -w apps/api-gateway
```

Run migration deploy:

```powershell
$env:DATABASE_URL="postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway"

npm run db:migrate:deploy -w apps/api-gateway
```

Run seed:

```powershell
$env:DATABASE_URL="postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway"

npm run db:seed -w apps/api-gateway
```

Validate Gateway route config table:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "\dt gateway.*"
```

Validate Gateway route config rows:

```powershell
docker compose exec postgres psql -U pulsegate -d pulsegate -c "SELECT method, gateway_path, downstream_url, enabled, priority FROM gateway.gateway_routes ORDER BY priority;"
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
27 test files passed
176 tests passed
```

Current unit test coverage:

```txt
request-id.middleware.test.ts
  -> Request ID generation and reuse

access-log.middleware.test.ts
  -> Duration calculation, safe access log payload, response time header behavior

api-key-auth.middleware.test.ts
  -> Missing, invalid, valid, and array header API key cases

admin-route-config.route.test.ts
  -> Admin API key behavior
  -> Route config list behavior
  -> Route config detail behavior
  -> Route config create behavior
  -> Route config update behavior
  -> Route config soft delete behavior
  -> Route config reload validation behavior
  -> Route config validation behavior
  -> Route config duplicate conflict behavior
  -> Route config not found behavior
  -> Soft-deleted route hidden from list/detail behavior

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
  -> Number, CSV, string env parsing, default admin API key config, custom admin API key config

downstream-routes.test.ts
  -> Product route policy config
  -> Product Service health route config
  -> Multi-route downstream route config list

validate-downstream-routes.test.ts
  -> Route config validation, duplicate route detection, invalid policy detection

database-route-config.mapper.test.ts
  -> Database route config row mapping
  -> Disabled route filtering
  -> Priority ordering
  -> JSON header transform validation
  -> Retry status JSON validation
  -> Mapped downstream route validation

runtime-downstream-routes.test.ts
  -> Runtime DB route config success behavior
  -> Fallback when DB returns no routes
  -> Fallback when DB loading fails

observability/metrics.test.ts
  -> Metrics registry, request metrics, cache metrics, cache status normalization

routes/metrics.route.test.ts
  -> /metrics endpoint and Prometheus text format

policies/timeout.policy.test.ts
  -> Timeout policy signal creation, abort behavior, and cleanup

policies/cache.policy.test.ts
  -> Cache key generation, enabled/disabled resolution, TTL override

policies/rate-limit.policy.test.ts
  -> Runtime rate limit policy resolution

policies/request-transform.policy.test.ts
  -> Request header add/remove behavior and immutability

policies/response-transform.policy.test.ts
  -> Response header add/remove behavior and immutability

policies/retry.policy.test.ts
  -> Retryable HTTP method checks, retryable status checks, result retry, error retry, retry exhaustion
```

Current integration test coverage:

```txt
GET /health
  -> 200 OK
  -> includes x-request-id
  -> includes basic security headers

GET /api/product-service/health
  -> 200 OK
  -> does not require API key
  -> does not require JWT
  -> proxies to Product Service /health
  -> returns x-cache: BYPASS
  -> includes x-request-id
  -> includes x-response-time-ms
  -> does not return rate limit headers

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
  -> includes x-cache: BYPASS when no response cache store is configured in test app
  -> includes rate limit headers

GET /api/products with response cache store configured
  -> First request returns x-cache: MISS
  -> Second request returns x-cache: HIT
  -> Product Service is only called once

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

Current route management API test coverage:

```txt
GET /internal/admin/routes
  -> 401 when admin API key is missing
  -> 403 when admin API key is invalid
  -> 200 and returns all route configs when admin API key is valid

GET /internal/admin/routes/:id
  -> 200 and returns route config by id
  -> 404 when route config id does not exist

POST /internal/admin/routes
  -> 201 and creates route config
  -> 400 when route config is invalid
  -> 409 when method + gatewayPath already exists
  -> 401 when admin API key is missing

PATCH /internal/admin/routes/:id
  -> 200 and updates route config
  -> 404 when route config id does not exist
  -> 400 when merged route config is invalid
  -> 409 when method + gatewayPath conflicts with another active route
  -> 401 when admin API key is missing

DELETE /internal/admin/routes/:id
  -> 200 and soft deletes route config
  -> 404 when route config id does not exist
  -> 401 when admin API key is missing
  -> deleted route is hidden from list/detail
  -> duplicate check ignores soft-deleted route

POST /internal/admin/routes/reload
  -> 200 and validates active route configs
  -> returns validation-only reload summary
  -> 401 when admin API key is missing
  -> 403 when admin API key is invalid
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

Generate Product Service Prisma Client:

```powershell
npm run db:generate -w apps/product-service
```

Generate API Gateway Prisma Client:

```powershell
npm run db:generate -w apps/api-gateway
```

Seed Product Service database:

```powershell
npm run db:seed -w apps/product-service
```

Seed API Gateway route config database:

```powershell
$env:DATABASE_URL="postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway"

npm run db:seed -w apps/api-gateway
```

CI validation commands:

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

| Feature                                    | Status                                                        |
| ------------------------------------------ | ------------------------------------------------------------- |
| Normalize downstream service errors        | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add downstream request timeout             | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add downstream route config foundation     | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add API key authentication                 | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add JWT authentication                     | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add basic unit test setup                  | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add request ID unit tests                  | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add API key authentication unit tests      | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add JWT authentication unit tests          | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add downstream error unit tests            | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add environment parsing unit tests         | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add API Gateway integration tests          | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add manual validation for protected routes | ![Done](https://img.shields.io/badge/status-done-brightgreen) |

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

Status: ![Completed](https://img.shields.io/badge/status-completed-brightgreen)

| Feature                                | Status                                                        |
| -------------------------------------- | ------------------------------------------------------------- |
| Review current route config model      | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add route policy type foundation       | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add route config validation            | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add per-route timeout policy           | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add per-route cache policy             | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add per-route rate limit policy        | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add request transformation foundation  | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add response transformation foundation | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add upstream retry policy foundation   | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add route policy integration tests     | ![Done](https://img.shields.io/badge/status-done-brightgreen) |

### Sprint 6 - CI/CD Foundation

Status: ![Completed](https://img.shields.io/badge/status-completed-brightgreen)

| Feature                                      | Status                                                        |
| -------------------------------------------- | ------------------------------------------------------------- |
| Review package scripts                       | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add GitHub Actions workflow                  | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Run `npm ci` in CI                           | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Generate Product Service Prisma Client in CI | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Run automated tests in CI                    | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Run TypeScript typecheck in CI               | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Run production build in CI                   | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Build API Gateway Docker image in CI         | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Build Product Service Docker image           | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add CI badge to README                       | ![Done](https://img.shields.io/badge/status-done-brightgreen) |

### Sprint 7 - Multi-Route Gateway Expansion

Status: ![Completed](https://img.shields.io/badge/status-completed-brightgreen)

| Feature                                              | Status                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| Refactor Product proxy into generic downstream proxy | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add Product Service health proxy route config        | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Register downstream routes from config               | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add multi-route config tests                         | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add health proxy integration test                    | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Validate Docker runtime for new route                | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Validate protected product route still works         | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Final tests, typecheck, build, Docker validation     | ![Done](https://img.shields.io/badge/status-done-brightgreen) |

### Sprint 8 - Dynamic Route Config from Database

Status: ![Completed](https://img.shields.io/badge/status-completed-brightgreen)

| Feature                                                    | Status                                                        |
| ---------------------------------------------------------- | ------------------------------------------------------------- |
| Design route config database model                         | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add API Gateway Prisma schema                              | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add Gateway route config migration                         | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Store Gateway route config in PostgreSQL schema `gateway`  | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Seed current Gateway routes into database                  | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add database route config mapper                           | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add database route config repository                       | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Load route config from database at runtime                 | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Keep safe fallback/static config during rollout            | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add validation and tests for database route config         | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Generate API Gateway Prisma Client in CI and Docker image  | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Validate Docker runtime DB route config loading            | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Validate public and protected routes after DB route config | ![Done](https://img.shields.io/badge/status-done-brightgreen) |

### Sprint 9 - Route Management API Foundation

Status: ![Completed](https://img.shields.io/badge/status-completed-brightgreen)

| Feature                                     | Status                                                        |
| ------------------------------------------- | ------------------------------------------------------------- |
| Add admin API key middleware                | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add internal/admin route config read API    | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add route config detail API                 | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add route config create API                 | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add route config update API                 | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add route config enable/disable behavior    | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add validation before persisting route data | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add duplicate route conflict detection      | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Keep runtime reload strategy restart-based  | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add route management tests                  | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add admin env config tests                  | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Validate Docker route management behavior   | ![Done](https://img.shields.io/badge/status-done-brightgreen) |

### Sprint 10 - Route Management Hardening

Status: ![Completed](https://img.shields.io/badge/status-completed-brightgreen)

| Feature                                                   | Status                                                        |
| --------------------------------------------------------- | ------------------------------------------------------------- |
| Add route config soft delete fields                        | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add route config soft delete API                           | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add active-route partial unique index                      | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Exclude soft-deleted routes from admin read APIs           | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Exclude soft-deleted routes from runtime loading            | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add admin actor metadata                                   | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add validation-only route reload endpoint                  | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Keep true hot reload deferred                              | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Add soft delete and reload validation tests                | ![Done](https://img.shields.io/badge/status-done-brightgreen) |
| Validate Docker soft delete and reload behavior            | ![Done](https://img.shields.io/badge/status-done-brightgreen) |

### Sprint 11 - Recommended Next Options

Status: ![Recommended Next](https://img.shields.io/badge/status-recommended%20next-blue)

| Feature                                      | Status                                                            |
| -------------------------------------------- | ----------------------------------------------------------------- |
| Start small Admin Dashboard foundation        | ![Recommended](https://img.shields.io/badge/status-recommended-blue) |
| Add API consumer database foundation          | ![Optional](https://img.shields.io/badge/status-optional-lightgrey) |
| Add API key lifecycle foundation              | ![Optional](https://img.shields.io/badge/status-optional-lightgrey) |
| Add route management audit log table          | ![Optional](https://img.shields.io/badge/status-optional-lightgrey) |
| Add service registry foundation               | ![Optional](https://img.shields.io/badge/status-optional-lightgrey) |

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
| Service Registry       | ![Future](https://img.shields.io/badge/status-future-lightgrey) |
| API Consumer Database  | ![Future](https://img.shields.io/badge/status-future-lightgrey) |
| API Key Lifecycle      | ![Future](https://img.shields.io/badge/status-future-lightgrey) |
| Usage Plans and Quotas | ![Future](https://img.shields.io/badge/status-future-lightgrey) |
| Admin Dashboard        | ![Future](https://img.shields.io/badge/status-future-lightgrey) |
| Developer Portal       | ![Future](https://img.shields.io/badge/status-future-lightgrey) |
| OpenAPI Documentation  | ![Future](https://img.shields.io/badge/status-future-lightgrey) |
| OpenTelemetry tracing  | ![Future](https://img.shields.io/badge/status-future-lightgrey) |
| Loki log aggregation   | ![Future](https://img.shields.io/badge/status-future-lightgrey) |
| k6 load testing        | ![Future](https://img.shields.io/badge/status-future-lightgrey) |
| Docker image registry  | ![Future](https://img.shields.io/badge/status-future-lightgrey) |
| Kubernetes deployment  | ![Future](https://img.shields.io/badge/status-future-lightgrey) |
| CD pipeline            | ![Future](https://img.shields.io/badge/status-future-lightgrey) |
| Production secrets     | ![Future](https://img.shields.io/badge/status-future-lightgrey) |
| Cloud lightweight demo | ![Future](https://img.shields.io/badge/status-future-lightgrey) |

---

## Current Status

PulseGate currently has a stable local-first API Gateway and infrastructure foundation with Docker Compose, PostgreSQL, Prisma, Redis-backed traffic protection, database-backed Product Service data, Redis response caching, structured access logs, Prometheus metrics, Prometheus scraping, Grafana datasource provisioning, Grafana dashboard provisioning, advanced Gateway route policy foundations, GitHub Actions CI/CD validation, static multi-route fallback, database-backed dynamic Gateway route configuration, and hardened internal/admin route management APIs with soft delete and reload validation.

Stable flow:

```txt
Client
  -> API Gateway :3000
    -> Runtime route config loader
      -> Load enabled, non-deleted routes from PostgreSQL gateway.gateway_routes
      -> Validate mapped route configs
      -> Fall back to static downstream routes if DB loading fails or returns no active routes
    -> Request ID handling
    -> Structured access logs
    -> Response time measurement
    -> Basic security headers
    -> Request size limit
    -> Route policy configuration
    -> Protected product route:
      -> API key authentication
      -> Redis-backed rate limiting
      -> JWT authentication
      -> Redis response cache
      -> Request transform foundation
      -> Downstream timeout policy
      -> Upstream retry policy foundation
      -> Response transform foundation
      -> Normalized downstream error handling
      -> Product Service :3001 /products
        -> Prisma
        -> PostgreSQL public.products
        -> Database-backed Product response
    -> Public product service health proxy route:
      -> No API key
      -> No JWT
      -> No rate limit
      -> No cache
      -> Downstream timeout policy
      -> Product Service :3001 /health
    -> Internal/admin route management APIs:
      -> Admin API key authentication
      -> List route configs
      -> Read route config detail
      -> Create route config
      -> Update route config
      -> Enable/disable route config
      -> Soft delete route config
      -> Validate route config before persistence
      -> Validate active route configs through reload validation endpoint

API Gateway
  -> /metrics

Prometheus
  -> Scrapes API Gateway /metrics

Grafana
  -> Reads Prometheus datasource
  -> Displays PulseGate API Gateway Overview dashboard

GitHub Actions
  -> Validates npm ci, Prisma generate, tests, typecheck, build, and Docker image builds
```

Docker Compose flow:

```txt
Client
  -> localhost:3000
    -> API Gateway container
      -> PostgreSQL container for dynamic route config
      -> Redis container for rate limiting and caching
      -> Product Service container
        -> PostgreSQL container for product data

Admin Client / Future Admin Dashboard
  -> localhost:3000/internal/admin/routes
    -> API Gateway container
      -> PostgreSQL container gateway.gateway_routes

Prometheus container
  -> Scrapes API Gateway container

Grafana container
  -> Reads Prometheus container
```

Latest stable Sprint 10 commits:

```txt
8052742 feat(gateway): add route config soft delete
1f7443d feat(gateway): add route config reload validation
```

Latest stable Sprint 9 commits:

```txt
2e0faee feat(gateway): add admin route config read api
0d6aa66 feat(gateway): add route config create api
7a828ba feat(gateway): add route config update api
4f660d6 chore(gateway): document admin route config env
```

Latest stable Sprint 8 commits:

```txt
01a32ac feat(gateway): add route config database schema
ff105f6 feat(gateway): seed route config data
a1785dc feat(gateway): map database route configs
6f67cb7 feat(gateway): load runtime route configs with fallback
951139c chore(gateway): configure database route config runtime
6d8f6ab docs: finalize sprint 8 documentation
```

Latest stable Sprint 7 commits:

```txt
f825b61 refactor(gateway): add generic downstream proxy route
2e65849 feat(gateway): add product service health route config
db97b76 feat(gateway): register downstream routes from config
ae96ab3 test(gateway): cover product service health proxy route
41fed83 docs: finalize sprint 7 documentation
```

Latest stable Sprint 6 commits:

```txt
b2b8929 ci: add github actions workflow
e102aa0 ci: add docker image build validation
d06e0e7 docs: add ci badge to readme
0f83248 docs: finalize sprint 6 documentation
```

Latest stable Sprint 5 commits:

```txt
9138e16 feat(gateway): add route policy type foundation
dbd2607 feat(gateway): validate route policy configuration
6bf7eb1 feat(gateway): add per-route timeout policy helper
75d63f7 feat(gateway): add per-route cache policy helper
7480632 feat(gateway): add per-route rate limit policy helper
13ee083 feat(gateway): add request transformation policy foundation
57bdd38 feat(gateway): add response transformation policy foundation
806022a feat(gateway): add upstream retry policy foundation
84b3fed test(gateway): cover route policy integration behavior
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
* Policy foundation before Admin UI.
* Static route config fallback before dynamic database route config rollout.
* Database-backed config before Admin Dashboard.
* Backend route management APIs before Admin Dashboard.
* Validation-only reload endpoint before true hot reload.
* Restart-based route application before hot reload.
* GitHub-ready documentation.
* Reproducible infrastructure through configuration files.

---

## License

This project is licensed under the MIT License.