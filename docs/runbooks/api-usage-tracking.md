# API Usage Tracking Runbook

This runbook validates Sprint 14 API usage tracking and usage summary behavior.

## Start Stack

Run:

docker compose up --build -d

Check:

docker compose ps

Expected:

- pulsegate-postgres healthy
- pulsegate-redis healthy
- pulsegate-product-service healthy
- pulsegate-api-gateway up
- pulsegate-prometheus up
- pulsegate-grafana up

## Apply API Gateway Migrations

Run:

docker compose exec api-gateway npm run db:migrate:deploy --workspace api-gateway

Expected:

- Migration 20260703150000_add_api_usage_events is applied
- All migrations have been successfully applied

## Confirm Usage Table

Run:

docker compose exec postgres psql -U pulsegate -d pulsegate -c "\dt gateway.*"

Expected table:

- gateway.api_usage_events

## Create API Consumer

Run admin POST:

POST http://localhost:3000/internal/admin/consumers

Headers:

- x-admin-api-key: local-admin-key
- x-admin-actor: local-validation
- content-type: application/json

Body:

{
  "name": "Usage Validation Consumer",
  "description": "Consumer for API usage tracking validation"
}

Save:

- consumerId

## Issue API Key

Run admin POST:

POST http://localhost:3000/internal/admin/consumers/:consumerId/api-keys

Headers:

- x-admin-api-key: local-admin-key
- x-admin-actor: local-validation
- content-type: application/json

Body:

{
  "name": "Usage Validation Key"
}

Save:

- apiKeyId
- rawKey

Important:

Raw key is returned only once.

## Create JWT

Use local JWT secret:

- local-dev-jwt-secret-change-me

Expected issuer:

- pulsegate-api-gateway

Expected audience:

- pulsegate-clients

## Call Protected Route

Run:

GET http://localhost:3000/api/products

Headers:

- x-api-key: rawKey
- authorization: Bearer localJwt

Expected:

- 200 OK
- product data returned

## Check Usage Event

Run SQL:

SELECT request_id, api_key_id, consumer_id, api_key_auth_source, route_method, route_path, status_code, duration_ms, cache_status, occurred_at
FROM gateway.api_usage_events
WHERE api_key_id = '<apiKeyId>'
ORDER BY occurred_at DESC
LIMIT 5;

Expected:

- api_key_id is populated
- consumer_id is populated
- api_key_auth_source = database
- route_method = GET
- route_path = /api/products
- status_code = 200
- cache_status = MISS or HIT depending on cache state

## Check Consumer Usage Summary

Run:

GET http://localhost:3000/internal/admin/usage/consumers/:consumerId/summary

Header:

- x-admin-api-key: local-admin-key

Expected:

- subjectType = consumer
- subjectId = consumerId
- totalRequests >= 1
- successfulRequests >= 1
- averageDurationMs >= 0

## Check API Key Usage Summary

Run:

GET http://localhost:3000/internal/admin/usage/api-keys/:apiKeyId/summary

Header:

- x-admin-api-key: local-admin-key

Expected:

- subjectType = apiKey
- subjectId = apiKeyId
- totalRequests >= 1
- successfulRequests >= 1
- averageDurationMs >= 0

## Revoke API Key

Run:

PATCH http://localhost:3000/internal/admin/api-keys/:apiKeyId/revoke

Headers:

- x-admin-api-key: local-admin-key
- x-admin-actor: local-validation

Expected:

- status = REVOKED
- revokedAt is populated
- revokedBy is populated

## Validate Revoked Key

Call:

GET http://localhost:3000/api/products

Headers:

- x-api-key: revoked rawKey
- authorization: Bearer localJwt

Expected:

- 403

Current Sprint 14 behavior:

- Revoked request is blocked before downstream proxy handler.
- Revoked request does not create a new successful usage event.

## Current Limitations

- Failed auth requests are not tracked yet.
- Rate-limited requests are not tracked yet.
- Usage tracking is event-based.
- No usage plan or quota enforcement yet.
