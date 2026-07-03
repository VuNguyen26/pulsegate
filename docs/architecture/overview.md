# PulseGate Architecture Overview

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

## Current Version

v0.14.0

## Current Status

Sprint 13 - API Consumer and API Key Lifecycle Foundation Complete

Current validation:

- 36 test files passed
- 256 tests passed
- npm run typecheck passed
- npm run build passed
- Docker runtime validation passed
- GitHub Actions CI passing

---

## Architecture Scope

This document describes the current architecture only.

Detailed sprint history lives in:

- docs/sdlc/sprint-history/

Manual validation commands live in:

- docs/runbooks/

Long decision records live in:

- docs/project-context/decisions/

---

## Product Goal

PulseGate is a local-first API Gateway, API Management, and Observability Platform inspired by:

- Kong
- Apache APISIX
- Tyk
- Apigee
- AWS API Gateway

PulseGate is designed to demonstrate backend engineering around:

- API Gateway routing
- Microservice communication
- Dynamic route configuration
- Runtime route reload
- API consumer management
- Issued API key lifecycle
- DB-backed API key authentication
- Traffic protection
- Observability
- CI/CD
- Production-oriented backend architecture

---

## Current High-Level Architecture

Current runtime system:

- Client or API consumer
- PulseGate API Gateway
- Product Service
- PostgreSQL
- Redis
- Prometheus
- Grafana
- GitHub Actions CI

Runtime flow:

    Client / API Consumer
      -> API Gateway :3000
        -> Request ID
        -> Structured access log timer
        -> Metrics timer
        -> Security headers
        -> Request size limit
        -> Runtime route registry lookup
        -> Route policy resolution
        -> DB-backed API key auth or env API key fallback
        -> Redis-backed rate limit when enabled
        -> JWT auth when required
        -> Redis response cache when enabled
        -> Shared downstream proxy pipeline
      -> Product Service :3001
      -> PostgreSQL / Redis / Prometheus / Grafana

---

## Current Infrastructure

Docker Compose services:

- api-gateway
- product-service
- postgres
- redis
- prometheus
- grafana

Ports:

- API Gateway -> 3000
- Product Service -> 3001
- Grafana -> 3002
- PostgreSQL -> 5432
- Redis -> 6379
- Prometheus -> 9090

---

## Data Ownership

Product Service owns product data.

    PostgreSQL public schema
      -> public.products
      -> public._prisma_migrations

API Gateway owns gateway and API management data.

    PostgreSQL gateway schema
      -> gateway.gateway_routes
      -> gateway.api_consumers
      -> gateway.api_keys
      -> gateway._prisma_migrations

Reason:

- Product Service should own product data.
- API Gateway should own route config, API consumers, and API keys.
- Separate schemas avoid Prisma migration ownership conflicts.
- Gateway auth and route management should not depend on downstream service data models.

---

## API Gateway Responsibilities

API Gateway currently handles:

- Public health endpoint.
- Prometheus metrics endpoint.
- Product proxy endpoint.
- Product Service health proxy endpoint.
- Catch-all dynamic dispatcher for /api/*.
- Startup route config loading.
- Static route config fallback.
- Runtime route registry.
- Runtime reload.
- Shared downstream proxy pipeline.
- API key authentication.
- DB-backed issued API key verification.
- Env API_KEYS fallback.
- JWT authentication.
- Redis-backed rate limiting.
- Redis response cache.
- Request transform foundation.
- Response transform foundation.
- Timeout policy.
- Retry policy foundation.
- Downstream error normalization.
- Internal/admin route management APIs.
- Internal/admin API consumer APIs.
- Internal/admin API key lifecycle APIs.
- Structured access logs.
- Prometheus metrics.

---

## Product Service Responsibilities

Product Service currently handles:

- GET /health
- GET /products
- PostgreSQL-backed product data
- Prisma Client access
- Request ID reuse
- Basic service-level error handling

Current seeded products:

- prod_001 - Mechanical Keyboard - 120
- prod_002 - Gaming Mouse - 45

---

## Startup Route Config Loading

Startup flow:

    API Gateway process starts
      -> loadRuntimeDownstreamRouteConfigs()
      -> try loading active DB routes from gateway.gateway_routes
      -> active means enabled=true and deleted_at IS NULL
      -> map DB records to DownstreamRouteConfig
      -> validate mapped route configs
      -> use DB routes when valid and non-empty
      -> fall back to static downstreamRouteConfigs when DB load fails or returns empty
      -> create runtime route registry
      -> register known startup routes
      -> register catch-all dynamic router for /api/*
      -> wire DB-backed API key middleware into downstream proxy
      -> connect Redis
      -> listen on port 3000

Static fallback routes:

- GET /api/products
- GET /api/product-service/health

---

## Runtime Route Registry

Runtime registry purpose:

- Keep an in-memory snapshot of active route configs.
- Allow existing registered routes to resolve latest config per request.
- Allow catch-all dynamic router to resolve brand-new /api/* routes.
- Allow admin reload to apply route config changes without unsafe Fastify route mutation.
- Validate replacement route configs before changing the active snapshot.

Registry capabilities:

- getSnapshot()
- replaceRoutes(routes)
- findRoute(method, gatewayPath)

Snapshot fields:

- version
- loadedAt
- routeCount
- routes

Important safety rule:

PulseGate does not dynamically unregister or register arbitrary Fastify routes at runtime.

Instead:

- Fastify route table stays stable.
- Runtime registry stores active route config.
- Existing registered routes read from the registry.
- The stable /api/* catch-all route dispatches new DB-backed paths through registry lookup.

---

## Catch-All Dynamic Router

Dynamic router scope:

- /api/*

Supported methods:

- GET
- POST
- PUT
- PATCH
- DELETE

Dynamic route flow:

    Client
      -> GET /api/new-runtime-path
      -> Fastify matches /api/* catch-all route
      -> Dynamic router extracts method and request path
      -> Runtime registry lookup by exact method + exact path
      -> If route does not exist, return 404 ROUTE_NOT_FOUND
      -> If route exists, use shared downstream proxy pipeline

Current dynamic route capability:

- Brand-new DB-backed /api/* routes can work after POST /internal/admin/routes/reload.
- API Gateway restart is not required after successful reload.

Current limitation:

- Exact method + exact path matching only.
- Path parameters are not implemented yet.
- Wildcard upstream path mapping is not implemented yet.
- Host-based routing is not implemented yet.
- Weighted upstreams are not implemented yet.
- Service discovery is not implemented yet.

---

## Shared Downstream Proxy Pipeline

The shared proxy pipeline applies route behavior from the latest runtime route config.

Pipeline:

    Runtime route lookup
      -> API key policy
      -> DB-backed API key verifier or env API_KEYS fallback
      -> Redis-backed rate limit policy
      -> JWT policy
      -> Redis response cache policy
      -> Request transform foundation
      -> Timeout policy
      -> Retry policy foundation
      -> Downstream fetch
      -> Response transform foundation
      -> Normalized downstream errors

The same pipeline is used by:

- Startup registered downstream routes.
- Catch-all dynamic /api/* routes.

---

## API Consumer and API Key Architecture

Sprint 13 added API consumer and API key lifecycle foundation.

API consumers:

    gateway.api_consumers

Consumer statuses:

- ACTIVE
- DISABLED

API keys:

    gateway.api_keys

API key statuses:

- ACTIVE
- REVOKED

API key storage rule:

- Raw API keys are never persisted.
- keyHash is persisted.
- keyPrefix is persisted.
- rawKey is returned only once during issue response.
- keyHash is never exposed in API responses.

Runtime DB-backed API key auth flow:

    Incoming x-api-key
      -> hash raw key
      -> lookup gateway.api_keys by keyHash
      -> include related consumer
      -> check key status
      -> check consumer status
      -> check expiresAt
      -> update lastUsedAt best-effort
      -> attach request.apiKeyId and request.apiConsumerId when valid

Invalid DB-backed states:

- API key status is REVOKED.
- API key is expired.
- API consumer status is DISABLED.

Important security rule:

If a DB-backed key is found but revoked, expired, or belongs to a disabled consumer, PulseGate rejects the request and does not fall back to env API_KEYS.

Env fallback is used only when:

- DB key is not found.
- DB lookup is unavailable.
- DB lookup is intentionally skipped in local/dev mode.

---

## Route Management Architecture

Internal/admin route management endpoints:

- GET /internal/admin/routes
- GET /internal/admin/routes/runtime
- GET /internal/admin/routes/:id
- POST /internal/admin/routes
- PATCH /internal/admin/routes/:id
- DELETE /internal/admin/routes/:id
- POST /internal/admin/routes/reload

Current behavior:

- Protected by x-admin-api-key.
- Supports optional x-admin-actor.
- Lists non-deleted route configs.
- Reads non-deleted route config detail.
- Creates route configs.
- Updates route configs.
- Enables and disables routes through PATCH.
- Soft deletes routes through DELETE.
- Validates route configs before persistence.
- Rejects duplicate active method + gatewayPath.
- Reloads active DB routes into runtime registry.

Soft delete behavior:

- Sets enabled=false.
- Sets deleted_at.
- Sets deleted_by.
- Sets updated_by.
- Excludes route from admin list/detail.
- Excludes route from runtime loading.
- Allows recreating the same method + gatewayPath because uniqueness applies only to active non-deleted routes.

---

## API Consumer and API Key Admin APIs

Internal/admin consumer endpoints:

- GET /internal/admin/consumers
- POST /internal/admin/consumers
- GET /internal/admin/consumers/:id
- PATCH /internal/admin/consumers/:id

Internal/admin API key endpoints:

- GET /internal/admin/consumers/:consumerId/api-keys
- POST /internal/admin/consumers/:consumerId/api-keys
- PATCH /internal/admin/api-keys/:id/revoke

Current behavior:

- All endpoints require x-admin-api-key.
- Consumer creation requires name.
- Consumer status defaults to ACTIVE.
- API key issue returns rawKey once.
- API key list does not expose rawKey.
- API key list does not expose keyHash.
- API key revoke sets status=REVOKED.
- API key revoke sets revokedAt and revokedBy.

---

## Route Policy Model

Current route policy model:

- auth
- timeout
- cache
- rateLimit
- requestTransform
- responseTransform
- retry

Current protected product route:

- GET /api/products
- Requires API key.
- Requires JWT.
- Uses Redis-backed rate limit.
- Uses Redis response cache.
- Proxies to Product Service GET /products on cache MISS.

Current public health proxy route:

- GET /api/product-service/health
- Does not require API key.
- Does not require JWT.
- Does not use Redis rate limit.
- Does not use Redis response cache.
- Proxies to Product Service GET /health.

Dynamic DB-backed routes use the same policy model.

---

## Observability Architecture

Current observability layers:

- Request ID propagation.
- Structured access logs.
- x-response-time-ms response header.
- Prometheus metrics registry.
- GET /metrics endpoint.
- Prometheus Docker service.
- Grafana Docker service.
- Provisioned Grafana datasource.
- Provisioned API Gateway dashboard.

Current metrics:

- http_requests_total
- http_request_duration_seconds
- http_response_cache_total

Current Grafana dashboard:

- PulseGate API Gateway Overview

Current limitation:

- Per-consumer and per-API-key usage metrics are not implemented yet.

---

## CI/CD Architecture

GitHub Actions validates:

- npm ci
- Product Service Prisma Client generation.
- API Gateway Prisma Client generation.
- npm run test
- npm run typecheck
- npm run build
- API Gateway Docker image build
- Product Service Docker image build

Current limitations:

- CI does not run full Docker Compose runtime stack yet.
- CI does not push Docker images to a registry yet.
- CI does not deploy automatically yet.

---

## Current Important Files

API Gateway:

- apps/api-gateway/src/app.ts
- apps/api-gateway/src/server.ts
- apps/api-gateway/src/proxy/downstream-proxy-handler.ts
- apps/api-gateway/src/routes/product-proxy.route.ts
- apps/api-gateway/src/routes/admin-route-config.route.ts
- apps/api-gateway/src/routes/admin-consumer.route.ts
- apps/api-gateway/src/routes/admin-api-key.route.ts
- apps/api-gateway/src/runtime/route-runtime-registry.ts
- apps/api-gateway/src/api-consumers/
- apps/api-gateway/src/api-keys/
- apps/api-gateway/src/route-management/
- apps/api-gateway/prisma/schema.prisma

Product Service:

- apps/product-service/src/server.ts
- apps/product-service/src/routes/product.route.ts
- apps/product-service/src/products/product.repository.ts
- apps/product-service/prisma/schema.prisma

Infrastructure:

- docker-compose.yml
- observability/prometheus/prometheus.yml
- observability/grafana/

---

## Current Limitations

- API key usage tracking is not implemented yet.
- Per-consumer analytics are not implemented yet.
- Per-key analytics are not implemented yet.
- Usage plans and quotas are not implemented yet.
- Admin Dashboard is not implemented yet.
- Developer Portal is not implemented yet.
- Route management audit log table is not implemented yet.
- Stronger admin auth and RBAC are not implemented yet.
- Dynamic router supports exact method + exact path matching only.
- Path parameters are not implemented yet.
- Wildcard upstream mapping is not implemented yet.
- Host-based routing is not implemented yet.
- Weighted upstreams are not implemented yet.
- Service discovery is not implemented yet.
- Rate limit identity still uses raw API key value.
- Grafana does not yet include per-consumer or per-key usage dashboards.
- OpenTelemetry tracing is not implemented yet.
- Loki centralized logging is not implemented yet.
- k6 load testing is not implemented yet.
- Kafka and RabbitMQ are not implemented yet.
- Kubernetes and cloud deployment are planned for later.

---

## Recommended Next Architecture Step

Sprint 14 - API Key Usage Tracking and Consumer Analytics Foundation

Recommended direction:

- Add API usage event or aggregate table.
- Record apiKeyId, consumerId, route, method, statusCode, durationMs, and timestamp.
- Support env fallback traffic safely.
- Expose admin read API for consumer usage summary.
- Expose admin read API for API key usage summary.
- Prepare usage plans and quotas for later.
