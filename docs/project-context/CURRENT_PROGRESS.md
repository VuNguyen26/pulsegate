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

v0.28.0

---

## Latest Completed Sprint

Sprint 27 - Analytics Retention Execution Guardrails

Status:

Done.

Sprint 27 added safe guardrails for future analytics retention execution:

- Added analytics retention execution guard model.
- Added explicit execution args parser for mode, confirmation phrase, and hard delete limit.
- Added execution preview composition across retention policy, retention plan, execution args, and guard decision.
- Added npm run analytics:retention:execution-preview command.
- Added delete batch plan model with single total hard delete cap across selected sources.
- Added candidate recheck requirement modeling before any future delete.
- Preserved dry-run default behavior.
- Preserved existing analytics:retention:dry-run command behavior.
- Did not delete raw events.
- Did not add a retention execute command.
- Did not add a retention delete repository.
- Did not add migration or schema changes.
- Did not change quota checker, usage recorder, or rejected event recorder.
- Did not switch runtime summary APIs to rollup reads.

Sprint 27 details are archived in:

- docs/sdlc/sprint-history/sprint-27.md

Related runbooks:

- docs/runbooks/analytics-retention-execution-preview.md
- docs/runbooks/analytics-retention-dry-run.md
- docs/runbooks/analytics-rollup-backfill.md
- docs/runbooks/analytics-rollup-read.md

Related design record:

- docs/project-context/decisions/2026-07-04-usage-analytics-retention-rollup-design.md

---

## Latest Validation Status

Latest stable validation from Sprint 27:

- npm run test -> passed
- npm run typecheck -> passed
- npm run build -> passed
- PostgreSQL migration deploy -> passed with no pending migrations
- Analytics retention execution preview command validation -> passed
- Analytics retention dry-run command validation -> passed with DATABASE_URL

Latest automated test result:

- 85 test files passed
- 591 tests passed

Manual DB/runtime command validation:

- docker compose up -d postgres started or reused pulsegate-postgres.
- npm run db:migrate:deploy --workspace api-gateway found 7 migrations and no pending migrations.
- npm run analytics:retention:execution-preview --workspace api-gateway -- --enabled true --source usage --usage-retention-days 90 returned dry-run guard preview with deleteAllowed=false.
- npm run analytics:retention:execution-preview --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 120 --mode execute --confirm-execute I_UNDERSTAND_ANALYTICS_RETENTION_DELETE --hard-delete-limit 100 returned execute guard preview with deleteImplementationAvailable=false.
- npm run analytics:retention:dry-run --workspace api-gateway -- --enabled true --source usage --usage-retention-days 90 returned candidateCount and deleteAllowed=false.

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
- Internal/admin analytics rollup read endpoint.
- Analytics retention policy parser and plan model.
- Analytics retention candidate read repository.
- Analytics retention dry-run service.
- Analytics retention dry-run args parser.
- Analytics retention dry-run command.
- Analytics retention execution guard model.
- Analytics retention execution args parser.
- Analytics retention execution preview command.
- Analytics retention delete batch plan model.
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

Internal/admin rollup analytics:

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

Analytics retention:

- npm run analytics:retention:dry-run previews DB-backed candidate raw event retention.
- source can be usage, rejected, or both.
- usageRetentionDays and rejectedRetentionDays are separate.
- Retention candidate reads count rows older than cutoff only.
- Dry-run command output reports dryRunOnly=true and deleteAllowed=false.
- npm run analytics:retention:execution-preview previews execution guard decisions without DB access.
- Execution preview supports explicit execute mode, confirmation phrase, and hard delete limit.
- Execution preview reports deleteImplementationAvailable=false.
- Delete batch planning models candidate recheck and a single total hard delete limit.
- No raw event delete implementation exists yet.
- No retention execute command exists yet.

Current quota scope:

- DB-backed API keys only.
- API key must have usagePlanId.
- Usage plan must be enabled.
- Quota windows are DAILY or MONTHLY.
- Quota uses gateway.api_usage_events as source of truth.
- Rejected requests are tracked in gateway.api_rejected_events.
- Rejected requests are intentionally not stored in gateway.api_usage_events.
- Rollup tables, retention dry-run, and retention execution preview are not used for quota counting.

---

## Current Limitations

- Usage summary APIs still read raw events.
- Rejected summary APIs still read raw events.
- Rollup read endpoint exists, but summary APIs have not switched to rollup reads.
- Retention execution is guard/preview/model only.
- No retention delete repository is implemented yet.
- No retention execute command is implemented yet.
- No retention delete job is implemented yet.
- No scheduled/background rollup job yet.
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

Sprint 28 recommended direction:

- Analytics Retention Execution Repository Safety Foundation

Recommended scope:

- Keep retention execution explicit and operator-controlled.
- Add repository-level delete safety primitives only behind execution guardrails.
- Require candidate recheck and hard delete limit before any delete.
- Keep successful usage and rejected/security events separate.
- Keep quota counting on gateway.api_usage_events.
- Do not expose an execute command until explicitly approved.
- Avoid switching summary APIs to rollup reads unless explicitly selected.
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
7. Run Docker/runtime validation when runtime behavior changes.
8. Commit only after stable validation.
9. Push after each stable commit.
10. Keep final docs compact.
