# Decision: Analytics Rollup Scheduler Command Dry-Run Service Invocation Fail-Closed Error Model

## Date

2026-07-08

## Status

Accepted

## Context

Sprint 44 exposed a command dry-run service invocation wiring readiness review, but the scheduler preview still did not model the detailed operator-facing failure output expected if a future dry-run service invocation fails.

Before any command dry-run can call AnalyticsRollupBackfillService.runBackfill, the failure behavior must be explicit, blocked, source-aware, non-destructive, and test-covered.

## Decision

Expose dryRunServiceInvocationFailClosedErrorModel under dryRunDesignReview for command:dry-run scheduler preview requests.

The model keeps:

- currentServiceInvocationState=not-wired
- targetTrigger=command
- targetBackfillMode=dry-run
- targetServiceMethod=runBackfill
- expectedFailureSource=future-backfill-service-dry-run-invocation
- expectedOperatorOutput=operator-visible-fail-closed-service-error-review
- operatorReviewRequired=true
- sourceScopedErrorOutputRequired=true
- safetyFlagsRequiredOnFailure=true
- noPartialPersistenceRequired=true
- noPartialQuotaMutationRequired=true
- noRawEventDeletionRequired=true
- failureState=blocked
- blockedReason=backfill-service-invocation-not-wired
- serviceInvocationCurrentlyAllowed=false
- partialPersistenceAllowed=false
- quotaCountingChangeAllowed=false
- rawEventDeletionAllowed=false
- failureBehavior=fail-closed-without-partial-persistence

The scheduler preview command also documents this field in usage text and locks it in command output tests.

## Non-Goals

Sprint 45 does not:

- Wire AnalyticsRollupBackfillService.runBackfill.
- Invoke the backfill service.
- Execute backfill.
- Read raw usage events.
- Read raw rejected events.
- Persist usage rollups.
- Persist rejected rollups.
- Change quota counting.
- Change usage recording.
- Change rejected event recording.
- Switch runtime summaries to rollup reads.
- Create scheduled/background jobs.
- Delete raw events.
- Expose retention execution.

## Consequences

Future command dry-run service invocation wiring must preserve the fail-closed model and make real service errors operator-visible without partial persistence, quota mutation, or raw event deletion.

Sprint 46 can design the wiring contract with the fail-closed output already modeled, but real service invocation must remain blocked-by-default until explicit approval and Docker/PostgreSQL validation.

## Validation

Sprint 45 validation:

- npm run test -> 105 test files passed, 742 tests passed.
- npm run typecheck -> passed.
- npm run build -> passed.
- Runtime command assertion passed for analytics:rollup:scheduler-preview command dry-run fail-closed error model output with --event-limit=500.

No Docker/PostgreSQL validation was required because Sprint 45 stayed DB-free, model/test/command-output-only, and non-destructive.