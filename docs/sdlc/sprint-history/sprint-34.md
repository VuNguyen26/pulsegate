# Sprint 34 - Rollup Scheduler Execution Boundary Design

## Status

Complete.

## Version

v0.35.0

## Commits

- 728999f feat(gateway): add analytics rollup scheduler execution decision
- 1a10829 feat(gateway): expose rollup scheduler execution decision preview
- c44cb84 feat(gateway): add rollup scheduler execution preview args

---

## Goal

Design an explicit, non-destructive execution boundary for future analytics rollup scheduler execution after the Sprint 33 scheduler runner preview foundation.

Sprint 34 intentionally stayed preview-first:

- No scheduled/background rollup job.
- No database access from the scheduler execution decision.
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

### Checkpoint 34.1 - Scheduler Execution Decision Model

Added:

- analytics-rollup-scheduler-execution-decision.ts
- analytics-rollup-scheduler-execution-decision.test.ts

Behavior:

- Adds a scheduler execution decision contract.
- Supports trigger visibility:
  - command
  - process-local
  - external-scheduler
- Supports requested mode visibility:
  - preview
  - dry-run
  - execute
- Allows command-triggered preview only.
- Blocks skipped runner plans with scheduler-runner-not-ready.
- Blocks process-local and external-scheduler triggers with automatic-trigger-not-wired.
- Blocks dry-run and execute modes with backfill-execution-not-wired.
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

- Targeted execution decision tests passed.
- Full test/typecheck/build passed.

---

### Checkpoint 34.2 - Scheduler Preview Command Execution Decision Output

Updated:

- analytics-rollup-scheduler-preview.command.ts
- analytics-rollup-scheduler-preview.command.test.ts

Behavior:

- Adds executionDecision to scheduler preview command output.
- Preserves the existing top-level scheduler runner output shape.
- Keeps default command behavior as command-triggered preview.
- Locks command output safety fields.
- Keeps command DB-free and non-destructive.

Runtime validation command:

    npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source both --run-at 2026-07-06T13:07:00.000Z --granularity hour --lookback-buckets 1 --safety-delay-ms 300000 --max-buckets 1

Runtime output preserved:

- kind=analytics-rollup-scheduler-runner
- mode=preview
- status=ready
- executionDecision.status=preview-ready
- executionDecision.allowed=true
- executionDecision.boundary.trigger=command
- executionDecision.boundary.requestedMode=preview
- executionDecision.boundary.allowedMode=preview
- invokesBackfillService=false
- executesBackfill=false
- readsEvents=false
- persistsRollups=false
- affectsQuotaCounting=false
- deletesRawEvents=false

---

### Checkpoint 34.3 - Scheduler Execution Preview Args

Added:

- analytics-rollup-scheduler-preview-args.ts
- analytics-rollup-scheduler-preview-args.test.ts

Updated:

- analytics-rollup-scheduler-preview.command.ts
- analytics-rollup-scheduler-preview.command.test.ts

Behavior:

- Adds scheduler-specific preview args parser.
- Keeps existing schedule preview args parser unchanged.
- Adds --execution-trigger command|process-local|external-scheduler.
- Adds --execution-mode preview|dry-run|execute.
- Blocks execute mode because backfill execution is not wired.
- Blocks process-local trigger because automatic execution is not wired.
- Fixes scheduler preview usage text spacing while extending safety wording.

Runtime blocked execute validation:

    npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source usage --run-at 2026-07-06T13:07:00.000Z --granularity hour --execution-mode execute

Expected output:

- executionDecision.status=blocked
- executionDecision.allowed=false
- executionDecision.blockedReason=backfill-execution-not-wired
- executionDecision.boundary.requestedMode=execute
- executionDecision.boundary.allowedMode=preview

Runtime blocked process-local validation:

    npm run analytics:rollup:scheduler-preview --workspace api-gateway -- --enabled true --source usage --run-at 2026-07-06T13:07:00.000Z --granularity hour --execution-trigger process-local

Expected output:

- executionDecision.status=blocked
- executionDecision.allowed=false
- executionDecision.blockedReason=automatic-trigger-not-wired
- executionDecision.boundary.trigger=process-local
- executionDecision.boundary.processLocalExecutionWired=false
- executionDecision.boundary.externalSchedulerExecutionWired=false

---

## Final Validation

Automated validation:

- npm run test -> 103 test files / 706 tests passed
- npm run typecheck -> passed
- npm run build -> passed

Runtime command validation:

- analytics:rollup:scheduler-preview default preview -> passed
- analytics:rollup:scheduler-preview blocked execute decision -> passed
- analytics:rollup:scheduler-preview blocked process-local decision -> passed

Docker/PostgreSQL validation:

- Not required for Sprint 34 because the scheduler execution boundary preview is DB-free and non-destructive.

---

## Safety Boundaries Preserved

Sprint 34 did not:

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

Suggested Sprint 35 directions:

1. Rollup Scheduler Execution Wiring Design Review
   - Decide whether command-triggered execution can safely invoke the backfill service.
   - Keep process-local and external scheduler execution blocked until automatic execution semantics are designed.
   - Require runtime validation if DB interaction or backfill service invocation is introduced.

2. Analytics Retention Execution Design Review
   - Continue retention execution design without exposing destructive execution.
   - Keep Prisma delete repository unwired from operator-facing commands unless explicitly approved.