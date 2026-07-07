# Sprint 39 - Rollup Scheduler Command Dry-Run Service Invocation Contract Review

Date: 2026-07-07

Status: Complete

Version: v0.40.0

## Goal

Make the future scheduler command dry-run service invocation boundary explicit before wiring any real backfill service call.

Sprint 39 continued the safe rollup scheduler execution path from Sprint 38. It stayed DB-free, preview-only, and non-destructive.

## Changes

### Checkpoint 39.1 - Service Invocation Contract Review Model

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.test.ts

Added dryRunServiceInvocationContractReview under dryRunDesignReview for command:dry-run requests.

The review documents:

- serviceBoundary=scheduler-command-to-rollup-backfill-service
- currentServiceInvocationState=not-wired
- allowedTrigger=command
- allowedBackfillMode=dry-run
- requestSource=scheduler-runner-backfill-requests
- invocationCardinality=per-source-backfill-request
- requiresReadyRunnerPlan=true
- requiresDryRunRequestMode=true
- requiresNonInvokingPreviewBeforeWiring=true
- requiresEventLimitGuardrail=true
- requiresMaxBucketGuardrail=true
- requiresSourceSeparation=true
- requiresDockerPostgresRuntimeValidation=true
- serviceInvocationCurrentlyAllowed=false
- dryRunServiceMayReadEvents=false
- dryRunServiceMayPersistRollups=false
- quotaCountingChangeAllowed=false
- rawEventDeletionAllowed=false
- failureBehavior=fail-closed-before-service-invocation

### Checkpoint 39.2 - Command Output Coverage

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts

Added command-level JSON output coverage for dryRunServiceInvocationContractReview.

### Checkpoint 39.3 - Usage Text Contract

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts

Updated scheduler preview usage text to mention dryRunServiceInvocationContractReview.

### Checkpoint 39.4 - Runtime Command Validation

Validated:

- command:dry-run remains blocked with backfill-service-invocation-not-wired and exposes dryRunServiceInvocationContractReview.
- process-local:dry-run remains blocked with automatic-trigger-not-wired and dryRunDesignReview=null.

## Safety Boundaries Preserved

Sprint 39 did not:

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

- npm run test -> 103 test files / 717 tests passed
- npm run typecheck -> passed
- npm run build -> passed

Targeted validation:

- analytics-rollup-scheduler-execution-decision.test.ts -> 11 tests passed
- analytics-rollup-scheduler-preview.command.test.ts -> 12 tests passed
- api-gateway typecheck -> passed

Runtime command validation:

- analytics:rollup:scheduler-preview command:dry-run service invocation contract review -> passed
- analytics:rollup:scheduler-preview process-local:dry-run blocked boundary -> passed

Docker/PostgreSQL validation:

- Not required for Sprint 39 because the scheduler command dry-run service invocation contract review stayed DB-free, preview-only, and non-destructive.

## Commit

- bef1461 feat(gateway): add rollup scheduler dry-run service invocation contract review