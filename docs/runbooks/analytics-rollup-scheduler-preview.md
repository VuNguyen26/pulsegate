# Analytics Rollup Scheduler Preview Runbook

## Scope

This runbook covers the non-destructive analytics rollup scheduler preview command added in Sprint 33.

The command converts a schedule plan into dry-run backfill request contracts.

It is not a scheduler job and does not execute rollup work.

---

## Base Command

    npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --run-at <iso> --granularity <hour|day>

Options:

- --run-at <iso>: required scheduler run timestamp.
- --granularity <hour|day>: required rollup granularity.
- --enabled <true|false>: optional, defaults to false.
- --source <usage|rejected|both>: optional, defaults to both.
- --lookback-buckets <n>: optional positive integer, defaults to 1.
- --safety-delay-ms <n>: optional non-negative integer, defaults to 300000.
- --max-buckets <n>: optional positive integer guardrail.

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

Expected safety output:

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
6. dry-run mode.
7. safety flags.

Do not treat this command as proof that rollups were rebuilt. It does not invoke the backfill service, read events, or persist rollups.

---

## Related Files

- apps/api-gateway/src/analytics/analytics-rollup-schedule-plan.ts
- apps/api-gateway/src/analytics/analytics-rollup-schedule-preview-args.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-runner.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.ts
- apps/api-gateway/package.json
