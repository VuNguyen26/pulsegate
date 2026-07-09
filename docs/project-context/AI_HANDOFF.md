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

- v0.51.0

Latest completed sprint:

- Sprint 50 - Command Execute Wiring Preview blocked-by-default

Recommended next technical sprint:

- Sprint 51 - Command Execute Runtime Wiring with strict guardrails

---

## Current Validation Status

Latest stable validation from Sprint 50:

- npm run test -> passed.
- npm run typecheck -> passed.
- npm run build -> passed.

Latest automated test result:

- 105 test files passed.
- 773 tests passed.

Docker/PostgreSQL runtime validation:

- Not required for Sprint 50.
- Sprint 50 was DB-free and only changed command execute wiring preview model/output, command usage/runbook docs, and tests.
- No runtime execute path, DB read, migration, Prisma persistence, rollup persistence, quota path, retention delete, or raw event deletion was introduced.

Sprint 50 commits:

- 32ddf49 feat(gateway): expose scheduler command execute wiring preview
- 857e863 test(gateway): expose scheduler command execute wiring preview output
- e43a929 test(gateway): lock scheduler command execute wiring preview blocked paths

Sprint 50 preserved:

- gateway.api_usage_events as the source of truth for successful usage and quota counting.
- gateway.api_rejected_events as the separate source of truth for rejected/security traffic.
- No quota checker changes.
- No usage recorder changes.
- No rejected event recorder changes.
- No scheduled/background rollup job.
- No execute-mode runtime wiring.
- No execute call to AnalyticsRollupBackfillService.runBackfill.
- No process-local or external scheduler execution wiring.
- No rollup summary API switch.
- No retention execute command.
- No operator-facing raw event deletion.
- No raw event reads or rollup persistence through scheduler execute.

## Current Architecture Summary

API Gateway currently supports:

- Dynamic route config, runtime route registry, reload endpoint, and catch-all dynamic router for /api/*.
- DB-backed issued API key authentication, env API key fallback, JWT authentication, Redis-backed rate limiting, and Redis response caching.
- API usage event recording and API rejected event recording.
- Event-based quota checker and runtime quota enforcement.
- Usage and rejected event summary/listing APIs with filters and pagination.
- Analytics rollup calculation, persistence, manual backfill, read model, schedule preview, scheduler runner contract, scheduler execution decision boundary, scheduler execution wiring review, scheduler command dry-run design review, invocation contract, readiness review, invocation design review, service invocation contract review, implementation design, wiring readiness review, fail-closed error model, wiring contract, request mapper, service adapter boundary design, adapter preview output integration, command dry-run runtime service invocation, runtime consistency output, blocked-path runtime tests, command execute contract review, command execute readiness review, command execute operator output review, command execute wiring preview, schedule preview command, scheduler preview args parser, and scheduler preview command foundations.
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
- npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --lookback-buckets 1 --safety-delay-ms 300000 --max-buckets 1 --execution-mode execute --event-limit 500

Analytics rollup scheduler foundation:

- Scheduler preview command can convert a schedule plan into dry-run backfill request contracts without creating scheduled jobs, reading events, or persisting rollups.
- Default preview remains non-invoking.
- Direct command dry-run with --event-limit invokes AnalyticsRollupBackfillService.runBackfill in dry-run mode only.
- Runtime command dry-run exposes dryRunServiceInvocationResults with source-separated usage and rejected service-dry-run-invoked results.
- Runtime command dry-run exposes runtimeConsistency.status=runtime-dry-run-service-invocation-wired.
- command:execute exposes commandExecuteContractReview, commandExecuteReadinessReview, commandExecuteOperatorOutputReview, and commandExecuteWiringPreview.
- command:execute remains blocked with backfill-execution-not-wired.
- commandExecuteWiringPreview is blocked-by-default, command-only, and absent for process-local/external-scheduler execute triggers.
- Dry-run without --event-limit remains blocked.
- process-local and external-scheduler execution remain blocked.
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
- Command execute wiring preview exists, but execute runtime remains unwired.
- process-local scheduler and external scheduler execution remain unwired.

---

## Important Files

Analytics foundation:

- apps/api-gateway/prisma/schema.prisma
- apps/api-gateway/src/analytics/
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-backfill-request-mapper.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-backfill-service-adapter.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.ts
- apps/api-gateway/src/routes/admin-analytics-rollup.route.ts

Docs:

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/DECISION_LOG.md
- docs/project-context/AI_HANDOFF.md
- docs/sdlc/sprint-history/sprint-50.md
- docs/runbooks/analytics-rollup-scheduler-preview.md
- docs/project-context/decisions/2026-07-09-analytics-rollup-scheduler-command-execute-wiring-preview.md

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

Start Sprint 51 after confirming Sprint 50 docs are committed and pushed.

Recommended direction:

- Command Execute Runtime Wiring with strict guardrails.

Before starting:

- Confirm git status is clean.
- Confirm latest docs commit is pushed.
- Keep implementation small and testable.
- Preserve quota correctness.
- Keep successful usage and rejected/security event storage separate.
- Keep scheduler dry-run separate from actual background execution.
- Keep command dry-run behavior unchanged.
- Keep command execute behind explicit operator confirmation, event-limit guardrail, max-bucket bound, bounded bucket count, source separation, rollback expectation, operator output, and Docker/PostgreSQL runtime validation.
- Keep process-local/external-scheduler execution blocked until explicitly designed.
- Keep retention execution explicit and guarded.
- Do not expose destructive retention delete behavior until explicitly approved.