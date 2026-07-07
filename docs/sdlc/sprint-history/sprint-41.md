# Sprint 41 - Rollup Scheduler Command Dry-Run Service Invocation Request Mapper Design

Date: 2026-07-08

Status: Complete

Version: v0.42.0

## Goal

Add the request mapper boundary from scheduler runner dry-run backfill request contracts to rollup backfill service dry-run input contracts before wiring any real backfill service call.

Sprint 41 continued the safe rollup scheduler execution path from Sprint 40. It stayed DB-free, mapper-only, preview-only, and non-destructive.

## Changes

### Checkpoint 41.1 - Scheduler Backfill Request Mapper

Added:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-backfill-request-mapper.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-backfill-request-mapper.test.ts

Behavior:

- Maps AnalyticsRollupSchedulerBackfillRequest to dry-run AnalyticsRollupBackfillRunInput.
- Maps ready scheduler runner plans into one dry-run service input per planned source.
- Preserves usage and rejected source separation.
- Requires ready runner plans before runner-level mapping.
- Requires dry-run request mode.
- Requires non-invoking request contracts.
- Requires explicit positive eventLimit guardrail.
- Maps maxBuckets from request.bucketCount so the mapper cannot widen the planned scheduler window.
- Returns mapper safety output with mapperOnly=true, invokesBackfillService=false, readsEvents=false, persistsRollups=false, affectsQuotaCounting=false, deletesRawEvents=false, and serviceInvocationCurrentlyAllowed=false.

### Checkpoint 41.2 - Request Mapper Design Output

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.test.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts

Behavior:

- Added dryRunServiceInvocationRequestMapperDesign under dryRunDesignReview for command:dry-run requests.
- Documented mapperBoundary=scheduler-backfill-request-to-backfill-service-run-input.
- Kept currentMapperState=implemented-model-only.
- Kept mapperCurrentlyAllowed=true.
- Kept serviceInvocationCurrentlyAllowed=false.
- Kept mapperMayInvokeBackfillService=false.
- Kept mapperMayReadEvents=false.
- Kept mapperMayPersistRollups=false.
- Kept quotaCountingChangeAllowed=false.
- Kept rawEventDeletionAllowed=false.
- Kept command dry-run blocked with backfill-service-invocation-not-wired.
- Kept process-local dry-run blocked with automatic-trigger-not-wired and dryRunDesignReview=null.

### Checkpoint 41.3 - Runtime Command Validation

Validated:

- command:dry-run remains blocked with backfill-service-invocation-not-wired and exposes dryRunServiceInvocationRequestMapperDesign.
- process-local:dry-run remains blocked with automatic-trigger-not-wired and dryRunDesignReview=null.
- No backfill service is invoked.
- No events are read.
- No rollups are persisted.
- No quota counting behavior changes.
- No raw event deletion is introduced.

## Safety Boundaries Preserved

Sprint 41 did not:

- create a scheduled/background rollup job
- invoke the backfill service
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

- npm run test -> 104 test files / 725 tests passed
- npm run typecheck -> passed
- npm run build -> passed

Targeted validation:

- analytics-rollup-scheduler-backfill-request-mapper.test.ts -> 5 tests passed
- analytics-rollup-scheduler-execution-decision.test.ts -> 13 tests passed
- analytics-rollup-scheduler-preview.command.test.ts -> 13 tests passed

Runtime command validation:

- analytics:rollup:scheduler-preview command:dry-run request mapper design -> passed
- analytics:rollup:scheduler-preview process-local:dry-run blocked boundary -> passed

Docker/PostgreSQL validation:

- Not required for Sprint 41 because the scheduler command dry-run request mapper design stayed DB-free, mapper-only, preview-only, and non-destructive.

## Commits

- c2efae3 feat(gateway): add rollup scheduler dry-run backfill request mapper
- d42b38a feat(gateway): expose rollup scheduler dry-run request mapper design