# Sprint 25 - Analytics Rollup Read Model Foundation

## Status

Complete.

## Goal

Add a safe read-only rollup read model so operators can inspect analytics rollup tables without changing existing usage/rejected summary APIs, quota counting, recorders, retention, or background jobs.

## Scope

Implemented:

- Analytics rollup read query model.
- Usage rollup read repository.
- Rejected rollup read repository.
- Analytics rollup read service.
- Internal/admin read endpoint:
  - GET /internal/admin/analytics/rollups
- Docker runtime validation for the new endpoint.
- Compact documentation and runbook updates.

Not implemented:

- Summary API switch to rollup reads.
- Quota counting from rollups.
- Retention deletion.
- Scheduled/background rollup job.
- Recorder changes.
- New migration.

## Checkpoints

### 25.1 - Analytics Rollup Read Query Model

Added query parsing and validation for read-only rollup reads.

Supported inputs:

- source: usage or rejected.
- granularity: hour or day.
- from and to ISO timestamps.
- limit with guardrails.
- Shared filters: routePath, routeMethod, statusCode, apiKeyAuthSource, apiKeyId, consumerId.
- Usage-only filter: cacheStatus.
- Rejected-only filter: rejectionReason.

Validation rejects invalid source-specific filters and invalid query values.

Commit:

- f0787a5 feat(gateway): add analytics rollup read query model

### 25.2 - Usage Rollup Read Repository

Added read-only repository for gateway.api_usage_rollups.

Behavior:

- Reads usage rollup rows.
- Filters by rebuild window, dimensions, cache status, auth source, API key, and consumer.
- Maps statusCode filter to usage statusClass.
- Orders by bucketStart and dimensionHash.
- Does not write data.

Commit:

- 9cd9d86 feat(gateway): add usage rollup read repository

### 25.3 - Rejected Rollup Read Repository

Added read-only repository for gateway.api_rejected_rollups.

Behavior:

- Reads rejected rollup rows.
- Filters by rebuild window, dimensions, rejection reason, exact statusCode, auth source, API key, and consumer.
- Orders by bucketStart and dimensionHash.
- Does not write data.

Commit:

- ef5ae86 feat(gateway): add rejected rollup read repository

### 25.4 - Analytics Rollup Read Service

Added source-dispatching read service.

Behavior:

- usage source delegates to usage rollup read repository.
- rejected source delegates to rejected rollup read repository.
- Does not access Prisma directly.

Commit:

- 1ab35c3 feat(gateway): add analytics rollup read service

### 25.5 - Internal Rollup Read Endpoint

Added:

- apps/api-gateway/src/routes/admin-analytics-rollup.route.ts
- apps/api-gateway/src/routes/admin-analytics-rollup.route.test.ts
- app.ts registration for analytics rollup route

Endpoint:

- GET /internal/admin/analytics/rollups

Behavior:

- Requires admin API key.
- Returns usage or rejected rollup rows.
- Returns requested window, rebuild window, bucketCount, limit, filters, count, and items.
- Returns 400 INVALID_QUERY_PARAMETER for invalid rollup read query.
- Keeps existing summary APIs unchanged.

Commit:

- f14d751 feat(gateway): expose analytics rollup read endpoint

### 25.6 - Manual Runtime Validation

Docker runtime validation passed after applying the existing analytics rollup migration to the local Docker database.

Validated:

- Docker Compose build and startup.
- Runtime migration deploy.
- Rollup tables exist in gateway schema.
- GET /health returns 200.
- Missing admin key returns 401.
- Usage rollup read returns 200.
- Rejected rollup read returns 200.
- Invalid rejected query with cacheStatus returns 400.

## Final Validation

Final validation:

- npm run test -> passed.
- npm run typecheck -> passed.
- npm run build -> passed.

Automated test result:

- 76 test files passed.
- 521 tests passed.

Manual runtime validation:

- Passed for GET /internal/admin/analytics/rollups.

## Safety Boundaries Preserved

Sprint 25 preserved:

- gateway.api_usage_events remains the source of truth for successful usage analytics and quota counting.
- gateway.api_rejected_events remains the source of truth for rejected/security traffic.
- Existing usage summary APIs still read raw usage events.
- Existing rejected summary APIs still read raw rejected events.
- Rollup tables are not used for quota counting.
- No retention deletion was added.
- No scheduled/background rollup job was added.
- No usage recorder change was made.
- No rejected event recorder change was made.
- No quota checker change was made.

## Recommended Next Sprint

Sprint 26 recommended direction:

- Analytics Retention Safety Foundation

Suggested first scope:

- Retention config parser.
- Dry-run retention planner.
- Separate usage and rejected retention policies.
- No deletion in the first checkpoint.
- No quota counting change.
