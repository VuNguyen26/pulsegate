# Sprint 24 - Analytics Rollup Backfill Command

## Status

Complete.

## Version

v0.25.0

## Goal

Add a controlled manual analytics rollup backfill command after Sprint 23's rollup persistence foundation.

This sprint intentionally avoided runtime summary API changes, quota rewrites, usage recorder rewrites, rejected event recorder rewrites, retention deletion, scheduled/background jobs, dashboard work, Kafka/RabbitMQ, Kubernetes, Admin Dashboard, and Developer Portal work.

---

## Checkpoints

### Checkpoint 24.1 - Analytics Rollup Backfill Plan Parser

Added a pure backfill plan parser.

Behavior:

- Parses from, to, granularity, source, mode, and maxBuckets.
- Defaults source to both.
- Defaults mode to dry-run.
- Uses the existing rollup window planner.
- Applies maxBuckets guardrail.
- Rejects invalid dates, inverted ranges, invalid granularity, invalid source, invalid mode, and excessive bucket windows.
- Does not read or write the database.

Files:

- apps/api-gateway/src/analytics/analytics-rollup-backfill-plan.ts
- apps/api-gateway/src/analytics/analytics-rollup-backfill-plan.test.ts

Commit:

- b65f519 feat(gateway): add analytics rollup backfill plan parser

---

### Checkpoint 24.2 - Analytics Rollup Backfill Event Reader

Added Prisma-backed raw event readers for backfill windows.

Behavior:

- Reads successful usage events from gateway.api_usage_events.
- Reads rejected events from gateway.api_rejected_events.
- Uses half-open windows: occurredAt >= rebuildFrom and occurredAt < rebuildTo.
- Sorts by occurredAt asc and id asc for deterministic rebuild input.
- Supports an event limit guardrail.
- Returns empty arrays for empty rebuild windows without calling Prisma.
- Maps usage cacheStatus into the strict rollup event union.
- Does not aggregate or persist rollups.

Files:

- apps/api-gateway/src/analytics/analytics-rollup-backfill-event-reader.ts
- apps/api-gateway/src/analytics/analytics-rollup-backfill-event-reader.test.ts

Commit:

- 3f5dcc8 feat(gateway): add analytics rollup backfill event reader

---

### Checkpoint 24.3 - Analytics Rollup Backfill Service Orchestration

Added backfill service orchestration.

Behavior:

- Accepts an AnalyticsRollupBackfillPlan.
- In dry-run mode, returns planned summaries without reading or persisting events.
- In execute mode, reads raw events and persists rollups through the existing persistence service.
- Supports usage, rejected, or both sources.
- Skips empty rebuild windows safely.
- Returns source-level and total inputEventCount, aggregateCount, and upsertedCount.
- Does not change runtime APIs.

Files:

- apps/api-gateway/src/analytics/analytics-rollup-backfill-service.ts
- apps/api-gateway/src/analytics/analytics-rollup-backfill-service.test.ts

Commit:

- a5c62a6 feat(gateway): add analytics rollup backfill service

---

### Checkpoint 24.4 - Analytics Rollup Backfill Command Wiring

Added the manual/internal command.

Command:

- npm run analytics:rollup:backfill --workspace api-gateway -- --from <iso> --to <iso> --granularity <hour|day>

Behavior:

- Parses CLI args.
- Defaults to dry-run.
- Requires explicit --mode execute before writing rollups.
- Supports --source usage, --source rejected, and --source both.
- Supports --max-buckets and --event-limit.
- Wires Prisma event reader, rollup repositories, persistence service, and backfill service.
- Prints JSON summary output.
- Prints usage text on invalid command input.
- Disconnects Prisma after command completion.

Files:

- apps/api-gateway/package.json
- apps/api-gateway/src/analytics/analytics-rollup-backfill-command-args.ts
- apps/api-gateway/src/analytics/analytics-rollup-backfill-command-args.test.ts
- apps/api-gateway/src/analytics/analytics-rollup-backfill.command.ts

Commit:

- e19c3e4 feat(gateway): add analytics rollup backfill command

---

### Checkpoint 24.5 - Analytics Rollup Backfill Event Limit Safety

Added execution safety around event limits.

Behavior:

- Execute mode reads eventLimit + 1 events.
- If returned event count is greater than eventLimit, the service throws before persistence.
- Prevents partial rollup persistence for oversized rebuild windows.
- Requires the operator to split the time window or increase eventLimit.
- Applies to both usage and rejected source execution.
- Does not change event readers, repositories, schema, runtime APIs, or quota counting.

Files:

- apps/api-gateway/src/analytics/analytics-rollup-backfill-service.ts
- apps/api-gateway/src/analytics/analytics-rollup-backfill-service.test.ts

Commit:

- cd276a2 feat(gateway): guard analytics rollup backfill event limits

---

### Checkpoint 24.6 - Final Sprint 24 Compact Documentation

Updated compact docs and added this sprint history plus the analytics rollup backfill runbook.

Files:

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/AI_HANDOFF.md
- docs/project-context/DECISION_LOG.md
- docs/sdlc/sprint-history/sprint-24.md
- docs/runbooks/analytics-rollup-backfill.md

---

## Validation

Final validation before documentation:

- git status -sb -> clean
- npm run test -> 71 test files passed, 494 tests passed
- npm run typecheck -> passed
- npm run build -> passed

Manual command validation:

- Dry-run default command returned planned usage and rejected summaries.
- Execute mode with an empty window skipped safely without reading or persisting events.
- Invalid granularity failed intentionally and printed usage output.

Docker runtime validation:

- Full Docker runtime API validation was not required because Sprint 24 did not change HTTP runtime APIs or gateway runtime request handling.
- Manual command validation covered the new command behavior.

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
- Runtime summary APIs were not switched to rollup reads.
- Rollup tables are not used for quota counting.
- No retention deletion was added.
- No scheduled/background job was added.
- No runtime HTTP API behavior was changed.

---

## Result

Sprint 24 completed a safe manual analytics rollup backfill command foundation.

Current foundation includes:

- Backfill plan parser.
- Backfill event reader.
- Backfill service orchestration.
- Backfill command args parser.
- Backfill command wiring.
- Dry-run default behavior.
- Explicit execute mode.
- Empty-window skip behavior.
- Event limit safety.
- JSON summary output.

Current remaining gaps:

- Runtime summary APIs do not read rollup tables yet.
- No scheduled/background rollup job yet.
- No retention policy job yet.
- No Grafana panels based on rollups yet.

Next recommended sprint:

- Sprint 25 - Analytics Retention Safety Foundation or Rollup Read Model Investigation
