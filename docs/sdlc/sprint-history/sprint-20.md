# Sprint 20 - Usage Analytics Listing and Event Investigation

## Status

Done.

## Version

v0.21.0

## Goal

Add raw successful usage event investigation without mixing usage and rejected/security traffic.

Sprint 20 focused on successful usage events in gateway.api_usage_events:

- Add safe query parsing for usage event listing.
- Add repository-level filters and pagination for raw successful usage events.
- Expose an admin usage event listing endpoint.
- Keep quota counting stable.
- Keep rejected/security traffic separate in gateway.api_rejected_events.
- Avoid retention jobs, rollup tables, and migrations.

---

## Non-Goals

Sprint 20 intentionally did not implement:

- Cursor pagination.
- Aggregate rollup tables.
- Retention jobs.
- Kafka or RabbitMQ.
- Kubernetes.
- Admin Dashboard UI.
- Developer Portal UI.
- Billing or paid plans.
- Multi-tenant organization model.
- Quota checker rewrite.
- Usage recorder rewrite.
- Rejected event recorder changes.
- Database migration.

---

## Checkpoints

### Checkpoint 20.1 - Usage Event Listing Query Parser

Added:

- apps/api-gateway/src/api-usage/api-usage-events-listing.types.ts
- apps/api-gateway/src/api-usage/api-usage-events-listing-query.ts
- apps/api-gateway/src/api-usage/api-usage-events-listing-query.test.ts

Implemented parser support for:

- limit
- offset
- from
- to
- routePath
- routeMethod
- statusCode
- cacheStatus
- apiKeyAuthSource
- apiKeyId
- consumerId

Validation behavior:

- Default limit is 20.
- Maximum limit is 100.
- Default offset is 0.
- Invalid query values return INVALID_QUERY_PARAMETER.
- routeMethod is normalized to uppercase.
- cacheStatus is normalized to HIT, MISS, or BYPASS.
- Blank string filters are omitted.

Commit:

- 6acbcc5 feat(gateway): add usage events listing query parser

---

### Checkpoint 20.2 - Usage Events Listing Repository and Mapper

Added:

- apps/api-gateway/src/api-usage/api-usage-events-listing.mapper.ts
- apps/api-gateway/src/api-usage/api-usage-events-listing.mapper.test.ts
- apps/api-gateway/src/api-usage/api-usage-events-listing.repository.ts
- apps/api-gateway/src/api-usage/api-usage-events-listing.repository.test.ts

Updated:

- apps/api-gateway/src/api-usage/api-usage-events-listing.types.ts

Implemented repository behavior:

- Reads from gateway.api_usage_events through prisma.apiUsageEvent.
- Supports filters by occurredAt from/to, routePath, routeMethod, statusCode, cacheStatus, apiKeyAuthSource, apiKeyId, and consumerId.
- Supports pagination with limit and offset.
- Returns total and hasNextPage.
- Sorts by occurredAt desc and id desc.
- Selects only safe event fields.

Implemented mapper behavior:

- Maps Date occurredAt to ISO string.
- Maps missing response filters to null.
- Does not expose raw API keys, JWTs, or Authorization headers.

Commit:

- 9cb9152 feat(gateway): add usage events listing repository

---

### Checkpoint 20.3 - Expose Usage Events Listing API

Updated:

- apps/api-gateway/src/routes/admin-api-usage.route.ts
- apps/api-gateway/src/routes/admin-api-usage.route.test.ts

Added endpoint:

    GET /internal/admin/usage/events

Implemented behavior:

- Protected by x-admin-api-key.
- Parses query with parseApiUsageEventsListingQuery.
- Invalid query returns 400 INVALID_QUERY_PARAMETER.
- Calls usageEventsListingRepository.listEvents.
- Maps response with mapApiUsageEventsListingReadModelToResponse.
- Response shape is data.items, data.pagination, and data.filters.
- Does not change quota counting.
- Does not change usage recorder behavior.
- Does not change rejected event behavior.

Commit:

- 9f8966a feat(gateway): expose usage events listing API

---

### Checkpoint 20.4 - Final Sprint 20 Compact Documentation

Updated compact docs and added Sprint 20 history.

Expected files:

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/AI_HANDOFF.md
- docs/project-context/DECISION_LOG.md
- docs/sdlc/sprint-history/sprint-20.md
- docs/runbooks/api-usage-analytics.md

---

## Final Validation

Latest validation before final docs:

- git status -sb -> clean
- npm run test -> passed
- npm run typecheck -> passed
- npm run build -> passed

Latest automated result:

- 59 test files passed
- 396 tests passed

Runtime validation for Sprint 20.3:

- Docker postgres started/healthy.
- Docker redis started/healthy.
- Product Service built/healthy.
- API Gateway built/started.
- GET /health succeeded.
- Admin consumer creation succeeded.
- Admin API key issue succeeded.
- Protected GET /api/products succeeded with x-api-key and JWT.
- Successful request generated a usage event.
- Invalid usage events listing query returned 400 INVALID_QUERY_PARAMETER.
- Default usage events listing returned 200 with limit 20 and offset 0.
- Filtered usage events listing returned 200 with normalized filters.
- Filtered listing returned at least one usage event item.

---

## Current Usage Events Listing API

Successful usage events listing:

    GET /internal/admin/usage/events

Requires:

    x-admin-api-key: local-admin-key

Supported pagination:

- limit
- offset
- total
- hasNextPage

Supported filters:

- from
- to
- routePath
- routeMethod
- statusCode
- cacheStatus
- apiKeyAuthSource
- apiKeyId
- consumerId

Example:

    GET /internal/admin/usage/events?limit=10&offset=0&routePath=/api/products&routeMethod=get&statusCode=200&apiKeyAuthSource=database&apiKeyId=:apiKeyId&consumerId=:consumerId

Response includes:

- data.items
- data.pagination
- data.filters

The filters object returns normalized filters.

---

## Important Design Rules Preserved

- gateway.api_usage_events remains the source of truth for successful proxy/cache usage and quota counting.
- gateway.api_rejected_events remains the source of truth for rejected/security traffic.
- Rejected requests are not written into gateway.api_usage_events.
- Usage analytics does not expose raw API keys, JWTs, or Authorization headers.
- Usage event listing filters do not change quota counting.
- Sprint 20 did not add aggregate rollup tables.
- Sprint 20 did not add retention jobs.
- Sprint 20 did not add a database migration.

---

## Recommended Next Sprint

Sprint 21 possible direction:

1. Analytics Retention/Rollup Implementation Foundation

   Start implementing the first small storage lifecycle foundation based on the Sprint 19 decision record.

2. Usage Analytics Cursor Pagination and Investigation Hardening

   Add cursor pagination or other investigation hardening for larger event datasets.

Recommended caution:

- Keep successful usage and rejected/security events separate.
- Avoid changing quota counting until the design is explicit and tested.
- Keep checkpoints small.
