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

v0.45.0

---

## Latest Completed Sprint

Sprint 44 - Rollup Scheduler Command Dry-Run Service Invocation Wiring Readiness Review

Status:

Done.

Sprint 44 continued the analytics rollup scheduler safety path after Sprint 43.

It added a command dry-run service invocation wiring readiness review before wiring any real backfill service call:

- Added dryRunServiceInvocationWiringReadinessReview under dryRunDesignReview for command:dry-run requests.
- Kept currentWiringState=not-wired and readyForServiceInvocationWiring=false.
- Kept serviceInvocationCurrentlyAllowed=false.
- Required ready runner plans, mapped dry-run service inputs, adapter previews before wiring, per-source invocation, source separation, event limit guardrails, max bucket guardrails, operator safety output, fail-closed service errors, and Docker/PostgreSQL runtime validation before future service invocation wiring.
- Hardened command output tests and usage text for the new readiness review.
- Kept command dry-run blocked with backfill-service-invocation-not-wired.
- Kept process-local and external scheduler execution blocked.
- Did not invoke the backfill service.
- Did not call AnalyticsRollupBackfillService.runBackfill from scheduler preview.
- Did not read raw events or persist rollups.
- Did not change quota counting, usage recording, rejected event recording, rollup read APIs, summary APIs, migrations, or retention/delete paths.

Sprint 44 details are archived in:

- docs/sdlc/sprint-history/sprint-44.md

Related design record:

- docs/project-context/decisions/2026-07-08-analytics-rollup-scheduler-command-dry-run-service-invocation-wiring-readiness-review.md
---

## Latest Validation Status

Latest stable validation from Sprint 44:

- npm run test -> passed with 105 test files and 740 tests
- npm run typecheck -> passed
- npm run build -> passed

Manual command validation:

- analytics:rollup:scheduler-preview command dry-run wiring readiness validation passed with blockedReason=backfill-service-invocation-not-wired.
- command:dry-run validation exposed dryRunServiceInvocationWiringReadinessReview with currentWiringState=not-wired, targetTrigger=command, targetBackfillMode=dry-run, targetServiceMethod=runBackfill, readyForServiceInvocationWiring=false, serviceInvocationCurrentlyAllowed=false, quotaCountingChangeAllowed=false, and rawEventDeletionAllowed=false.
- command:dry-run adapter preview validation still exposed two source-separated previews for usage and rejected when --event-limit=500 was provided.
- Runtime output preserved previewOnly=true, createsScheduledJob=false, invokesBackfillService=false, executesBackfill=false, readsEvents=false, persistsRollups=false, affectsQuotaCounting=false, and deletesRawEvents=false.
- No Docker/PostgreSQL validation was required for Sprint 44 because the scheduler command dry-run wiring readiness review is DB-free, preview-only, command-output-only, and non-destructive.
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
- Analytics rollup calculation, persistence, manual backfill, read model, schedule preview, scheduler runner, execution decision, wiring review, command dry-run design review, invocation contract, readiness review, invocation design review, service invocation contract review, implementation design, request mapper, service adapter boundary design, adapter preview output integration, service invocation wiring readiness review, and scheduler preview command foundations.
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
- The command reports previewOnly=true, createsScheduledJob=false, invokesBackfillService=false, executesBackfill=false, readsEvents=false, persistsRollups=false, affectsQuotaCounting=false, and deletesRawEvents=false.
- The command exposes executionDecision.boundary and executionDecision.wiringReview.
- command:dry-run exposes dryRunDesignReview, dryRunInvocationContract, dryRunInvocationReadiness, dryRunInvocationDesignReview, dryRunServiceInvocationContractReview, dryRunServiceInvocationImplementationDesign, dryRunServiceInvocationWiringReadinessReview, dryRunServiceInvocationRequestMapperDesign, dryRunServiceAdapterBoundaryDesign, and dryRunServiceAdapterPreviews when --event-limit is provided.
- command:dry-run remains blocked with backfill-service-invocation-not-wired.
- process-local:dry-run remains blocked with automatic-trigger-not-wired and dryRunDesignReview=null.
- execute mode remains blocked until command dry-run is safely designed, mapped, adapted, wired, and runtime-validated first.
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
- Rollup schedule and scheduler preview commands exist, and scheduler preview exposes execution boundary decisions plus dry-run design outputs, but no scheduled/background rollup job yet.
- Command dry-run service invocation wiring readiness review and adapter previews are exposed as command output only; no scheduler preview service invocation is wired yet.
- Retention execution has repository-level, service-level, and operator preview safety foundations, but no operator-facing execute command yet.
- Retention Prisma delete repository is not wired to any operator-facing execute command, API, scheduled job, or quota path yet.
- No retention delete job is implemented yet.
- No Admin Dashboard or Developer Portal yet.
- Dynamic router supports exact method + exact path matching only.
- CI does not run the full Docker Compose runtime stack yet.
- Kubernetes and cloud deployment are planned for later.

---

## Recommended Next Sprint

Sprint 45 - Rollup Scheduler Command Dry-Run Service Invocation Fail-Closed Error Model

Recommended scope:

- Model fail-closed service invocation error output before invoking the backfill service.
- Keep command dry-run blocked until actual service invocation wiring is explicitly approved.
- Do not invoke the backfill service unless explicitly approved and Docker/PostgreSQL runtime-validated.
- Do not jump directly from scheduler preview to execute mode.
- Keep process-local/external-scheduler execution blocked until automatic execution semantics are explicitly designed.
- Keep successful usage and rejected/security events separate.
- Keep quota counting on gateway.api_usage_events.
