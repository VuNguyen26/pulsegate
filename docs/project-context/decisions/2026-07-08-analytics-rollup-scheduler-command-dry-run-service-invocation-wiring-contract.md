# Decision: Analytics Rollup Scheduler Command Dry-Run Service Invocation Wiring Contract

## Date

2026-07-08

## Status

Accepted

## Context

Sprint 45 exposed a fail-closed error model for future command dry-run service invocation failures, but the scheduler preview still did not define the full request, response, validation, and operator output contract required before any real service call can be wired.

Before command dry-run can call AnalyticsRollupBackfillService.runBackfill, the wiring contract must remain explicit, command-only, dry-run-only, source-aware, bounded, fail-closed, non-destructive, and test-covered.

## Decision

Expose dryRunServiceInvocationWiringContract under dryRunDesignReview for command:dry-run scheduler preview requests.

The contract keeps:

- currentWiringState=not-wired
- targetTrigger=command
- targetBackfillMode=dry-run
- targetServiceMethod=runBackfill
- requestContract.inputSource=mapped-dry-run-service-inputs
- requestContract.requestMode=dry-run
- requestContract.cardinality=per-source-mapped-run-input
- requestContract.requiresReadyRunnerPlan=true
- requestContract.requiresSourceSeparatedInputs=true
- requestContract.requiresExplicitEventLimit=true
- requestContract.requiresMaxBucketBound=true
- responseContract.outputTarget=operator-visible-command-dry-run-output
- responseContract.requiredResultMode=dry-run
- responseContract.sourceScopedResultsRequired=true
- responseContract.perSourceSafetyFlagsRequired=true
- responseContract.serviceDryRunPlanRequired=true
- responseContract.partialFailureOutputRequired=true
- validationContract.rejectMissingEventLimit=true
- validationContract.rejectUnboundedBucketCount=true
- validationContract.rejectNonCommandTrigger=true
- validationContract.rejectExecuteMode=true
- validationContract.requiresDockerPostgresRuntimeValidationBeforeWiring=true
- operatorOutputContract.includeServiceInvocationState=true
- operatorOutputContract.includeBlockedReason=true
- operatorOutputContract.includeSourceScopedResultSummary=true
- operatorOutputContract.includeSafetyFlags=true
- operatorOutputContract.includeNoQuotaMutationStatement=true
- operatorOutputContract.includeNoRawEventDeletionStatement=true
- backfillServiceInvocationWired=false
- serviceInvocationCurrentlyAllowed=false
- mayInvokeBackfillServiceAfterExplicitWiring=true
- mayReadEventsThroughServiceDryRun=false
- mayPersistRollupsThroughServiceDryRun=false
- partialPersistenceAllowed=false
- quotaCountingChangeAllowed=false
- rawEventDeletionAllowed=false
- failureBehavior=fail-closed-before-service-invocation

The scheduler preview command also documents this field in usage text and locks it in command output tests.

## Non-Goals

Sprint 46 does not:

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

Future command dry-run service invocation wiring must satisfy the request, response, validation, and operator output contract before runtime service calls are enabled.

Sprint 47 can wire command dry-run to AnalyticsRollupBackfillService.runBackfill in dry-run mode only, but it must include Docker/PostgreSQL runtime validation and must preserve source separation, event-limit guardrails, max-bucket guardrails, fail-closed behavior, no quota mutation, no raw event deletion, and blocked execute/automatic trigger semantics.

## Validation

Sprint 46 validation:

- npm run test -> 105 test files passed, 744 tests passed.
- npm run typecheck -> passed.
- npm run build -> passed.
- Runtime command assertion passed for analytics:rollup:scheduler-preview command dry-run wiring contract output with --event-limit=500.

No Docker/PostgreSQL validation was required because Sprint 46 stayed DB-free, model/test/command-output-only, and non-destructive.