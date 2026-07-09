# AI Handoff

## Documentation Shape

Detailed sprint history lives in:

- docs/sdlc/sprint-history/

Long decision records live in:

- docs/project-context/decisions/

## Current Version

- v0.54.0

## Latest Completed Sprint

- Sprint 53 - Switch selected summary reads to rollup read model with fallback

## Next Recommended Sprint

- Sprint 54 - Background Scheduler Contract/Runner

## Current Validation Status

Latest stable validation from Sprint 53:

- 122 test files passed.
- 887 tests passed.
- Typecheck passed.
- Build passed.
- git diff --check passed.
- Docker/PostgreSQL runtime validation passed for selected summary runtime-read switching.

Runtime validation:

- PostgreSQL healthy.
- Redis healthy.
- Prisma generate passed.
- Prisma migrate deploy passed with no pending migrations.
- product-service and api-gateway Docker build/start passed.
- API Gateway health passed.
- Seeded bounded raw usage events, usage rollup records, raw rejected events, and rejected rollup records.
- Default consumer usage and API key usage summary responses returned raw-event totals.
- `rollupSummaryRuntimeRead=true` returned rollup totals for bounded consumer usage and API key usage summary reads.
- Consumer usage unbounded runtime-read request fell back to raw-event summary.
- Default rejected summary response returned raw-event totals.
- `rollupSummaryRuntimeRead=true` returned rollup totals for bounded rejected summary reads.
- Rejected unbounded runtime-read request fell back to raw-event summary.
- Preview output remained absent unless `rollupSummaryPreview=true` was explicitly requested.
- Runtime read switching and preview output stayed isolated.

## Current Architecture Summary

API Gateway currently supports:

- Route config and dynamic proxy foundations.
- API key and JWT auth foundations.
- Rate limit, quota, usage tracking, rejected-event tracking, and observability foundations.
- Analytics rollup calculation, persistence, manual backfill, read model, schedule preview, scheduler runner contract, scheduler execution decision boundary, scheduler execution wiring review, command dry-run runtime invocation, command execute runtime wiring, and command execute runtime safety tests.
- Rollup summary API switch preview on selected summary APIs behind `rollupSummaryPreview=true`.
- Selected summary runtime reads behind `rollupSummaryRuntimeRead=true` with rollup read-model usage and raw-summary fallback.
- Retention dry-run, retention execution previews, retention operator preview, and retention repository safety foundations.

## Current Summary API Switch Boundary

Sprint 53 switches selected bounded summary reads only when explicitly requested:

- default summary runtime path remains `raw-event-summary`
- runtime switch flag is explicit: `rollupSummaryRuntimeRead=true`
- preview flag remains explicit and separate: `rollupSummaryPreview=true`
- selected targets are consumer usage summary, API key usage summary, and rejected summary
- compatible runtime rollup reads require bounded `from` and `to`
- missing, empty, unsupported, unbounded, failed, or source-mismatched rollup paths fall back to `raw-event-summary`
- existing summary response shape is preserved
- quota counting is not changed
- raw events are not deleted
- scheduler/background behavior is not changed
- retention execution remains out of scope

Still unwired:

- automatic/background scheduler runner runtime
- process-local execute
- external scheduler execute
- retention delete execution
- quota mutation
- raw event deletion
- Admin UI

## Important Current Files

- apps/api-gateway/src/analytics/analytics-rollup-summary-runtime-read-decision.ts
- apps/api-gateway/src/analytics/analytics-rollup-summary-runtime-read-decision-request-mapper.ts
- apps/api-gateway/src/analytics/analytics-rollup-summary-read-model-adapter.ts
- apps/api-gateway/src/analytics/analytics-rollup-summary-runtime-read-resolver.ts
- apps/api-gateway/src/analytics/analytics-rollup-summary-runtime-read-query-mapper.ts
- apps/api-gateway/src/analytics/analytics-rollup-summary-runtime-read-service.ts
- apps/api-gateway/src/routes/admin-api-usage.route.ts
- apps/api-gateway/src/routes/admin-api-rejection.route.ts
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/DECISION_LOG.md
- docs/sdlc/sprint-history/sprint-53.md
- docs/project-context/decisions/2026-07-09-rollup-summary-runtime-read-switch.md

## Startup Instruction

Start Sprint 54 after confirming Sprint 53 docs are committed and pushed.