# Sprint 48 - Command Dry-Run Runtime Output Hardening

## Status

Done.

## Version

v0.49.0

## Summary

Sprint 48 hardened analytics rollup scheduler command dry-run runtime output after Sprint 47 wired direct command-only dry-run service invocation.

The sprint strengthened failure output, guardrail behavior, source separation, runtime field visibility, and Docker/PostgreSQL runtime smoke validation without opening execute mode or automatic scheduler execution.

## Commits

- 294d74f test(gateway): lock external scheduler dry-run blocked path
- 8e39ba9 test(gateway): lock scheduler dry-run fail-closed service output
- 9fb359a test(gateway): lock scheduler dry-run source-separated failures
- caac474 feat(gateway): preserve scheduler dry-run output on cleanup failure
- 5615ce8 test(gateway): lock scheduler dry-run guardrail fail-fast
- 8742af8 test(gateway): lock scheduler dry-run cleanup output contract
- e59ea85 feat(gateway): expose scheduler dry-run factory failures
- 4b91070 test(gateway): lock scheduler dry-run runtime output field visibility

## Changes

### Checkpoint 48.1 - External Scheduler Dry-Run Blocked Path Regression Lock

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts

Locked behavior:

- external-scheduler dry-run with --event-limit remains blocked.
- Runtime dry-run backfill service factory is not resolved for external scheduler dry-run.
- No dryRunServiceInvocationResults are emitted for external scheduler dry-run.
- No scheduled job, service invocation, execute backfill, event read, rollup persistence, quota mutation, or raw event deletion is introduced.

### Checkpoint 48.2 - Command Dry-Run Service Failure Output Hardening

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts

Locked behavior:

- Injected dry-run backfill service failures produce failed-closed-service-error output.
- Failure output remains source-scoped.
- Safety flags preserve no event reads, no rollup persistence, no quota mutation, and no raw event deletion.

### Checkpoint 48.3 - Source Separation Failure Output Hardening

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts

Locked behavior:

- source=both keeps one dry-run service invocation result per source.
- A usage source failure does not drop a rejected source success result.
- Source order and source-specific safety output remain visible.

### Checkpoint 48.4 - Runtime Factory Dispose Failure Hardening

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts

Added:

- dryRunRuntimeCleanupError output.

Locked behavior:

- Runtime cleanup failures do not drop dryRunServiceInvocationResults.
- Cleanup failure output is operator-visible.
- Successful dry-run service invocation remains dry-run-ready.
- No destructive behavior is introduced.

### Checkpoint 48.5 - Event Limit / Max Bucket Runtime Guardrail Hardening

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts

Locked behavior:

- Invalid --event-limit fails before runtime factory resolution.
- Invalid --max-buckets fails before runtime factory resolution.
- No operator JSON is printed for invalid input.
- No runtime service is created for invalid input.

### Checkpoint 48.6 - Runtime Output Contract Snapshot Hardening

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts

Locked behavior:

- Happy-path runtime dry-run output includes dryRunServiceInvocationResults.
- Happy-path runtime dry-run output does not include dryRunRuntimeCleanupError.

### Checkpoint 48.7 - Runtime Service Factory Failure Output Hardening

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts

Added:

- dryRunRuntimeFactoryError output.

Locked behavior:

- Runtime factory failures return operator JSON instead of rejecting before output.
- Runtime factory failures do not invoke the dry-run backfill service.
- Runtime factory failures keep executionDecision blocked with backfill-service-invocation-not-wired.
- Runtime factory failures do not expose dryRunServiceInvocationResults or dryRunRuntimeCleanupError.

### Checkpoint 48.8 - Runtime Output Documentation/Contract Review

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts

Locked behavior:

- Success output includes dryRunServiceInvocationResults and excludes runtime error fields.
- Cleanup failure output includes dryRunServiceInvocationResults and dryRunRuntimeCleanupError only.
- Factory failure output includes dryRunRuntimeFactoryError only.
- Preview and blocked outputs do not include runtime-only fields.

### Checkpoint 48.9 - Final Runtime Smoke Validation

Runtime validation:

- PostgreSQL container was healthy.
- DATABASE_URL was set to postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway for host-local validation.
- npm run db:migrate:deploy --workspace api-gateway passed with 7 migrations and no pending migrations.
- analytics:rollup:scheduler-preview command dry-run runtime smoke passed with --event-limit=500.
- Runtime output reached dry-run-ready.
- Runtime output included usage and rejected dryRunServiceInvocationResults.
- Runtime output included service-dry-run-invoked for both sources.
- Runtime output preserved no event reads, no rollup persistence, no quota mutation, and no raw event deletion.
- Runtime output did not include dryRunRuntimeCleanupError or dryRunRuntimeFactoryError on the happy path.

## Final Validation

Automated validation:

- npm run test passed with 105 test files and 763 tests.
- npm run typecheck passed.
- npm run build passed.

Runtime validation:

- Docker/PostgreSQL runtime smoke validation passed for analytics:rollup:scheduler-preview command dry-run.
- Migration deploy reported 7 migrations and no pending migrations.
- Runtime command dry-run reached executionDecision.status=dry-run-ready.
- Runtime output exposed source-separated dryRunServiceInvocationResults for usage and rejected.
- Runtime safety preserved executesBackfill=false, readsEvents=false, persistsRollups=false, affectsQuotaCounting=false, and deletesRawEvents=false.

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

Sprint 49 - Command Execute Contract Review.

Recommended scope:

- Review command execute request and response contracts.
- Define execute guardrails before any execute wiring.
- Define rollback expectations and operator output before any execute runtime work.
- Keep command dry-run runtime behavior unchanged.
- Keep process-local and external scheduler execution blocked.
- Keep quota counting unchanged.
- Keep raw event deletion forbidden.