# Sprint 18 - Advanced Usage Analytics and Rejected Event Drilldown

## Status

Done.

## Goal

Sprint 18 extends Sprint 17 rejected request tracking with admin-facing drilldown APIs.

The sprint focuses on:

- Raw rejected event listing.
- Safe pagination.
- Filterable rejected event queries.
- Filtered rejected events summary.
- Strong query validation.
- Tests around query parsing, repository behavior, mapper behavior, and routes.

Sprint 18 intentionally does not change quota counting, rejected event recording, or database schema.

---

## Design Rules

- gateway.api_usage_events remains the source of truth for successful proxy/cache usage and quota counting.
- gateway.api_rejected_events remains the source of truth for rejected/security traffic.
- Rejected requests must not be written into gateway.api_usage_events.
- Raw API keys, JWTs, and Authorization headers must not be stored or returned.
- Rejected event drilldown is read-only.
- Keep the implementation small and testable.
- Do not introduce rollup tables, Kafka, RabbitMQ, Kubernetes, Admin Dashboard UI, Developer Portal UI, billing, or multi-tenant organization model in this sprint.

---

## Checkpoint 18.1 - Rejected Event Listing API Foundation

Added:

- GET /internal/admin/api-rejections/events

Capabilities:

- Admin API key protection.
- Raw rejected event listing.
- Safe pagination:
  - limit
  - offset
  - total
  - hasNextPage
- Default limit 20.
- Max limit 100.
- Sorting by occurredAt desc and id desc.
- Filters:
  - from
  - to
  - rejectionReason
  - statusCode
  - routePath
  - routeMethod
  - apiKeyAuthSource
  - apiKeyId
  - consumerId
- 400 INVALID_QUERY_PARAMETER for invalid query values.

Files added or changed:

- apps/api-gateway/src/api-rejections/api-rejected-events-listing.types.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-listing.repository.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-listing.mapper.ts
- apps/api-gateway/src/routes/admin-api-rejection.route.ts
- apps/api-gateway/src/routes/admin-api-rejection.route.test.ts

Validation:

- Focused route tests passed.
- npm run typecheck passed.
- npm run test passed.
- npm run build passed.
- Docker runtime listing, pagination, filter, and invalid query validation passed.

Commit:

- a61eed2 feat(gateway): add rejected event listing

---

## Checkpoint 18.2 - Rejected Event Listing Query Parser Hardening

Added:

- Dedicated rejected event listing query parser.
- Parser tests.

Purpose:

- Move query parsing out of the route file.
- Keep validation deterministic and reusable.
- Support future reuse for summary filters.

Files added or changed:

- apps/api-gateway/src/api-rejections/api-rejected-events-listing-query.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-listing-query.test.ts
- apps/api-gateway/src/routes/admin-api-rejection.route.ts

Validation:

- Parser tests passed.
- Route tests passed.
- npm run typecheck passed.
- npm run test passed.
- npm run build passed.

Commit:

- a26e247 refactor(gateway): extract rejected event listing query parser

---

## Checkpoint 18.3 - Rejected Event Listing Repository and Mapper Tests

Added tests for:

- Rejected event listing repository.
- Rejected event listing mapper.

Covered behavior:

- Prisma where generation.
- Full filter support.
- Sort order.
- Pagination shape.
- Empty filters.
- Date serialization.
- Metadata and filter mapping.

Files added:

- apps/api-gateway/src/api-rejections/api-rejected-events-listing.repository.test.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-listing.mapper.test.ts

Validation:

- Focused repository and mapper tests passed.
- npm run typecheck passed.
- npm run test passed.
- npm run build passed.

Commit:

- 066ee71 test(gateway): cover rejected event listing repository and mapper

---

## Checkpoint 18.4 - Filtered Rejected Events Summary

Changed:

- GET /internal/admin/api-rejections/summary now supports the same filter model as listing.
- Summary response includes filters.
- Summary repository aggregates over filtered gateway.api_rejected_events.
- Route-level query validation returns 400 INVALID_QUERY_PARAMETER for invalid summary filters.
- Listing repository exposes a shared where-builder for reuse.

Files changed:

- apps/api-gateway/src/api-rejections/api-rejected-events-listing.repository.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-summary.types.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-summary.repository.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-summary.mapper.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-summary.repository.test.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-summary.mapper.test.ts
- apps/api-gateway/src/routes/admin-api-rejection.route.ts
- apps/api-gateway/src/routes/admin-api-rejection.route.test.ts

Runtime validation:

- GET /health -> 200.
- GET /internal/admin/api-rejections/summary -> 200 with filters.
- GET /internal/admin/api-rejections/summary?rejectionReason=RATE_LIMIT_EXCEEDED&statusCode=429&routeMethod=GET -> 200.
- GET /internal/admin/api-rejections/summary?statusCode=99 -> 400 INVALID_QUERY_PARAMETER.

Validation:

- Focused tests passed.
- npm run test passed.
- npm run typecheck passed.
- npm run build passed.
- Docker runtime validation passed.

Commit:

- 1be74df feat(gateway): add filtered rejected events summary

---

## Checkpoint 18.5 - Final Sprint Documentation

Updated compact docs:

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/AI_HANDOFF.md
- docs/project-context/DECISION_LOG.md
- docs/runbooks/api-rejected-events.md
- docs/sdlc/sprint-history/sprint-18.md

Purpose:

- Mark Sprint 18 as complete.
- Move detailed Sprint 18 history into sprint-history.
- Keep main docs compact.
- Update next recommended sprint direction.

---

## Final Validation Summary

Latest stable validation:

- npm run test -> passed
- npm run typecheck -> passed
- npm run build -> passed
- Docker runtime validation -> passed

Latest automated test result:

- 55 test files passed
- 362 tests passed

Latest runtime validation covered:

- Rejected events summary.
- Filtered rejected events summary.
- Raw rejected events listing.
- Listing pagination.
- Listing filters.
- Invalid listing query handling.
- Invalid summary query handling.

---

## Current End State

Implemented admin rejected event APIs:

- GET /internal/admin/api-rejections/summary
- GET /internal/admin/api-rejections/events

Supported rejected event filters:

- from
- to
- rejectionReason
- statusCode
- routePath
- routeMethod
- apiKeyAuthSource
- apiKeyId
- consumerId

Still not implemented:

- Aggregate rollup table.
- Retention policy.
- Cursor pagination for very large event datasets.
- Grafana panels for rejected traffic.
- Admin Dashboard UI.
- Developer Portal UI.

---

## Recommended Next Sprint

Sprint 19 - Usage Analytics Hardening and Retention/Rollup Design

Recommended scope:

- Add time-range and filter support to successful usage analytics.
- Evaluate retention policy for usage and rejected events.
- Design aggregate rollups for high-volume analytics.
- Consider Grafana panels for quota, usage, and rejected traffic.
- Keep successful usage and rejected/security traffic separate.
