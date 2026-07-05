# Sprint 22 - Analytics Retention/Rollup Implementation Foundation

## Status

Complete.

## Version

v0.23.0

## Goal

Start a safe analytics retention/rollup foundation without changing runtime behavior.

This sprint intentionally avoided migrations, rollup tables, retention jobs, backfill commands, quota rewrites, usage recorder rewrites, rejected event recorder rewrites, Docker/runtime changes, and API behavior changes.

---

## Checkpoints

### Checkpoint 22.0 - Baseline Review

Reviewed current retention/rollup design and existing usage/rejected analytics implementation.

Confirmed:

- gateway.api_usage_events remains the source of truth for successful usage analytics and quota counting.
- gateway.api_rejected_events remains the source of truth for rejected/security traffic.
- Current summaries and listings still read from raw event tables.
- Retention and rollup persistence require careful future design.

---

### Checkpoint 22.1 - Analytics Rollup Time Bucket Foundation

Added UTC rollup time bucket helpers.

Behavior:

- Supports hour and day granularity.
- Floors timestamps to UTC bucket starts.
- Calculates exclusive bucket ends.
- Lists buckets over half-open time ranges.
- Rejects invalid dates and inverted ranges.

Files:

- apps/api-gateway/src/analytics/analytics-rollup-time-bucket.ts
- apps/api-gateway/src/analytics/analytics-rollup-time-bucket.test.ts

Commit:

- fa97aff feat(gateway): add analytics rollup time bucket foundation

---

### Checkpoint 22.2 - Analytics Rollup Window Planner

Added rollup window planning foundation.

Behavior:

- Preserves requestedFrom and requestedTo.
- Expands partial ranges to full rebuild buckets.
- Returns rebuildFrom and rebuildTo for future recalculation.
- Supports maxBuckets guardrail.
- Returns empty plans for empty ranges.

Files:

- apps/api-gateway/src/analytics/analytics-rollup-window-plan.ts
- apps/api-gateway/src/analytics/analytics-rollup-window-plan.test.ts

Commit:

- 14e80f9 feat(gateway): add analytics rollup window planner

---

### Checkpoint 22.3 - Usage Rollup Aggregate Builder

Added code/test-only successful usage rollup aggregate builder.

Behavior:

- Aggregates raw usage-shaped events by bucket and dimensions.
- Dimensions include consumer, API key, route path, route method, status class, cache status, and API key auth source.
- Tracks total requests, successful requests, error requests, total duration, average duration, cache counters, and lastRequestAt.
- Does not read from or write to the database.

Files:

- apps/api-gateway/src/analytics/analytics-usage-rollup-aggregate.ts
- apps/api-gateway/src/analytics/analytics-usage-rollup-aggregate.test.ts

Commit:

- 22e8260 feat(gateway): add usage rollup aggregate builder

---

### Checkpoint 22.4 - Rejected Rollup Aggregate Builder

Added code/test-only rejected/security rollup aggregate builder.

Behavior:

- Aggregates rejected-event-shaped records by bucket and dimensions.
- Dimensions include consumer, API key, route path, route method, rejection reason, status code, and API key auth source.
- Tracks totalRejectedRequests and lastRejectedAt.
- Does not read from or write to the database.

Files:

- apps/api-gateway/src/analytics/analytics-rejected-rollup-aggregate.ts
- apps/api-gateway/src/analytics/analytics-rejected-rollup-aggregate.test.ts

Commit:

- df335cf feat(gateway): add rejected rollup aggregate builder

---

### Checkpoint 22.5 - Final Compact Documentation

Updated compact docs and added this sprint history.

Files:

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/AI_HANDOFF.md
- docs/project-context/DECISION_LOG.md
- docs/sdlc/sprint-history/sprint-22.md

---

## Validation

Final validation before documentation:

- npm run test -> 63 test files passed, 443 tests passed
- npm run typecheck -> passed
- npm run build -> passed

Docker runtime validation:

- Not required for Sprint 22 because no runtime API, Docker, database schema, recorder, or quota behavior changed.
- Latest Docker runtime validation remains Sprint 21 cursor pagination validation.

---

## Design Safety

Preserved boundaries:

- gateway.api_usage_events remains the source of truth for successful usage analytics and quota counting.
- gateway.api_rejected_events remains the source of truth for rejected/security traffic.
- Rejected requests are not written into gateway.api_usage_events.
- Raw API keys, JWTs, and Authorization headers are not stored or returned.
- Quota checker behavior was not changed.
- Usage recorder behavior was not changed.
- Rejected event recorder behavior was not changed.
- No migration was added.
- No retention deletion was added.
- No rollup persistence was added.
- No backfill command was added.

---

## Result

Sprint 22 completed a safe analytics rollup implementation foundation.

Current foundation includes:

- UTC hourly/daily bucket helper.
- Rollup window planner.
- Usage rollup aggregate builder.
- Rejected rollup aggregate builder.

Next recommended sprint:

- Sprint 23 - Analytics Rollup Persistence or Retention Safety Foundation
