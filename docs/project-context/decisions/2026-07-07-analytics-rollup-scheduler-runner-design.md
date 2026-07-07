# Decision: Analytics Rollup Scheduler Runner Design

## Date

2026-07-07

## Status

Accepted.

## Context

Sprint 32 added a non-destructive analytics rollup schedule preview foundation.

The schedule preview command can plan a future rollup window, but it intentionally does not create scheduled jobs, read raw events, persist rollups, or call backfill execution.

Before adding any real background automation, PulseGate needs an explicit runner boundary that makes the future execution shape visible and testable.

---

## Decision

PulseGate will start scheduler runner work as a preview-only boundary.

Sprint 33 adds:

- A scheduler runner contract/model.
- Dry-run backfill request contracts derived from schedule plans.
- An operator-facing npm run analytics:rollup:scheduler-preview command.
- Safety contract tests for scheduler preview usage and output.

The scheduler preview command remains DB-free and non-destructive.

It must not:

- Create scheduled/background jobs.
- Invoke the backfill service.
- Execute backfill.
- Read raw usage events.
- Read raw rejected events.
- Persist usage rollups.
- Persist rejected rollups.
- Affect quota counting.
- Delete raw events.
- Touch retention/delete paths.

---

## Consequences

Positive:

- Future scheduler execution has a clearer boundary.
- Operators can inspect planned dry-run backfill request contracts before any execution exists.
- Source separation remains explicit for usage and rejected rollups.
- Runtime command validation remains lightweight because the command is DB-free.

Tradeoffs:

- No real scheduled rollup automation exists yet.
- Rollup freshness still depends on manual backfill execution.
- A future sprint must explicitly design execution ownership, trigger style, runtime validation, and failure handling before any scheduler executes work.

---

## Validation

Sprint 33 validation:

- npm run test -> 101 test files / 692 tests passed
- npm run typecheck -> passed
- npm run build -> passed
- Runtime validation passed for npm run analytics:rollup:scheduler-preview
- No Docker/PostgreSQL validation was required because the command is DB-free and preview-only

---

## Related Files

- apps/api-gateway/src/analytics/analytics-rollup-scheduler-runner.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-runner.test.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.ts
- apps/api-gateway/src/analytics/analytics-rollup-scheduler-preview.command.test.ts
- apps/api-gateway/package.json
- docs/runbooks/analytics-rollup-scheduler-preview.md
- docs/sdlc/sprint-history/sprint-33.md
