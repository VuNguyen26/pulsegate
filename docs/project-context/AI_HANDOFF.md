# AI Handoff

## Documentation Shape

Detailed sprint history lives in:

- docs/sdlc/sprint-history/

Long decision records live in:

- docs/project-context/decisions/

## Current Version

- v0.53.0

## Latest Completed Sprint

- Sprint 52 - Rollup Summary API Switch Preview

## Next Recommended Sprint

- Sprint 53 - Switch selected summary reads to rollup read model with fallback

## Current Validation Status

Latest stable validation from Sprint 52:

- 114 test files passed.
- 841 tests passed.
- Typecheck passed.
- Build passed.
- git diff --check passed.
- Docker/PostgreSQL runtime summary preview validation passed.

Runtime validation:

- PostgreSQL healthy.
- Redis healthy.
- Prisma generate passed.
- Prisma migrate deploy passed with no pending migrations.
- product-service and api-gateway Docker build/start passed.
- API Gateway health passed.
- Seeded one consumer, one API key, one usage event, and one rejected event.
- Default summary responses did not include `rollupSummaryPreview`.
- Consumer usage, API key usage, and rejected summary preview endpoints returned preview output.
- All preview outputs kept `raw-event-summary` as fallback and did not apply runtime switching.

## Current Architecture Summary

API Gateway currently supports:

- Route config and dynamic proxy foundations.
- API key and JWT auth foundations.
- Rate limit, quota, usage tracking, rejected-event tracking, and observability foundations.
- Analytics rollup calculation, persistence, manual backfill, read model, schedule preview, scheduler runner contract, scheduler execution decision boundary, scheduler execution wiring review, command dry-run runtime invocation, command execute runtime wiring, and command execute runtime safety tests.
- Rollup summary API switch preview on selected summary APIs behind `rollupSummaryPreview=true`.
- Retention dry-run, retention execution previews, retention operator preview, and retention repository safety foundations.

## Current Summary API Switch Boundary

Sprint 52 exposes preview output only:

- default summary runtime path remains `raw-event-summary`
- preview flag is explicit: `rollupSummaryPreview=true`
- selected targets are consumer usage summary, API key usage summary, and rejected summary
- preview mappers are DB-free
- preview output can report compatibility/fallback/operator decisions
- runtime switch is not applied
- quota counting is not changed
- raw events are not deleted
- scheduler/background behavior is not changed

Still unwired:

- selected summary reads using rollup repositories
- automatic rollup fallback execution
- scheduled/background rollup execute
- process-local execute
- external scheduler execute
- retention delete execution
- quota mutation
- raw event deletion

## Important Current Files

- apps/api-gateway/src/analytics/analytics-rollup-summary-switch-preview.ts
- apps/api-gateway/src/analytics/analytics-rollup-summary-query-compatibility-preview.ts
- apps/api-gateway/src/analytics/analytics-rollup-summary-api-switch-preview-output.ts
- apps/api-gateway/src/analytics/analytics-rollup-summary-preview-request-mapper.ts
- apps/api-gateway/src/routes/admin-api-usage.route.ts
- apps/api-gateway/src/routes/admin-api-rejection.route.ts
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/DECISION_LOG.md
- docs/sdlc/sprint-history/sprint-52.md
- docs/project-context/decisions/2026-07-09-rollup-summary-api-switch-preview.md

## Startup Instruction

Start Sprint 53 after confirming Sprint 52 docs are committed and pushed.