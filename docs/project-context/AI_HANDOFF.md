# PulseGate AI Handoff

## Purpose

This file gives enough context to continue PulseGate work in a new AI chat.

It should stay compact.

Detailed sprint history lives in:

- docs/sdlc/sprint-history/

Manual validation commands live in:

- docs/runbooks/

Long decision records live in:

- docs/project-context/decisions/

---

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

Repository:

- https://github.com/VuNguyen26/pulsegate.git

Local path:

- E:\pulsegate

Current version:

- v0.46.0

Latest completed sprint:

- Sprint 44 - Rollup Scheduler Command Dry-Run Service Invocation Wiring Readiness Review

Recommended next technical sprint:

- Sprint 45 - Rollup Scheduler Command Dry-Run Service Invocation Fail-Closed Error Model

---

## Current Validation Status

Latest stable validation from Sprint 45:

- npm run test -> passed.
- npm run typecheck -> passed.
- npm run build -> passed.

Latest automated test result:

- 105 test files passed.
- 742 tests passed.

Manual command validation:

- npm run analytics:rollup:scheduler-preview --workspace api-gateway was validated for command dry-run service invocation fail-closed error model output with --event-limit=500.
- Command dry-run validation passed with blockedReason=backfill-service-invocation-not-wired.
- Command dry-run validation exposed dryRunServiceInvocationFailClosedErrorModel with failureState=blocked, targetTrigger=command, targetBackfillMode=dry-run, targetServiceMethod=runBackfill, serviceInvocationCurrentlyAllowed=false, partialPersistenceAllowed=false, quotaCountingChangeAllowed=false, and rawEventDeletionAllowed=false.
- Runtime output preserved previewOnly=true, createsScheduledJob=false, invokesBackfillService=false, executesBackfill=false, readsEvents=false, persistsRollups=false, affectsQuotaCounting=false, and deletesRawEvents=false.
- No Docker/PostgreSQL validation was required because Sprint 45 stayed DB-free, model/test/command-output-only, and non-destructive.

Sprint 45 commits:

- 275077a feat(gateway): add rollup scheduler dry-run fail-closed error model
- 68eb2e7 test(gateway): lock rollup scheduler dry-run fail-closed command output

Sprint 45 preserved:

- gateway.api_usage_events as the source of truth for successful usage and quota counting.
- gateway.api_rejected_events as the separate source of truth for rejected/security traffic.
- No quota checker changes.
- No usage recorder changes.
- No rejected event recorder changes.
- No scheduled/background rollup job.
- No backfill service invocation from scheduler preview.
- No call to AnalyticsRollupBackfillService.runBackfill from scheduler preview.
- No rollup summary API switch.
- No retention execute command.
- No operator-facing raw event deletion.
---

## Current Architecture Summary

API Gateway currently supports:

- Dynamic route config, runtime route registry, reload endpoint, and catch-all dynamic router for /api/*.
- DB-backed issued API key authentication, env API key fallback, JWT authentication, Redis-backed rate limiting, and Redis response caching.
- API usage event recording and API rejected event recording.
- Event-based quota checker and runtime quota enforcement.
- Usage and rejected event summary/listing APIs with filters and pagination.
- Analytics rollup calculation, persistence, manual backfill, read model, schedule preview, scheduler runner contract, scheduler execution decision boundary, scheduler execution wiring review, scheduler command dry-run design review, invocation contract, readiness review, invocation design review, service invocation contract review, implementation design, wiring readiness review, fail-closed error model, request mapper, service adapter boundary design, adapter preview output integration, schedule preview command, scheduler preview args parser, and scheduler preview command foundations.
- Read-only analytics rollup endpoint.
- Analytics retention dry-run, execution preview, repository safety, service preview, and operator preview foundations.
- Internal/admin route, consumer, API key, usage plan, usage analytics, rejected analytics, quota, and rollup APIs.
- Structured access logs, Prometheus metrics, and Grafana dashboard.

---

## Current Data Ownership

Product Service owns:

- public.products
- public._prisma_migrations

API Gateway owns:

- gateway.gateway_routes
- gateway.api_consumers
- gateway.api_keys
- gateway.usage_plans
- gateway.api_usage_events
- gateway.api_rejected_events
- gateway.api_usage_rollups
- gateway.api_rejected_rollups
- gateway._prisma_migrations

---

## Current API Usage, Quota, Rejected Event, Rollup, and Retention Behavior

Usage event table:

- gateway.api_usage_events

Rejected event table:

- gateway.api_rejected_events

Rollup tables:

- gateway.api_usage_rollups
- gateway.api_rejected_rollups

Rollup commands:

- npm run analytics:rollup:backfill --workspace api-gateway -- --from 2026-07-05T00:00:00.000Z --to 2026-07-06T00:00:00.000Z --granularity hour
- npm run analytics:rollup:schedule-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --lookback-buckets 1 --safety-delay-ms 300000 --max-buckets 1
- npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --lookback-buckets 1 --safety-delay-ms 300000 --max-buckets 1
- npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source usage --run-at 2026-07-06T13:07:00.000Z --granularity hour --execution-mode dry-run

Analytics rollup scheduler foundation:

- Scheduler preview command can convert a schedule plan into dry-run backfill request contracts without creating scheduled jobs, invoking backfill service, reading events, or persisting rollups.
- Scheduler preview command exposes executionDecision.wiringReview with currentCapability=command-preview-only.
- Scheduler preview command exposes dryRunDesignReview for command:dry-run requests while keeping backfill service invocation unwired and non-destructive.
- Scheduler preview command exposes dryRunInvocationContract, dryRunInvocationReadiness, dryRunInvocationDesignReview, dryRunServiceInvocationContractReview, dryRunServiceInvocationImplementationDesign, dryRunServiceInvocationWiringReadinessReview, dryRunServiceInvocationFailClosedErrorModel, dryRunServiceInvocationRequestMapperDesign, and dryRunServiceAdapterBoundaryDesign for command:dry-run requests.
- Scheduler preview command exposes dryRunServiceAdapterPreviews for command:dry-run requests when --event-limit is provided.
- Scheduler dry-run backfill request mapper maps ready runner backfill requests to dry-run AnalyticsRollupBackfillRunInput contracts without invoking the backfill service.
- Scheduler dry-run service adapter boundary validates mapped dry-run service input contracts and produces planned dry-run service result previews without calling AnalyticsRollupBackfillService.runBackfill.
- Scheduler preview command keeps command:dry-run blocked with backfill-service-invocation-not-wired.
- Scheduler preview command keeps process-local:dry-run blocked with automatic-trigger-not-wired and dryRunDesignReview=null.
- Rollups are not used by runtime summaries, scheduled background jobs, retention delete, execution preview, or quota counting yet.

Analytics retention foundation:

- Dry-run command prints DB-backed candidate JSON preview.
- Execution preview command prints guard JSON preview without DB access.
- Operator preview command reads candidate counts from PostgreSQL through the Prisma candidate read repository.
- Operator preview output reports commandDeletesEvents=false, candidateReadOnly=true, deleteRepositoryExecuted=false, deleteAllowed=false, and destructiveExecutionPerformed=false.
- No operator-facing raw event deletion exists.
- No retention execute command exists yet.

Current analytics limitations:

- Usage and rejected summary APIs are event-based at runtime.
- Rollup read endpoint exists, but summary APIs have not switched to rollup reads.
- No retention delete job yet.
- Rollup schedule and scheduler preview commands exist, but no scheduled/background rollup job yet.
- Command dry-run service adapter boundary exists as contract model and design output only; no scheduler preview service invocation is wired yet.

---

## Important Files

Analytics foundation:

- apps/api-gateway/prisma/schema.prisma
- apps/api-gateway/src/analytics/
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-backfill-request-mapper.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-backfill-service-adapter.ts
- apps/api-gateway/src/routes/admin-analytics-rollup.route.ts

Docs:

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/DECISION_LOG.md
- docs/project-context/AI_HANDOFF.md
- docs/sdlc/sprint-history/sprint-45.md
- docs/runbooks/analytics-rollup-scheduler-preview.md
- docs/project-context/decisions/2026-07-08-analytics-rollup-scheduler-command-dry-run-service-invocation-fail-closed-error-model.md

---

## User Working Preferences

Use Vietnamese when explaining.

Work style:

- Work like a careful senior backend reviewer.
- Change a small number of files at a time.
- Provide copy-paste-ready PowerShell blocks.
- Review terminal output carefully before moving forward.
- Run npm run test.
- Run npm run typecheck.
- Run npm run build.
- Run Docker/runtime validation when runtime behavior changes.
- Commit only after stable validation.
- Push after each stable commit.
- Keep final docs compact.
- Do not overbuild.
- Do not silently skip tests.
- Do not claim production-ready when only foundation exists.

---

## Recommended Next Step

Start Sprint 46 after confirming Sprint 45 docs are committed and pushed.

Recommended direction:

- Command Dry-Run Service Invocation Wiring Contract.

Before starting:

- Confirm git status is clean.
- Confirm latest docs commit is pushed.
- Keep implementation small and testable.
- Preserve quota correctness.
- Keep successful usage and rejected/security event storage separate.
- Keep scheduler preview separate from actual background execution.
- Keep command dry-run blocked until backfill service invocation is explicitly wired and approved.
- Keep wiring readiness review, fail-closed error model, and adapter preview output non-invoking and fail-closed.
- Keep execute mode blocked until command dry-run has safe design, mapper, adapter boundary, preview output, wiring, error handling, and validation first.
- Keep process-local/external-scheduler execution blocked until explicitly designed.
- Keep retention execution explicit and guarded.
- Do not expose a destructive execute command until explicitly approved.