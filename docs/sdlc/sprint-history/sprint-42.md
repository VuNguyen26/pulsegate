# Sprint 42 - Rollup Scheduler Command Dry-Run Service Adapter Boundary Design

Date: 2026-07-08

Status: Complete

Version: v0.43.0

## Goal

Define the service adapter boundary from mapped scheduler dry-run backfill service inputs to a future rollup backfill service dry-run call before wiring any real service invocation.

Sprint 42 continued the safe rollup scheduler execution path from Sprint 41. It stayed DB-free, adapter-boundary-only, preview-only, and non-destructive.

## Changes

### Checkpoint 42.1 - Service Adapter Boundary Design Output

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.test.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts

Behavior:

- Added dryRunServiceAdapterBoundaryDesign under dryRunDesignReview for command:dry-run requests.
- Documented adapterBoundary=mapped-backfill-run-input-to-rollup-backfill-service-dry-run.
- Kept currentAdapterState=not-implemented.
- Kept adapterSource=future-scheduler-rollup-backfill-service-dry-run-adapter.
- Kept inputSource=analytics-rollup-backfill-run-input.
- Kept outputTarget=rollup-backfill-service-dry-run-result.
- Kept targetTrigger=command.
- Kept targetBackfillMode=dry-run.
- Kept targetDryRunBehavior=service-dry-run-plan-only.
- Required ready runner plan, mapped dry-run service input, dry-run backfill plan, per-source invocation, source separation, event limit guardrails, max bucket guardrails, operator safety output, fail-closed service errors, and Docker/PostgreSQL runtime validation.
- Kept adapterCurrentlyAllowed=false.
- Kept serviceInvocationCurrentlyAllowed=false.
- Kept adapterMayInvokeBackfillService=false.
- Kept adapterMayReadEvents=false.
- Kept adapterMayPersistRollups=false.
- Kept quotaCountingChangeAllowed=false.
- Kept rawEventDeletionAllowed=false.
- Kept failureBehavior=fail-closed-before-service-invocation.
- Kept command dry-run blocked with backfill-service-invocation-not-wired.
- Kept process-local dry-run blocked with automatic-trigger-not-wired and dryRunDesignReview=null.

### Checkpoint 42.2 - Adapter Contract Model

Added:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-backfill-service-adapter.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-backfill-service-adapter.test.ts

Behavior:

- Added a contract-model-only adapter preview for mapped dry-run AnalyticsRollupBackfillRunInput values.
- Validates that mapped inputs preserve non-invoking mapper safety.
- Requires plan.mode=dry-run.
- Requires one source per mapped service input.
- Requires plan.source to match the mapped source.
- Requires explicit positive eventLimit.
- Requires positive planned bucket count.
- Rejects duplicate mapped sources before preview creation.
- Produces planned dry-run service result output without calling AnalyticsRollupBackfillService.runBackfill.
- Keeps invokesBackfillService=false, readsEvents=false, persistsRollups=false, affectsQuotaCounting=false, deletesRawEvents=false, and serviceInvocationCurrentlyAllowed=false.

### Checkpoint 42.3 - Runtime Command Validation

Validated:

- command:dry-run remains blocked with backfill-service-invocation-not-wired and exposes dryRunServiceAdapterBoundaryDesign.
- process-local:dry-run remains blocked with automatic-trigger-not-wired and dryRunDesignReview=null.
- No backfill service is invoked.
- No events are read.
- No rollups are persisted.
- No quota counting behavior changes.
- No raw event deletion is introduced.

## Safety Boundaries Preserved

Sprint 42 did not:

- create a scheduled/background rollup job
- invoke the backfill service
- call AnalyticsRollupBackfillService.runBackfill from scheduler preview
- execute backfill
- read raw usage events
- read raw rejected events
- persist usage rollups
- persist rejected rollups
- affect quota counting
- delete raw events
- change usage recorder behavior
- change rejected event recorder behavior
- change rollup read APIs
- switch summary APIs to rollup reads
- touch retention delete execution paths

## Validation

Automated validation:

- npm run test -> 105 test files / 732 tests passed
- npm run typecheck -> passed
- npm run build -> passed

Targeted validation:

- analytics-rollup-scheduler-backfill-service-adapter.test.ts -> 5 tests passed
- analytics-rollup-scheduler-backfill-request-mapper.test.ts -> 5 tests passed
- analytics-rollup-scheduler-execution-decision.test.ts -> 14 tests passed
- analytics-rollup-scheduler-preview.command.test.ts -> 14 tests passed

Runtime command validation:

- analytics:rollup:scheduler-preview command:dry-run service adapter boundary design -> passed
- analytics:rollup:scheduler-preview process-local:dry-run blocked boundary -> passed

Docker/PostgreSQL validation:

- Not required for Sprint 42 because the scheduler command dry-run service adapter boundary design stayed DB-free, adapter-boundary-only, preview-only, and non-destructive.

## Commits

- 19e63ff feat(gateway): add rollup scheduler dry-run service adapter boundary
