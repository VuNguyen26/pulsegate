# API Usage Analytics Runbook

## Purpose

This runbook validates successful usage analytics.

It covers current behavior for:

- Consumer usage summary filters.
- API key usage summary filters.
- Raw successful usage event listing.
- Invalid query handling.
- Normalized filter response.
- Safe pagination for usage event listing.

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

Supported pagination:

- limit
- offset
- total
- hasNextPage

Pagination rules:

- Default limit is 20.
- Maximum limit is 100.
- Default offset is 0.
- Sort order is occurredAt desc and id desc.

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
- Invalid query returns 400 INVALID_QUERY_PARAMETER.

Important behavior:

- Usage events listing reads from gateway.api_usage_events only.
- Rejected requests are stored in gateway.api_rejected_events, not gateway.api_usage_events.
- Raw API keys, JWTs, and Authorization headers are not stored or returned.

---

## Runtime Validation Summary

Sprint 20 runtime validation proved:

- GET /health returns 200.
- Admin can create a consumer.
- Admin can issue an API key.
- Protected GET /api/products succeeds when both x-api-key and Authorization Bearer JWT are provided.
- A successful protected request creates a gateway.api_usage_events row.
- GET /internal/admin/usage/events?limit=101 returns 400 INVALID_QUERY_PARAMETER.
- GET /internal/admin/usage/events returns 200 with default limit 20 and offset 0.
- Filtered usage event listing returns 200 with normalized filters.
- Filtered usage event listing can return the generated successful usage event.

Expected status sequence:

    Checking health...
    Creating validation consumer...
    Creating validation API key...
    Generating successful usage event...
    Checking invalid usage events listing query...
    Checking default usage events listing...
    Checking filtered usage events listing...
    Usage events listing runtime validation PASSED

---

## Manual Validation Notes

When generating a protected usage event for GET /api/products, send both:

    x-api-key: <rawKey from API key issue response>
    Authorization: Bearer <valid local JWT>

The API key issue response returns the raw key as:

    data.rawKey

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

### API key creation response does not include key

The issue API key response returns the raw key as rawKey.

Use:

    $plainApiKey = $keyResponse.Json.data.rawKey

### Invalid query does not return 400

Check that the query parser is wired in:

- apps/api-gateway/src/routes/admin-api-usage.route.ts
- apps/api-gateway/src/api-usage/api-usage-events-listing-query.ts
- apps/api-gateway/src/api-usage/api-usage-summary-query.ts

### Filters are not normalized

Check parser tests:

    npm run test --workspace api-gateway -- src/api-usage/api-usage-events-listing-query.test.ts src/api-usage/api-usage-summary-query.test.ts

### Listing rows are unexpected

Remember:

- Usage events listing reads from gateway.api_usage_events.
- Rejected requests are stored in gateway.api_rejected_events, not gateway.api_usage_events.
- A newly created consumer/API key needs at least one successful protected request before a matching usage event appears.
