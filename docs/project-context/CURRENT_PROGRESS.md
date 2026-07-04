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

v0.18.0

---

## Latest Completed Sprint

Sprint 17 - API Rejection Tracking and Rejected Events Observability

Status:

Done.

Sprint 17 added rejected request tracking and rejected traffic observability:

- Separate gateway.api_rejected_events table.
- Rejected event recorder foundation.
- QUOTA_EXCEEDED rejected event tracking.
- RATE_LIMIT_EXCEEDED rejected event tracking.
- Failed auth rejected event tracking for API key and JWT failures.
- Admin rejected events summary endpoint.
- Docker runtime validation proving rejected events are persisted and summarized.

Sprint 17 details are archived in:

- docs/sdlc/sprint-history/sprint-17.md

Sprint 17 runbook:

- docs/runbooks/api-rejected-events.md

Sprint 17 decision record:

- docs/project-context/decisions/2026-07-04-rejected-events-side-table.md

---

## Latest Validation Status

Latest stable validation from Sprint 17:

- npm run test -> passed
- npm run typecheck -> passed
- npm run build -> passed
- Docker runtime rejected events validation -> passed

Latest automated test result:

- 52 test files passed
- 342 tests passed

Latest Docker runtime validation proved:

- Missing API key returns 401 API_KEY_MISSING and records a rejected event.
- Invalid API key returns 403 API_KEY_INVALID and records a rejected event.
- Missing JWT returns 401 JWT_TOKEN_MISSING and records rejected events.
- Route rate limit returns 429 TOO_MANY_REQUESTS and records RATE_LIMIT_EXCEEDED.
- GET /internal/admin/api-rejections/summary returns totals grouped by rejection reason and status code.
- gateway.api_rejected_events stores route, method, auth source, status, reason, and occurredAt.

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
- PostgreSQL-backed usage plans.
- PostgreSQL-backed API usage events.
- PostgreSQL-backed API rejected events.
- Internal/admin route management APIs.
- Internal/admin API consumer APIs.
- Internal/admin API key lifecycle APIs.
- Internal/admin usage plan APIs.
- Internal/admin API usage summary APIs.
- Internal/admin rejected events summary API.
- Internal/admin quota observability APIs.
- Runtime route registry.
- Runtime registry reload endpoint.
- Catch-all dynamic router for /api/*.
- Shared downstream proxy pipeline.
- DB-backed issued API key authentication.
- Event-based quota checker.
- Runtime quota enforcement.
- API usage recorder.
- API rejected event recorder.
- API key quota state reader.
- Usage plan usage summary reader.
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
- gateway.usage_plans
- gateway.api_usage_events
- gateway.api_rejected_events

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
- GET /internal/admin/api-keys/:id/quota
- PATCH /internal/admin/api-keys/:id/revoke
- PATCH /internal/admin/api-keys/:id/usage-plan

Internal/admin usage plans:

- GET /internal/admin/usage-plans
- POST /internal/admin/usage-plans
- GET /internal/admin/usage-plans/:id
- GET /internal/admin/usage-plans/:id/usage-summary
- PATCH /internal/admin/usage-plans/:id

Internal/admin usage analytics:

- GET /internal/admin/usage/consumers/:consumerId/summary
- GET /internal/admin/usage/api-keys/:apiKeyId/summary
- GET /internal/admin/api-rejections/summary

---

## Current Usage and Quota Behavior

Usage event table:

- gateway.api_usage_events

Usage recording scope:

- Successful downstream proxy/cache handler responses.
- Cache HIT.
- Cache MISS.
- Cache BYPASS.
- DB-backed API key traffic.
- Env fallback API key traffic.

Rejected event table:

- gateway.api_rejected_events

Rejected recording scope:

- API_KEY_MISSING
- API_KEY_INVALID
- JWT_TOKEN_MISSING
- JWT_TOKEN_INVALID
- RATE_LIMIT_EXCEEDED
- QUOTA_EXCEEDED

Usage plan table:

- gateway.usage_plans

Current quota scope:

- DB-backed API keys only.
- API key must have usagePlanId.
- Usage plan must be enabled.
- Quota windows are DAILY or MONTHLY.
- Quota uses gateway.api_usage_events as source of truth.
- Rejected requests are tracked in gateway.api_rejected_events.
- Rejected requests are intentionally not stored in gateway.api_usage_events.
- No aggregate rollup table yet.

---

## Current Limitations

- Rejected events summary is aggregate-only.
- Raw rejected event listing is not implemented yet.
- Filterable rejected event drilldown is not implemented yet.
- Usage data is event-based only.
- No aggregate rollup table yet.
- No retention policy yet.
- No per-consumer Grafana dashboard yet.
- No per-key Grafana dashboard yet.
- No quota/rejected-events Grafana dashboard yet.
- Disabled usage plans currently skip quota enforcement.
- Env fallback API keys are not quota-enforced.
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

Sprint 17 - API Usage Rejection Tracking Design or Advanced Usage Analytics Hardening

Recommended scope:

- Design rejected request tracking separately from successful/proxied usage events.
- Decide whether failed auth, rate-limited, and quota-denied traffic belongs in api_usage_events with outcome/type fields or in a separate rejected/security event table.
- Keep quota counts accurate.
- Avoid adding Kafka, RabbitMQ, Kubernetes, Admin Dashboard UI, Developer Portal UI, billing, paid plans, or multi-tenant organization model unless explicitly selected.

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
