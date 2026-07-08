# Decision: Analytics Rollup Scheduler Command Dry-Run Service Adapter Boundary Design

Date: 2026-07-08

Status: Accepted

## Context

Sprint 41 added the mapper-only boundary from scheduler runner dry-run backfill request contracts to dry-run AnalyticsRollupBackfillRunInput contracts.

Before any scheduler command can invoke the rollup backfill service, PulseGate needs a service adapter boundary that is explicit, source-separated, guardrail-bound, fail-closed, and test-covered.

## Decision

Add a contract-model-only service adapter boundary for scheduler command dry-run service invocation design.

The adapter boundary:

- Accepts mapped dry-run AnalyticsRollupBackfillRunInput contracts.
- Validates that mapped inputs remain dry-run-only and non-invoking.
- Preserves one mapped service input per planned source.
- Requires plan.mode=dry-run.
- Requires source separation between usage and rejected inputs.
- Requires an explicit positive eventLimit guardrail.
- Requires a positive dry-run backfill plan bucket count.
- Rejects duplicate mapped sources.
- Produces planned dry-run service result output without calling AnalyticsRollupBackfillService.runBackfill.
- Fails closed before service invocation when mapped input safety is invalid.

Expose dryRunServiceAdapterBoundaryDesign under dryRunDesignReview for command:dry-run scheduler preview output.

## Safety Constraints

Sprint 42 keeps:

- command dry-run blocked with backfill-service-invocation-not-wired
- process-local dry-run blocked with automatic-trigger-not-wired
- adapterCurrentlyAllowed=false
- serviceInvocationCurrentlyAllowed=false
- adapterMayInvokeBackfillService=false
- adapterMayReadEvents=false
- adapterMayPersistRollups=false
- quotaCountingChangeAllowed=false
- rawEventDeletionAllowed=false
- failureBehavior=fail-closed-before-service-invocation

Sprint 42 does not:

- create scheduled/background jobs
- invoke the backfill service
- call AnalyticsRollupBackfillService.runBackfill from scheduler preview
- execute backfill
- read raw usage events
- read raw rejected events
- persist rollups
- change quota counting
- delete raw events
- wire retention delete execution

## Consequences

Future scheduler command dry-run service invocation still requires an explicit wiring step before any service call is allowed.

Docker/PostgreSQL runtime validation is still required before future wiring that invokes the backfill service, reads events, or persists rollups.

Execute mode remains blocked until command dry-run invocation is safely mapped, adapted, explicitly wired, and runtime-validated first.

Process-local and external scheduler execution remain blocked until automatic execution semantics are explicitly designed.

## Validation

- npm run test -> 105 test files / 732 tests passed
- npm run typecheck -> passed
- npm run build -> passed
- analytics:rollup:scheduler-preview command dry-run runtime validation -> passed
- analytics:rollup:scheduler-preview process-local dry-run runtime validation -> passed

Docker/PostgreSQL validation was not required because this decision stayed DB-free, adapter-boundary-only, preview-only, and non-destructive.
