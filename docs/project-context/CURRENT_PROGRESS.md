# Current Progress

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

## Document Scope

This file is intentionally compact.

Detailed sprint history lives in:

- docs/sdlc/sprint-history/

Manual validation commands live in:

- docs/runbooks/

Long decision records live in:

- docs/project-context/decisions/

---

## Current Version

v0.51.0

---

## Latest Completed Sprint

Sprint 50 - Command Execute Wiring Preview blocked-by-default

Status:

Done.

Sprint 50 added a blocked-by-default analytics rollup scheduler command execute wiring preview without wiring execute runtime.

It kept execute mode blocked while making future execute wiring state explicit and operator-visible:

- Exposed commandExecuteWiringPreview for command:execute requests.
- Reported status=execute-wiring-preview-blocked and currentWiringState=blocked-not-wired.
- Preserved command execute blocked with backfill-execution-not-wired for ready runner plans.
- Preserved scheduler-runner-not-ready for skipped runner plans with zero source-scoped planned executions.
- Kept process-local and external-scheduler execute triggers blocked with automatic-trigger-not-wired and without commandExecuteWiringPreview.
- Exposed planned source-scoped execute requests while keeping willInvokeBackfillService=false, willExecuteBackfill=false, willReadEvents=false, and willPersistRollups=false.
- Kept commandExecuteContractReview, commandExecuteReadinessReview, and commandExecuteOperatorOutputReview visible for command:execute.
- Updated command output and usage text to document commandExecuteWiringPreview.
- Kept command dry-run runtime behavior unchanged.
- Did not create scheduled/background jobs.
- Did not wire execute runtime.
- Did not call AnalyticsRollupBackfillService.runBackfill in execute mode.
- Did not read raw events.
- Did not persist rollups.
- Did not change quota counting, usage recording, rejected event recording, rollup read APIs, summary APIs, migrations, or retention/delete paths.
- Did not delete raw events.

Sprint 50 details are archived in:

- docs/sdlc/sprint-history/sprint-50.md

Related decision record:

- docs/project-context/decisions/2026-07-09-analytics-rollup-scheduler-command-execute-wiring-preview.md

---
## Latest Validation Status

Latest stable validation from Sprint 50:

- npm run test -> passed with 105 test files and 773 tests
- npm run typecheck -> passed
- npm run build -> passed

Docker/PostgreSQL runtime validation:

- Not required for Sprint 50.
- Reason: Sprint 50 was DB-free and only changed command execute wiring preview model/output, command usage/runbook docs, and tests.
- No runtime execute path was introduced.
- No DB read, migration, Prisma persistence, rollup persistence, quota path, retention delete, or raw event deletion was introduced.

Safety validation:

- command execute remained blocked with backfill-execution-not-wired.
- commandExecuteWiringPreview was exposed only for command:execute.
- Preview, dry-run, and automatic trigger paths did not expose command-only execute wiring preview when not applicable.
- Runtime dry-run service factory was not resolved for execute mode.
- No scheduled/background job, service execute invocation, execute backfill, event read, rollup persistence, quota mutation, or raw event deletion was introduced.

---
## Current Limitations

- Usage summary APIs still read raw events.
- Rejected summary APIs still read raw events.
- Rollup read endpoint exists, but summary APIs have not switched to rollup reads.
- Direct command dry-run service invocation is wired, but no scheduled/background rollup job exists yet.
- Command execute contract/readiness/operator output/wiring preview is implemented, but execute runtime is still blocked and unwired.
- process-local and external scheduler execution are still blocked.
- Retention execution has repository-level, service-level, and operator preview safety foundations, but no operator-facing execute command yet.
- Retention Prisma delete repository is not wired to any operator-facing execute command, API, scheduled job, or quota path yet.
- No retention delete job is implemented yet.
- No Admin Dashboard or Developer Portal yet.
- Dynamic router supports exact method + exact path matching only.
- CI does not run the full Docker Compose runtime stack yet.
- Kubernetes and cloud deployment are planned for later.

---

## Recommended Next Sprint

Sprint 51 - Command Execute Runtime Wiring with strict guardrails

Recommended scope:

- Wire command execute only after explicit operator confirmation and strict guardrails.
- Require explicit event-limit, max-bucket bound, bounded bucket count, and source-separated execution.
- Preserve rollup-tables-only persistence scope and rollback expectation.
- Require Docker/PostgreSQL runtime validation.
- Keep command dry-run behavior unchanged.
- Keep process-local/external-scheduler execution blocked until automatic execution semantics are explicitly designed.
- Keep successful usage and rejected/security events separate.
- Keep quota counting on gateway.api_usage_events.
- Keep raw event deletion forbidden.