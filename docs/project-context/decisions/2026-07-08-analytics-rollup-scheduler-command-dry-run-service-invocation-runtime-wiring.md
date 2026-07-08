# Decision: Analytics Rollup Scheduler Command Dry-Run Service Invocation Runtime Wiring

## Date

2026-07-08

## Status

Accepted

## Context

Sprint 46 defined the command dry-run service invocation wiring contract while keeping scheduler preview non-invoking.

The next safe step was to wire direct CLI command dry-run to AnalyticsRollupBackfillService.runBackfill in dry-run mode only, with Docker/PostgreSQL runtime validation and without introducing execute mode, process-local scheduler execution, external scheduler execution, quota changes, rollup summary API switching, retention execution, or raw event deletion.

## Decision

Wire direct CLI command dry-run to call AnalyticsRollupBackfillService.runBackfill in dry-run mode only.

The runtime path is allowed only when:

- trigger=command
- requestedMode=dry-run
- --event-limit is present and valid
- scheduler runner plan is ready
- mapped dry-run service inputs are source-separated
- max bucket guardrails are preserved

The command now exposes:

- executionDecision.status=dry-run-ready
- executionDecision.boundary.backfillServiceInvocationWired=true
- executionDecision.wiringReview.runtimeConsistency.status=runtime-dry-run-service-invocation-wired
- dryRunServiceInvocationResults
- one source-scoped service-dry-run-invoked result per mapped source

The runtime path keeps:

- serviceResult.mode=dry-run
- source separation for usage and rejected traffic
- service dry-run plan-only output
- executesBackfill=false
- readsEvents=false
- persistsRollups=false
- affectsQuotaCounting=false
- deletesRawEvents=false
- automaticTriggersRemainUnwired=true
- executeRemainsUnwired=true

## Non-Goals

Sprint 47 does not:

- Wire execute mode.
- Wire process-local scheduler execution.
- Wire external scheduler execution.
- Create scheduled/background rollup jobs.
- Read raw events through scheduler service dry-run.
- Persist rollups through scheduler service dry-run.
- Change quota counting.
- Change usage recording.
- Change rejected event recording.
- Switch runtime summaries to rollup reads.
- Create migrations.
- Expose retention execution.
- Delete raw events.

## Consequences

Direct command dry-run is now a real runtime service invocation boundary, so future work must harden runtime output and failure behavior before execute mode is considered.

Historical design/review artifacts under dryRunDesignReview may still describe earlier blocked wiring states. The new runtimeConsistency overlay is the operator-facing source for current runtime invocation state.

Future Sprint 48 work should harden:

- fail-closed service error output
- source separation edge cases
- event-limit guardrails
- max-bucket guardrails
- operator output clarity

## Validation

Sprint 47 validation:

- npm run test -> 105 test files passed, 756 tests passed.
- npm run typecheck -> passed.
- npm run build -> passed.
- Docker/PostgreSQL runtime validation passed.
- npm run db:migrate:deploy --workspace api-gateway passed with 7 migrations and no pending migrations.
- Runtime command dry-run with --event-limit=500 reached dry-run-ready.
- Runtime command dry-run emitted dryRunServiceInvocationResults for usage and rejected sources.
- Runtime command dry-run preserved no execute, no event reads, no persistence, no quota mutation, and no raw event deletion.
- Blocked runtime paths remained blocked for dry-run without event-limit, process-local dry-run, and execute mode.