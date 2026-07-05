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

v0.25.0

---

## Latest Completed Sprint

Sprint 24 - Analytics Rollup Backfill Command

Status:

Done.

Sprint 24 added a controlled manual analytics rollup backfill command:

- Added analytics rollup backfill plan parser.
- Added analytics rollup backfill event reader.
- Added analytics rollup backfill orchestration service.
- Added npm command wiring for analytics rollup backfill.
- Added dry-run default behavior and explicit execute mode.
- Added safe empty-window skip behavior.
- Added event limit safety to prevent partial rollup persistence.
- Preserved successful usage and rejected/security event separation.
- Preserved gateway.api_usage_events as source of truth for successful usage and quota counting.
- Preserved gateway.api_rejected_events as source of truth for rejected/security traffic.
- Did not switch runtime summary APIs to rollup reads.
- Did not add retention deletion or scheduled/background jobs.
- Did not change quota checker, usage recorder, or rejected event recorder.

Sprint 24 details are archived in:

- docs/sdlc/sprint-history/sprint-24.md

Related runbook:

- docs/runbooks/analytics-rollup-backfill.md

Related design record:

- docs/project-context/decisions/2026-07-04-usage-analytics-retention-rollup-design.md

---

## Latest Validation Status

Latest stable validation from Sprint 24:

- npm run test -> passed
- npm run typecheck -> passed
- npm run build -> passed
- Manual analytics rollup backfill command validation -> passed

Latest automated test result:

- 71 test files passed
- 494 tests passed

Manual command validation:

- Dry-run command returned planned usage and rejected summaries.
- Execute mode with an empty window skipped safely without reading or persisting events.
- Invalid granularity failed with usage output.

Docker/runtime validation:

- Full runtime API validation was not required for Sprint 24 because HTTP runtime APIs and gateway request handling were not changed.
- Backfill command behavior was validated manually through npm command execution.

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
- PostgreSQL-backed API usage rollups.
- PostgreSQL-backed API rejected rollups.
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
- Analytics rollup time bucket helper.
- Analytics rollup window planner.
- Usage rollup aggregate builder.
- Rejected rollup aggregate builder.
- Analytics rollup dimension hash builder.
- Usage rollup persistence repository.
- Rejected rollup persistence repository.
- Analytics rollup persistence service.
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

## Current Usage, Quota, Rejected Event, and Rollup Behavior

Usage event table:

- gateway.api_usage_events

Rejected event table:

- gateway.api_rejected_events

Rollup tables:

- gateway.api_usage_rollups
- gateway.api_rejected_rollups

Usage analytics:

- GET /internal/admin/usage/events returns raw successful usage event rows.
- Usage event listing supports filters, offset pagination, and cursor pagination with nextCursor.
- Consumer usage summary supports filters.
- API key usage summary supports filters.
- Invalid usage analytics query returns 400 INVALID_QUERY_PARAMETER.
- Runtime usage summaries still read gateway.api_usage_events.

Rejected event observability:

- GET /internal/admin/api-rejections/summary returns aggregate rejected traffic totals.
- GET /internal/admin/api-rejections/events returns raw rejected event rows.
- Rejected event APIs support filters and raw listing cursor pagination.
- Runtime rejected analytics still read gateway.api_rejected_events.

Analytics rollup foundation:

- Current rollup helpers live under apps/api-gateway/src/analytics.
- Helpers calculate UTC buckets, plan rebuild windows, aggregate successful usage events, and aggregate rejected events.
- Persistence repositories upsert usage and rejected rollups by dimensionHash.
- Internal persistence service aggregates raw-shaped events and delegates persistence to rollup repositories.
- Rollup backfill is available through a manual command, but rollups are not connected to runtime endpoints, background jobs, retention, or quota counting yet.

Current quota scope:

- DB-backed API keys only.
- API key must have usagePlanId.
- Usage plan must be enabled.
- Quota windows are DAILY or MONTHLY.
- Quota uses gateway.api_usage_events as source of truth.
- Rejected requests are tracked in gateway.api_rejected_events.
- Rejected requests are intentionally not stored in gateway.api_usage_events.
- Rollup tables are not used for quota counting.

---

## Current Limitations

- Usage data is event-based at runtime.
- Rejected event analytics is event-based at runtime.
- Manual rollup backfill command exists, but runtime summary APIs have not switched to rollup reads.
- Runtime summary APIs have not switched to rollup reads.
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

Sprint 25 recommended direction:

- Analytics Retention Safety Foundation or Rollup Read Model Investigation

Recommended scope:

- Choose one small backend direction.
- If choosing rollup backfill, start with a controlled command/query plan and safe validation.
- If choosing retention, start with safe configuration and dry-run design before deleting anything.
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
