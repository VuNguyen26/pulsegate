# Sprint 23 - Analytics Rollup Persistence Foundation

## Status

Complete.

## Version

v0.24.0

## Goal

Add a safe analytics rollup persistence foundation after Sprint 22's code/test-only rollup calculation foundation.

This sprint intentionally avoided runtime analytics API changes, summary API rewrites, quota rewrites, usage recorder rewrites, rejected event recorder rewrites, retention jobs, destructive pruning, backfill commands, dashboard work, and background job infrastructure.

---

## Checkpoints

### Checkpoint 23.0 - Rollup Persistence Schema Preflight

Reviewed current Prisma schema, Sprint 22 analytics helpers, and the retention/rollup design record.

Confirmed:

- gateway.api_usage_events remains the source of truth for successful usage analytics and quota counting.
- gateway.api_rejected_events remains the source of truth for rejected/security traffic.
- Runtime summaries and raw listings still read raw event tables.
- Rollup persistence should keep successful usage and rejected/security traffic separate.
- Rollup tables need an idempotent key that handles nullable dimensions safely.

Important design note:

- PostgreSQL unique constraints over nullable dimensions are not enough for idempotent upserts because NULL values do not compare as equal.
- Sprint 23 therefore uses a dimensionHash unique key.

---

### Checkpoint 23.1 - Analytics Rollup Persistence Schema

Added rollup persistence schema and migration.

Tables:

- api_usage_rollups
- api_rejected_rollups

Behavior:

- Usage and rejected rollups are stored separately.
- Each row has a unique dimensionHash.
- Rollup dimensions and metrics are stored separately.
- No foreign keys are added to API keys or consumers so historical rollups can survive future lifecycle changes.
- Migration is additive and non-destructive.

Files:

- apps/api-gateway/prisma/schema.prisma
- apps/api-gateway/prisma/migrations/20260705140157_add_analytics_rollup_tables/migration.sql

Commit:

- 128792a feat(gateway): add analytics rollup persistence schema

Validation:

- Prisma schema validate passed.
- Migration deploy passed on a clean shadow database.
- npm run test passed.
- npm run typecheck passed.
- npm run build passed.

---

### Checkpoint 23.2 - Analytics Rollup Dimension Hash Builder

Added stable dimension hash helpers.

Behavior:

- Builds SHA-256 dimension hashes for usage rollups.
- Builds SHA-256 dimension hashes for rejected rollups.
- Includes namespace, granularity, bucketStart, and dimensions.
- Excludes metrics from the hash.
- Distinguishes null from empty string.
- Rejects invalid bucketStart dates.

Files:

- apps/api-gateway/src/analytics/analytics-rollup-dimension-hash.ts
- apps/api-gateway/src/analytics/analytics-rollup-dimension-hash.test.ts

Commit:

- 8bca0a2 feat(gateway): add analytics rollup dimension hash builder

---

### Checkpoint 23.3 - Usage Rollup Persistence Repository

Added usage rollup persistence repository.

Behavior:

- Accepts AnalyticsUsageRollupAggregate batches.
- Builds dimensionHash internally.
- Upserts into api_usage_rollups by dimensionHash.
- Empty batches do not call Prisma.
- Does not change runtime usage analytics APIs.
- Does not change quota counting.

Files:

- apps/api-gateway/src/analytics/analytics-usage-rollup.repository.ts
- apps/api-gateway/src/analytics/analytics-usage-rollup.repository.test.ts

Commit:

- 5495520 feat(gateway): add usage rollup persistence repository

---

### Checkpoint 23.4 - Rejected Rollup Persistence Repository

Added rejected rollup persistence repository.

Behavior:

- Accepts AnalyticsRejectedRollupAggregate batches.
- Builds dimensionHash internally.
- Upserts into api_rejected_rollups by dimensionHash.
- Empty batches do not call Prisma.
- Preserves nullable route dimensions.
- Does not change rejected event runtime APIs or recorder behavior.

Files:

- apps/api-gateway/src/analytics/analytics-rejected-rollup.repository.ts
- apps/api-gateway/src/analytics/analytics-rejected-rollup.repository.test.ts

Commit:

- f1b24f3 feat(gateway): add rejected rollup persistence repository

---

### Checkpoint 23.5 - Analytics Rollup Persistence Service

Added internal rollup persistence orchestration service.

Behavior:

- Accepts raw usage-shaped or rejected-shaped events.
- Builds aggregates using Sprint 22 aggregate builders.
- Persists aggregates through Sprint 23 repositories.
- Returns inputEventCount, aggregateCount, and upsertedCount.
- Does not read raw events from the database.
- Does not add a backfill command.
- Does not connect to runtime endpoints.

Files:

- apps/api-gateway/src/analytics/analytics-rollup-persistence-service.ts
- apps/api-gateway/src/analytics/analytics-rollup-persistence-service.test.ts

Commit:

- 402625f feat(gateway): add analytics rollup persistence service

---

### Checkpoint 23.6 - Final Compact Documentation

Updated compact docs and added this sprint history.

Files:

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/AI_HANDOFF.md
- docs/project-context/DECISION_LOG.md
- docs/sdlc/sprint-history/sprint-23.md

---

## Validation

Final validation before documentation:

- npm run test -> 67 test files passed, 461 tests passed
- npm run typecheck -> passed
- npm run build -> passed
- npx prisma validate -> passed
- npx prisma migrate deploy -> passed on clean shadow database

Shadow database migration validation:

- Applied all API Gateway migrations successfully.
- Included migration 20260705140157_add_analytics_rollup_tables.
- Avoided prisma migrate reset on the main local database because the shared local database also contains Product Service tables.

Docker runtime validation:

- Full runtime API validation was not required because Sprint 23 did not change runtime API behavior.
- Migration safety was validated with a clean shadow database.

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
- No retention deletion was added.
- No backfill command was added.
- No background job was added.

---

## Result

Sprint 23 completed a safe analytics rollup persistence foundation.

Current foundation includes:

- Usage rollup persistence table.
- Rejected rollup persistence table.
- Dimension hash builder.
- Usage rollup repository.
- Rejected rollup repository.
- Internal rollup persistence service.

Current remaining gaps:

- No rollup backfill command yet.
- No runtime summary API reads from rollup tables yet.
- No retention policy job yet.
- No Grafana panels based on rollups yet.

Next recommended sprint:

- Sprint 24 - Analytics Rollup Backfill Command or Retention Safety Foundation
