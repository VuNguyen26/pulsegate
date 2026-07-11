# API Usage Analytics Runbook

## Purpose

This runbook validates successful usage analytics.

It covers current behavior for:

- Consumer usage summary filters.
- API key usage summary filters.
- Raw successful usage event listing.
- Invalid query handling.
- Normalized filter response.
- Safe offset and cursor pagination for usage event listing.

---

## Prerequisites

Run from repository root:

    cd E:\pulsegate

Expected local env values:

    ADMIN_API_KEY_HEADER=x-admin-api-key
    ADMIN_API_KEY=local-admin-key
    JWT_SECRET=local-dev-jwt-secret-change-me
    JWT_ISSUER=pulsegate-api-gateway
    JWT_AUDIENCE=pulsegate-clients

---

## Start Runtime Stack

Start infrastructure:

    docker compose up -d postgres redis

Apply API Gateway migrations:

    $env:DATABASE_URL = "postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway"
    npx prisma migrate deploy --schema apps/api-gateway/prisma/schema.prisma

Rebuild and start services:

    docker compose up -d --build product-service api-gateway

Validate API Gateway health:

    Invoke-WebRequest http://localhost:3000/health -UseBasicParsing

If the first health call fails immediately after startup, wait a few seconds and retry.

---

## Usage Summary Endpoints

Consumer usage summary:

    GET /internal/admin/usage/consumers/:consumerId/summary

API key usage summary:

    GET /internal/admin/usage/api-keys/:apiKeyId/summary

Supported filters:

- from
- to
- routePath
- routeMethod
- statusCode
- cacheStatus
- apiKeyAuthSource

Validation rules:

- from and to must be valid ISO date-time strings.
- from must be earlier than or equal to to.
- statusCode must be an integer between 100 and 599.
- routeMethod must be one of GET, POST, PUT, PATCH, DELETE.
- cacheStatus must be one of HIT, MISS, BYPASS.
- Invalid query returns 400 INVALID_QUERY_PARAMETER.

---

## Usage Events Listing Endpoint

Successful usage events listing:

    GET /internal/admin/usage/events

Supported pagination fields:

- limit
- offset
- total
- hasNextPage
- nextCursor

Pagination rules:

- Default limit is 20.
- Maximum limit is 100.
- Default offset is 0.
- Sort order is occurredAt desc and id desc.
- Offset pagination uses limit and offset.
- Cursor pagination uses nextCursor from the previous response.
- Cursor payload is based on occurredAt and id from the last item in the current page.
- offset cannot be used together with cursor.

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

Validation rules:

- from and to must be valid ISO date-time strings.
- from must be earlier than or equal to to.
- statusCode must be an integer between 100 and 599.
- routeMethod must be one of GET, POST, PUT, PATCH, DELETE.
- cacheStatus must be one of HIT, MISS, BYPASS.
- limit must be an integer between 1 and 100.
- offset must be an integer greater than or equal to 0.
- cursor must be a valid base64url encoded JSON object when provided.
- cursor.occurredAt must be a valid ISO date-time string.
- cursor.id must be a non-empty string.
- offset and cursor cannot be used together.
- Invalid query returns 400 INVALID_QUERY_PARAMETER.

Important behavior:

- Usage events listing reads from gateway.api_usage_events only.
- Rejected requests are stored in gateway.api_rejected_events, not gateway.api_usage_events.
- Raw API keys, JWTs, and Authorization headers are not stored or returned.
- Cursor pagination does not change usage recording or quota counting.

---

## Cursor Pagination Runtime Check

First page:

    curl.exe -s "http://localhost:3000/internal/admin/usage/events?limit=1" -H "x-admin-api-key: local-admin-key"

Expected:

- HTTP 200.
- data.items contains at least one item when usage events exist.
- data.pagination.nextCursor is present when another page exists.

Second page:

    curl.exe -s "http://localhost:3000/internal/admin/usage/events?limit=1&cursor=<nextCursor>" -H "x-admin-api-key: local-admin-key"

Expected:

- HTTP 200.
- data.pagination.offset = 0.
- returned item continues after the previous page when more events exist.

Invalid offset plus cursor:

    curl.exe -i "http://localhost:3000/internal/admin/usage/events?limit=1&offset=1&cursor=<nextCursor>" -H "x-admin-api-key: local-admin-key"

Expected:

- HTTP 400.
- error.code = INVALID_QUERY_PARAMETER.

---

## Runtime Validation Summary

Sprint 21 runtime validation proved:

- GET /health returns 200.
- Protected GET /api/products succeeds when both x-api-key and Authorization Bearer JWT are provided.
- Successful protected requests create gateway.api_usage_events rows.
- Rejected requests create gateway.api_rejected_events rows.
- GET /internal/admin/usage/events?limit=1 returns nextCursor when more rows exist.
- GET /internal/admin/usage/events?limit=1&cursor=<nextCursor> returns the next page.
- GET /internal/admin/usage/events?limit=1&offset=1&cursor=<nextCursor> returns 400 INVALID_QUERY_PARAMETER.

Validation status:

- Passed.

---

## Manual Validation Notes

When generating a protected usage event for GET /api/products, send both:

    x-api-key: <rawKey from API key issue response or dev-api-key>
    Authorization: Bearer <valid local JWT>

The protected product route currently requires:

- DB-backed or env API key.
- Valid JWT.

Local JWT values:

    JWT_SECRET=local-dev-jwt-secret-change-me
    JWT_ISSUER=pulsegate-api-gateway
    JWT_AUDIENCE=pulsegate-clients

---

## Troubleshooting

### Health check fails immediately after startup

Wait a few seconds and retry:

    Start-Sleep -Seconds 5
    Invoke-WebRequest http://localhost:3000/health -UseBasicParsing

### Admin endpoint returns 401

Check admin API key header:

    x-admin-api-key: local-admin-key

### Protected product request returns JWT_TOKEN_MISSING

The protected route GET /api/products requires both x-api-key and Authorization Bearer JWT.

### Invalid query does not return 400

Check that the query parser is wired in:

- apps/api-gateway/src/routes/admin-api-usage.route.ts
- apps/api-gateway/src/api-usage/api-usage-events-listing-query.ts
- apps/api-gateway/src/api-usage/api-usage-summary-query.ts

### Listing rows are unexpected

Remember:

- Usage events listing reads from gateway.api_usage_events.
- Rejected requests are stored in gateway.api_rejected_events, not gateway.api_usage_events.
- A newly created consumer/API key needs at least one successful protected request before a matching usage event appears.

## Rollup Summary Runtime Read Opt-In

Selected usage summary APIs can opt in to rollup read-model summaries:

- `GET /internal/admin/usage/consumers/:consumerId/summary?rollupSummaryRuntimeRead=true&from=<iso>&to=<iso>`
- `GET /internal/admin/usage/api-keys/:apiKeyId/summary?rollupSummaryRuntimeRead=true&from=<iso>&to=<iso>`

Default behavior:

- Without `rollupSummaryRuntimeRead=true`, usage summaries continue to read the raw usage-event summary path.
- Existing response shape is preserved.

Runtime rollup behavior:

- Bounded `from` and `to` windows are required.
- Compatible usage filters can be mapped to `gateway.api_usage_rollups`.
- Missing, empty, unsupported, unbounded, failed, or source-mismatched rollup reads fall back to raw-event summary.

Safety:

- `rollupSummaryPreview=true` remains preview output only.
- Quota counting is unchanged and does not use rollup tables.
- Summary APIs do not persist rollups or delete raw events.
- Scheduler/background execution and retention execution are unchanged.

## Sprint 54 Scheduler Boundary Note

Sprint 54 does not change successful usage analytics, quota counting, or usage event storage.

Background scheduler contract/output remains DB-free and does not read usage events, persist usage rollups, or affect quota counting.

## Sprint 55 Scheduler Runtime Boundary Note

Sprint 55 does not change this feature path.

The sprint only opens a guarded direct CLI `process-local` + `dry-run` scheduler runtime path for analytics rollup service invocation. It does not add scheduled/background jobs, external scheduler execution, execute mode expansion, quota mutation, raw event deletion, or retention execution.

## Sprint 63 Dashboard Usage Analytics

Product/documentation version: `v1.3.0`.

Dashboard page:

```txt
http://localhost:3003/usage-analytics
```

The page provides:

- consumer usage summary lookup
- API key usage summary lookup
- API key quota state lookup
- usage-plan current-window summary lookup
- successful usage event investigation

Dashboard filter rules:

- maximum date range: 31 days
- default event limit: 20
- maximum event limit: 100
- cursor navigation only
- no offset
- no rollup summary flags
- unknown and duplicate keys fail closed

Data semantics:

- Successful usage reads remain backed by existing Gateway Admin endpoints.
- `gateway.api_usage_events` remains the quota-counting source of truth.
- Rejected/security events are not included in successful usage totals.
- The Dashboard adds no mutation or persistence behavior.

<!-- pulsegate:sprint-64-dashboard-visibility:start -->
## Sprint 64 Dashboard visibility

The Admin Dashboard now exposes read-only /rollups, /scheduler, and /retention operator views. These views do not open scheduler execution or retention deletion. Use docs/runbooks/admin-dashboard-analytics-operations.md for endpoint, safety, and troubleshooting guidance.
<!-- pulsegate:sprint-64-dashboard-visibility:end -->
