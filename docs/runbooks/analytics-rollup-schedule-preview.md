# Analytics Rollup Schedule Preview Runbook

## Scope

This runbook covers the non-destructive analytics rollup schedule preview command added in Sprint 32.

The command previews what a future scheduled rollup run would plan.

It is not a scheduler and does not execute rollup work.

For scheduler runner preview, see:

- docs/runbooks/analytics-rollup-scheduler-preview.md

---

## Base Command

    npm run analytics:rollup:schedule-preview --workspace api-gateway -- --run-at <iso> --granularity <hour|day>

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
      "commandCreatesScheduledJob": false,
      "commandExecutesBackfill": false,
      "readsEvents": false,
      "persistsRollups": false,
      "affectsQuotaCounting": false,
      "deletesRawEvents": false
    }

---

## Enabled Preview Example

    cd E:\pulsegate

    npm run analytics:rollup:schedule-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --lookback-buckets 1 --safety-delay-ms 300000 --max-buckets 1

Expected result:

- kind is analytics-rollup-schedule-preview.
- mode is preview.
- enabled is true.
- status is planned.
- source is both.
- sources contains usage and rejected.
- bucketCount is 1.
- willReadEvents is false.
- willPersistRollups is false.
- safety.previewOnly is true.

---

## Disabled Preview Example

    cd E:\pulsegate

    npm run analytics:rollup:schedule-preview --workspace api-gateway -- --run-at 2026-07-06T13:07:00.000Z --granularity hour --source usage

Expected result:

- enabled is false.
- status is disabled.
- source is usage.
- window fields are null.
- bucketCount is 0.
- commandCreatesScheduledJob is false.

---

## Invalid Command Validation

    npm run analytics:rollup:schedule-preview --workspace api-gateway -- --run-at invalid-date --granularity hour

Expected result:

- Command fails intentionally.
- Error explains that --run-at must be a valid date string.
- Usage text is printed.
- npm exits with code 1.

---

## Operational Notes

Use this command before implementing or wiring any real scheduler.

The preview output should be reviewed for:

1. runAt.
2. effectiveTo.
3. requestedFrom.
4. requestedTo.
5. rebuildFrom.
6. rebuildTo.
7. bucketCount.
8. sources.
9. safety flags.

Do not treat this command as proof that rollups were rebuilt. It does not read events or persist rollups.

---

## Related Files

- apps/api-gateway/src/analytics/analytics-rollup-schedule-plan.ts
- apps/api-gateway/src/analytics/analytics-rollup-schedule-preview.ts
- apps/api-gateway/src/analytics/analytics-rollup-schedule-preview-args.ts
- apps/api-gateway/src/analytics/analytics-rollup-schedule-preview.command.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-runner.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.ts
- apps/api-gateway/package.json

<!-- pulsegate:sprint-64-dashboard-visibility:start -->
## Sprint 64 Dashboard visibility

The Admin Dashboard now exposes read-only /rollups, /scheduler, and /retention operator views. These views do not open scheduler execution or retention deletion. Use docs/runbooks/admin-dashboard-analytics-operations.md for endpoint, safety, and troubleshooting guidance.
<!-- pulsegate:sprint-64-dashboard-visibility:end -->
