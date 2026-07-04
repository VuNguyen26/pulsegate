# Sprint 19 - Usage Analytics Hardening and Retention/Rollup Design

## Status

Done.

## Version

v0.20.0

## Goal

Harden successful usage analytics without mixing usage and rejected traffic.

Sprint 19 focused on successful usage events in gateway.api_usage_events:

- Add safe query parsing for usage summary filters.
- Add repository-level filters for successful usage summaries.
- Expose filtered consumer and API key usage summaries.
- Keep quota counting stable.
- Keep rejected/security traffic separate in gateway.api_rejected_events.
- Document retention/rollup design direction without adding migration-heavy infrastructure yet.

---

## Non-Goals

Sprint 19 intentionally did not implement:

- Raw successful usage event listing.
- Cursor pagination for usage events.
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

---

## Checkpoints

### Checkpoint 19.1 - Usage Summary Query Parser Foundation

Added:

- apps/api-gateway/src/api-usage/api-usage-summary-query.ts
- apps/api-gateway/src/api-usage/api-usage-summary-query.test.ts

Implemented parser support for:

- from
- to
- routePath
- routeMethod
- statusCode
- cacheStatus
- apiKeyAuthSource

Validation behavior:

- Invalid statusCode returns INVALID_QUERY_PARAMETER.
- Invalid date returns INVALID_QUERY_PARAMETER.
- from > to returns INVALID_QUERY_PARAMETER.
- Unsupported routeMethod returns INVALID_QUERY_PARAMETER.
- Unsupported cacheStatus returns INVALID_QUERY_PARAMETER.
- routeMethod is normalized to uppercase.
- cacheStatus is normalized to HIT, MISS, or BYPASS.
- Blank string filters are omitted.

Commit:

- 8845934 feat(gateway): add usage summary query parser

---

### Checkpoint 19.2 - Usage Summary Repository Filters

Updated:

- apps/api-gateway/src/api-usage/api-usage-summary.types.ts
- apps/api-gateway/src/api-usage/api-usage-summary-query.ts
- apps/api-gateway/src/api-usage/api-usage-summary.repository.ts
- apps/api-gateway/src/api-usage/api-usage-summary.repository.test.ts

Implemented repository filters for:

- occurredAt from/to
- routePath
- routeMethod
- statusCode
- cacheStatus
- apiKeyAuthSource

Important behavior:

- Repository methods now accept optional filters.
- Successful/error request counts respect statusCode filters.
- Cache hit/miss/bypass counts respect cacheStatus filters.
- Filtering stays inside gateway.api_usage_events.
- No quota checker or recorder behavior changed.

Commit:

- 42da44a feat(gateway): add usage summary repository filters

---

### Checkpoint 19.3 - Expose Filtered Usage Summary APIs

Updated:

- apps/api-gateway/src/routes/admin-api-usage.route.ts
- apps/api-gateway/src/routes/admin-api-usage.route.test.ts

Affected endpoints:

- GET /internal/admin/usage/consumers/:consumerId/summary
- GET /internal/admin/usage/api-keys/:apiKeyId/summary

Implemented behavior:

- Route parses query with parseApiUsageSummaryQuery.
- Invalid query returns 400 INVALID_QUERY_PARAMETER.
- Repository receives normalized filters.
- Response includes a filters object with normalized filters.
- Missing consumer still returns API_CONSUMER_NOT_FOUND.
- Missing API key still returns API_KEY_NOT_FOUND.
- Admin auth remains x-admin-api-key based.

Commit:

- da50061 feat(gateway): expose filtered usage summaries

---

### Checkpoint 19.4 - Final Sprint 19 Compact Documentation

Updated compact docs and added Sprint 19 history/runbook/decision record.

Expected files:

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/AI_HANDOFF.md
- docs/project-context/DECISION_LOG.md
- docs/sdlc/sprint-history/sprint-19.md
- docs/runbooks/api-usage-analytics.md
- docs/project-context/decisions/2026-07-04-usage-analytics-retention-rollup-design.md

---

## Final Validation

Latest validation before final docs:

- git status -sb -> clean
- npm run test -> passed
- npm run typecheck -> passed
- npm run build -> passed

Latest automated result:

- 56 test files passed
- 376 tests passed

Runtime validation for Sprint 19.3:

- Docker postgres started/healthy.
- Docker redis started/healthy.
- Product Service built/healthy.
- API Gateway built/started.
- GET /health succeeded.
- Admin consumer creation succeeded.
- Admin API key issue succeeded.
- Invalid consumer usage summary query returned 400 INVALID_QUERY_PARAMETER.
- Filtered consumer usage summary returned 200 with normalized filters.
- Filtered API key usage summary returned 200 with normalized filters.

---

## Current Usage Summary API

Consumer usage summary:

    GET /internal/admin/usage/consumers/:consumerId/summary

API key usage summary:

    GET /internal/admin/usage/api-keys/:apiKeyId/summary

Both endpoints require:

    x-admin-api-key: local-admin-key

Supported filters:

- from
- to
- routePath
- routeMethod
- statusCode
- cacheStatus
- apiKeyAuthSource

Example:

    GET /internal/admin/usage/consumers/:consumerId/summary?routeMethod=get&routePath=/api/products&statusCode=200&cacheStatus=miss&apiKeyAuthSource=database

Response includes:

- data
- filters

The filters object returns normalized filters.

---

## Important Design Rules Preserved

- gateway.api_usage_events remains the source of truth for successful proxy/cache usage and quota counting.
- gateway.api_rejected_events remains the source of truth for rejected/security traffic.
- Rejected requests are not written into gateway.api_usage_events.
- Usage analytics does not expose raw API keys, JWTs, or Authorization headers.
- Usage analytics filters do not change quota counting.
- Sprint 19 did not add aggregate rollup tables.
- Sprint 19 did not add retention jobs.

---

## Recommended Next Sprint

Sprint 20 possible direction:

1. Usage Analytics Listing and Event Investigation

   Add raw successful usage event listing with safe pagination, similar to rejected event listing.

2. Analytics Retention/Rollup Implementation Foundation

   Start implementing the first small storage lifecycle foundation based on the Sprint 19 decision record.

Recommended caution:

- Keep successful usage and rejected/security events separate.
- Avoid changing quota counting until the design is explicit and tested.
- Keep checkpoints small.
