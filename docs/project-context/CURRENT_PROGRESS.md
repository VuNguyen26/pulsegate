# Current Progress

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

## Document Scope

This file is intentionally compact.

Detailed sprint history lives in:

- docs/sdlc/sprint-history/

Manual validation commands live in:

- docs/runbooks/

Long decision records live in:

- docs/project-context/decisions/

---

## Current Version

v0.15.0

---

## Latest Completed Sprint

Sprint 14 - API Key Usage Tracking and Consumer Analytics Foundation

Status:

Done.

Sprint 14 added the first usage tracking and consumer analytics foundation:

- API usage event schema.
- API usage event migration.
- API usage recorder service.
- Runtime usage recording during successful downstream proxy responses.
- DB-backed API key usage attribution.
- Env fallback traffic support.
- Cache status tracking.
- Consumer usage summary repository.
- API key usage summary repository.
- Admin consumer usage summary API.
- Admin API key usage summary API.
- Docker runtime validation for usage tracking.

Sprint 14 details are archived in:

- docs/sdlc/sprint-history/sprint-14.md

Sprint 14 runbook:

- docs/runbooks/api-usage-tracking.md

---

## Latest Validation Status

Latest stable validation from Sprint 14:

- npm run test -> passed
- npm run typecheck -> passed
- npm run build -> passed
- Docker runtime validation -> passed

Latest automated test result:

- 40 test files passed
- 270 tests passed

Latest Docker runtime validation proved:

- gateway.api_usage_events table exists.
- DB-backed API key traffic records usage event.
- Usage event records apiKeyId and consumerId.
- Usage event records apiKeyAuthSource=database.
- Usage event records route, method, status code, duration, and cache status.
- Consumer usage summary API returns usage totals.
- API key usage summary API returns usage totals.
- Revoked DB-backed key returns 403.
- Revoked DB-backed request does not create a new successful usage event.

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
- PostgreSQL-backed API usage events.
- Internal/admin route management APIs.
- Internal/admin API consumer APIs.
- Internal/admin API key lifecycle APIs.
- Internal/admin API usage summary APIs.
- Runtime route registry.
- Runtime registry reload endpoint.
- Catch-all dynamic router for /api/*.
- Shared downstream proxy pipeline.
- DB-backed issued API key authentication.
- API usage recorder.
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
- gateway.api_usage_events

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

Internal/admin usage analytics:

- GET /internal/admin/usage/consumers/:consumerId/summary
- GET /internal/admin/usage/api-keys/:apiKeyId/summary

---

## Current Usage Tracking Behavior

Usage event table:

- gateway.api_usage_events

Recorded fields:

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

Current recording scope:

- Successful downstream proxy handler responses.
- Cache HIT.
- Cache MISS.
- Cache BYPASS.
- DB-backed API key traffic.
- Env fallback API key traffic.

Current summary APIs:

- Consumer usage summary.
- API key usage summary.

Summary fields:

- totalRequests
- successfulRequests
- errorRequests
- averageDurationMs
- cacheHits
- cacheMisses
- cacheBypasses
- lastRequestAt

Current limitation:

- Failed auth requests are not tracked yet.
- Rate-limited requests are not tracked yet.
- No usage plans or quotas yet.
- No aggregate rollup table yet.

---

## Current Limitations

- Failed authentication requests are not tracked yet.
- Rate-limited requests are not tracked yet.
- Usage data is event-based only.
- No aggregate rollup table yet.
- No retention policy yet.
- No per-consumer Grafana dashboard yet.
- No per-key Grafana dashboard yet.
- Usage plans and quotas are not implemented yet.
- Admin Dashboard is not implemented yet.
- Developer Portal is not implemented yet.
- Admin auth is still local admin API key based.
- JWT auth is still local secret based.
- Dynamic router supports exact method + exact path matching only.
- Path parameters are not implemented yet.
- Wildcard upstream path forwarding is not implemented yet.
- Host-based routing is not implemented yet.
- Weighted upstreams are not implemented yet.
- Service discovery is not implemented yet.
- CI does not run the full Docker Compose runtime stack yet.
- CI does not push Docker images to a registry yet.
- CI does not deploy automatically yet.
- Kubernetes and cloud deployment are planned for later.

---

## Recommended Next Sprint

Sprint 15 - Usage Plans and Quota Foundation

Recommended scope:

- Add usage plan schema.
- Attach consumers or API keys to usage plans.
- Define quota window model.
- Prepare quota counters.
- Start enforcing simple quota limits.
- Keep API usage event tracking as source of truth.

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
