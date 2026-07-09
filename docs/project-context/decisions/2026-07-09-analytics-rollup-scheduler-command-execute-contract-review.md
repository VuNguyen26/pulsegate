# Rollup Scheduler Command Execute Contract Review

## Status

Accepted.

## Context

Sprint 48 hardened direct command dry-run runtime output after Sprint 47 wired command-only dry-run service invocation.

The next risk boundary is command execute. Execute can eventually read events and persist rollups, so its confirmation, guardrails, rollback expectations, persistence scope, and operator output must be visible before runtime wiring.

## Decision

Keep command execute review-only in Sprint 49.

Sprint 49 locks:

- commandExecuteContractReview is exposed for command:execute scheduler preview requests.
- commandExecuteReadinessReview is exposed for command:execute scheduler preview requests.
- commandExecuteOperatorOutputReview is exposed for command:execute scheduler preview requests.
- command execute remains blocked with backfill-execution-not-wired.
- Future execute wiring requires explicit operator confirmation.
- Future execute wiring requires ready runner plan, prior dry-run runtime validation, explicit event limit, max bucket bound, bounded bucket count, and source-separated execution.
- Future execute persistence scope is rollup-tables-only.
- Future execute rollback expectation is bounded-idempotent-rollup-upsert-or-fail-closed-before-execution.
- Operator output must include confirmation requirement, blocked reason, readiness status, contract review status, persistence scope, rollback expectation, source-scoped planned requests, safety flags, no quota mutation, and no raw event deletion.
- process-local and external scheduler execution remain blocked with automatic-trigger-not-wired.
- command dry-run runtime behavior remains unchanged.

## Safety Boundaries

Sprint 49 does not:

- create a scheduled/background rollup job
- wire process-local scheduler execution
- wire external scheduler execution
- wire execute-mode runtime behavior
- call AnalyticsRollupBackfillService.runBackfill in execute mode
- read raw usage events
- read raw rejected events
- persist rollups through scheduler execute
- change quota counting
- change usage recording
- change rejected event recording
- switch summary APIs to rollup reads
- add retention execute behavior
- delete raw events

## Validation

Automated validation:

- npm run test passed with 105 test files and 767 tests.
- npm run typecheck passed.
- npm run build passed.

Docker/PostgreSQL runtime validation:

- Not required for Sprint 49.
- Reason: Sprint 49 was DB-free and only changed contract/review models, command usage text, and tests.
- No runtime execute path, DB read, migration, Prisma persistence, rollup persistence, quota path, retention delete, or raw event deletion was introduced.

## Consequences

Command execute now has explicit review output for contract, readiness, and operator-facing expectations.

Sprint 50 can introduce a blocked-by-default command execute wiring preview, but execute runtime must remain blocked until guardrails, rollback behavior, operator controls, and Docker/PostgreSQL runtime validation are explicitly implemented and approved.