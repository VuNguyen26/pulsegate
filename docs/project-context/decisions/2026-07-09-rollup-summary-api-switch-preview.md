# Rollup Summary API Switch Preview

Date: 2026-07-09

## Status

Accepted

## Context

Sprint 51 wired direct CLI command execute runtime for analytics rollups with strict guardrails. The next roadmap item was to prepare selected summary APIs for a future rollup read-model switch without changing runtime defaults.

The selected summary API targets are:

- consumer usage summary
- API key usage summary
- rejected events summary

These endpoints are operator-facing read APIs, but their current raw-event summary path remains the source of truth until a future sprint wires a safe rollup read fallback path.

## Decision

Sprint 52 exposes rollup summary API switch preview output while keeping runtime defaults unchanged.

The preview includes:

- selected summary target
- current runtime path
- future rollup read-model preview path
- query compatibility result
- fallback plan
- operator decision
- reviewer notes
- safety flags

The preview is only exposed when `rollupSummaryPreview=true`.

Default summary responses remain unchanged when the flag is absent or not exactly true.

The preview mappers use already parsed summary filters and remain DB-free.

## Guardrails

Sprint 52 keeps these boundaries:

- Summary APIs still default to `raw-event-summary`.
- Rollup repositories are not called by summary API runtime paths.
- Runtime switch is not applied.
- Preview output can require fallback to `raw-event-summary`.
- Query compatibility requires bounded `from` and `to` windows.
- Invalid query parsing still rejects before repository calls or preview output.
- Quota counting is not changed.
- Rollups are not persisted by summary APIs.
- Raw events are not deleted.
- Scheduler/background execution is not changed.
- Retention execution remains out of scope.

## Validation

Final validation before docs:

- 114 test files passed.
- 841 tests passed.
- Typecheck passed.
- Build passed.
- git diff --check passed.

Docker/PostgreSQL runtime summary preview validation passed:

- PostgreSQL healthy.
- Redis healthy.
- Prisma generate passed.
- Prisma migrate deploy passed with no pending migrations.
- product-service and api-gateway Docker build/start passed.
- API Gateway health passed.
- Seeded one consumer, one API key, one usage event, and one rejected event.
- Default summary responses did not include `rollupSummaryPreview`.
- Consumer usage summary preview returned `usage-consumer-summary`.
- API key usage summary preview returned `usage-api-key-summary`.
- Rejected summary preview returned `rejected-summary`.
- All preview outputs retained `raw-event-summary` fallback and did not apply runtime switching.

## Consequences

Sprint 53 can safely switch selected bounded summary reads to rollup read repositories with fallback because Sprint 52 made the target, compatibility, fallback, and operator output explicit.

Future runtime work must still preserve quota correctness and raw event retention boundaries.
