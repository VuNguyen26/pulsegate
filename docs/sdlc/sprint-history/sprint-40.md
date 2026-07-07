# Sprint 40 - Rollup Scheduler Command Dry-Run Service Invocation Implementation Design

Date: 2026-07-07

Status: Complete

Version: v0.41.0

## Goal

Make the future scheduler command dry-run service invocation implementation boundary explicit before wiring any real backfill service call.

Sprint 40 continued the safe rollup scheduler execution path from Sprint 39. It stayed DB-free, preview-only, and non-destructive.

## Changes

### Checkpoint 40.1 - Service Invocation Implementation Design Model

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.test.ts

Added dryRunServiceInvocationImplementationDesign under dryRunDesignReview for command:dry-run requests.

The design documents:

- status=implementation-design-required-before-wiring
- implementationBoundary=scheduler-command-dry-run-to-rollup-backfill-service
- currentImplementationState=not-implemented
- targetTrigger=command
- targetBackfillMode=dry-run
- requestSource=scheduler-runner-backfill-requests
- plannedInvocationCardinality=per-source-backfill-request
- targetDryRunBehavior=service-dry-run-plan-only
- serviceAdapterRequired=true
- requestMapperRequired=true
- requiresReadyRunnerPlan=true
- requiresDryRunRequestMode=true
- requiresNonInvokingPreviewBeforeInvocation=true
- requiresPerSourceInvocation=true
- requiresSourceSeparation=true
- requiresEventLimitGuardrail=true
- requiresMaxBucketGuardrail=true
- requiresOperatorSafetyOutput=true
- requiresFailClosedServiceErrors=true
- requiresDockerPostgresRuntimeValidation=true
- implementationCurrentlyAllowed=false
- serviceInvocationCurrentlyAllowed=false
- dryRunServiceMayReadEvents=false
- dryRunServiceMayPersistRollups=false
- quotaCountingChangeAllowed=false
- rawEventDeletionAllowed=false

### Checkpoint 40.2 - Command Output Coverage and Usage Text

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts

Added command-level JSON output coverage for dryRunServiceInvocationImplementationDesign.

Updated scheduler preview usage text to mention:

- dryRunServiceInvocationImplementationDesign
- explicit implementation design
- fail-closed service errors
- operator safety output
- Docker/PostgreSQL runtime validation

### Checkpoint 40.3 - Runtime Command Validation

Validated:

- command:dry-run remains blocked with backfill-service-invocation-not-wired and exposes dryRunServiceInvocationImplementationDesign.
- process-local:dry-run remains blocked with automatic-trigger-not-wired and dryRunDesignReview=null.

## Safety Boundaries Preserved

Sprint 40 did not:

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

- npm run test -> 103 test files / 718 tests passed
- npm run typecheck -> passed
- npm run build -> passed

Targeted validation:

- analytics-rollup-scheduler-execution-decision.test.ts -> 12 tests passed
- analytics-rollup-scheduler-preview.command.test.ts -> 12 tests passed
- api-gateway typecheck -> passed

Runtime command validation:

- analytics:rollup:scheduler-preview command:dry-run service invocation implementation design -> passed
- analytics:rollup:scheduler-preview process-local:dry-run blocked boundary -> passed

Docker/PostgreSQL validation:

- Not required for Sprint 40 because the scheduler command dry-run service invocation implementation design stayed DB-free, preview-only, and non-destructive.

## Commits

- 6703d2d feat(gateway): add rollup scheduler dry-run service invocation implementation design