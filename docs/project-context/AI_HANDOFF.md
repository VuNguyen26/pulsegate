# AI Handoff

## Documentation Shape

Detailed sprint history lives in:

- docs/sdlc/sprint-history/

Long decision records live in:

- docs/project-context/decisions/

## Current Version

- v0.52.0

## Latest Completed Sprint

- Sprint 51 - Command Execute Runtime Wiring with strict guardrails

## Next Recommended Sprint

- Sprint 52 - Rollup Summary API Switch Preview

## Current Validation Status

Latest stable validation from Sprint 51:

- 110 test files passed.
- 812 tests passed.
- Typecheck passed.
- Build passed.
- Docker/PostgreSQL runtime execute validation passed.

Runtime execute validation:

- PostgreSQL healthy.
- Prisma generate passed.
- Prisma migrate deploy passed with no pending migrations.
- Direct CLI command execute returned execute-ready.
- backfillExecutionWired=true.
- runtime gate open.
- runtimeInvocationAllowed=true.
- usage and rejected execute invocation results returned.
- Empty validation DB produced 0 input events, 0 aggregates, and 0 upserts for both sources.

## Current Architecture Summary

API Gateway currently supports:

- Route config and dynamic proxy foundations.
- API key and JWT auth foundations.
- Rate limit, quota, usage tracking, rejected-event tracking, and observability foundations.
- Analytics rollup calculation, persistence, manual backfill, read model, schedule preview, scheduler runner contract, scheduler execution decision boundary, scheduler execution wiring review, command dry-run runtime invocation, command execute runtime wiring, and command execute runtime safety tests.
- Retention dry-run, retention execution previews, retention operator preview, and retention repository safety foundations.

## Current Scheduler Execute Boundary

Direct CLI command execute is wired only with strict guardrails:

- command trigger only
- execution mode execute
- ready runner plan
- explicit --confirm-execute true
- explicit --event-limit
- bounded max buckets
- source-separated mappings
- runtime gate open
- Docker/PostgreSQL validation required for runtime changes

Still unwired:

- process-local execute
- external scheduler execute
- scheduled/background execute
- retention delete execution
- summary API switch
- quota mutation
- raw event deletion

## Important Current Files

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview-execute-runtime-safety.test.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-execution-decision.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-backfill-service-adapter.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-backfill-request-mapper.ts
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/DECISION_LOG.md
- docs/sdlc/sprint-history/sprint-51.md
- docs/project-context/decisions/2026-07-09-analytics-rollup-scheduler-command-execute-runtime-wiring.md

## Startup Instruction

Start Sprint 52 after confirming Sprint 51 docs are committed and pushed.
