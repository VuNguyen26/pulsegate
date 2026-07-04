# PulseGate Architecture Overview

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

## Current Version

v0.19.0

## Current Status

Sprint 18 - Advanced Usage Analytics and Rejected Event Drilldown Complete

Current validation:

- 55 test files passed
- 362 tests passed
- npm run typecheck passed
- npm run build passed
- Docker runtime rejected events listing and filtered summary validation passed

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
- Usage plans and quota enforcement
- Quota observability
- Rejected request tracking
- Rejected events observability and drilldown
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
        -> Usage quota check when DB-backed key has an enabled usage plan
        -> Rejected event recording when auth, rate limit, or quota rejects the request
        -> Redis response cache when enabled
        -> Shared downstream proxy pipeline
        -> API usage recorder after successful proxy/cache response
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
      -> gateway.usage_plans
      -> gateway.api_usage_events
      -> gateway.api_rejected_events
      -> gateway._prisma_migrations

Reason:

- Product Service owns product data.
- API Gateway owns route config, API consumers, issued API keys, usage plans, usage events, and rejected request events.
- Separate schemas avoid Prisma migration ownership conflicts.
- Gateway auth, route management, API management, quota, and analytics should not depend on downstream service data models.

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
- Usage plan management.
- API key usage plan assignment.
- Event-based quota evaluation.
- Runtime quota enforcement.
- API key quota state calculation.
- Usage plan usage summary calculation.
- 429 quota metadata responses.
- Redis-backed rate limiting.
- Redis response cache.
- API usage event recording.
- API rejected event recording.
- Consumer usage summary.
- API key usage summary.
- Rejected events summary.
- Filtered rejected events summary.
- Rejected events raw listing.
- Request transform foundation.
- Response transform foundation.
- Timeout policy.
- Retry policy foundation.
- Downstream error normalization.
- Internal/admin route management APIs.
- Internal/admin API consumer APIs.
- Internal/admin API key lifecycle APIs.
- Internal/admin usage plan APIs.
- Internal/admin API usage summary APIs.
- Internal/admin rejected event APIs.
- Internal/admin quota observability APIs.
- Structured access logs.
- Prometheus metrics.

---

## Shared Downstream Proxy Pipeline

The shared proxy pipeline applies route behavior from the latest runtime route config.

Pipeline:

    Runtime route lookup
      -> API key policy
      -> DB-backed API key verifier or env API_KEYS fallback
      -> Redis-backed rate limit policy
      -> JWT policy
      -> Usage quota policy
      -> Rejected event recorder for auth, rate limit, and quota rejections
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

API key usage plan assignment:

- api_keys.usage_plan_id references gateway.usage_plans.
- Assignment is optional.
- Unassigned API keys are not quota-enforced.
- Assigned API keys are quota-enforced when the usage plan is enabled.

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

## Usage Plan and Quota Architecture

Usage plan table:

    gateway.usage_plans

Quota windows:

- DAILY
- MONTHLY

Quota enforcement behavior:

- Applies only to DB-backed API keys.
- Applies only when the API key has usagePlanId.
- Applies only when the usage plan is enabled.
- Env fallback API keys are not quota-enforced.
- Public routes without API keys are not quota-enforced.
- Disabled usage plans currently skip quota enforcement.
- When quota is exceeded, PulseGate returns 429 QUOTA_EXCEEDED.

Quota evaluation:

- Uses gateway.api_usage_events as the source of truth.
- Counts API usage events for the current quota window.
- DAILY windows use UTC day boundaries.
- MONTHLY windows use UTC month boundaries.
- If usedRequests >= quotaLimit, the request is rejected before cache/proxy execution.

429 quota response metadata:

- quotaLimit
- quotaWindow
- usedRequests
- remainingRequests
- windowStartedAt
- windowEndsAt
- resetAt

Current quota limitation:

- Redis quota counters are not implemented yet.
- Aggregate rollup tables are not implemented yet.

---

## API Usage Tracking Architecture

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

Usage recorder behavior:

- Records successful downstream proxy/cache handler responses.
- Records DB-backed API key traffic with apiKeyId and consumerId.
- Records env fallback traffic without apiKeyId and consumerId.
- Records cache status HIT, MISS, or BYPASS.
- Records response status code and durationMs.
- Usage recorder failure does not fail the client response.

Current usage recording limitation:

- Usage tracking is event-based only.
- No aggregate rollup table yet.
- Rejected requests are intentionally tracked in gateway.api_rejected_events instead of gateway.api_usage_events.

---

## API Rejected Event Architecture

Rejected event table:

    gateway.api_rejected_events

Tracked rejection reasons:

- API_KEY_MISSING
- API_KEY_INVALID
- JWT_TOKEN_MISSING
- JWT_TOKEN_INVALID
- RATE_LIMIT_EXCEEDED
- QUOTA_EXCEEDED

Rejected event behavior:

- Records failed API key auth.
- Records failed JWT auth.
- Records rate-limited requests.
- Records quota-denied requests.
- Stores route, method, status, reason, request id, auth source, API key id, consumer id, and occurredAt when available.
- Does not store raw API keys, JWTs, or Authorization headers.
- Does not write rejected requests into gateway.api_usage_events.

Admin rejected event endpoints:

- GET /internal/admin/api-rejections/summary
- GET /internal/admin/api-rejections/events

Summary endpoint:

- Returns total rejected requests.
- Returns counts grouped by rejection reason.
- Returns counts grouped by status code.
- Returns lastRejectedAt.
- Supports filters.

Listing endpoint:

- Returns raw rejected event rows.
- Supports safe pagination with limit, offset, total, and hasNextPage.
- Supports filters by from, to, rejectionReason, statusCode, routePath, routeMethod, apiKeyAuthSource, apiKeyId, and consumerId.
- Sorts by occurredAt desc and id desc.
- Rejects invalid query values with 400 INVALID_QUERY_PARAMETER.

---

## Admin Usage Summary Architecture

Admin usage summary endpoints:

- GET /internal/admin/usage/consumers/:consumerId/summary
- GET /internal/admin/usage/api-keys/:apiKeyId/summary

Both endpoints require:

- x-admin-api-key

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

## Quota Observability Architecture

API key quota state endpoint:

- GET /internal/admin/api-keys/:id/quota

Usage plan usage summary endpoint:

- GET /internal/admin/usage-plans/:id/usage-summary

Behavior:

- Uses current quota window boundaries.
- Counts usage from gateway.api_usage_events.
- Keeps api_usage_events as source of truth for successful/proxied usage.
- Keeps rejected requests in gateway.api_rejected_events.

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
- Uses runtime quota check for DB-backed API keys with usage plans.
- Uses Redis response cache.
- Proxies to Product Service GET /products on cache MISS.
- Records API usage event after successful proxy/cache response.

Current public health proxy route:

- GET /api/product-service/health
- Does not require API key.
- Does not require JWT.
- Does not use Redis rate limit.
- Does not use Redis response cache.
- Does not enforce quota.
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
- API rejected event table for rejected/security traffic analytics.
- Admin usage summary APIs.
- Admin rejected event summary and listing APIs.
- Admin quota state and usage plan summary APIs.

Current metrics:

- http_requests_total
- http_request_duration_seconds
- http_response_cache_total

Current Grafana dashboard:

- PulseGate API Gateway Overview

Current limitation:

- Grafana does not yet show per-consumer, per-key, quota usage, or rejected event panels.

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

Rejected events:

- apps/api-gateway/prisma/schema.prisma
- apps/api-gateway/src/api-rejections/api-rejected-event-recorder.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-summary.types.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-summary.mapper.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-summary.repository.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-listing.types.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-listing.mapper.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-listing.repository.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-listing-query.ts
- apps/api-gateway/src/routes/admin-api-rejection.route.ts

API Gateway core:

- apps/api-gateway/src/app.ts
- apps/api-gateway/src/server.ts
- apps/api-gateway/src/routes/product-proxy.route.ts
- apps/api-gateway/src/routes/admin-route-config.route.ts
- apps/api-gateway/src/routes/admin-consumer.route.ts
- apps/api-gateway/src/routes/admin-api-key.route.ts
- apps/api-gateway/src/routes/admin-usage-plan.route.ts
- apps/api-gateway/src/runtime/route-runtime-registry.ts
- apps/api-gateway/src/api-consumers/
- apps/api-gateway/src/api-keys/
- apps/api-gateway/src/usage-plans/

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

- Usage data is event-based only.
- Rejected event analytics is event-based only.
- No aggregate rollup table yet.
- No retention policy yet.
- No cursor pagination for very large event datasets yet.
- Disabled usage plans currently skip quota enforcement.
- Env fallback API keys are not quota-enforced.
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

Sprint 19 - Usage Analytics Hardening and Retention/Rollup Design

Recommended direction:

- Add time-range and filter support to successful usage analytics.
- Evaluate retention policy for usage and rejected events.
- Design aggregate rollups for high-volume analytics.
- Consider Grafana panels for quota, usage, and rejected traffic.
- Keep successful usage events and rejected/security events clearly separated.
