# Sprint 33 - Rollup Scheduler Runner Design

## Status

Complete.

## Version

v0.34.0

## Commits

- a7a6e99 feat(gateway): add analytics rollup scheduler runner contract
- 495591a feat(gateway): expose analytics rollup scheduler preview command
- 743f92e test(gateway): harden analytics rollup scheduler preview safety contract

---

## Goal

Design a non-destructive analytics rollup scheduler runner boundary after the Sprint 32 schedule preview foundation.

Sprint 33 intentionally stayed preview-first:

- No scheduled/background rollup job.
- No database access from the new scheduler preview command.
- No Prisma import.
- No backfill service invocation.
- No backfill execution.
- No raw event reads.
- No rollup persistence.
- No quota counting changes.
- No usage or rejected recorder changes.
- No summary API switch to rollup reads.
- No retention/delete changes.

---

## Checkpoints

### Checkpoint 33.1 - Rollup Scheduler Runner Contract

Added:

- analytics-rollup-scheduler-runner.ts
- analytics-rollup-scheduler-runner.test.ts

Behavior:

- Converts an analytics rollup schedule plan into a scheduler runner preview contract.
- Disabled schedules return status=skipped and no backfillRequests.
- Planned schedules return status=ready and dry-run backfill request contracts per selected source.
- Preserves usage and rejected source separation.
- Locks safety fields:
  - previewOnly=true
  - createsScheduledJob=false
  - invokesBackfillService=false
  - executesBackfill=false
  - readsEvents=false
  - persistsRollups=false
  - affectsQuotaCounting=false
  - deletesRawEvents=false

Validation:

- Targeted scheduler runner tests passed.
- Full test/typecheck/build passed.

---

### Checkpoint 33.2 - Rollup Scheduler Preview Command

Added:

- analytics-rollup-scheduler-preview.command.ts
- analytics-rollup-scheduler-preview.command.test.ts
- npm script analytics:rollup:scheduler-preview

Behavior:

- Parses CLI args with the existing schedule preview args parser.
- Builds a schedule plan.
- Builds a scheduler runner preview plan.
- Prints JSON output.
- Does not import Prisma.
- Does not connect to PostgreSQL.
- Does not call the backfill service.
- Does not create scheduled jobs.
- Does not read events.
- Does not persist rollups.

Runtime validation command:

    npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --lookback-buckets 1 --safety-delay-ms 300000 --max-buckets 1

Runtime output preserved:

- previewOnly=true
- createsScheduledJob=false
- invokesBackfillService=false
- executesBackfill=false
- readsEvents=false
- persistsRollups=false
- affectsQuotaCounting=false
- deletesRawEvents=false

---

### Checkpoint 33.3 - Scheduler Preview Command Safety Hardening

Updated:

- analytics-rollup-scheduler-preview.command.test.ts

Behavior:

- Locks usage text safety wording.
- Locks invalid args fail-fast behavior before output.
- Locks dry-run backfill request contracts.
- Preserves command-level non-destructive safety fields.

Validation:

- Targeted scheduler preview command tests passed.
- Full test/typecheck/build passed.

---

## Final Validation

Automated validation:

- npm run test -> 101 test files / 692 tests passed
- npm run typecheck -> passed
- npm run build -> passed

Runtime command validation:

- analytics:rollup:scheduler-preview -> passed

Docker/PostgreSQL validation:

- Not required for Sprint 33 because the new command is DB-free and preview-only.

---

## Safety Boundaries Preserved

Sprint 33 did not:

- Create a scheduled/background rollup job.
- Invoke the backfill service from scheduler preview.
- Execute backfill from scheduler preview.
- Read raw usage or rejected events from scheduler preview.
- Persist usage or rejected rollups from scheduler preview.
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

Suggested Sprint 34 directions:

1. Rollup Scheduler Execution Boundary Design
   - Decide whether future runner execution should be command-triggered, process-local, or external-scheduler driven.
   - Keep preview separate from execution.
   - Do not silently add background execution.

2. Analytics Retention Execution Design Review
   - Continue retention execution design without exposing destructive execution.
   - Keep Prisma delete repository unwired from operator-facing commands unless explicitly approved.
