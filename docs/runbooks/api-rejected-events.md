# API Rejected Events Runbook

## Purpose

This runbook validates rejected request tracking and rejected event drilldown.

It covers:

- API_KEY_MISSING
- API_KEY_INVALID
- JWT_TOKEN_MISSING
- RATE_LIMIT_EXCEEDED
- Admin rejected events summary
- Filtered rejected events summary
- Admin rejected events raw listing
- Safe offset and cursor pagination and query validation
- PostgreSQL rejected event records

---

## Prerequisites

Run from repository root:

    cd E:\pulsegate

Expected local values:

    API_KEY_HEADER=x-api-key
    ADMIN_API_KEY_HEADER=x-admin-api-key
    ADMIN_API_KEY=local-admin-key
    API_KEYS=dev-api-key

---

## Start Runtime Stack

Apply API Gateway migrations:

    $env:DATABASE_URL = "postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway"
    npx prisma migrate deploy --schema apps/api-gateway/prisma/schema.prisma

Build and start services:

    docker compose up -d --build product-service api-gateway
    docker compose ps

Check gateway health:

    curl.exe -i http://localhost:3000/health

Expected:

- HTTP 200.
- status ok.

If the first health call fails immediately after startup, wait a few seconds and retry.

---

## Rejected Events Summary Endpoint

Summary:

    GET /internal/admin/api-rejections/summary

Expected response fields:

- data.totalRejectedRequests
- data.byReason
- data.byStatusCode
- data.lastRejectedAt
- data.filters

Supported filters:

- from
- to
- rejectionReason
- statusCode
- routePath
- routeMethod
- apiKeyAuthSource
- apiKeyId
- consumerId

Important:

- Summary does not support cursor.
- cursor is only valid for raw rejected event listing.

Invalid summary cursor:

    curl.exe -i "http://localhost:3000/internal/admin/api-rejections/summary?cursor=<nextCursor>" -H "x-admin-api-key: local-admin-key"

Expected:

- HTTP 400.
- error.code = INVALID_QUERY_PARAMETER.

---

## Rejected Events Listing Endpoint

Raw listing:

    GET /internal/admin/api-rejections/events

Expected response fields:

- data.items
- data.pagination.limit
- data.pagination.offset
- data.pagination.total
- data.pagination.hasNextPage
- data.pagination.nextCursor
- data.filters

Supported pagination:

- limit
- offset
- cursor
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
- rejectionReason
- statusCode
- routePath
- routeMethod
- apiKeyAuthSource
- apiKeyId
- consumerId

Validation rules:

- from and to must be valid ISO date-time strings.
- from must be earlier than or equal to to.
- rejectionReason must be a supported rejection reason.
- statusCode must be an integer between 100 and 599.
- routeMethod must be one of GET, POST, PUT, PATCH, DELETE.
- limit must be an integer between 1 and 100.
- offset must be an integer greater than or equal to 0.
- cursor must be a valid base64url encoded JSON object when provided.
- cursor.occurredAt must be a valid ISO date-time string.
- cursor.id must be a non-empty string.
- offset and cursor cannot be used together.
- Invalid query returns 400 INVALID_QUERY_PARAMETER.

---

## Runtime Validation Script

Clear Redis rate limit counters for deterministic validation:

    docker exec pulsegate-redis redis-cli FLUSHDB

Generate rejected events:

    curl.exe -i http://localhost:3000/api/products
    curl.exe -i http://localhost:3000/api/products -H "x-api-key: wrong-key"
    curl.exe -i http://localhost:3000/api/products -H "x-api-key: dev-api-key"

Expected examples:

- Missing API key -> HTTP 401 -> API_KEY_MISSING.
- Invalid API key -> HTTP 403 -> API_KEY_INVALID.
- Valid API key without JWT -> HTTP 401 -> JWT_TOKEN_MISSING.
- Rate limit exceeded -> HTTP 429 -> RATE_LIMIT_EXCEEDED.

Check listing first page:

    curl.exe -i "http://localhost:3000/internal/admin/api-rejections/events?limit=1" -H "x-admin-api-key: local-admin-key"

Expected:

- HTTP 200.
- data.pagination.limit = 1.
- data.pagination.offset = 0.
- data.pagination.nextCursor is present when another page exists.

Check cursor listing:

    curl.exe -i "http://localhost:3000/internal/admin/api-rejections/events?limit=1&cursor=<nextCursor>" -H "x-admin-api-key: local-admin-key"

Expected:

- HTTP 200.
- data.pagination.offset = 0.
- returned items continue after the cursor when more events exist.

Check invalid offset plus cursor:

    curl.exe -i "http://localhost:3000/internal/admin/api-rejections/events?limit=1&offset=1&cursor=<nextCursor>" -H "x-admin-api-key: local-admin-key"

Expected:

- HTTP 400.
- error.code = INVALID_QUERY_PARAMETER.

Check invalid listing query:

    curl.exe -i "http://localhost:3000/internal/admin/api-rejections/events?limit=101" -H "x-admin-api-key: local-admin-key"

Expected:

- HTTP 400.
- error.code = INVALID_QUERY_PARAMETER.

Check rejected events in PostgreSQL:

    docker exec pulsegate-postgres psql -U pulsegate -d pulsegate -c "select rejection_reason, status_code, count(*) from gateway.api_rejected_events group by rejection_reason, status_code order by rejection_reason, status_code;"

Expected groups include:

- API_KEY_MISSING / 401
- API_KEY_INVALID / 403
- JWT_TOKEN_MISSING / 401
- RATE_LIMIT_EXCEEDED / 429 when rate limit is reached

Check latest rejected events:

    docker exec pulsegate-postgres psql -U pulsegate -d pulsegate -c "select rejection_reason, status_code, route_method, route_path, api_key_auth_source, occurred_at from gateway.api_rejected_events order by occurred_at desc limit 12;"

Expected:

- route_method = GET for product route validation.
- route_path = /api/products.
- api_key_auth_source is env for env API key requests.
- no raw API key, JWT, or Authorization header is stored.

---

## Sprint 21 Runtime Validation Result

Observed runtime result:

- GET /health -> 200.
- Successful usage events were generated.
- Rejected events were generated.
- GET /internal/admin/api-rejections/events?limit=1 returned nextCursor.
- GET /internal/admin/api-rejections/events?limit=1&cursor=<nextCursor> returned the next page.
- GET /internal/admin/api-rejections/events?limit=1&offset=1&cursor=<nextCursor> returned 400 INVALID_QUERY_PARAMETER.
- GET /internal/admin/api-rejections/summary?cursor=<nextCursor> returned 400 INVALID_QUERY_PARAMETER.

Validation status:

- Passed.

---

## Historical Runtime Validation Results

Sprint 17 observed:

- API_KEY_MISSING -> 401.
- API_KEY_INVALID -> 403.
- JWT_TOKEN_MISSING -> 401.
- RATE_LIMIT_EXCEEDED -> 429.

Sprint 18 observed:

- GET /internal/admin/api-rejections/events -> 200.
- GET /internal/admin/api-rejections/events?limit=5&offset=0 -> 200.
- GET /internal/admin/api-rejections/events?limit=101 -> 400 INVALID_QUERY_PARAMETER.
- Filtered rejected event listing and summary returned 200.
- Invalid rejected summary query returned 400 INVALID_QUERY_PARAMETER.

---

## Design Safety Notes

Rejected events are stored in:

- gateway.api_rejected_events

Successful proxy/cache usage events are stored in:

- gateway.api_usage_events

Do not record rejected requests into gateway.api_usage_events unless the quota counting model is redesigned.

Rejected event analytics must not store or return:

- Raw API keys
- JWTs
- Authorization headers
