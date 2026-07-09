# AI Handoff

## Documentation Shape

Detailed sprint history lives in:

- docs/sdlc/sprint-history/

Long decision records live in:

- docs/project-context/decisions/

## Current Version

- v0.56.0

## Latest Completed Sprint

- Sprint 55 - Background Scheduler Runtime Wiring with guardrails

## Next Recommended Sprint

- Sprint 56 - Retention Execute Contract Review

## Current Validation Status

Latest stable validation from Sprint 54:

- 126 test files passed.
- 923 tests passed.
- Typecheck passed.
- Build passed.
- git diff --check passed.

Docker/PostgreSQL runtime validation was not required for Sprint 54 because it only added DB-free contract/model/output/command-output/usage text and tests.

## Sprint 54 Summary

Sprint 54 added the background scheduler contract/runner boundary for analytics rollups:

- Background scheduler contract model for command, process-local, and external-scheduler.
- Background runner plan contract for enabled, disabled, invalid, preview-ready, and runtime-blocked plans.
- Background scheduler operator output model.
- ackgroundScheduler field in scheduler preview command JSON output.
- Usage text and tests documenting that ackgroundScheduler is operator-visible contract data only.
- Hardening tests confirming background runtime fields stay hidden and runtime factories are not resolved for unwired background triggers.

## Important Boundaries

Do not regress these boundaries:

- command trigger remains direct-CLI-owned.
- Direct command dry-run and execute behavior must remain separate from background semantics.
- process-local and external-scheduler preview may expose contract output but must not start runtime work.
- process-local and external-scheduler dry-run/execute remain blocked with ackground-runtime-execution-not-wired.
- No scheduled/background rollup job exists yet.
- No background runner loop exists yet.
- No background trigger invokes AnalyticsRollupBackfillService.runBackfill.
- No background trigger reads events, persists rollups, affects quota counting, deletes raw events, or runs retention execution.
- Summary runtime read switching remains controlled only by selected summary API requests with ollupSummaryRuntimeRead=true.
- ollupSummaryPreview=true remains preview-output-only.

## Important Current Files

- apps/api-gateway/src/analytics/analytics-rollup-background-scheduler-contract.ts
- apps/api-gateway/src/analytics/analytics-rollup-background-scheduler-runner-plan.ts
- apps/api-gateway/src/analytics/analytics-rollup-background-scheduler-output.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview-background-output.command.test.ts
- docs/runbooks/analytics-rollup-scheduler-preview.md
- docs/sdlc/sprint-history/sprint-54.md
- docs/project-context/decisions/2026-07-09-analytics-rollup-background-scheduler-contract-runner.md

## Startup Instruction

Start Sprint 55 only after confirming Sprint 54 docs are committed and pushed.

## Sprint 55 Completion Summary

Sprint 55 completed Background Scheduler Runtime Wiring with guardrails.

Implemented:

- Background scheduler runtime gate.
- `backgroundScheduler.runtimeGate` command output.
- Process-local dry-run runtime gate opt-in.
- Process-local dry-run invocation seam.
- Direct CLI process-local dry-run runtime invocation through the existing dry-run backfill service adapter.
- Runtime output consistency for safety and operator notes.
- Docker/PostgreSQL runtime validation for guarded process-local dry-run invocation.

Final Sprint 55 validation:

- 129 test files / 940 tests passed.
- Typecheck passed.
- Build passed.
- Docker/PostgreSQL runtime validation passed.
- `usage` and `rejected` each returned `service-dry-run-invoked`.

Safety boundaries preserved:

- No scheduled/background rollup job.
- No external scheduler runtime execution.
- No background execute.
- No quota mutation.
- No raw event deletion.
- No retention execution.
- No Admin UI or Product/Platform Expansion v2 work.

Next sprint:

Sprint 56 - Retention Execute Contract Review.
