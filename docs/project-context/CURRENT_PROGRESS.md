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

v0.22.0

---

## Latest Completed Sprint

Sprint 21 - Usage Analytics Cursor Pagination and Investigation Hardening

Status:

Done.

Sprint 21 hardened raw event investigation:

- Added cursor pagination to GET /internal/admin/usage/events.
- Added cursor pagination to GET /internal/admin/api-rejections/events.
- Added nextCursor to successful usage event listing pagination responses.
- Added nextCursor to rejected event listing pagination responses.
- Cursor pagination follows occurredAt desc and id desc listing order.
- offset cannot be used together with cursor.
- Rejected events summary rejects cursor because cursor is only valid for raw listing.
- Preserved gateway.api_usage_events as source of truth for successful usage and quota counting.
- Preserved gateway.api_rejected_events as the separate source of truth for rejected/security traffic.
- Did not add migrations, retention jobs, rollup tables, quota rewrites, or recorder rewrites.

Sprint 21 details are archived in:

- docs/sdlc/sprint-history/sprint-21.md

Sprint 21 runbooks:

- docs/runbooks/api-usage-analytics.md
- docs/runbooks/api-rejected-events.md

Related design record:

- docs/project-context/decisions/2026-07-04-usage-analytics-retention-rollup-design.md

---

## Latest Validation Status

Latest stable validation from Sprint 21:

- npm run test -> passed
- npm run typecheck -> passed
- npm run build -> passed
- Docker runtime cursor pagination validation -> passed

Latest automated test result:

- 59 test files passed
- 414 tests passed

Latest Docker runtime validation proved:

- GET /health returns 200.
- Successful protected requests can generate usage events.
- Rejected requests can generate rejected events.
- Usage event listing returns nextCursor when more rows exist.
- Usage event listing accepts cursor pagination.
- Usage event listing rejects offset together with cursor.
- Rejected event listing returns nextCursor when more rows exist.
- Rejected event listing accepts cursor pagination.
- Rejected event listing rejects offset together with cursor.
- Rejected events summary rejects cursor.
- gateway.api_usage_events remains the source of truth for successful usage and quota counting.
- gateway.api_rejected_events remains separate for rejected/security traffic.

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
- Dynamic route config.
- Runtime route registry and reload endpoint.
- Catch-all dynamic router for /api/*.
- Shared downstream proxy pipeline.
- DB-backed issued API key authentication.
- Static env API key fallback.
- JWT authentication.
- Redis-backed rate limiting.
- Redis response caching.
- PostgreSQL-backed API consumers.
- PostgreSQL-backed issued API keys.
- PostgreSQL-backed usage plans.
- PostgreSQL-backed API usage events.
- PostgreSQL-backed API rejected events.
- API usage recorder.
- API rejected event recorder.
- Event-based quota checker.
- Runtime quota enforcement.
- API key quota state reader.
- Usage plan usage summary reader.
- Usage summary reader with filters.
- Usage events listing reader with filters, offset pagination, and cursor pagination.
- Rejected event summary reader with filters.
- Rejected event listing reader with filters, offset pagination, and cursor pagination.
- Internal/admin route management APIs.
- Internal/admin consumer APIs.
- Internal/admin API key lifecycle APIs.
- Internal/admin usage plan APIs.
- Internal/admin usage analytics APIs.
- Internal/admin quota observability APIs.
- Internal/admin rejected events APIs.
- Structured access logs.
- Prometheus metrics.
- Grafana dashboard.

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

Internal/admin usage analytics:

- GET /internal/admin/usage/events
- GET /internal/admin/usage/consumers/:consumerId/summary
- GET /internal/admin/usage/api-keys/:apiKeyId/summary

Internal/admin rejected analytics:

- GET /internal/admin/api-rejections/summary
- GET /internal/admin/api-rejections/events

Internal/admin quota observability:

- GET /internal/admin/api-keys/:id/quota
- GET /internal/admin/usage-plans/:id/usage-summary

Internal/admin management:

- Route config management.
- Consumer management.
- API key issue/list/revoke.
- API key usage plan assignment.
- Usage plan create/list/detail/update.

---

## Current Usage, Quota, and Rejected Event Behavior

Usage event table:

- gateway.api_usage_events

Usage analytics:

- GET /internal/admin/usage/events returns raw successful usage event rows.
- Usage event listing supports filters, offset pagination, and cursor pagination with nextCursor.
- Consumer usage summary supports filters.
- API key usage summary supports filters.
- Summary filters include from, to, routePath, routeMethod, statusCode, cacheStatus, and apiKeyAuthSource.
- Listing filters include from, to, routePath, routeMethod, statusCode, cacheStatus, apiKeyAuthSource, apiKeyId, and consumerId.
- Invalid usage analytics query returns 400 INVALID_QUERY_PARAMETER.

Rejected event table:

- gateway.api_rejected_events

Rejected event observability:

- GET /internal/admin/api-rejections/summary returns aggregate rejected traffic totals.
- GET /internal/admin/api-rejections/summary supports filters.
- GET /internal/admin/api-rejections/events returns raw rejected event rows.
- GET /internal/admin/api-rejections/events supports filters, offset pagination, and cursor pagination with nextCursor.
- GET /internal/admin/api-rejections/summary rejects cursor.

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

Sprint 22 recommended direction:

- Analytics Retention/Rollup Implementation Foundation

Recommended scope:

- Start a small storage lifecycle foundation for high-volume analytics.
- Keep successful usage and rejected/security events separate.
- Avoid changing quota counting unless explicitly designed.
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
