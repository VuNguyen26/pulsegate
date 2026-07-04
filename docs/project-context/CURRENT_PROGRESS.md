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

v0.20.0

---

## Latest Completed Sprint

Sprint 19 - Usage Analytics Hardening and Retention/Rollup Design

Status:

Done.

Sprint 19 hardened successful usage analytics:

- Added usage summary query parser.
- Added usage summary filter model.
- Added repository-level filters for successful usage summaries.
- Exposed filtered usage summary APIs for consumers and API keys.
- Preserved api_usage_events as source of truth for successful usage and quota counting.
- Preserved api_rejected_events as the separate source of truth for rejected/security traffic.
- Added retention/rollup design guidance without implementing a migration or rollup table.

Sprint 19 details are archived in:

- docs/sdlc/sprint-history/sprint-19.md

Sprint 19 runbook:

- docs/runbooks/api-usage-analytics.md

Related decision record:

- docs/project-context/decisions/2026-07-04-usage-analytics-retention-rollup-design.md

---

## Latest Validation Status

Latest stable validation from Sprint 19:

- npm run test -> passed
- npm run typecheck -> passed
- npm run build -> passed
- Docker runtime filtered usage summary validation -> passed

Latest automated test result:

- 56 test files passed
- 376 tests passed

Latest Docker runtime validation proved:

- GET /health returns 200.
- Admin can create a consumer.
- Admin can issue an API key.
- Invalid usage summary query returns 400 INVALID_QUERY_PARAMETER.
- Filtered consumer usage summary returns 200 with normalized filters.
- Filtered API key usage summary returns 200 with normalized filters.

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
- Internal/admin filtered API usage summary APIs.
- Internal/admin quota observability APIs.
- Internal/admin rejected events summary API.
- Internal/admin rejected events listing API.
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
- Usage summary reader with filters.
- Rejected event summary reader with filters.
- Rejected event listing reader with filters and pagination.
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
- GET /internal/admin/api-rejections/events

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

Usage analytics:

- Consumer usage summary supports filters.
- API key usage summary supports filters.
- Supported filters include from, to, routePath, routeMethod, statusCode, cacheStatus, and apiKeyAuthSource.
- Invalid usage summary query returns 400 INVALID_QUERY_PARAMETER.

Rejected event table:

- gateway.api_rejected_events

Rejected recording scope:

- API_KEY_MISSING
- API_KEY_INVALID
- JWT_TOKEN_MISSING
- JWT_TOKEN_INVALID
- RATE_LIMIT_EXCEEDED
- QUOTA_EXCEEDED

Rejected event observability:

- GET /internal/admin/api-rejections/summary returns aggregate rejected traffic totals.
- GET /internal/admin/api-rejections/summary supports filters.
- GET /internal/admin/api-rejections/events returns raw rejected event rows.
- GET /internal/admin/api-rejections/events supports safe pagination and filters.
- Supported filters include from, to, rejectionReason, statusCode, routePath, routeMethod, apiKeyAuthSource, apiKeyId, and consumerId.

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

- Usage data is event-based only.
- Rejected event analytics is event-based only.
- No aggregate rollup table yet.
- No retention policy job yet.
- No cursor pagination for very large event datasets yet.
- No raw successful usage event listing endpoint yet.
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

Sprint 20 recommended direction:

- Usage Analytics Listing and Event Investigation, or
- Analytics Retention/Rollup Implementation Foundation

Recommended scope:

- If investigation is prioritized, add raw successful usage event listing with safe pagination.
- If storage lifecycle is prioritized, implement the first small retention/rollup foundation.
- Keep successful usage and rejected/security events separate.
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
