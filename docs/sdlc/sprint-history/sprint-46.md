# Sprint 46 - Command Dry-Run Service Invocation Wiring Contract

## Status

Done.

## Version

v0.47.0

## Summary

Sprint 46 added a command dry-run service invocation wiring contract for future rollup scheduler dry-run service calls.

The sprint stayed model/test/command-output-only and did not wire any real backfill service call.

## Commits

- dfe5845 feat(gateway): add rollup scheduler dry-run wiring contract
- 99bd6f9 test(gateway): lock rollup scheduler dry-run wiring contract output

## Changes

### Checkpoint 46.1 - Wiring Contract Model Only

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.test.ts

Added:

- dryRunServiceInvocationWiringContract under dryRunDesignReview for command:dry-run requests.

Locked behavior:

- status=wiring-contract-required-before-service-invocation
- contractBoundary=scheduler-command-dry-run-to-rollup-backfill-service-run-backfill
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

Validation:

- Targeted execution decision test passed with 17 tests.
- Targeted scheduler preview command regression test passed with 19 tests.
- npm run typecheck --workspace api-gateway passed.
- npm run build --workspace api-gateway passed.

### Checkpoint 46.2 - Command Output Contract Hardening

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts

Added:

- Command output test coverage for dryRunServiceInvocationWiringContract.
- Usage text coverage for the new wiring contract and operator output expectations.

Locked behavior:

- Command dry-run output exposes dryRunServiceInvocationWiringContract.
- Command dry-run remains blocked with backfill-service-invocation-not-wired.
- Service invocation remains disallowed.
- Request/response contract remains operator-visible.
- Source-scoped result summary remains required for future wiring.
- Event-limit guardrail and max-bucket bound remain required.
- Quota counting changes remain disallowed.
- Raw event deletion remains disallowed.
- Scheduler preview safety flags remain non-destructive.

Validation:

- Targeted scheduler preview command and execution decision tests passed with 37 tests.
- npm run typecheck --workspace api-gateway passed.
- npm run build --workspace api-gateway passed.

## Final Validation

- npm run test -> 105 test files passed, 744 tests passed.
- npm run typecheck -> passed.
- npm run build -> passed.
- Runtime command assertion passed for analytics:rollup:scheduler-preview command dry-run wiring contract output with --event-limit=500.

Runtime assertion covered:

- executionDecision.status=blocked
- executionDecision.allowed=false
- executionDecision.blockedReason=backfill-service-invocation-not-wired
- dryRunServiceInvocationWiringContract is present
- currentWiringState=not-wired
- targetTrigger=command
- targetBackfillMode=dry-run
- targetServiceMethod=runBackfill
- requestContract.inputSource=mapped-dry-run-service-inputs
- requestContract.requiresExplicitEventLimit=true
- requestContract.requiresMaxBucketBound=true
- responseContract.sourceScopedResultsRequired=true
- operatorOutputContract.includeNoQuotaMutationStatement=true
- operatorOutputContract.includeNoRawEventDeletionStatement=true
- backfillServiceInvocationWired=false
- serviceInvocationCurrentlyAllowed=false
- mayReadEventsThroughServiceDryRun=false
- mayPersistRollupsThroughServiceDryRun=false
- quotaCountingChangeAllowed=false
- rawEventDeletionAllowed=false
- execution safety flags remain false for backfill invocation, event reads, persistence, quota changes, and raw event deletion

## Docker/PostgreSQL Validation

Not required.

Reason:

- Sprint 46 stayed DB-free.
- Scheduler preview did not import Prisma.
- Scheduler preview did not connect to PostgreSQL.
- Scheduler preview did not call AnalyticsRollupBackfillService.runBackfill.
- Scheduler preview did not read raw events.
- Scheduler preview did not persist rollups.
- Scheduler preview did not change quota counting.
- Scheduler preview did not delete raw events.

## Safety Boundaries Preserved

- No scheduled/background rollup job.
- No backfill service invocation from scheduler preview.
- No call to AnalyticsRollupBackfillService.runBackfill from scheduler preview.
- No backfill execution.
- No raw usage event reads.
- No raw rejected event reads.
- No rollup persistence.
- No quota counting change.
- No usage recorder change.
- No rejected event recorder change.
- No rollup summary API switch.
- No retention execute command.
- No operator-facing raw event deletion.

## Next Sprint

Sprint 47 - Command Dry-Run Service Invocation Runtime Wiring.

Recommended scope:

- Wire command dry-run to call AnalyticsRollupBackfillService.runBackfill in dry-run mode only.
- Require Docker/PostgreSQL runtime validation.
- Preserve source separation, event limit guardrails, max bucket guardrails, fail-closed service errors, and operator safety output.
- Keep execute mode blocked.
- Keep process-local and external scheduler execution blocked.
- Keep quota counting unchanged.
- Keep raw event deletion forbidden.