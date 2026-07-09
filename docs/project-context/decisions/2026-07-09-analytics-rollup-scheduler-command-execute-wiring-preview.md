# Rollup Scheduler Command Execute Wiring Preview

## Status

Accepted.

## Context

Sprint 49 exposed command execute contract, readiness, and operator output review while keeping execute runtime blocked.

The next safe boundary is a blocked-by-default command execute wiring preview. It should show the future execute wiring shape without invoking execute backfill, reading events, persisting rollups, changing quota counting, or deleting raw events.

## Decision

Keep command execute wiring preview blocked-by-default in Sprint 50.

Sprint 50 locks:

- commandExecuteWiringPreview is exposed for command:execute scheduler preview requests.
- command execute remains blocked with backfill-execution-not-wired for ready runner plans.
- skipped runner plans expose scheduler-runner-not-ready and zero source-scoped planned executions.
- process-local and external-scheduler execute requests remain blocked with automatic-trigger-not-wired and do not expose commandExecuteWiringPreview.
- commandExecuteWiringPreview reports status=execute-wiring-preview-blocked and currentWiringState=blocked-not-wired.
- commandExecuteWiringPreview reports confirmationState=not-confirmed and requiredConfirmation=explicit-operator-confirmation.
- sourceScopedPlannedExecutions show requestedMode=execute while keeping willInvokeBackfillService=false, willExecuteBackfill=false, willReadEvents=false, and willPersistRollups=false.
- executeRuntimeCurrentlyAllowed=false.
- backfillExecutionWired=false.
- serviceInvocationCurrentlyAllowed=false.
- eventReadCurrentlyAllowed=false.
- rollupPersistenceCurrentlyAllowed=false.
- quotaCountingChangeAllowed=false.
- rawEventDeletionAllowed=false.
- processLocalExecutionAllowed=false.
- externalSchedulerExecutionAllowed=false.
- scheduledJobCreationAllowed=false.

## Safety Boundaries

Sprint 50 does not:

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

- npm run test passed with 105 test files and 773 tests.
- npm run typecheck passed.
- npm run build passed.

Docker/PostgreSQL runtime validation:

- Not required for Sprint 50.
- Reason: Sprint 50 was DB-free and only changed command execute wiring preview model/output, command usage/runbook docs, and tests.
- No runtime execute path, DB read, migration, Prisma persistence, rollup persistence, quota path, retention delete, or raw event deletion was introduced.

## Consequences

Command execute now has explicit contract, readiness, operator output, and blocked-by-default wiring preview output.

Sprint 51 can consider command execute runtime wiring, but only with strict command-only guardrails, explicit operator confirmation, event-limit and max-bucket bounds, source separation, rollback expectation, operator output, and Docker/PostgreSQL runtime validation. Process-local/external scheduler execution and raw event deletion remain out of scope until explicitly designed.