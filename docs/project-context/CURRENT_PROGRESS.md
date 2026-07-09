# Current Progress

## Documentation Shape

Detailed sprint history lives in:

- docs/sdlc/sprint-history/

Long decision records live in:

- docs/project-context/decisions/

## Current Version

v0.55.0

## Latest Completed Sprint

Sprint 54 - Background Scheduler Contract/Runner

## Current State

Sprint 54 added a DB-free background scheduler contract/runner boundary for analytics rollups.

Implemented in Sprint 54:

- Added background scheduler trigger contract for command, process-local, and external-scheduler.
- Added background runner plan contract with ready/blocked states for scheduler-enabled, disabled, and invalid plans.
- Added operator-visible background scheduler output.
- Exposed ackgroundScheduler in nalytics:rollup:scheduler-preview command JSON output.
- Documented usage text for background scheduler output.
- Hardened command-output visibility tests for process-local preview, process-local dry-run, external-scheduler execute, disabled runner, and command ownership.

Current background scheduler boundary:

- command remains owned by direct CLI runtime semantics.
- process-local and external-scheduler preview can produce contract output only.
- process-local and external-scheduler dry-run/execute remain blocked with ackground-runtime-execution-not-wired.
- No scheduled/background job is created.
- No background trigger invokes AnalyticsRollupBackfillService.runBackfill.
- No background trigger reads events, persists rollups, affects quota counting, deletes raw events, or runs retention execution.

Sprint 54 details are archived in:

- docs/sdlc/sprint-history/sprint-54.md

Related decision record:

- docs/project-context/decisions/2026-07-09-analytics-rollup-background-scheduler-contract-runner.md

## Latest Validation Status

Latest stable validation from Sprint 54:

- 126 test files passed.
- 923 tests passed.
- Typecheck passed.
- Build passed.
- git diff --check passed.

Docker/PostgreSQL runtime validation was not required because Sprint 54 only added DB-free contract/model/output/command-output/usage text and tests. It did not add a DB read, migration, repository/service runtime interaction, scheduled job, background runner loop, quota path, retention execution, or raw event deletion path.

## Current Safety Boundaries

Still not implemented:

- Scheduled/background rollup job.
- Process-local runner loop.
- External scheduler runtime integration.
- Background dry-run/execute invocation.
- Background AnalyticsRollupBackfillService.runBackfill call.
- Quota counting mutation from rollups.
- Raw event deletion.
- Retention execution.
- Admin Dashboard UI.

Preserved from previous sprints:

- Direct command dry-run runtime invocation remains command-only and dry-run-only.
- Direct command execute runtime remains guarded by command trigger, execute mode, explicit confirmation, event limit, bounded buckets, source separation, and runtime gate.
- Selected summary runtime reads remain opt-in behind ollupSummaryRuntimeRead=true with raw-summary fallback.
- ollupSummaryPreview=true remains preview-output-only.

## Next Recommended Sprint

Sprint 55 - Background Scheduler Runtime Wiring with guardrails
