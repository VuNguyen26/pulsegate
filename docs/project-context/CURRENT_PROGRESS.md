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

v0.17.0

---

## Latest Completed Sprint

Sprint 16 - Quota Observability and Usage Management Hardening

Status:

Done.

Sprint 16 added quota observability and quota management hardening:

- API key quota state reader.
- Admin API key quota state endpoint.
- Usage plan usage summary reader.
- Admin usage plan usage summary endpoint.
- Quota metadata in 429 QUOTA_EXCEEDED responses.
- Explicit decision not to record quota-denied requests into gateway.api_usage_events yet.
- Docker runtime validation proving quota observability APIs and quota metadata.

Sprint 16 details are archived in:

- docs/sdlc/sprint-history/sprint-16.md

Sprint 16 runbook:

- docs/runbooks/usage-plans-and-quotas.md

Sprint 16 decision record:

- docs/project-context/decisions/2026-07-04-quota-denied-usage-event-tracking.md

---

## Latest Validation Status

Latest stable validation from Sprint 16:

- npm run test -> passed
- npm run typecheck -> passed
- npm run build -> passed
- Docker runtime quota observability validation -> passed

Latest automated test result:

- 46 test files passed
- 329 tests passed

Latest Docker runtime validation proved:

- Usage plan can be created through admin API.
- DB-backed API key can be issued through admin API.
- Usage plan can be assigned to an API key.
- First protected /api/products request with limit 1 returns 200.
- API key quota state endpoint returns usedRequests=1, remainingRequests=0, exceeded=true, enforced=true.
- Second protected /api/products request returns 429 QUOTA_EXCEEDED with quota metadata.
- Usage plan usage summary endpoint returns assigned key count, active key count, current-window usage, exceeded key count, and top API keys by usage.

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
- Internal/admin route management APIs.
- Internal/admin API consumer APIs.
- Internal/admin API key lifecycle APIs.
- Internal/admin usage plan APIs.
- Internal/admin API usage summary APIs.
- Internal/admin quota observability APIs.
- Runtime route registry.
- Runtime registry reload endpoint.
- Catch-all dynamic router for /api/*.
- Shared downstream proxy pipeline.
- DB-backed issued API key authentication.
- Event-based quota checker.
- Runtime quota enforcement.
- API usage recorder.
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

---

## Current Usage and Quota Behavior

Usage event table:

- gateway.api_usage_events

Usage plan table:

- gateway.usage_plans

Current recording scope:

- Successful downstream proxy handler responses.
- Cache HIT.
- Cache MISS.
- Cache BYPASS.
- DB-backed API key traffic.
- Env fallback API key traffic.

Current quota scope:

- DB-backed API keys only.
- API key must have usagePlanId.
- Usage plan must be enabled.
- Quota windows are DAILY or MONTHLY.
- Quota uses gateway.api_usage_events as source of truth.
- Over-quota request returns 429 QUOTA_EXCEEDED.
- Over-quota response includes quota metadata.
- Env fallback API keys are not quota-enforced.
- Public routes are not quota-enforced.
- Quota-denied requests are not recorded into api_usage_events yet.

Current summary APIs:

- Consumer usage summary.
- API key usage summary.
- API key quota state.
- Usage plan usage summary.

Current limitation:

- Failed auth requests are not tracked yet.
- Rate-limited requests are not tracked yet.
- Quota-denied requests are not tracked yet.
- No aggregate rollup table yet.

---

## Current Limitations

- Failed authentication requests are not tracked yet.
- Rate-limited requests are not tracked yet.
- Quota-denied requests are not tracked yet.
- Usage data is event-based only.
- No aggregate rollup table yet.
- No retention policy yet.
- No per-consumer Grafana dashboard yet.
- No per-key Grafana dashboard yet.
- No quota usage Grafana dashboard yet.
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
