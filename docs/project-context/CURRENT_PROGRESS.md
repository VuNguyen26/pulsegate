# Current Progress

## Documentation Shape

Detailed sprint history lives in:

- docs/sdlc/sprint-history/

Long decision records live in:

- docs/project-context/decisions/

## Current Version

v0.53.0

## Latest Completed Sprint

Sprint 52 - Rollup Summary API Switch Preview

## Current State

Sprint 52 added a guarded rollup summary API switch preview for selected admin summary APIs.

Current summary API behavior:

- Default summary API responses still use the existing raw-event summary path.
- `rollupSummaryPreview=true` exposes a preview object on selected summary APIs.
- Selected preview targets are consumer usage summary, API key usage summary, and rejected events summary.
- Preview output reports target, compatibility, operator decision, fallback plan, reviewer notes, and safety flags.
- Preview output currently falls back to `raw-event-summary` when rollup data state is unknown.
- Query compatibility requires bounded `from` and `to` windows before a future rollup read switch can be considered.
- Preview mappers are DB-free and do not call rollup repositories.
- Runtime defaults remain unchanged.

Sprint 52 details are archived in:

- docs/sdlc/sprint-history/sprint-52.md

Related decision record:

- docs/project-context/decisions/2026-07-09-rollup-summary-api-switch-preview.md

## Latest Validation Status

Latest stable validation from Sprint 52:

- 114 test files passed.
- 841 tests passed.
- Typecheck passed.
- Build passed.
- git diff --check passed.
- Docker/PostgreSQL runtime validation passed for summary preview endpoints.

Runtime validation result:

- PostgreSQL and Redis were healthy.
- Prisma generate passed.
- Prisma migrate deploy passed with no pending migrations.
- Docker build/start passed for product-service and api-gateway.
- API Gateway health passed.
- Validation data was seeded for one consumer, one API key, one usage event, and one rejected event.
- Default consumer usage and rejected summary responses did not include `rollupSummaryPreview`.
- Consumer usage summary preview returned target `usage-consumer-summary`.
- API key usage summary preview returned target `usage-api-key-summary`.
- Rejected summary preview returned target `rejected-summary`.
- All preview endpoints retained `raw-event-summary` as fallback path and did not apply a runtime switch.

## Current Limitations

- Summary APIs still default to the raw-event summary path.
- Rollup summary preview is exposed only when `rollupSummaryPreview=true`.
- Rollup read repositories are not used by summary API runtime paths yet.
- Rollup data freshness/missing-state checks are preview-only.
- No scheduled/background rollup execute job exists.
- process-local execute remains unwired.
- external scheduler execute remains unwired.
- Retention delete execution remains out of scope.
- No Admin Dashboard before Sprint 61.
- No Developer Portal before Sprint 65.
- No billing/marketplace before Sprint 80.
- No Kafka/RabbitMQ or Kubernetes/cloud expansion before Sprint 71.

## Next Recommended Sprint

Sprint 53 - Switch selected summary reads to rollup read model with fallback