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
- Safe pagination and query validation
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

- HTTP 200
- status ok

If the first health call fails immediately after startup, wait a few seconds and retry.

---

## Runtime Validation Script

Clear Redis rate limit counters for deterministic validation:

    docker exec pulsegate-redis redis-cli FLUSHDB

Check rejected events before validation:

    docker exec pulsegate-postgres psql -U pulsegate -d pulsegate -c "select rejection_reason, status_code, count(*) from gateway.api_rejected_events group by rejection_reason, status_code order by rejection_reason, status_code;"

Call protected route without API key:

    curl.exe -i http://localhost:3000/api/products

Expected:

- HTTP 401
- error.code = API_KEY_MISSING

Call protected route with invalid API key:

    curl.exe -i http://localhost:3000/api/products -H "x-api-key: wrong-key"

Expected:

- HTTP 403
- error.code = API_KEY_INVALID

Call protected route with valid env API key but without JWT:

    curl.exe -i http://localhost:3000/api/products -H "x-api-key: dev-api-key"

Expected:

- HTTP 401
- error.code = JWT_TOKEN_MISSING

Repeat the valid API key but missing JWT request until rate limit is exceeded.

Expected final rate-limited response:

- HTTP 429
- error.code = TOO_MANY_REQUESTS

Check admin rejected events summary:

    curl.exe -s http://localhost:3000/internal/admin/api-rejections/summary -H "x-admin-api-key: local-admin-key"

Expected response fields:

- data.totalRejectedRequests
- data.byReason
- data.byStatusCode
- data.lastRejectedAt
- data.filters

Check filtered rejected events summary:

    curl.exe -i "http://localhost:3000/internal/admin/api-rejections/summary?rejectionReason=RATE_LIMIT_EXCEEDED&statusCode=429&routeMethod=GET" -H "x-admin-api-key: local-admin-key"

Expected:

- HTTP 200
- data.totalRejectedRequests only includes matching events
- data.byReason includes RATE_LIMIT_EXCEEDED
- data.byStatusCode includes 429
- data.filters.rejectionReason = RATE_LIMIT_EXCEEDED
- data.filters.statusCode = 429
- data.filters.routeMethod = GET

Check invalid rejected events summary query:

    curl.exe -i "http://localhost:3000/internal/admin/api-rejections/summary?statusCode=99" -H "x-admin-api-key: local-admin-key"

Expected:

- HTTP 400
- error.code = INVALID_QUERY_PARAMETER

Check admin rejected events raw listing:

    curl.exe -i "http://localhost:3000/internal/admin/api-rejections/events" -H "x-admin-api-key: local-admin-key"

Expected response fields:

- data.items
- data.pagination.limit
- data.pagination.offset
- data.pagination.total
- data.pagination.hasNextPage
- data.filters

Check listing pagination:

    curl.exe -i "http://localhost:3000/internal/admin/api-rejections/events?limit=5&offset=0" -H "x-admin-api-key: local-admin-key"

Expected:

- HTTP 200
- data.pagination.limit = 5
- data.pagination.offset = 0
- data.pagination.total is present
- data.pagination.hasNextPage is present

Check filtered listing:

    curl.exe -i "http://localhost:3000/internal/admin/api-rejections/events?rejectionReason=RATE_LIMIT_EXCEEDED&statusCode=429&routeMethod=GET" -H "x-admin-api-key: local-admin-key"

Expected:

- HTTP 200
- Returned items match the filter when matching events exist
- data.filters.rejectionReason = RATE_LIMIT_EXCEEDED
- data.filters.statusCode = 429
- data.filters.routeMethod = GET

Check invalid listing query:

    curl.exe -i "http://localhost:3000/internal/admin/api-rejections/events?limit=101" -H "x-admin-api-key: local-admin-key"

Expected:

- HTTP 400
- error.code = INVALID_QUERY_PARAMETER

Check rejected events in PostgreSQL:

    docker exec pulsegate-postgres psql -U pulsegate -d pulsegate -c "select rejection_reason, status_code, count(*) from gateway.api_rejected_events group by rejection_reason, status_code order by rejection_reason, status_code;"

Expected groups:

- API_KEY_MISSING / 401
- API_KEY_INVALID / 403
- JWT_TOKEN_MISSING / 401
- RATE_LIMIT_EXCEEDED / 429

Check latest rejected events:

    docker exec pulsegate-postgres psql -U pulsegate -d pulsegate -c "select rejection_reason, status_code, route_method, route_path, api_key_auth_source, occurred_at from gateway.api_rejected_events order by occurred_at desc limit 12;"

Expected:

- route_method = GET
- route_path = /api/products
- api_key_auth_source is env for env API key requests
- no raw API key, JWT, or Authorization header is stored

---

## Sprint 17 Runtime Validation Result

Observed runtime result:

- API_KEY_MISSING -> 401 -> count 1
- API_KEY_INVALID -> 403 -> count 1
- JWT_TOKEN_MISSING -> 401 -> count 5
- RATE_LIMIT_EXCEEDED -> 429 -> count 1
- totalRejectedRequests -> 8

Validation status:

- Passed.

---

## Sprint 18 Runtime Validation Result

Observed runtime result:

- GET /health -> 200.
- GET /internal/admin/api-rejections/events -> 200.
- GET /internal/admin/api-rejections/events?limit=5&offset=0 -> 200.
- GET /internal/admin/api-rejections/events?limit=101 -> 400 INVALID_QUERY_PARAMETER.
- GET /internal/admin/api-rejections/events?rejectionReason=RATE_LIMIT_EXCEEDED&statusCode=429&routeMethod=GET -> 200.
- GET /internal/admin/api-rejections/summary -> 200 with filters.
- GET /internal/admin/api-rejections/summary?rejectionReason=RATE_LIMIT_EXCEEDED&statusCode=429&routeMethod=GET -> 200.
- GET /internal/admin/api-rejections/summary?statusCode=99 -> 400 INVALID_QUERY_PARAMETER.

Validation status:

- Passed.

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
