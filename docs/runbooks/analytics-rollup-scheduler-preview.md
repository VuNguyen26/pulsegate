# Analytics Rollup Scheduler Preview Runbook

## Scope

This runbook covers the non-destructive analytics rollup scheduler preview command.

The command converts a schedule plan into dry-run backfill request contracts, prints an execution boundary decision, and includes a wiring review for future scheduler execution design.

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

Execution boundary preview options:

- --execution-trigger <command|process-local|external-scheduler>: optional, defaults to command.
- --execution-mode <preview|dry-run|execute>: optional, defaults to preview.

Argument style:

- The command accepts both --option value and --option=value forms.

These execution options only affect executionDecision output. They do not execute work.

---

## Safety Model

The command is preview-only.

It does not:

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

Expected runner safety output:

    {
      "previewOnly": true,
      "createsScheduledJob": false,
      "invokesBackfillService": false,
      "executesBackfill": false,
      "readsEvents": false,
      "persistsRollups": false,
      "affectsQuotaCounting": false,
      "deletesRawEvents": false
    }

Expected execution decision boundary output for default preview:

    {
      "trigger": "command",
      "requestedMode": "preview",
      "allowedMode": "preview",
      "commandTriggeredOnly": true,
      "processLocalExecutionWired": false,
      "externalSchedulerExecutionWired": false,
      "backfillServiceInvocationWired": false,
      "backfillExecutionWired": false
    }

Expected execution wiring review output for default preview:

    {
      "currentCapability": "command-preview-only",
      "requestedCapability": "command:preview",
      "recommendedNextStep": "keep-command-preview-only",
      "requiresExplicitDesignBeforeWiring": false,
      "requiresDockerPostgresValidationBeforeWiring": false,
      "automaticTriggersRemainUnwired": true,
      "executeRemainsUnwired": true
    }

---

## Enabled Preview Example

    cd E:\pulsegate

    npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --lookback-buckets 1 --safety-delay-ms 300000 --max-buckets 1

Expected result:

- kind is analytics-rollup-scheduler-runner.
- mode is preview.
- enabled is true.
- status is ready.
- scheduleStatus is planned.
- source is both.
- sources contains usage and rejected.
- bucketCount is 1.
- backfillRequests contains dry-run contracts for usage and rejected.
- willInvokeBackfillService is false.
- willReadEvents is false.
- willPersistRollups is false.
- safety.previewOnly is true.
- executionDecision.kind is analytics-rollup-scheduler-execution-decision.
- executionDecision.status is preview-ready.
- executionDecision.allowed is true.
- executionDecision.boundary.trigger is command.
- executionDecision.boundary.requestedMode is preview.
- executionDecision.boundary.allowedMode is preview.
- executionDecision.wiringReview.currentCapability is command-preview-only.
- executionDecision.wiringReview.recommendedNextStep is keep-command-preview-only.

---

## Blocked Dry-Run Preview Example

    cd E:\pulsegate

    npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source usage --run-at 2026-07-06T13:07:00.000Z --granularity hour --execution-mode dry-run

Expected result:

- Scheduler runner status is ready.
- executionDecision.status is blocked.
- executionDecision.allowed is false.
- executionDecision.blockedReason is backfill-service-invocation-not-wired.
- executionDecision.boundary.requestedMode is dry-run.
- executionDecision.boundary.allowedMode is preview.
- executionDecision.boundary.backfillServiceInvocationWired is false.
- executionDecision.boundary.backfillExecutionWired is false.
- executionDecision.wiringReview.requestedCapability is command:dry-run.
- executionDecision.wiringReview.recommendedNextStep is design-command-dry-run-backfill-service-invocation.
- executionDecision.wiringReview.requiresExplicitDesignBeforeWiring is true.
- executionDecision.wiringReview.requiresDockerPostgresValidationBeforeWiring is true.
- No backfill service is invoked.
- No events are read.
- No rollups are persisted.

---

## Blocked Execute Preview Example

    cd E:\pulsegate

    npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source usage --run-at 2026-07-06T13:07:00.000Z --granularity hour --execution-mode execute

Expected result:

- Scheduler runner status is ready.
- executionDecision.status is blocked.
- executionDecision.allowed is false.
- executionDecision.blockedReason is backfill-execution-not-wired.
- executionDecision.boundary.requestedMode is execute.
- executionDecision.boundary.allowedMode is preview.
- executionDecision.boundary.backfillServiceInvocationWired is false.
- executionDecision.boundary.backfillExecutionWired is false.
- executionDecision.wiringReview.requestedCapability is command:execute.
- executionDecision.wiringReview.recommendedNextStep is wire-command-dry-run-before-execute.
- executionDecision.wiringReview.requiresExplicitDesignBeforeWiring is true.
- executionDecision.wiringReview.requiresDockerPostgresValidationBeforeWiring is true.
- No backfill service is invoked.
- No events are read.
- No rollups are persisted.

---

## Blocked Process-Local Trigger Preview Example

    cd E:\pulsegate

    npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source usage --run-at 2026-07-06T13:07:00.000Z --granularity hour --execution-trigger process-local

Expected result:

- Scheduler runner status is ready.
- executionDecision.status is blocked.
- executionDecision.allowed is false.
- executionDecision.blockedReason is automatic-trigger-not-wired.
- executionDecision.boundary.trigger is process-local.
- executionDecision.boundary.requestedMode is preview.
- executionDecision.boundary.processLocalExecutionWired is false.
- executionDecision.boundary.externalSchedulerExecutionWired is false.
- executionDecision.wiringReview.requestedCapability is process-local:preview.
- executionDecision.wiringReview.recommendedNextStep is keep-automatic-triggers-unwired.
- executionDecision.wiringReview.requiresExplicitDesignBeforeWiring is true.
- No scheduled/background job is created.

---

## Equals-Style Args Example

    cd E:\pulsegate

    npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled=true --source=usage --run-at=2026-07-06T13:07:00.000Z --granularity=hour --execution-mode=execute

Expected result:

- The command accepts equals-style args.
- executionDecision.status is blocked.
- executionDecision.blockedReason is backfill-execution-not-wired.
- Safety output remains non-destructive.

---

## Disabled Preview Example

    cd E:\pulsegate

    npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --run-at 2026-07-06T13:07:00.000Z --granularity hour --source usage

Expected result:

- enabled is false.
- status is skipped.
- scheduleStatus is disabled.
- skipReason is schedule-disabled.
- source is usage.
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

Use this command before implementing or wiring any real scheduler runner execution.

The preview output should be reviewed for:

1. runAt.
2. effectiveTo.
3. bucketCount.
4. sources.
5. backfillRequests.
6. dry-run request contracts.
7. executionDecision.allowed.
8. executionDecision.blockedReason.
9. executionDecision.boundary.
10. executionDecision.wiringReview.
11. safety flags.

Do not treat this command as proof that rollups were rebuilt. It does not invoke the backfill service, read events, or persist rollups.

Do not treat blocked dry-run/execute/process-local/external-scheduler decisions as failures. They are expected until execution wiring is explicitly designed.

Do not wire execute mode before command dry-run has a safe design.

Do not wire process-local or external-scheduler execution until automatic execution semantics are explicitly designed.

---

## Related Files

- apps/api-gateway/src/analytics/analytics-rollup-schedule-plan.ts
- apps/api-gateway/src/analytics/analytics-rollup-schedule-preview-args.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview-args.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-runner.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.ts
- apps/api-gateway/package.json