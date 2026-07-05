# PulseGate Architecture Overview

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

## Current Version

v0.24.0

## Current Status

Sprint 23 - Analytics Rollup Persistence Foundation Complete

Current validation:

- 67 test files passed
- 461 tests passed
- npm run typecheck passed
- npm run build passed
- Prisma schema validate passed
- Shadow database migration deploy passed for all API Gateway migrations, including analytics rollup tables

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

PulseGate is a local-first API Gateway, API Management, and Observability Platform inspired by Kong, Apache APISIX, Tyk, Apigee, and AWS API Gateway.

PulseGate demonstrates backend engineering around API Gateway routing, dynamic route configuration, API consumer management, DB-backed API keys, usage plans, quota enforcement, successful usage analytics, rejected request analytics, observability, analytics rollup foundations, and CI/CD.

---

## Current High-Level Architecture

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

Analytics rollup foundation flow:

    Raw usage/rejected-shaped events
      -> UTC time bucket helper
      -> rollup window planner
      -> usage or rejected aggregate builder
      -> dimension hash builder
      -> usage or rejected rollup repository
      -> analytics rollup persistence service
      -> future backfill or background job

Sprint 23 did not connect rollup persistence to runtime APIs, quota counting, retention, or background jobs.

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

Product Service owns:

- public.products
- public._prisma_migrations

API Gateway owns:

- gateway.gateway_routes
- gateway.api_consumers
- gateway.api_keys
- gateway.usage_plans
- gateway.api_usage_events
- gateway.api_rejected_events
- gateway.api_usage_rollups
- gateway.api_rejected_rollups
- gateway._prisma_migrations

---

## API Gateway Responsibilities

API Gateway currently handles:

- Public health and metrics endpoints.
- Product Service proxy routes.
- Catch-all dynamic dispatcher for /api/*.
- Startup route config loading and runtime reload.
- Shared downstream proxy pipeline.
- DB-backed issued API key verification.
- Env API_KEYS fallback.
- JWT authentication.
- Usage plan management and API key assignment.
- Event-based quota evaluation and runtime quota enforcement.
- API key quota state and usage plan usage summary.
- Redis-backed rate limiting and response caching.
- API usage event recording.
- API rejected event recording.
- Consumer and API key usage summaries with filters.
- Successful usage event raw listing with filters, offset pagination, and cursor pagination.
- Rejected events summary and raw listing with filters, offset pagination, and cursor pagination.
- Analytics rollup calculation and persistence foundations under apps/api-gateway/src/analytics.
- Internal/admin route, consumer, API key, usage plan, usage analytics, rejected event, and quota APIs.
- Structured access logs and Prometheus metrics.

---

## API Usage Tracking and Analytics Architecture

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

Admin usage analytics endpoints:

- GET /internal/admin/usage/events
- GET /internal/admin/usage/consumers/:consumerId/summary
- GET /internal/admin/usage/api-keys/:apiKeyId/summary

Usage event listing behavior:

- Returns raw successful usage event rows from gateway.api_usage_events.
- Supports offset pagination with limit, offset, total, and hasNextPage.
- Supports cursor pagination with nextCursor for large event investigation.
- Default limit is 20.
- Maximum limit is 100.
- Sorts by occurredAt desc and id desc.
- Cursor pagination uses occurredAt and id from the last item in the current page.
- offset cannot be used together with cursor.
- Supports filters by from, to, routePath, routeMethod, statusCode, cacheStatus, apiKeyAuthSource, apiKeyId, and consumerId.
- Invalid query values return 400 INVALID_QUERY_PARAMETER.
- Does not expose raw API keys, JWTs, or Authorization headers.

Usage summary behavior:

- Summaries still read from gateway.api_usage_events.
- Supported filters include from, to, routePath, routeMethod, statusCode, cacheStatus, and apiKeyAuthSource.
- Invalid query values return 400 INVALID_QUERY_PARAMETER.
- routeMethod is normalized to uppercase.
- cacheStatus is normalized to HIT, MISS, or BYPASS.

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

Admin rejected event endpoints:

- GET /internal/admin/api-rejections/summary
- GET /internal/admin/api-rejections/events

Rejected listing behavior:

- Returns raw rejected event rows.
- Supports offset pagination with limit, offset, total, and hasNextPage.
- Supports cursor pagination with nextCursor for large rejected event investigation.
- Supports filters by from, to, rejectionReason, statusCode, routePath, routeMethod, apiKeyAuthSource, apiKeyId, and consumerId.
- Sorts by occurredAt desc and id desc.
- Cursor pagination uses occurredAt and id from the last item in the current page.
- offset cannot be used together with cursor.
- Rejected events summary rejects cursor because cursor is only meaningful for raw event listing.
- Rejects invalid query values with 400 INVALID_QUERY_PARAMETER.
- Does not write rejected requests into gateway.api_usage_events.

---

## Analytics Rollup Persistence Foundation Architecture

Rollup tables:

    gateway.api_usage_rollups
    gateway.api_rejected_rollups

Current files:

- apps/api-gateway/src/analytics/analytics-rollup-time-bucket.ts
- apps/api-gateway/src/analytics/analytics-rollup-window-plan.ts
- apps/api-gateway/src/analytics/analytics-usage-rollup-aggregate.ts
- apps/api-gateway/src/analytics/analytics-rejected-rollup-aggregate.ts
- apps/api-gateway/src/analytics/analytics-rollup-dimension-hash.ts
- apps/api-gateway/src/analytics/analytics-usage-rollup.repository.ts
- apps/api-gateway/src/analytics/analytics-rejected-rollup.repository.ts
- apps/api-gateway/src/analytics/analytics-rollup-persistence-service.ts

Current behavior:

- Rollup buckets are calculated in UTC.
- Supported granularities are hour and day.
- Window planner expands partial ranges to full bucket rebuild windows.
- Window planner supports maxBuckets guardrails.
- Usage aggregate builder groups raw usage events by bucket, consumer, API key, route, method, status class, cache status, and auth source.
- Rejected aggregate builder groups rejected events by bucket, consumer, API key, route, method, rejection reason, status code, and auth source.
- Dimension hashes are SHA-256 values built from stable rollup dimensions and exclude metrics.
- Usage and rejected rollups have separate repositories and separate persistence tables.
- Persistence uses upsert by dimensionHash to support idempotent rebuild behavior.

Current safety boundaries:

- No runtime API change.
- No summary API switch to rollup reads.
- No backfill command.
- No background job.
- No retention deletion.
- No quota checker change.
- No usage recorder change.
- No rejected event recorder change.

---

## Current Important Files

Analytics rollup foundation:

- apps/api-gateway/src/analytics/

API usage analytics:

- apps/api-gateway/prisma/schema.prisma
- apps/api-gateway/src/api-usage/
- apps/api-gateway/src/routes/admin-api-usage.route.ts

Rejected events:

- apps/api-gateway/src/api-rejections/
- apps/api-gateway/src/routes/admin-api-rejection.route.ts

Core:

- apps/api-gateway/src/app.ts
- apps/api-gateway/src/server.ts
- apps/api-gateway/src/proxy/downstream-proxy-handler.ts
- apps/api-gateway/src/routes/
- apps/api-gateway/src/runtime/
- apps/api-gateway/src/api-consumers/
- apps/api-gateway/src/api-keys/
- apps/api-gateway/src/usage-plans/

---

## Current Limitations

- Usage data is event-based at runtime.
- Rejected event analytics is event-based at runtime.
- Rollup tables and persistence repositories exist, but no backfill command uses them yet.
- Runtime summary APIs have not switched to rollup reads.
- No retention policy job yet.
- Disabled usage plans currently skip quota enforcement.
- Env fallback API keys are not quota-enforced.
- Admin Dashboard is not implemented yet.
- Developer Portal is not implemented yet.
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

Sprint 24 recommended direction:

- Analytics Rollup Backfill Command or Retention Safety Foundation

Rationale:

- Rollup persistence foundations now exist.
- The next step can safely add controlled backfill execution or retention dry-run planning without changing quota counting accidentally.
