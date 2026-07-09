# Rollup Summary Runtime Read Switch

Date: 2026-07-09

## Status

Accepted

## Context

Sprint 52 exposed rollup summary API switch preview output for selected summary APIs without changing runtime defaults.

Sprint 53 implements the next safe step: selected bounded summary reads can use the rollup read model behind an explicit runtime flag while preserving raw-summary fallback.

The selected summary API targets are:

- consumer usage summary
- API key usage summary
- rejected events summary

These endpoints remain operator-facing read APIs. The default path continues to use raw-event summary repositories unless the caller explicitly opts in to runtime rollup reads.

## Decision

Sprint 53 switches selected bounded summary reads to rollup read models only when `rollupSummaryRuntimeRead=true`.

The implementation adds:

- runtime read decision model
- real-route filter mapper
- rollup read-model adapter for usage and rejected summaries
- runtime resolver with raw-summary fallback
- rollup read query mapper
- runtime read service seam using injected analytics rollup read service
- usage summary route wiring for consumer and API key summaries
- rejected summary route wiring

Default summary responses remain unchanged when the runtime flag is absent or not exactly true.

`rollupSummaryPreview=true` remains preview-only output and does not control runtime read selection.

## Guardrails

Sprint 53 keeps these boundaries:

- Summary APIs still default to `raw-event-summary`.
- Runtime rollup reads require explicit `rollupSummaryRuntimeRead=true`.
- Runtime rollup reads require compatible bounded `from` and `to` windows.
- Unsupported, unbounded, missing, empty, failed, or source-mismatched rollup read paths fall back to `raw-event-summary`.
- Existing summary response shape is preserved.
- Invalid query parsing still rejects before repository calls or runtime/preview output.
- Quota counting is not changed.
- Rollups are not persisted by summary APIs.
- Raw events are not deleted.
- Scheduler/background execution is not changed.
- Retention execution remains out of scope.
- Admin UI remains out of scope.

## Validation

Final validation before docs:

- 122 test files passed.
- 887 tests passed.
- Typecheck passed.
- Build passed.
- git diff --check passed.

Docker/PostgreSQL runtime usage summary validation passed:

- PostgreSQL healthy.
- Redis healthy.
- Prisma generate passed.
- Prisma migrate deploy passed with no pending migrations.
- product-service and api-gateway Docker build/start passed.
- API Gateway health passed.
- Seeded one consumer, one API key, raw usage events, and usage rollup records.
- Default consumer and API key usage summaries returned raw-event totals.
- Runtime consumer and API key usage summaries returned rollup totals with `rollupSummaryRuntimeRead=true`.
- Unbounded runtime-read request fell back to raw-event summary.
- Preview output did not appear unless explicitly requested.

Docker/PostgreSQL runtime rejected summary validation passed:

- PostgreSQL healthy.
- Redis healthy.
- Prisma generate passed.
- Prisma migrate deploy passed with no pending migrations.
- product-service and api-gateway Docker build/start passed.
- API Gateway health passed.
- Seeded one consumer, one API key, raw rejected events, and rejected rollup records.
- Default rejected summary returned raw-event totals.
- Runtime rejected summary returned rollup totals with `rollupSummaryRuntimeRead=true`.
- Unbounded runtime-read request fell back to raw-event summary.
- Preview output did not appear unless explicitly requested.
- Runtime data and preview output remained isolated when both flags were present.

## Consequences

Selected summary reads now have a safe rollup runtime-read path that can be exercised without changing default summary behavior.

Future work can build on this by introducing background scheduler runner contracts and operational controls, while continuing to preserve quota correctness, raw event retention boundaries, and retention execution guardrails.