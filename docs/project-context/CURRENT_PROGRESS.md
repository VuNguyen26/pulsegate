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

v0.32.0

---

## Latest Completed Sprint

Sprint 31 - Analytics Retention Execution Operator Preview Hardening

Status:

Done.

Sprint 31 hardened the non-destructive operator-facing analytics retention preview command:

- Added stronger safety contract tests for operator preview output and command JSON.
- Added usage text safety and formatting contract tests.
- Added fail-fast validation so invalid execution-only args are rejected before DB-backed candidate reads.
- Preserved DB-backed count-only candidate reads for valid operator previews.
- Preserved usage/rejected source separation.
- Did not call deleteCandidates.
- Did not wire the Prisma delete repository into the command.
- Did not add a retention execute command, delete API, scheduled retention job, migration, quota path, recorder change, or rollup summary switch.

Sprint 31 details are archived in:

- docs/sdlc/sprint-history/sprint-31.md

Related runbooks:

- docs/runbooks/analytics-retention-operator-preview.md
- docs/runbooks/analytics-retention-execution-service-preview.md
- docs/runbooks/analytics-retention-delete-repository.md
- docs/runbooks/analytics-retention-execution-preview.md
- docs/runbooks/analytics-retention-dry-run.md

Related design records:

- docs/project-context/decisions/2026-07-06-analytics-retention-operator-preview-hardening.md
- docs/project-context/decisions/2026-07-06-analytics-retention-operator-preview-command.md
- docs/project-context/decisions/2026-07-06-analytics-retention-execution-service-orchestration-preview.md
- docs/project-context/decisions/2026-07-06-analytics-retention-delete-repository-safety.md
---

## Latest Validation Status

Latest stable validation from Sprint 31:

- npm run test -> passed
- npm run typecheck -> passed
- npm run build -> passed

Latest automated test result:

- 95 test files passed
- 659 tests passed

Manual DB/runtime command validation:

- docker compose up -d postgres -> passed.
- npm run db:migrate:deploy --workspace api-gateway -> 7 migrations found, no pending migrations.
- analytics:retention:operator-preview validation passed for disabled, usage, rejected, and both execute-preview modes.
- Invalid dry-run hard-delete-limit validation failed fast with exit code 1 before preview output.
- Runtime output preserved commandDeletesEvents=false, candidateReadOnly=true, deleteRepositoryExecuted=false, deleteAllowed=false, and destructiveExecutionPerformed=false.
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
- Analytics retention delete repository safety contract.
- Analytics retention delete repository port and executor.
- Analytics retention delete operation planner.
- Analytics retention Prisma delete repository implementation behind guardrails.
- Analytics retention execution service preview.
- Analytics retention execution service summary model.
- Analytics retention execution candidate count loader.
- Analytics retention candidate-read execution preview composition.
- Analytics retention operator preview output model.
- Analytics retention operator preview command runner.
- Analytics retention operator preview command with DB-backed candidate counts.
- Analytics retention operator preview fail-fast execution arg validation.
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
- Delete repository safety model blocks unsafe repository operations before any delete.
- Delete operation planner derives source-specific repository requests from retention and batch plans.
- Prisma delete repository can count source-specific candidates and delete only bounded selected IDs after safety checks.
- Execution service preview composes policy, plan, guard, batch plan, operation plan, optional repository preparation, and safe flags.
- Execution service summary provides a compact non-destructive summary contract.
- Candidate count loader normalizes count-only candidate read repository output for execution planning.
- Candidate-read execution preview composes existing read-only candidate counts into the service preview.
- Operator preview command reads DB-backed candidate counts through the Prisma candidate read repository.
- Operator preview command validates execution args before DB-backed candidate reads, so invalid execute-only flags fail fast before touching the candidate repository.
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
- Rollup tables, retention dry-run, and retention execution preview are not used for quota counting.

---

## Current Limitations

- Usage summary APIs still read raw events.
- Rejected summary APIs still read raw events.
- Rollup read endpoint exists, but summary APIs have not switched to rollup reads.
- Retention execution has repository-level, service-level, and operator preview safety foundations, but no operator-facing execute command yet.
- Retention Prisma delete repository is not wired to any operator-facing execute command, API, scheduled job, or quota path yet.
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

Sprint 32 recommended direction:

- Rollup Scheduling Foundation or Analytics Retention Execution Design Review

Recommended scope:

- Keep retention execution explicit, guarded, and non-destructive unless destructive execution is separately approved.
- Option A: start a separate non-destructive scheduled rollup planning foundation.
- Option B: explicitly design the next analytics retention execution boundary before exposing any destructive command/API/job.
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
