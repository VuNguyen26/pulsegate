# Rollup Scheduler Command Dry-Run Runtime Output Hardening

## Status

Accepted.

## Context

Sprint 47 wired direct CLI scheduler command dry-run to call AnalyticsRollupBackfillService.runBackfill in dry-run mode only.

That runtime path stayed command-only, dry-run-only, event-limit guarded, source-separated, and non-destructive.

Sprint 48 hardened the operator output and runtime failure behavior around that path before any execute-mode or automatic scheduler work.

## Decision

Harden command dry-run runtime output while preserving the existing safety boundaries.

Sprint 48 locks:

- External scheduler dry-run with --event-limit remains blocked before runtime service factory resolution.
- Injected dry-run backfill service failures return source-scoped failed-closed-service-error output.
- Source-separated partial failures preserve successful source results when another source fails.
- Runtime cleanup failures preserve dryRunServiceInvocationResults and expose dryRunRuntimeCleanupError.
- Invalid event-limit and invalid max-bucket inputs fail before runtime factory resolution.
- Runtime service factory failures expose dryRunRuntimeFactoryError without invoking the backfill service.
- Runtime output field visibility is explicit:
  - success includes dryRunServiceInvocationResults only
  - cleanup failure includes dryRunServiceInvocationResults and dryRunRuntimeCleanupError
  - factory failure includes dryRunRuntimeFactoryError only
  - preview and blocked paths do not include runtime-only fields
- Docker/PostgreSQL runtime smoke validation remains required for the DB-backed runtime factory path.

## Safety Boundaries

Sprint 48 does not:

- create a scheduled/background rollup job
- wire process-local scheduler execution
- wire external scheduler execution
- wire execute-mode backfill
- read raw usage events through scheduler service dry-run
- read raw rejected events through scheduler service dry-run
- persist rollups through scheduler service dry-run
- change quota counting
- change usage recording
- change rejected event recording
- switch summary APIs to rollup reads
- add retention execute behavior
- delete raw events

## Validation

Automated validation:

- npm run test passed with 105 test files and 763 tests.
- npm run typecheck passed.
- npm run build passed.

Docker/PostgreSQL runtime validation:

- PostgreSQL container was healthy.
- DATABASE_URL was set to the host-local gateway schema connection string.
- npm run db:migrate:deploy --workspace api-gateway passed with 7 migrations and no pending migrations.
- analytics:rollup:scheduler-preview command dry-run runtime smoke passed with --event-limit=500.
- Runtime output reached executionDecision.status=dry-run-ready.
- Runtime output exposed dryRunServiceInvocationResults for usage and rejected sources.
- Runtime output exposed service-dry-run-invoked results with serviceResult.mode=dry-run.
- Runtime output exposed runtimeConsistency.status=runtime-dry-run-service-invocation-wired.
- Runtime output did not expose dryRunRuntimeCleanupError or dryRunRuntimeFactoryError on the happy path.
- Runtime safety preserved executesBackfill=false, readsEvents=false, persistsRollups=false, affectsQuotaCounting=false, and deletesRawEvents=false.

## Consequences

Command dry-run runtime service invocation is now hardened enough for operator-facing dry-run output review.

Sprint 49 can review command execute contracts, but execute mode must remain blocked until explicit execute guardrails, rollback expectations, operator output, and runtime validation are designed.