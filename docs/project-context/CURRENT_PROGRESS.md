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

v0.48.0

---

## Latest Completed Sprint

Sprint 47 - Command Dry-Run Service Invocation Runtime Wiring

Status:

Done.

Sprint 47 completed the analytics rollup scheduler command dry-run runtime service invocation step after Sprint 46.

It safely wired direct CLI command dry-run to call AnalyticsRollupBackfillService.runBackfill in dry-run mode only:

- Added service invocation safety coverage showing mapped scheduler dry-run inputs can call the backfill service without event reads or persistence.
- Added a runtime adapter seam that invokes an injected backfill service and fails closed on service errors.
- Exposed dryRunServiceInvocationResults for explicitly enabled command dry-run service invocation.
- Added execution decision support for dry-run-ready when command dry-run service invocation is wired.
- Wired direct CLI runtime dry-run through a Prisma-backed AnalyticsRollupBackfillService factory.
- Added runtimeConsistency output so operator JSON clearly shows runtime-dry-run-service-invocation-wired while historical review artifacts may remain blocked.
- Locked blocked runtime paths for dry-run without --event-limit, process-local dry-run, and execute mode.
- Validated Docker/PostgreSQL runtime behavior with migration deploy and direct scheduler command dry-run.
- Kept command dry-run source-separated, event-limit guarded, max-bucket guarded, fail-closed, operator-visible, and non-destructive.
- Kept execute mode blocked with backfill-execution-not-wired.
- Kept process-local and external scheduler execution blocked with automatic-trigger-not-wired.
- Did not create scheduled/background jobs.
- Did not execute backfill.
- Did not read raw events through service dry-run.
- Did not persist rollups through service dry-run.
- Did not change quota counting, usage recording, rejected event recording, rollup read APIs, summary APIs, migrations, or retention/delete paths.
- Did not delete raw events.

Sprint 47 details are archived in:

- docs/sdlc/sprint-history/sprint-47.md

Related decision record:

- docs/project-context/decisions/2026-07-08-analytics-rollup-scheduler-command-dry-run-service-invocation-runtime-wiring.md

---

## Latest Validation Status

Latest stable validation from Sprint 47:

- npm run test -> passed with 105 test files and 756 tests
- npm run typecheck -> passed
- npm run build -> passed

Docker/PostgreSQL runtime validation:

- PostgreSQL container was healthy.
- npm run db:migrate:deploy --workspace api-gateway passed with 7 migrations and no pending migrations.
- analytics:rollup:scheduler-preview command dry-run runtime validation passed with --event-limit=500.
- Runtime output reached executionDecision.status=dry-run-ready.
- Runtime output exposed dryRunServiceInvocationResults for usage and rejected sources.
- Runtime output exposed service-dry-run-invoked results with serviceResult.mode=dry-run.
- Runtime output exposed runtimeConsistency.status=runtime-dry-run-service-invocation-wired.
- Runtime output preserved executesBackfill=false, readsEvents=false, persistsRollups=false, affectsQuotaCounting=false, and deletesRawEvents=false.

Blocked-path runtime validation:

- Dry-run without --event-limit remained blocked with backfill-service-invocation-not-wired.
- process-local dry-run with --event-limit remained blocked with automatic-trigger-not-wired.
- command execute with --event-limit remained blocked with backfill-execution-not-wired.

---

## Current Architecture Summary

PulseGate currently has:

- Fastify API Gateway.
- Product Service.
- Docker Compose local infrastructure.
- PostgreSQL, Prisma, Redis, Prometheus, and Grafana.
- Dynamic route config, runtime route registry, reload endpoint, and catch-all dynamic router for /api/*.
- DB-backed issued API key authentication, env API key fallback, JWT authentication, Redis-backed rate limiting, and Redis response caching.
- PostgreSQL-backed API consumers, API keys, usage plans, usage events, rejected events, usage rollups, and rejected rollups.
- Event-based quota checker and runtime quota enforcement.
- Usage and rejected event summary/listing APIs with filters and pagination.
- Analytics rollup calculation, persistence, manual backfill, read model, schedule preview, scheduler runner, execution decision, wiring review, command dry-run design review, invocation contract, readiness review, invocation design review, service invocation contract review, implementation design, request mapper, service adapter boundary design, adapter preview output integration, service invocation wiring readiness review, service invocation fail-closed error model, service invocation wiring contract, command dry-run runtime service invocation, runtime consistency output, blocked-path runtime tests, and scheduler preview command foundations.
- Analytics retention dry-run, execution preview, repository safety, service preview, and operator preview foundations.
- Internal/admin route, consumer, API key, usage plan, usage analytics, rejected analytics, quota, and rollup APIs.
- Structured access logs, Prometheus metrics, and Grafana dashboard.

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

---

## Current Usage, Quota, Rejected Event, Rollup, and Retention Behavior

Usage event table:

- gateway.api_usage_events

Rejected event table:

- gateway.api_rejected_events

Rollup tables:

- gateway.api_usage_rollups
- gateway.api_rejected_rollups

Analytics rollup scheduler preview:

- npm run analytics:rollup:scheduler-preview converts a schedule plan into dry-run backfill request contracts.
- Default preview remains non-invoking and non-destructive.
- Direct command dry-run with --execution-mode dry-run and --event-limit invokes AnalyticsRollupBackfillService.runBackfill in dry-run mode only.
- command:dry-run runtime invocation exposes dryRunServiceInvocationResults with source-separated usage and rejected results.
- command:dry-run runtime invocation exposes runtimeConsistency.status=runtime-dry-run-service-invocation-wired.
- command:dry-run service results remain dry-run plan output with zero input, aggregate, and upsert counts.
- dry-run without --event-limit remains blocked with backfill-service-invocation-not-wired.
- process-local:dry-run remains blocked with automatic-trigger-not-wired and dryRunDesignReview=null.
- execute mode remains blocked with backfill-execution-not-wired.
- process-local and external-scheduler triggers remain blocked.
- No scheduled/background rollup job exists yet.

Analytics retention:

- npm run analytics:retention:dry-run previews DB-backed candidate raw event retention.
- npm run analytics:retention:execution-preview previews execution guard decisions without DB access.
- npm run analytics:retention:operator-preview reads DB-backed candidate counts through the Prisma candidate read repository.
- Operator preview output reports commandDeletesEvents=false, candidateReadOnly=true, deleteRepositoryExecuted=false, deleteAllowed=false, and destructiveExecutionPerformed=false.
- No operator-facing raw event delete command exists.
- No retention execute command exists yet.

Current quota scope:

- DB-backed API keys only.
- Quota uses gateway.api_usage_events as source of truth.
- Rejected requests are tracked in gateway.api_rejected_events.
- Rollup tables, rollup schedule preview, scheduler preview, retention dry-run, and retention execution preview are not used for quota counting.

---

## Current Limitations

- Usage summary APIs still read raw events.
- Rejected summary APIs still read raw events.
- Rollup read endpoint exists, but summary APIs have not switched to rollup reads.
- Direct command dry-run service invocation is wired, but no scheduled/background rollup job exists yet.
- Execute mode is still blocked.
- process-local and external scheduler execution are still blocked.
- Retention execution has repository-level, service-level, and operator preview safety foundations, but no operator-facing execute command yet.
- Retention Prisma delete repository is not wired to any operator-facing execute command, API, scheduled job, or quota path yet.
- No retention delete job is implemented yet.
- No Admin Dashboard or Developer Portal yet.
- Dynamic router supports exact method + exact path matching only.
- CI does not run the full Docker Compose runtime stack yet.
- Kubernetes and cloud deployment are planned for later.

---

## Recommended Next Sprint

Sprint 48 - Command Dry-Run Runtime Output Hardening

Recommended scope:

- Harden command dry-run runtime output and service failure cases.
- Make fail-closed service error output more operator-friendly.
- Strengthen source separation edge cases.
- Harden event-limit and max-bucket runtime guardrail behavior.
- Keep execute mode blocked.
- Keep process-local/external-scheduler execution blocked until automatic execution semantics are explicitly designed.
- Keep successful usage and rejected/security events separate.
- Keep quota counting on gateway.api_usage_events.
- Keep raw event deletion forbidden.