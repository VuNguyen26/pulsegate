# Sprint 47 - Command Dry-Run Service Invocation Runtime Wiring

## Status

Done.

## Version

v0.48.0

## Summary

Sprint 47 wired direct CLI scheduler command dry-run to call AnalyticsRollupBackfillService.runBackfill in dry-run mode only.

The sprint introduced the first real scheduler command dry-run service invocation path while preserving source separation, event-limit guardrails, max-bucket guardrails, fail-closed behavior, operator-visible output, and non-destructive safety boundaries.

## Commits

- 4dfa993 test(gateway): lock scheduler dry-run backfill service invocation safety
- 940aed3 feat(gateway): add scheduler dry-run backfill service adapter seam
- d5eac1a feat(gateway): expose injected scheduler dry-run service invocation output
- 9860de4 feat(gateway): add scheduler dry-run service invocation decision switch
- 732ed7e feat(gateway): wire scheduler command dry-run backfill runtime service
- fcc1d30 feat(gateway): add scheduler dry-run runtime consistency output
- 715ec6f test(gateway): lock scheduler dry-run runtime blocked paths

## Changes

### Checkpoint 47.1 - Backfill Service Dry-Run Invocation Safety

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-backfill-service-adapter.test.ts

Locked behavior:

- Mapped scheduler dry-run inputs can invoke AnalyticsRollupBackfillService.runBackfill in dry-run mode.
- Service dry-run returns planned output without reading events.
- Service dry-run returns planned output without persisting rollups.
- Usage and rejected mapped inputs remain source-separated.

### Checkpoint 47.2 - Runtime Adapter Seam

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-backfill-service-adapter.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-backfill-service-adapter.test.ts

Added:

- Runtime dry-run service invocation adapter functions.
- Fail-closed service error output.
- Source-scoped service result validation.
- Invocation safety flags.

Locked behavior:

- Adapter invokes an injected AnalyticsRollupBackfillService only for dry-run mapped inputs.
- Adapter result status is service-dry-run-invoked on success.
- Adapter result status is failed-closed-service-error on service errors.
- Safety flags preserve no event reads, no persistence, no quota mutation, and no raw event deletion.

### Checkpoint 47.3 - Injected Command Output

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts

Added:

- Optional command dependencies for an injected backfill service.
- Explicit allowDryRunServiceInvocation switch.
- dryRunServiceInvocationResults output when invocation is explicitly enabled.

Locked behavior:

- Injected service is not invoked unless allowDryRunServiceInvocation=true.
- Service invocation output is source-separated.
- Default command output remains non-invoking.

### Checkpoint 47.4 - Execution Decision Switch

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.test.ts

Added:

- dry-run-ready decision status.
- backfillServiceInvocationWired boundary switch.
- allowedMode=dry-run for command dry-run when service invocation is explicitly wired.

Locked behavior:

- command dry-run can become allowed only when service invocation is wired.
- process-local dry-run remains blocked even if a caller tries to set service invocation wired.
- execute mode remains blocked.

### Checkpoint 47.5 - Direct CLI Runtime Service Factory Wiring

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts

Added:

- Runtime backfill service factory for direct CLI command dry-run.
- Dynamic imports for Prisma-backed repositories, event reader, persistence service, and backfill service.
- Runtime dispose hook for disconnectGatewayPrisma.
- Direct-run wiring for allowDryRunServiceInvocation=true.

Locked behavior:

- Runtime factory is resolved only for direct command dry-run service invocation.
- Preview mode does not resolve the runtime factory.
- Service dry-run invocation calls runBackfill once per mapped source.
- Service dry-run does not read events or persist rollups.
- Prisma-backed factory exists for runtime wiring, but service dry-run remains plan-only.

### Checkpoint 47.6 - Runtime Consistency Output

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.test.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts

Added:

- executionDecision.wiringReview.runtimeConsistency.
- status=runtime-dry-run-service-invocation-wired for wired direct command dry-run.
- status=preview-only for default preview.
- status=blocked-or-review-only for blocked paths.
- historicalReviewArtifactsMayRemainBlocked=true to avoid rewriting historical review artifacts that intentionally remain model/review output.

Locked behavior:

- Runtime output clearly shows the current dry-run invocation state.
- automaticTriggersRemainUnwired=true remains visible.
- executeRemainsUnwired=true remains visible.
- No event reads, persistence, quota mutation, or raw deletion are reported.

### Checkpoint 47.7 - Runtime Blocked-Path Validation

Validated with Docker/PostgreSQL:

- Dry-run without --event-limit remained blocked with backfill-service-invocation-not-wired.
- process-local dry-run with --event-limit remained blocked with automatic-trigger-not-wired.
- command execute with --event-limit remained blocked with backfill-execution-not-wired.
- None of the blocked paths emitted dryRunServiceInvocationResults.

### Checkpoint 47.8 - Runtime Blocked-Path Unit Tests

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts

Locked behavior:

- Runtime factory is not resolved for dry-run without event limit.
- Runtime factory is not resolved for process-local dry-run.
- Runtime factory is not resolved for execute mode.
- Blocked-path runtimeConsistency output remains non-invoking.

## Final Validation

- npm run test -> 105 test files passed, 756 tests passed.
- npm run typecheck -> passed.
- npm run build -> passed.

## Docker/PostgreSQL Validation

Required and completed.

Runtime setup:

- PostgreSQL container healthy.
- DATABASE_URL pointed to postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway.
- npm run db:migrate:deploy --workspace api-gateway passed.
- 7 migrations found.
- No pending migrations to apply.

Runtime command validation:

    npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --lookback-buckets 1 --safety-delay-ms 300000 --max-buckets 1 --execution-mode dry-run --event-limit 500

Validated output:

- executionDecision.status=dry-run-ready
- executionDecision.allowed=true
- executionDecision.blockedReason=null
- executionDecision.boundary.backfillServiceInvocationWired=true
- executionDecision.boundary.backfillExecutionWired=false
- executionDecision.wiringReview.runtimeConsistency.status=runtime-dry-run-service-invocation-wired
- runtimeConsistency.serviceInvocationCurrentlyAllowed=true
- runtimeConsistency.invokesBackfillService=true
- runtimeConsistency.executesBackfill=false
- runtimeConsistency.readsEvents=false
- runtimeConsistency.persistsRollups=false
- runtimeConsistency.affectsQuotaCounting=false
- runtimeConsistency.deletesRawEvents=false
- dryRunServiceInvocationResults contained usage and rejected results
- each invocation result had status=service-dry-run-invoked
- each serviceResult.mode=dry-run
- each sourceResult.status=planned
- totalInputEventCount=0
- totalAggregateCount=0
- totalUpsertedCount=0

Blocked runtime validation:

- dry-run without --event-limit remained blocked.
- process-local dry-run with --event-limit remained blocked.
- command execute with --event-limit remained blocked.

## Safety Boundaries Preserved

- No scheduled/background rollup job.
- No process-local scheduler execution.
- No external scheduler execution.
- No execute-mode backfill.
- No raw usage event reads through scheduler service dry-run.
- No raw rejected event reads through scheduler service dry-run.
- No rollup persistence through scheduler service dry-run.
- No quota counting change.
- No usage recorder change.
- No rejected event recorder change.
- No rollup summary API switch.
- No retention execute command.
- No operator-facing raw event deletion.

## Next Sprint

Sprint 48 - Command Dry-Run Runtime Output Hardening.

Recommended scope:

- Harden command dry-run runtime output and failure cases.
- Strengthen source separation edge cases.
- Harden event-limit and max-bucket guardrail behavior.
- Improve fail-closed service error output.
- Keep execute mode blocked.
- Keep process-local and external scheduler execution blocked.
- Keep quota counting unchanged.
- Keep raw event deletion forbidden.