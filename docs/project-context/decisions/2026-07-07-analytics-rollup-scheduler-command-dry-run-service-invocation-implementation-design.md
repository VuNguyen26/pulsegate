# Decision: Analytics Rollup Scheduler Command Dry-Run Service Invocation Implementation Design

Date: 2026-07-07

Status: Accepted

## Context

The rollup scheduler preview can produce dry-run backfill request contracts from a schedule plan. Previous sprints exposed execution boundary, wiring review, command dry-run design review, invocation contract, invocation readiness, invocation design review, and service invocation contract review output.

Before the scheduler command can invoke the rollup backfill service in dry-run mode, the implementation boundary needs to be explicit and reviewable. Sprint 40 intentionally stops at implementation design and does not wire a service adapter, request mapper, or real service call.

## Decision

Expose dryRunServiceInvocationImplementationDesign under dryRunDesignReview for command:dry-run scheduler preview requests.

The implementation design is design-only and keeps current implementation unwired:

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
- implementationCurrentlyAllowed=false
- serviceInvocationCurrentlyAllowed=false
- dryRunServiceMayReadEvents=false
- dryRunServiceMayPersistRollups=false
- quotaCountingChangeAllowed=false
- rawEventDeletionAllowed=false

Future wiring must still require:

- ready scheduler runner plan
- dry-run request mode
- non-invoking preview before invocation
- per-source invocation
- source separation
- event limit guardrail
- max bucket guardrail
- operator safety output
- fail-closed service errors
- Docker/PostgreSQL runtime validation

## Consequences

Command dry-run remains blocked with backfill-service-invocation-not-wired.

Process-local and external scheduler dry-run remain blocked with automatic-trigger-not-wired and do not expose command dryRunDesignReview.

The scheduler preview remains DB-free, preview-only, and non-destructive.

No backfill service is invoked.

No raw events are read.

No rollups are persisted.

No quota counting behavior changes.

No raw event deletion is introduced.

## Validation

Sprint 40 validation passed:

- npm run test -> 103 test files / 718 tests passed
- npm run typecheck -> passed
- npm run build -> passed
- Runtime command validation passed for command:dry-run service invocation implementation design.
- Runtime command validation passed for process-local:dry-run blocked boundary.
- Docker/PostgreSQL validation was not required because this remained DB-free, preview-only, and non-destructive.