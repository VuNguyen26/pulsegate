# PulseGate Architecture Overview

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

## Current Version

v0.27.0

## Current Status

Sprint 26 - Analytics Retention Safety Foundation Complete

Current validation:

- 80 test files passed
- 551 tests passed
- npm run typecheck passed
- npm run build passed
- Analytics retention dry-run command validation passed

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

PulseGate demonstrates backend engineering around API Gateway routing, dynamic route configuration, API consumer management, DB-backed API keys, usage plans, quota enforcement, successful usage analytics, rejected request analytics, observability, analytics rollup foundations, analytics retention safety foundations, and CI/CD.

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

Analytics rollup flow:

    Raw usage/rejected event tables
      -> manual backfill command
      -> UTC time bucket helper
      -> rollup window planner
      -> usage or rejected aggregate builder
      -> dimension hash builder
      -> usage or rejected rollup repository
      -> rollup tables
      -> read-only internal/admin rollup endpoint

Analytics retention dry-run flow:

    CLI args
      -> retention dry-run args parser
      -> retention policy parser
      -> dry-run retention plan
      -> read-only candidate count repository
      -> dry-run JSON preview

Rollup tables and retention dry-run are not used by quota counting or existing summary APIs.

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
- Analytics rollup calculation, persistence, manual backfill, and read model foundations.
- Analytics retention dry-run policy, candidate count, service, args parser, and command foundations.
- Internal/admin route, consumer, API key, usage plan, usage analytics, rejected event, quota, and rollup APIs.
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
- Sorts by occurredAt desc and id desc.
- Supports filters by from, to, routePath, routeMethod, statusCode, cacheStatus, apiKeyAuthSource, apiKeyId, and consumerId.
- Invalid query values return 400 INVALID_QUERY_PARAMETER.
- Does not expose raw API keys, JWTs, or Authorization headers.

Usage summary behavior:

- Summaries still read from gateway.api_usage_events.
- Supported filters include from, to, routePath, routeMethod, statusCode, cacheStatus, and apiKeyAuthSource.
- Invalid query values return 400 INVALID_QUERY_PARAMETER.

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
- Rejected events summary rejects cursor because cursor is only meaningful for raw event listing.
- Rejects invalid query values with 400 INVALID_QUERY_PARAMETER.
- Does not write rejected requests into gateway.api_usage_events.

---

## Analytics Rollup Architecture

Rollup tables:

    gateway.api_usage_rollups
    gateway.api_rejected_rollups

Current files:

- apps/api-gateway/src/analytics/
- apps/api-gateway/src/routes/admin-analytics-rollup.route.ts

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
- Manual backfill command can plan or execute controlled rebuilds.
- Read repositories expose rollup rows without changing existing summary APIs.
- GET /internal/admin/analytics/rollups reads usage or rejected rollups with admin API key protection.

Rollup read endpoint:

- Requires source=usage or source=rejected.
- Requires from, to, and granularity.
- Supports limit.
- Supports routePath, routeMethod, statusCode, apiKeyAuthSource, apiKeyId, and consumerId.
- Supports cacheStatus for usage rollups only.
- Supports rejectionReason for rejected rollups only.
- Maps statusCode to statusClass for usage rollup reads.
- Uses exact statusCode for rejected rollup reads.
- Rejects invalid query values with 400 INVALID_QUERY_PARAMETER.

---

## Analytics Retention Dry-Run Architecture

Current files:

- apps/api-gateway/src/analytics/analytics-retention-policy.ts
- apps/api-gateway/src/analytics/analytics-retention-candidate-read.repository.ts
- apps/api-gateway/src/analytics/analytics-retention-dry-run-service.ts
- apps/api-gateway/src/analytics/analytics-retention-dry-run-command-args.ts
- apps/api-gateway/src/analytics/analytics-retention-dry-run.command.ts

Current command:

    npm run analytics:retention:dry-run --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 90

Current behavior:

- Defaults to disabled dry-run planning.
- Supports source=usage, source=rejected, or source=both.
- Supports separate usage and rejected retention day windows.
- Enforces minimum retention day guardrails.
- Counts candidate rows older than computed cutoffs.
- Returns JSON preview with candidateCount.
- Always returns dryRunOnly=true and deleteAllowed=false.
- Rejects execute mode.
- Does not delete raw events.

---

## Current Important Files

Analytics foundation:

- apps/api-gateway/src/analytics/
- apps/api-gateway/src/routes/admin-analytics-rollup.route.ts

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

- Usage summary APIs still read raw events.
- Rejected summary APIs still read raw events.
- Rollup read endpoint exists, but summary APIs have not switched to rollup reads.
- Retention currently supports dry-run candidate counting only.
- No retention delete job is implemented yet.
- No scheduled/background rollup job yet.
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

Sprint 27 recommended direction:

- Analytics Retention Execution Guardrails

Rationale:

- Sprint 26 added dry-run-only retention planning, candidate counting, and a CLI preview command.
- The next step can add guarded execution design without changing quota semantics or deleting data without explicit operator intent.
