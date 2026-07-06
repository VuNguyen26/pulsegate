# Sprint 32 - Analytics Rollup Scheduling Foundation

## Status

Complete.

## Version

v0.33.0

## Commits

- 135d4b2 feat(gateway): add analytics rollup schedule plan
- 82bd9f5 feat(gateway): add analytics rollup schedule preview
- d668e2c feat(gateway): add analytics rollup schedule preview args
- 6736beb feat(gateway): expose analytics rollup schedule preview command

---

## Goal

Start a non-destructive scheduled rollup foundation without introducing a real background scheduler.

Sprint 32 intentionally stayed preview-first:

- No scheduled/background rollup job.
- No database access from the new schedule preview command.
- No raw event reads.
- No rollup persistence.
- No quota counting changes.
- No usage or rejected recorder changes.
- No summary API switch to rollup reads.
- No retention/delete changes.

---

## Checkpoints

### Checkpoint 32.1 - Scheduled Rollup Plan Contract

Added:

- analytics-rollup-schedule-plan.ts
- analytics-rollup-schedule-plan.test.ts

Behavior:

- Plans hourly or daily rollup windows from runAt, granularity, lookbackBuckets, and safetyDelayMs.
- Supports source usage, rejected, or both.
- Preserves source separation.
- Supports maxBuckets guardrail through the existing window planner.
- Defaults to disabled unless enabled=true.

Validation:

- Targeted schedule plan tests passed.
- Full test/typecheck/build passed.

---

### Checkpoint 32.2 - Scheduled Rollup Preview Summary

Added:

- analytics-rollup-schedule-preview.ts
- analytics-rollup-schedule-preview.test.ts

Behavior:

- Converts a schedule plan into a preview JSON contract.
- Reports sourceResults with plannedBucketCount.
- Locks safety fields:
  - previewOnly=true
  - commandCreatesScheduledJob=false
  - commandExecutesBackfill=false
  - readsEvents=false
  - persistsRollups=false
  - affectsQuotaCounting=false
  - deletesRawEvents=false

Validation:

- Targeted schedule preview tests passed.
- Full test/typecheck/build passed.

---

### Checkpoint 32.3 - Scheduled Rollup Preview Args Parser

Added:

- analytics-rollup-schedule-preview-args.ts
- analytics-rollup-schedule-preview-args.test.ts

Behavior:

- Parses schedule preview CLI options:
  - --enabled <true|false>
  - --source <usage|rejected|both>
  - --granularity <hour|day>
  - --run-at <iso>
  - --lookback-buckets <n>
  - --safety-delay-ms <n>
  - --max-buckets <n>
- Rejects unknown options, missing values, invalid dates, invalid numeric guardrails, invalid sources, invalid granularities, and duplicate options.

Validation:

- Targeted args parser tests passed.
- Full test/typecheck/build passed.

---

### Checkpoint 32.4 - Rollup Schedule Preview Command

Added:

- analytics-rollup-schedule-preview.command.ts
- analytics-rollup-schedule-preview.command.test.ts
- npm script analytics:rollup:schedule-preview

Behavior:

- Parses CLI args.
- Builds a schedule plan.
- Builds a schedule preview.
- Prints JSON output.
- Does not import Prisma.
- Does not connect to PostgreSQL.
- Does not call the backfill service.
- Does not create scheduled jobs.
- Does not read events.
- Does not persist rollups.

Runtime validation command:

    npm run analytics:rollup:schedule-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --lookback-buckets 1 --safety-delay-ms 300000 --max-buckets 1

Runtime output preserved:

- previewOnly=true
- commandCreatesScheduledJob=false
- commandExecutesBackfill=false
- readsEvents=false
- persistsRollups=false
- affectsQuotaCounting=false
- deletesRawEvents=false

A package.json UTF-8 BOM issue was caught during runtime validation, fixed by rewriting package.json as UTF-8 without BOM, and revalidated successfully.

---

## Final Validation

Automated validation:

- npm run test -> 99 test files / 683 tests passed
- npm run typecheck -> passed
- npm run build -> passed

Runtime command validation:

- analytics:rollup:schedule-preview -> passed

Docker/PostgreSQL validation:

- Not required for Sprint 32 because the new command is DB-free and preview-only.

---

## Safety Boundaries Preserved

Sprint 32 did not:

- Create a scheduled/background rollup job.
- Read raw usage or rejected events from the schedule preview command.
- Persist usage or rejected rollups from the schedule preview command.
- Change runtime usage summaries.
- Change rejected event summaries.
- Switch summary APIs to rollup reads.
- Change quota counting.
- Change usage recording.
- Change rejected event recording.
- Touch retention execution.
- Delete raw events.

---

## Next Options

Suggested Sprint 33 directions:

1. Rollup Scheduler Runner Design
   - Design an explicit runner boundary.
   - Keep preview separate from execution.
   - Decide whether a future runner should be command-triggered, process-local, or external scheduler driven.
   - Do not silently add background execution.

2. Analytics Retention Execution Design Review
   - Continue retention execution design without exposing destructive execution.
   - Keep Prisma delete repository unwired from operator-facing commands unless explicitly approved.
