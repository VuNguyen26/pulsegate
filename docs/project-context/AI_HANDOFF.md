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

- v0.48.0

Latest completed sprint:

- Sprint 47 - Command Dry-Run Service Invocation Runtime Wiring

Recommended next technical sprint:

- Sprint 48 - Command Dry-Run Runtime Output Hardening

---

## Current Validation Status

Latest stable validation from Sprint 47:

- npm run test -> passed.
- npm run typecheck -> passed.
- npm run build -> passed.

Latest automated test result:

- 105 test files passed.
- 756 tests passed.

Docker/PostgreSQL runtime validation:

- PostgreSQL container was healthy.
- npm run db:migrate:deploy --workspace api-gateway passed.
- analytics:rollup:scheduler-preview command dry-run runtime validation passed with --event-limit=500.
- executionDecision.status=dry-run-ready.
- executionDecision.boundary.backfillServiceInvocationWired=true.
- executionDecision.wiringReview.runtimeConsistency.status=runtime-dry-run-service-invocation-wired.
- dryRunServiceInvocationResults contained usage and rejected service-dry-run-invoked results.
- serviceResult.mode=dry-run for both sources.
- service dry-run output kept inputEventCount=0, aggregateCount=0, and upsertedCount=0.
- executesBackfill=false, readsEvents=false, persistsRollups=false, affectsQuotaCounting=false, and deletesRawEvents=false.

Blocked runtime validation:

- Dry-run without --event-limit remained blocked with backfill-service-invocation-not-wired.
- process-local dry-run with --event-limit remained blocked with automatic-trigger-not-wired.
- command execute with --event-limit remained blocked with backfill-execution-not-wired.

Sprint 47 commits:

- 4dfa993 test(gateway): lock scheduler dry-run backfill service invocation safety
- 940aed3 feat(gateway): add scheduler dry-run backfill service adapter seam
- d5eac1a feat(gateway): expose injected scheduler dry-run service invocation output
- 9860de4 feat(gateway): add scheduler dry-run service invocation decision switch
- 732ed7e feat(gateway): wire scheduler command dry-run backfill runtime service
- fcc1d30 feat(gateway): add scheduler dry-run runtime consistency output
- 715ec6f test(gateway): lock scheduler dry-run runtime blocked paths

Sprint 47 preserved:

- gateway.api_usage_events as the source of truth for successful usage and quota counting.
- gateway.api_rejected_events as the separate source of truth for rejected/security traffic.
- No quota checker changes.
- No usage recorder changes.
- No rejected event recorder changes.
- No scheduled/background rollup job.
- No execute-mode backfill wiring.
- No process-local or external scheduler execution wiring.
- No rollup summary API switch.
- No retention execute command.
- No operator-facing raw event deletion.
- No raw event reads or rollup persistence through scheduler service dry-run.

---

## Current Architecture Summary

API Gateway currently supports:

- Dynamic route config, runtime route registry, reload endpoint, and catch-all dynamic router for /api/*.
- DB-backed issued API key authentication, env API key fallback, JWT authentication, Redis-backed rate limiting, and Redis response caching.
- API usage event recording and API rejected event recording.
- Event-based quota checker and runtime quota enforcement.
- Usage and rejected event summary/listing APIs with filters and pagination.
- Analytics rollup calculation, persistence, manual backfill, read model, schedule preview, scheduler runner contract, scheduler execution decision boundary, scheduler execution wiring review, scheduler command dry-run design review, invocation contract, readiness review, invocation design review, service invocation contract review, implementation design, wiring readiness review, fail-closed error model, wiring contract, request mapper, service adapter boundary design, adapter preview output integration, command dry-run runtime service invocation, runtime consistency output, blocked-path runtime tests, schedule preview command, scheduler preview args parser, and scheduler preview command foundations.
- Read-only analytics rollup endpoint.
- Analytics retention dry-run, execution preview, repository safety, service preview, and operator preview foundations.
- Internal/admin route, consumer, API key, usage plan, usage analytics, rejected analytics, quota, and rollup APIs.
- Structured access logs, Prometheus metrics, and Grafana dashboard.

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
- npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --lookback-buckets 1 --safety-delay-ms 300000 --max-buckets 1 --execution-mode dry-run --event-limit 500

Analytics rollup scheduler foundation:

- Scheduler preview command can convert a schedule plan into dry-run backfill request contracts without creating scheduled jobs, reading events, or persisting rollups.
- Default preview remains non-invoking.
- Direct command dry-run with --event-limit invokes AnalyticsRollupBackfillService.runBackfill in dry-run mode only.
- Runtime command dry-run exposes dryRunServiceInvocationResults with source-separated usage and rejected service-dry-run-invoked results.
- Runtime command dry-run exposes runtimeConsistency.status=runtime-dry-run-service-invocation-wired.
- Dry-run without --event-limit remains blocked.
- process-local and external-scheduler execution remain blocked.
- execute mode remains blocked.
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
- No scheduled/background rollup job yet.
- Command dry-run service invocation is wired only for direct CLI dry-run with event-limit.
- Execute mode, process-local scheduler, and external scheduler execution remain unwired.

---

## Important Files

Analytics foundation:

- apps/api-gateway/prisma/schema.prisma
- apps/api-gateway/src/analytics/
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-backfill-request-mapper.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-backfill-service-adapter.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.ts
- apps/api-gateway/src/routes/admin-analytics-rollup.route.ts

Docs:

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/DECISION_LOG.md
- docs/project-context/AI_HANDOFF.md
- docs/sdlc/sprint-history/sprint-47.md
- docs/runbooks/analytics-rollup-scheduler-preview.md
- docs/project-context/decisions/2026-07-08-analytics-rollup-scheduler-command-dry-run-service-invocation-runtime-wiring.md

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

Start Sprint 48 after confirming Sprint 47 docs are committed and pushed.

Recommended direction:

- Command Dry-Run Runtime Output Hardening.

Before starting:

- Confirm git status is clean.
- Confirm latest docs commit is pushed.
- Keep implementation small and testable.
- Preserve quota correctness.
- Keep successful usage and rejected/security event storage separate.
- Keep scheduler dry-run separate from actual background execution.
- Harden only command-triggered dry-run service invocation.
- Keep AnalyticsRollupBackfillService.runBackfill in dry-run mode only.
- Keep execute mode blocked until command dry-run runtime behavior is hardened and reviewed.
- Keep process-local/external-scheduler execution blocked until explicitly designed.
- Keep retention execution explicit and guarded.
- Do not expose a destructive execute command until explicitly approved.