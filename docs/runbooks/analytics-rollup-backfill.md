# Analytics Rollup Backfill Runbook

## Scope

This runbook covers the manual/internal analytics rollup backfill command added in Sprint 24.

The command is intended for controlled local/admin operations. It is not a scheduled background job.

For non-destructive schedule planning preview, see:

- docs/runbooks/analytics-rollup-schedule-preview.md

---

## Base Command

npm run analytics:rollup:backfill --workspace api-gateway -- --from <iso> --to <iso> --granularity <hour|day>

Options:

- --from <iso>: required inclusive requested start timestamp.
- --to <iso>: required exclusive requested end timestamp.
- --granularity <hour|day>: required rollup granularity.
- --source <usage|rejected|both>: optional, defaults to both.
- --mode <dry-run|execute>: optional, defaults to dry-run.
- --max-buckets <n>: optional positive integer rebuild window guardrail.
- --event-limit <n>: optional positive integer raw event guardrail.

---

## Safety Model

- The command defaults to dry-run.
- Dry-run does not read raw events.
- Dry-run does not persist rollups.
- Execute mode must be requested explicitly with --mode execute.
- Raw event reads use half-open rebuild windows: occurredAt >= rebuildFrom and occurredAt < rebuildTo.
- Execute mode reads eventLimit + 1 events.
- If returned event count is greater than eventLimit, execution fails before persistence.
- Usage source reads from gateway.api_usage_events.
- Rejected source reads from gateway.api_rejected_events.
- Usage rollups write to gateway.api_usage_rollups.
- Rejected rollups write to gateway.api_rejected_rollups.
- Quota counting still uses gateway.api_usage_events.
- Rollup tables are not used for quota counting.

---

## Dry-Run Example

cd E:\pulsegate

npm run analytics:rollup:backfill --workspace api-gateway -- --from "2026-07-05T10:15:00.000Z" --to "2026-07-05T13:00:00.000Z" --granularity "hour"

Expected result:

- mode is dry-run.
- source is both.
- sources contains usage and rejected.
- source result statuses are planned.
- input, aggregate, and upsert counts are zero.

---

## Execute Empty-Window Validation

cd E:\pulsegate

npm run analytics:rollup:backfill --workspace api-gateway -- --from "2026-07-05T10:15:00.000Z" --to "2026-07-05T10:15:00.000Z" --granularity "hour" --mode "execute"

Expected result:

- mode is execute.
- bucketCount is 0.
- rebuildFrom is null.
- rebuildTo is null.
- source result statuses are skipped-empty-window.
- no raw events are read.
- no rollups are persisted.

---

## Execute Usage Rollups

Use only after dry-run confirms the intended rebuild window.

npm run analytics:rollup:backfill --workspace api-gateway -- --from "2026-07-05T00:00:00.000Z" --to "2026-07-06T00:00:00.000Z" --granularity "hour" --source "usage" --mode "execute"

---

## Execute Rejected Rollups

Use only after dry-run confirms the intended rebuild window.

npm run analytics:rollup:backfill --workspace api-gateway -- --from "2026-07-05T00:00:00.000Z" --to "2026-07-06T00:00:00.000Z" --granularity "hour" --source "rejected" --mode "execute"

---

## Invalid Command Validation

npm run analytics:rollup:backfill --workspace api-gateway -- --from "2026-07-05T10:15:00.000Z" --to "2026-07-05T13:00:00.000Z" --granularity "minute"

Expected result:

- Command fails intentionally.
- Error includes granularity must be hour or day.
- Usage text is printed.
- npm exits with code 1.

---

## Operational Notes

Before executing real backfill:

1. Run dry-run first.
2. Confirm from, to, granularity, source, rebuildFrom, rebuildTo, and bucketCount.
3. Prefer small windows.
4. Keep default eventLimit unless there is a clear reason to increase it.
5. If eventLimit is exceeded, split the window before retrying.
6. Do not use rollup tables for quota counting.
7. Do not delete raw events as part of this command.

---

## Related Files

- apps/api-gateway/src/analytics/analytics-rollup-backfill-command-args.ts
- apps/api-gateway/src/analytics/analytics-rollup-backfill.command.ts
- apps/api-gateway/src/analytics/analytics-rollup-backfill-plan.ts
- apps/api-gateway/src/analytics/analytics-rollup-backfill-event-reader.ts
- apps/api-gateway/src/analytics/analytics-rollup-backfill-service.ts
- apps/api-gateway/src/analytics/analytics-rollup-persistence-service.ts
- apps/api-gateway/src/analytics/analytics-usage-rollup.repository.ts
- apps/api-gateway/src/analytics/analytics-rejected-rollup.repository.ts
- apps/api-gateway/prisma/schema.prisma
