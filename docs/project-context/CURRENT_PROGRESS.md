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

v0.33.0

---

## Latest Completed Sprint

Sprint 32 - Analytics Rollup Scheduling Foundation

Status:

Done.

Sprint 32 added a non-destructive analytics rollup scheduling foundation:

- Added schedule plan contracts for hourly/daily rollup windows.
- Added schedule preview summary output with explicit safety flags.
- Added schedule preview args parsing and usage text.
- Exposed npm run analytics:rollup:schedule-preview as a DB-free operator-facing preview command.
- Preserved usage/rejected source separation.
- Did not create a scheduled/background rollup job.
- Did not read raw events or persist rollups from the schedule preview command.
- Did not change quota counting, usage recording, rejected event recording, rollup read APIs, summary APIs, migrations, or retention/delete paths.

Sprint 32 details are archived in:

- docs/sdlc/sprint-history/sprint-32.md

Related runbooks:

- docs/runbooks/analytics-rollup-schedule-preview.md
- docs/runbooks/analytics-rollup-backfill.md
- docs/runbooks/analytics-rollup-read.md

Related design records:

- docs/project-context/decisions/2026-07-06-analytics-rollup-scheduling-foundation.md
- docs/project-context/decisions/2026-07-04-usage-analytics-retention-rollup-design.md

---

## Latest Validation Status

Latest stable validation from Sprint 32:

- npm run test -> passed
- npm run typecheck -> passed
- npm run build -> passed

Latest automated test result:

- 99 test files passed
- 683 tests passed

Manual command validation:

- analytics:rollup:schedule-preview validation passed for an enabled both-source hourly preview.
- Runtime output preserved previewOnly=true, commandCreatesScheduledJob=false, commandExecutesBackfill=false, readsEvents=false, persistsRollups=false, affectsQuotaCounting=false, and deletesRawEvents=false.
- package.json parse validation passed after ensuring UTF-8 without BOM.
- No Docker/PostgreSQL validation was required for Sprint 32 because the command is DB-free and preview-only.

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
- Analytics rollup manual backfill command.
- Analytics rollup read query model.
- Usage rollup read repository.
- Rejected rollup read repository.
- Analytics rollup read service.
- Analytics rollup schedule plan model.
- Analytics rollup schedule preview summary model.
- Analytics rollup schedule preview args parser.
- Analytics rollup schedule preview command.
- Internal/admin analytics rollup read endpoint.
- Analytics retention dry-run, execution preview, repository safety, service preview, and operator preview foundations.
- Internal/admin route, consumer, API key, usage plan, usage analytics, rejected analytics, quota, and rollup APIs.
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

Internal/admin analytics:

- GET /internal/admin/usage/events
- GET /internal/admin/usage/consumers/:consumerId/summary
- GET /internal/admin/usage/api-keys/:apiKeyId/summary
- GET /internal/admin/api-rejections/summary
- GET /internal/admin/api-rejections/events
- GET /internal/admin/analytics/rollups

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

## Current Usage, Quota, Rejected Event, Rollup, and Retention Behavior

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
- Runtime usage summaries still read gateway.api_usage_events.

Rejected event observability:

- GET /internal/admin/api-rejections/summary returns aggregate rejected traffic totals.
- GET /internal/admin/api-rejections/events returns raw rejected event rows.
- Rejected event APIs support filters and raw listing cursor pagination.
- Runtime rejected analytics still read gateway.api_rejected_events.

Analytics rollup read model:

- GET /internal/admin/analytics/rollups returns read-only rollup rows.
- source is required and must be usage or rejected.
- granularity is required and must be hour or day.
- from and to are required ISO timestamps.
- Usage rollup read supports cacheStatus.
- Rejected rollup read supports rejectionReason.
- statusCode maps to statusClass for usage rollups and exact statusCode for rejected rollups.

Analytics rollup schedule preview:

- npm run analytics:rollup:schedule-preview prints a JSON preview for a future scheduled rollup window.
- source can be usage, rejected, or both.
- granularity can be hour or day.
- lookbackBuckets, safetyDelayMs, and maxBuckets provide preview guardrails.
- The command reports previewOnly=true, commandCreatesScheduledJob=false, commandExecutesBackfill=false, readsEvents=false, persistsRollups=false, affectsQuotaCounting=false, and deletesRawEvents=false.
- No scheduled/background rollup job exists yet.

Analytics retention:

- npm run analytics:retention:dry-run previews DB-backed candidate raw event retention.
- npm run analytics:retention:execution-preview previews execution guard decisions without DB access.
- npm run analytics:retention:operator-preview reads DB-backed candidate counts through the Prisma candidate read repository.
- Operator preview output reports commandDeletesEvents=false, candidateReadOnly=true, deleteRepositoryExecuted=false, deleteAllowed=false, and destructiveExecutionPerformed=false.
- Service previews and operator previews do not call deleteCandidates.
- The existing execution preview command remains DB-free and reports deleteImplementationAvailable=false.
- No operator-facing raw event delete command exists.
- No retention execute command exists yet.

Current quota scope:

- DB-backed API keys only.
- API key must have usagePlanId.
- Usage plan must be enabled.
- Quota windows are DAILY or MONTHLY.
- Quota uses gateway.api_usage_events as source of truth.
- Rejected requests are tracked in gateway.api_rejected_events.
- Rejected requests are intentionally not stored in gateway.api_usage_events.
- Rollup tables, rollup schedule preview, retention dry-run, and retention execution preview are not used for quota counting.

---

## Current Limitations

- Usage summary APIs still read raw events.
- Rejected summary APIs still read raw events.
- Rollup read endpoint exists, but summary APIs have not switched to rollup reads.
- Rollup schedule preview command exists, but no scheduled/background rollup job yet.
- Retention execution has repository-level, service-level, and operator preview safety foundations, but no operator-facing execute command yet.
- Retention Prisma delete repository is not wired to any operator-facing execute command, API, scheduled job, or quota path yet.
- No retention delete job is implemented yet.
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

Sprint 33 recommended direction:

- Rollup Scheduler Runner Design or Analytics Retention Execution Design Review

Recommended scope:

- If continuing rollups, design an explicit scheduler runner boundary before adding any background execution.
- Keep schedule preview separate from actual event reads and persistence.
- Keep retention execution explicit, guarded, and non-destructive unless destructive execution is separately approved.
- Keep successful usage and rejected/security events separate.
- Keep quota counting on gateway.api_usage_events.
- Do not expose a destructive execute command until explicitly approved.

---

## Working Style

Continue using small stable checkpoints:

1. Implement one small checkpoint.
2. Explain changed files.
3. Run focused tests when useful.
4. Run npm run test.
5. Run npm run typecheck.
6. Run npm run build.
7. Run Docker/runtime validation when runtime behavior changes.
8. Commit only after stable validation.
9. Push after each stable commit.
10. Keep final docs compact.
