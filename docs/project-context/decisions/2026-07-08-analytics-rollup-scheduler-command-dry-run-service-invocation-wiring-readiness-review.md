# Decision: Rollup Scheduler Command Dry-Run Service Invocation Wiring Readiness Review

## Date

2026-07-08

## Status

Accepted

## Context

Sprint 43 exposed command dry-run service adapter previews for scheduler preview output when --event-limit is provided.

That made the mapped input to planned service-result boundary visible, but the scheduler command still needed an explicit readiness review before any future service invocation wiring.

## Decision

Expose dryRunServiceInvocationWiringReadinessReview under dryRunDesignReview for command:dry-run scheduler preview requests.

The review remains non-invoking and reports:

- currentWiringState=not-wired
- readyForServiceInvocationWiring=false
- serviceInvocationCurrentlyAllowed=false
- targetTrigger=command
- targetBackfillMode=dry-run
- targetServiceMethod=runBackfill
- targetDryRunBehavior=service-dry-run-plan-only
- requiresReadyRunnerPlan=true
- requiresMappedDryRunServiceInputs=true
- requiresAdapterPreviewsBeforeWiring=true
- requiresPerSourceInvocation=true
- requiresSourceSeparation=true
- requiresEventLimitGuardrail=true
- requiresMaxBucketGuardrail=true
- requiresOperatorSafetyOutput=true
- requiresFailClosedServiceErrors=true
- requiresDockerPostgresRuntimeValidation=true

Command dry-run remains blocked with backfill-service-invocation-not-wired.

## Safety Rules

The scheduler preview command must still not:

- Create scheduled/background jobs.
- Invoke the backfill service.
- Call AnalyticsRollupBackfillService.runBackfill.
- Execute backfill.
- Read raw usage events.
- Read raw rejected events.
- Persist usage rollups.
- Persist rejected rollups.
- Affect quota counting.
- Delete raw events.

Process-local and external scheduler triggers remain blocked.

## Rationale

The scheduler command should not jump from adapter preview output to real service invocation without an explicit wiring readiness boundary.

The readiness review keeps future prerequisites visible in operator JSON output while preserving the current blocked state.

Keeping service invocation disallowed protects quota correctness, source separation, and raw event safety.

## Validation

Sprint 44 validation:

- npm run test -> 105 test files / 740 tests passed
- npm run typecheck -> passed
- npm run build -> passed
- Runtime command assertion passed for analytics:rollup:scheduler-preview command dry-run wiring readiness output with --event-limit=500

Docker/PostgreSQL validation was not required because the change was DB-free, preview-only, command-output-only, and non-destructive.

## Consequences

Positive:

- Future service invocation wiring prerequisites are explicit.
- Operator output now exposes a readiness boundary between adapter previews and real service invocation.
- Command dry-run remains blocked and safe.

Trade-offs:

- Real dry-run service invocation is still not available.
- Another sprint should model fail-closed service invocation errors before actual service wiring.

## Follow-Up

Recommended next sprint:

- Sprint 45 - Rollup Scheduler Command Dry-Run Service Invocation Fail-Closed Error Model
