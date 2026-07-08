# Analytics Rollup Scheduler Preview Runbook

## Scope

This runbook covers the analytics rollup scheduler preview command.

The command can run in three safe operator-visible modes:

- Default preview: plans scheduler dry-run backfill request contracts without invoking the backfill service.
- Direct command dry-run with --event-limit: invokes AnalyticsRollupBackfillService.runBackfill in dry-run mode only and prints source-separated dryRunServiceInvocationResults.
- Blocked review paths: dry-run without event-limit, process-local dry-run, external scheduler dry-run, and execute mode remain blocked.

It is not a scheduler job and does not execute rollup work.

---

## Base Command

    npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --run-at <iso> --granularity <hour|day>

Schedule options:

- --run-at <iso>: required scheduler run timestamp.
- --granularity <hour|day>: required rollup granularity.
- --enabled <true|false>: optional, defaults to false.
- --source <usage|rejected|both>: optional, defaults to both.
- --lookback-buckets <n>: optional positive integer, defaults to 1.
- --safety-delay-ms <n>: optional non-negative integer, defaults to 300000.
- --max-buckets <n>: optional positive integer guardrail.

Execution boundary options:

- --execution-trigger <command|process-local|external-scheduler>: optional, defaults to command.
- --execution-mode <preview|dry-run|execute>: optional, defaults to preview.
- --event-limit <n>: positive integer required for direct command dry-run runtime service invocation.

Argument style:

- The command accepts both --option value and --option=value forms.

---

## Safety Model

Default preview and blocked paths do not:

- Create scheduled/background jobs.
- Invoke the backfill service.
- Execute backfill.
- Read raw usage events.
- Read raw rejected events.
- Persist usage rollups.
- Persist rejected rollups.
- Affect quota counting.
- Delete raw events.
- Connect to PostgreSQL.
- Use Prisma.

Direct command dry-run with --event-limit does:

- Resolve a Prisma-backed runtime AnalyticsRollupBackfillService factory.
- Invoke AnalyticsRollupBackfillService.runBackfill in dry-run mode only.
- Emit dryRunServiceInvocationResults.

Direct command dry-run still does not:

- Create scheduled/background jobs.
- Execute backfill.
- Read raw events through service dry-run.
- Persist rollups through service dry-run.
- Affect quota counting.
- Delete raw events.

---

## Docker/PostgreSQL Setup for Runtime Dry-Run

From the host:

    cd E:\pulsegate

    $env:DATABASE_URL = "postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway"

    docker compose up -d postgres
    docker compose ps postgres

    npm run db:migrate:deploy --workspace api-gateway

The database migration step should report no pending migrations after the local schema is current.

---

## Enabled Preview Example

    cd E:\pulsegate

    npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --lookback-buckets 1 --safety-delay-ms 300000 --max-buckets 1

Expected result:

- kind is analytics-rollup-scheduler-runner.
- mode is preview.
- status is ready.
- scheduleStatus is planned.
- sources contains usage and rejected.
- backfillRequests contains dry-run contracts for usage and rejected.
- willInvokeBackfillService is false.
- willReadEvents is false.
- willPersistRollups is false.
- executionDecision.status is preview-ready.
- executionDecision.allowed is true.
- executionDecision.boundary.allowedMode is preview.
- executionDecision.boundary.backfillServiceInvocationWired is false.
- executionDecision.wiringReview.runtimeConsistency.status is preview-only.
- dryRunServiceInvocationResults is not present.

---

## Command Dry-Run Runtime Service Invocation Example

    cd E:\pulsegate

    $env:DATABASE_URL = "postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway"

    npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --lookback-buckets 1 --safety-delay-ms 300000 --max-buckets 1 --execution-mode dry-run --event-limit 500

Expected result:

- executionDecision.status is dry-run-ready.
- executionDecision.allowed is true.
- executionDecision.blockedReason is null.
- executionDecision.boundary.trigger is command.
- executionDecision.boundary.requestedMode is dry-run.
- executionDecision.boundary.allowedMode is dry-run.
- executionDecision.boundary.backfillServiceInvocationWired is true.
- executionDecision.boundary.backfillExecutionWired is false.
- executionDecision.wiringReview.runtimeConsistency.status is runtime-dry-run-service-invocation-wired.
- executionDecision.wiringReview.runtimeConsistency.serviceInvocationCurrentlyAllowed is true.
- executionDecision.wiringReview.runtimeConsistency.invokesBackfillService is true.
- executionDecision.wiringReview.runtimeConsistency.executesBackfill is false.
- executionDecision.wiringReview.runtimeConsistency.readsEvents is false.
- executionDecision.wiringReview.runtimeConsistency.persistsRollups is false.
- executionDecision.wiringReview.runtimeConsistency.affectsQuotaCounting is false.
- executionDecision.wiringReview.runtimeConsistency.deletesRawEvents is false.
- dryRunServiceInvocationResults contains one usage result and one rejected result for source=both.
- Each dryRunServiceInvocationResults item has status=service-dry-run-invoked.
- Each serviceResult has mode=dry-run.
- Each serviceResult is source-scoped.
- Each serviceResult sourceResults item has status=planned.
- totalInputEventCount is 0.
- totalAggregateCount is 0.
- totalUpsertedCount is 0.

Safety expectations:

- No scheduled/background job is created.
- Execute mode is not wired.
- No raw events are read through service dry-run.
- No rollups are persisted through service dry-run.
- No quota counting changes.
- No raw events are deleted.

---

## Blocked Dry-Run Without Event Limit Example

    cd E:\pulsegate

    npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --lookback-buckets 1 --safety-delay-ms 300000 --max-buckets 1 --execution-mode dry-run

Expected result:

- executionDecision.status is blocked.
- executionDecision.allowed is false.
- executionDecision.blockedReason is backfill-service-invocation-not-wired.
- executionDecision.boundary.allowedMode is preview.
- executionDecision.boundary.backfillServiceInvocationWired is false.
- executionDecision.wiringReview.runtimeConsistency.status is blocked-or-review-only.
- dryRunServiceInvocationResults is not present.
- No backfill service is invoked.
- No events are read.
- No rollups are persisted.

---

## Blocked Process-Local Dry-Run Trigger Example

    cd E:\pulsegate

    npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --lookback-buckets 1 --safety-delay-ms 300000 --max-buckets 1 --execution-trigger process-local --execution-mode dry-run --event-limit 500

Expected result:

- executionDecision.status is blocked.
- executionDecision.allowed is false.
- executionDecision.blockedReason is automatic-trigger-not-wired.
- executionDecision.boundary.trigger is process-local.
- executionDecision.boundary.allowedMode is preview.
- executionDecision.boundary.processLocalExecutionWired is false.
- executionDecision.boundary.externalSchedulerExecutionWired is false.
- executionDecision.boundary.backfillServiceInvocationWired is false.
- executionDecision.wiringReview.runtimeConsistency.status is blocked-or-review-only.
- executionDecision.wiringReview.dryRunDesignReview is null.
- dryRunServiceInvocationResults is not present.
- No scheduled/background job is created.
- No backfill service is invoked.

---

## Blocked Execute Example

    cd E:\pulsegate

    npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --lookback-buckets 1 --safety-delay-ms 300000 --max-buckets 1 --execution-mode execute --event-limit 500

Expected result:

- executionDecision.status is blocked.
- executionDecision.allowed is false.
- executionDecision.blockedReason is backfill-execution-not-wired.
- executionDecision.boundary.requestedMode is execute.
- executionDecision.boundary.allowedMode is preview.
- executionDecision.boundary.backfillServiceInvocationWired is false.
- executionDecision.boundary.backfillExecutionWired is false.
- executionDecision.wiringReview.runtimeConsistency.status is blocked-or-review-only.
- dryRunServiceInvocationResults is not present.
- No backfill service is invoked.
- No execute backfill occurs.
- No events are read.
- No rollups are persisted.

---

## Disabled Preview Example

    cd E:\pulsegate

    npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --run-at 2026-07-06T13:07:00.000Z --granularity hour --source usage

Expected result:

- enabled is false.
- status is skipped.
- scheduleStatus is disabled.
- skipReason is schedule-disabled.
- bucketCount is 0.
- backfillRequests is empty.
- executionDecision.status is blocked.
- executionDecision.blockedReason is scheduler-runner-not-ready.
- createsScheduledJob is false.

---

## Invalid Command Validation

    npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --run-at invalid-date --granularity hour

Expected result:

- Command fails intentionally.
- Error explains that --run-at must be a valid date string.
- Usage text is printed.
- npm exits with code 1.
- No JSON preview is printed.

---

## Operational Notes

Review these fields before trusting command dry-run output:

1. runAt.
2. effectiveTo.
3. bucketCount.
4. sources.
5. backfillRequests.
6. executionDecision.allowed.
7. executionDecision.blockedReason.
8. executionDecision.boundary.
9. executionDecision.wiringReview.runtimeConsistency.
10. dryRunServiceInvocationResults for command dry-run with --event-limit.
11. Per-source serviceResult.mode.
12. Per-source serviceResult.sourceResults.
13. Safety flags.

Do not treat this command as proof that rollups were rebuilt. Command dry-run invokes the backfill service only in dry-run mode and does not execute backfill.

Do not treat blocked dry-run/execute/process-local/external-scheduler decisions as failures. They are expected unless their exact runtime wiring has been explicitly designed.

Do not wire execute mode before command dry-run runtime output and failure cases are hardened.

Do not wire process-local or external-scheduler execution until automatic execution semantics are explicitly designed.

---

## Related Files

- apps/api-gateway/src/analytics/analytics-rollup-schedule-plan.ts
- apps/api-gateway/src/analytics/analytics-rollup-schedule-preview-args.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview-args.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-runner.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-backfill-request-mapper.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-backfill-service-adapter.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.ts
- apps/api-gateway/package.json