# Sprint 45 - Rollup Scheduler Command Dry-Run Service Invocation Fail-Closed Error Model

## Status

Done.

## Version

v0.46.0

## Summary

Sprint 45 added a fail-closed error model for future rollup scheduler command dry-run service invocation.

The sprint stayed model/test/command-output-only and did not wire any real backfill service call.

## Commits

- 275077a feat(gateway): add rollup scheduler dry-run fail-closed error model
- 68eb2e7 test(gateway): lock rollup scheduler dry-run fail-closed command output

## Changes

### Checkpoint 45.1 - Fail-Closed Error Model Contract

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.test.ts

Added:

- dryRunServiceInvocationFailClosedErrorModel under dryRunDesignReview for command:dry-run requests.

Locked behavior:

- status=fail-closed-error-model-required-before-service-invocation
- errorBoundary=scheduler-command-dry-run-service-invocation
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
- mayInvokeBackfillServiceAfterExplicitWiring=true
- mayReadEventsThroughFailedServiceDryRun=false
- mayPersistRollupsThroughFailedServiceDryRun=false
- partialPersistenceAllowed=false
- quotaCountingChangeAllowed=false
- rawEventDeletionAllowed=false
- failureBehavior=fail-closed-without-partial-persistence

Validation:

- Targeted execution decision test passed with 16 tests.
- Full validation passed with 105 test files and 741 tests.
- npm run typecheck passed.
- npm run build passed.

### Checkpoint 45.2 - Command Output Contract Hardening

Updated:

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts

Added:

- Command output test coverage for dryRunServiceInvocationFailClosedErrorModel.
- Usage text coverage for the new fail-closed model and operator review expectations.

Locked behavior:

- Command dry-run output exposes dryRunServiceInvocationFailClosedErrorModel.
- Command dry-run remains blocked with backfill-service-invocation-not-wired.
- Service invocation remains disallowed.
- Partial persistence remains disallowed.
- Quota counting changes remain disallowed.
- Raw event deletion remains disallowed.
- Scheduler preview safety flags remain non-destructive.

Validation:

- Targeted scheduler preview command test passed with 19 tests.
- Runtime command assertion passed for command dry-run fail-closed error model output with --event-limit=500.
- Full validation passed with 105 test files and 742 tests.
- npm run typecheck passed.
- npm run build passed.

## Final Validation

- npm run test -> 105 test files passed, 742 tests passed.
- npm run typecheck -> passed.
- npm run build -> passed.
- Runtime command assertion passed for analytics:rollup:scheduler-preview command dry-run fail-closed error model output with --event-limit=500.

Runtime assertion covered:

- executionDecision.status=blocked
- executionDecision.blockedReason=backfill-service-invocation-not-wired
- dryRunServiceInvocationFailClosedErrorModel is present
- serviceInvocationCurrentlyAllowed=false
- partialPersistenceAllowed=false
- quotaCountingChangeAllowed=false
- rawEventDeletionAllowed=false
- execution safety flags remain false for backfill invocation, event reads, persistence, quota changes, and raw event deletion

## Docker/PostgreSQL Validation

Not required.

Reason:

- Sprint 45 stayed DB-free.
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

Sprint 46 - Command Dry-Run Service Invocation Wiring Contract.

Recommended scope:

- Define the command dry-run service invocation wiring contract.
- Keep service invocation blocked-by-default until explicit approval.
- Preserve fail-closed error output, operator safety output, source separation, event limit guardrails, max bucket guardrails, and Docker/PostgreSQL validation requirements.
- Do not wire execute mode.
- Do not wire process-local or external scheduler execution.