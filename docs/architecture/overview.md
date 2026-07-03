# PulseGate Architecture Overview

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

## Current Version

v0.15.0

## Current Status

Sprint 14 - API Key Usage Tracking and Consumer Analytics Foundation Complete

Current validation:

- 40 test files passed
- 270 tests passed
- npm run typecheck passed
- npm run build passed
- Docker runtime validation passed

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

PulseGate demonstrates backend engineering around:

- API Gateway routing
- Microservice communication
- Dynamic route configuration
- Runtime route reload
- API consumer management
- Issued API key lifecycle
- DB-backed API key authentication
- API usage tracking
- Consumer and API key analytics
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
        -> API usage recorder after successful proxy response
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
      -> gateway.api_usage_events
      -> gateway._prisma_migrations

Reason:

- Product Service owns product data.
- API Gateway owns route config, API consumers, issued API keys, and usage events.
- Separate schemas avoid Prisma migration ownership conflicts.
- Gateway auth, route management, and API management should not depend on downstream service data models.

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
- API usage event recording.
- Consumer usage summary.
- API key usage summary.
- Request transform foundation.
- Response transform foundation.
- Timeout policy.
- Retry policy foundation.
- Downstream error normalization.
- Internal/admin route management APIs.
- Internal/admin API consumer APIs.
- Internal/admin API key lifecycle APIs.
- Internal/admin API usage summary APIs.
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

Important safety rule:

PulseGate does not dynamically unregister or register arbitrary Fastify routes at runtime.

Instead:

- Fastify route table stays stable.
- Runtime registry stores active route config.
- Existing registered routes read from the registry.
- The stable /api/* catch-all route dispatches new DB-backed paths through registry lookup.

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
      -> API usage recorder
      -> Normalized downstream errors

The same pipeline is used by:

- Startup registered downstream routes.
- Catch-all dynamic /api/* routes.

---

## API Consumer and API Key Architecture

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

Important security rule:

If a DB-backed key is found but revoked, expired, or belongs to a disabled consumer, PulseGate rejects the request and does not fall back to env API_KEYS.

---

## API Usage Tracking Architecture

Sprint 14 added the API usage tracking foundation.

Usage table:

    gateway.api_usage_events

Usage event fields:

- requestId
- routePath
- routeMethod
- statusCode
- durationMs
- cacheStatus
- apiKeyAuthSource
- apiKeyId
- consumerId
- occurredAt

Relations:

- ApiUsageEvent -> ApiKey
- ApiUsageEvent -> ApiConsumer
- ApiKey -> usageEvents
- ApiConsumer -> apiUsageEvents

Usage recorder behavior:

- Records successful downstream proxy handler responses.
- Records DB-backed API key traffic with apiKeyId and consumerId.
- Records env fallback traffic without apiKeyId and consumerId.
- Records cache status HIT, MISS, or BYPASS.
- Records response status code and durationMs.
- Usage recorder failure does not fail the client response.

Current usage recording limitation:

- Missing API key requests are not tracked yet.
- Invalid API key requests are not tracked yet.
- Missing JWT requests are not tracked yet.
- Invalid JWT requests are not tracked yet.
- Rate-limited requests are not tracked yet.
- Usage tracking is event-based only.
- No aggregate rollup table yet.

---

## Admin Usage Summary Architecture

Admin usage summary endpoints:

- GET /internal/admin/usage/consumers/:consumerId/summary
- GET /internal/admin/usage/api-keys/:apiKeyId/summary

Both endpoints require:

- x-admin-api-key

Consumer summary behavior:

- Verifies consumer exists.
- Returns 404 API_CONSUMER_NOT_FOUND when missing.
- Returns usage summary for consumerId.

API key summary behavior:

- Verifies API key exists.
- Returns 404 API_KEY_NOT_FOUND when missing.
- Returns usage summary for apiKeyId.

Summary fields:

- subjectType
- subjectId
- totalRequests
- successfulRequests
- errorRequests
- averageDurationMs
- cacheHits
- cacheMisses
- cacheBypasses
- lastRequestAt

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
- Records API usage event after successful proxy response.

Current public health proxy route:

- GET /api/product-service/health
- Does not require API key.
- Does not require JWT.
- Does not use Redis rate limit.
- Does not use Redis response cache.
- Proxies to Product Service GET /health.
- Records API usage event with no apiKeyId and no consumerId.

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
- API usage event table for API management analytics.

Current metrics:

- http_requests_total
- http_request_duration_seconds
- http_response_cache_total

Current Grafana dashboard:

- PulseGate API Gateway Overview

Current limitation:

- Grafana does not yet show per-consumer or per-key usage panels.

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

API usage tracking:

- apps/api-gateway/prisma/schema.prisma
- apps/api-gateway/prisma/migrations/20260703150000_add_api_usage_events/migration.sql
- apps/api-gateway/src/api-usage/api-usage-recorder.ts
- apps/api-gateway/src/api-usage/api-usage-summary.repository.ts
- apps/api-gateway/src/api-usage/api-usage-summary.mapper.ts
- apps/api-gateway/src/api-usage/api-usage-summary.types.ts
- apps/api-gateway/src/routes/admin-api-usage.route.ts
- apps/api-gateway/src/proxy/downstream-proxy-handler.ts

API Gateway core:

- apps/api-gateway/src/app.ts
- apps/api-gateway/src/server.ts
- apps/api-gateway/src/routes/product-proxy.route.ts
- apps/api-gateway/src/routes/admin-route-config.route.ts
- apps/api-gateway/src/routes/admin-consumer.route.ts
- apps/api-gateway/src/routes/admin-api-key.route.ts
- apps/api-gateway/src/runtime/route-runtime-registry.ts
- apps/api-gateway/src/api-consumers/
- apps/api-gateway/src/api-keys/

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

- Failed authentication requests are not tracked yet.
- Rate-limited requests are not tracked yet.
- Usage data is event-based only.
- No aggregate rollup table yet.
- No retention policy yet.
- No usage plan model yet.
- No quota enforcement yet.
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
- OpenTelemetry tracing is not implemented yet.
- Loki centralized logging is not implemented yet.
- k6 load testing is not implemented yet.
- Kafka and RabbitMQ are not implemented yet.
- Kubernetes and cloud deployment are planned for later.

---

## Recommended Next Architecture Step

Sprint 15 - Usage Plans and Quota Foundation

Recommended direction:

- Add usage plan schema.
- Attach consumers or API keys to usage plans.
- Define quota windows.
- Prepare quota counters.
- Start enforcing simple quota limits.
- Keep API usage event tracking as source of truth.
