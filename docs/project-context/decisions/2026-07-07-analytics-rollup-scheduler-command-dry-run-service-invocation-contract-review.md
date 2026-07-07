# Decision: Analytics Rollup Scheduler Command Dry-Run Service Invocation Contract Review

Date: 2026-07-07

Status: Accepted

## Context

The rollup scheduler preview can produce dry-run backfill request contracts from a schedule plan. Previous sprints exposed execution boundary, wiring review, command dry-run design review, invocation contract, invocation readiness, and invocation design review output.

Before the scheduler command can invoke the rollup backfill service in dry-run mode, the service invocation boundary needs to be explicit and reviewable.

## Decision

Expose dryRunServiceInvocationContractReview under dryRunDesignReview for command:dry-run scheduler preview requests.

The review is contract-only and keeps current service invocation unwired:

- serviceBoundary=scheduler-command-to-rollup-backfill-service
- currentServiceInvocationState=not-wired
- allowedTrigger=command
- allowedBackfillMode=dry-run
- requestSource=scheduler-runner-backfill-requests
- invocationCardinality=per-source-backfill-request
- serviceInvocationCurrentlyAllowed=false
- dryRunServiceMayReadEvents=false
- dryRunServiceMayPersistRollups=false
- quotaCountingChangeAllowed=false
- rawEventDeletionAllowed=false
- failureBehavior=fail-closed-before-service-invocation

Future wiring must still require:

- ready scheduler runner plan
- dry-run request mode
- non-invoking preview before wiring
- per-source invocation
- source separation
- event limit guardrail
- max bucket guardrail
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

Sprint 39 validation passed:

- npm run test -> 103 test files / 717 tests passed
- npm run typecheck -> passed
- npm run build -> passed
- Runtime command validation passed for command:dry-run service invocation contract review.
- Runtime command validation passed for process-local:dry-run blocked boundary.
- Docker/PostgreSQL validation was not required because this remained DB-free and non-destructive.