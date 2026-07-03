# Current Progress

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

## Document Scope

This file is intentionally compact.

CURRENT_PROGRESS.md should only track:

- Current project state.
- Latest completed sprint.
- Latest validation status.
- Current architecture summary.
- Known limitations.
- Recommended next step.

Detailed sprint history lives in:

- docs/sdlc/sprint-history/

Manual validation commands live in:

- docs/runbooks/

Long decision records live in:

- docs/project-context/decisions/

---

## Current Version

v0.14.0

---

## Latest Completed Sprint

Sprint 13 - API Consumer and API Key Lifecycle Foundation

Status:

Done.

Sprint 13 added the first API Management ownership layer:

- API consumers.
- Issued API keys.
- Hashed API key storage.
- Admin Consumer API.
- Admin API Key lifecycle API.
- DB-backed runtime API key authentication.
- API key revocation.
- API key expiration check.
- Disabled consumer rejection.
- API key last-used metadata.
- Env API_KEYS fallback for local/dev compatibility.

Sprint 13 details are archived in:

- docs/sdlc/sprint-history/sprint-13.md

---

## Current Checkpoint

Checkpoint 14.0 - Documentation Compaction and Archive Strategy

Status:

In progress.

Goal:

- Keep main docs compact.
- Move detailed sprint history to docs/sdlc/sprint-history/.
- Move long decision records to docs/project-context/decisions/.
- Move manual validation commands to docs/runbooks/.
- Prepare documentation structure before starting Sprint 14 code.

Decision record:

- docs/project-context/decisions/2026-07-03-documentation-compaction.md

---

## Latest Validation Status

Latest stable validation from Sprint 13:

- npm run test -> passed
- npm run typecheck -> passed
- npm run build -> passed
- Docker runtime validation -> passed
- GitHub Actions CI -> passing

Latest automated test result:

- 36 test files passed
- 256 tests passed

Latest Docker runtime validation proved:

- API consumer can be created.
- DB-backed API key can be issued.
- Issued DB-backed API key can call protected GET /api/products with JWT.
- Revoked DB-backed API key returns 403.
- Legacy dev-api-key env fallback still works.

---

## Current Architecture Summary

PulseGate currently has:

- Fastify API Gateway.
- Product Service.
- Docker Compose local infrastructure.
- PostgreSQL.
- Prisma.
- Redis.
- Prometheus.
- Grafana.
- GitHub Actions CI/CD.
- PostgreSQL-backed Product Service data.
- PostgreSQL-backed API Gateway route config.
- PostgreSQL-backed API consumers.
- PostgreSQL-backed issued API keys.
- Internal/admin route management APIs.
- Internal/admin API consumer APIs.
- Internal/admin API key lifecycle APIs.
- Runtime route registry.
- Runtime registry reload endpoint.
- Catch-all dynamic router for /api/*.
- Shared downstream proxy pipeline.
- DB-backed issued API key authentication.
- Static env API key fallback.
- JWT authentication.
- Redis-backed rate limiting.
- Redis response caching.
- Route policy foundation.
- Structured access logs.
- Prometheus metrics.
- Grafana dashboard.

---

## Current Infrastructure

Docker services:

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

## Current Database State

Database:

- PostgreSQL

Database name:

- pulsegate

Schemas:

- public
- gateway

Product Service tables:

- public._prisma_migrations
- public.products

API Gateway tables:

- gateway._prisma_migrations
- gateway.gateway_routes
- gateway.api_consumers
- gateway.api_keys

Current seeded Product Service data:

- prod_001 - Mechanical Keyboard - 120
- prod_002 - Gaming Mouse - 45

Current seeded Gateway routes:

- GET /api/products
- GET /api/product-service/health

---

## Current API Gateway Endpoints

Public:

- GET /health
- GET /metrics
- GET /api/product-service/health

Protected:

- GET /api/products

Dynamic dispatcher:

- GET /api/*
- POST /api/*
- PUT /api/*
- PATCH /api/*
- DELETE /api/*

Internal/admin route management:

- GET /internal/admin/routes
- GET /internal/admin/routes/runtime
- GET /internal/admin/routes/:id
- POST /internal/admin/routes
- PATCH /internal/admin/routes/:id
- DELETE /internal/admin/routes/:id
- POST /internal/admin/routes/reload

Internal/admin consumers:

- GET /internal/admin/consumers
- POST /internal/admin/consumers
- GET /internal/admin/consumers/:id
- PATCH /internal/admin/consumers/:id

Internal/admin API keys:

- GET /internal/admin/consumers/:consumerId/api-keys
- POST /internal/admin/consumers/:consumerId/api-keys
- PATCH /internal/admin/api-keys/:id/revoke

---

## Current Runtime Behavior

Startup route config loading:

- API Gateway tries to load active route configs from gateway.gateway_routes.
- Active route means enabled=true and deleted_at IS NULL.
- DB route records are mapped to runtime DownstreamRouteConfig.
- Route configs are validated before use.
- If DB loading fails or returns no active routes, API Gateway falls back to static route config.

Runtime route registry:

- Stores current route snapshot.
- Tracks version, loadedAt, routeCount, and routes.
- Existing registered routes resolve latest route config from registry per request.
- Catch-all dynamic router resolves brand-new /api/* paths from registry per request.
- Registry replacement validates new route configs before swap.

Reload behavior:

- POST /internal/admin/routes/reload reads active DB routes.
- Reload validates mapped route configs.
- Reload replaces the runtime registry snapshot when validation succeeds.
- Existing registered routes can use updated config after reload.
- Brand-new DB-backed /api/* routes can work after reload without API Gateway restart.

Runtime auth:

- Protected routes can require x-api-key.
- DB-backed issued keys are verified by keyHash lookup.
- Active key + active consumer + not expired means valid.
- Revoked keys are rejected.
- Expired keys are rejected.
- Disabled consumer keys are rejected.
- If DB key is not found or DB lookup is unavailable, env API_KEYS fallback is used.
- If a DB key is known but invalid, PulseGate does not fall back to env API_KEYS.

---

## Current API Key Storage Rule

Raw API keys are never persisted.

Stored:

- keyHash
- keyPrefix

Returned only once:

- rawKey

Never exposed:

- keyHash

Current key statuses:

- ACTIVE
- REVOKED

Current consumer statuses:

- ACTIVE
- DISABLED

---

## Current Observability

Implemented:

- Request ID propagation.
- Structured access logs.
- x-response-time-ms header.
- Prometheus metrics endpoint.
- Prometheus Docker service.
- Grafana Docker service.
- Provisioned Grafana dashboard.

Current metrics:

- http_requests_total
- http_request_duration_seconds
- http_response_cache_total

Current dashboard:

- PulseGate API Gateway Overview

---

## Current Documentation Structure

Main docs:

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/AI_HANDOFF.md
- docs/project-context/DECISION_LOG.md

Archive docs:

- docs/sdlc/sprint-history/sprint-13.md

Decision records:

- docs/project-context/decisions/2026-07-03-documentation-compaction.md

Runbooks:

- docs/runbooks/local-validation.md
- docs/runbooks/admin-route-management.md
- docs/runbooks/api-key-lifecycle.md
- docs/runbooks/runtime-reload.md

---

## Current Limitations

- Dynamic router supports exact method + exact path matching only.
- Path parameters are not implemented yet.
- Wildcard upstream path forwarding is not implemented yet.
- Host-based routing is not implemented yet.
- Weighted upstreams are not implemented yet.
- Service discovery is not implemented yet.
- API key usage tracking is not implemented yet.
- Per-consumer analytics are not implemented yet.
- Per-key analytics are not implemented yet.
- Usage plans and quotas are not implemented yet.
- Admin Dashboard is not implemented yet.
- Developer Portal is not implemented yet.
- Admin auth is still local admin API key based.
- JWT auth is still local secret based.
- Rate limit identity still uses raw API key value.
- Grafana does not yet include per-consumer or per-key usage dashboards.
- CI does not run the full Docker Compose runtime stack yet.
- CI does not push Docker images to a registry yet.
- CI does not deploy automatically yet.
- Kubernetes and cloud deployment are planned for later.

---

## Recommended Next Sprint

Sprint 14 - API Key Usage Tracking and Consumer Analytics Foundation

Recommended scope:

- Add API usage event table or aggregate table.
- Record request ownership when DB-backed API key is used.
- Track apiKeyId, consumerId, route, method, statusCode, durationMs, and timestamp.
- Keep env fallback traffic supported.
- Expose admin read API for consumer usage summary.
- Expose admin read API for API key usage summary.
- Prepare usage plans and quotas for later.

Do not add yet unless explicitly selected:

- Kafka
- RabbitMQ
- Kubernetes
- Admin Dashboard UI
- Developer Portal UI
- Billing
- Paid plans
- Multi-tenant organization model
- Production cloud deployment

---

## Working Style

Continue using small stable checkpoints:

1. Implement one small checkpoint.
2. Explain changed files.
3. Run focused tests when useful.
4. Run npm run test.
5. Run npm run typecheck.
6. Run npm run build.
7. Run Docker validation when runtime behavior changes.
8. Commit only after stable validation.
9. Push after each stable commit.
10. Keep final docs compact.
