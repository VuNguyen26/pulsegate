# Current Progress

## Documentation Shape

Detailed sprint history lives in:

- docs/sdlc/sprint-history/

Long decision records live in:

- docs/project-context/decisions/

## Current Version

v0.54.0

## Latest Completed Sprint

Sprint 53 - Switch selected summary reads to rollup read model with fallback

## Current State

Sprint 53 switched selected bounded summary reads to the analytics rollup read model behind an explicit runtime flag with raw-event-summary fallback.

Selected runtime-read targets:

- consumer usage summary
- API key usage summary
- rejected events summary

Current summary API behavior:

- Default summary API responses still use the existing raw-event summary path.
- `rollupSummaryRuntimeRead=true` enables selected bounded summary reads to use rollup read repositories.
- Runtime rollup reads require compatible bounded `from` and `to` windows.
- Missing, empty, unsupported, unbounded, source-mismatched, or failed rollup read paths fall back to `raw-event-summary`.
- `rollupSummaryPreview=true` remains preview output only.
- Preview output remains isolated from runtime read switching.
- Existing summary response shapes are preserved.
- Quota counting remains unchanged.
- Raw events are not deleted.
- No scheduled/background rollup execute job was created.
- Retention execution remains out of scope.

Sprint 53 details are archived in:

- docs/sdlc/sprint-history/sprint-53.md

Related decision record:

- docs/project-context/decisions/2026-07-09-rollup-summary-runtime-read-switch.md

## Latest Validation Status

Latest stable validation from Sprint 53:

- 122 test files passed.
- 887 tests passed.
- Typecheck passed.
- Build passed.
- git diff --check passed.
- Docker/PostgreSQL runtime validation passed for selected summary runtime-read switching.

Runtime validation result:

- PostgreSQL and Redis were healthy.
- Prisma generate passed.
- Prisma migrate deploy passed with no pending migrations.
- Docker build/start passed for product-service and api-gateway.
- API Gateway health passed.
- Validation data was seeded for usage raw events, rejected raw events, usage rollups, and rejected rollups.
- Default consumer usage and API key usage summaries returned raw-event totals.
- Consumer usage and API key usage summaries returned rollup totals when `rollupSummaryRuntimeRead=true` and bounded `from`/`to` were provided.
- Consumer usage unbounded runtime-read request fell back to raw summary.
- Default rejected summary returned raw-event totals.
- Rejected summary returned rollup totals when `rollupSummaryRuntimeRead=true` and bounded `from`/`to` were provided.
- Rejected unbounded runtime-read request fell back to raw summary.
- `rollupSummaryPreview` did not appear unless explicitly requested.
- Runtime data and preview output stayed isolated when both runtime and preview flags were present.

## Current Limitations

- Summary APIs still default to the raw-event summary path unless `rollupSummaryRuntimeRead=true` is provided.
- Rollup runtime reads require bounded compatible query windows.
- Rollup data freshness/missing-state checks are intentionally conservative.
- No scheduled/background rollup execute job exists.
- process-local execute remains unwired.
- external scheduler execute remains unwired.
- Retention delete execution remains out of scope.
- No Admin Dashboard before Sprint 61.
- No Developer Portal before Sprint 65.
- No billing/marketplace before Sprint 80.
- No Kafka/RabbitMQ or Kubernetes/cloud expansion before Sprint 71.

## Next Recommended Sprint

Sprint 54 - Background Scheduler Contract/Runner