# Sprint 14 - API Key Usage Tracking and Consumer Analytics Foundation

## Status

Done.

## Version

v0.15.0

## Goal

Sprint 14 adds the first API usage tracking and consumer analytics foundation to PulseGate.

Before Sprint 14, PulseGate could create API consumers, issue API keys, verify DB-backed keys, revoke keys, and reject invalid keys.

After Sprint 14, PulseGate can also record successful proxied API traffic and expose admin usage summary APIs by consumer and API key.

## Technical Scope

Included:

- API usage event schema.
- API usage event migration.
- API usage recorder service.
- Runtime usage recording inside downstream proxy.
- DB-backed API key attribution.
- Env fallback traffic support.
- Cache status tracking.
- Consumer usage summary repository.
- API key usage summary repository.
- Admin usage summary API routes.
- Runtime Docker validation.

Not included yet:

- Failed auth request usage tracking.
- Usage plans.
- Quotas.
- Billing.
- Admin Dashboard UI.
- Developer Portal UI.
- Grafana per-consumer dashboard.
- Aggregated rollup tables.
- Retention policy.
- Async event streaming.

## Completed Work

### 1. API Usage Event Schema

Added Prisma model:

- ApiUsageEvent

Added table:

- gateway.api_usage_events

Tracked fields:

- requestId
- routePath
- routeMethod
- statusCode
- durationMs
- cacheStatus
- apiKeyAuthSource
- apiKeyId
- consumerId
- occurredAt

Added relations:

- ApiUsageEvent -> ApiKey
- ApiUsageEvent -> ApiConsumer
- ApiKey -> usageEvents
- ApiConsumer -> apiUsageEvents

Added indexes:

- occurredAt
- consumerId + occurredAt
- apiKeyId + occurredAt
- routeMethod + routePath + occurredAt
- statusCode
- apiKeyAuthSource

### 2. API Usage Recorder

Added:

- apps/api-gateway/src/api-usage/api-usage-recorder.ts
- apps/api-gateway/src/api-usage/api-usage-recorder.test.ts

Behavior:

- Records usage events through Prisma.
- Supports DB-backed API key traffic with apiKeyId and consumerId.
- Supports env fallback traffic without apiKeyId and consumerId.
- Supports cache status values: HIT, MISS, BYPASS.
- Supports optional occurredAt override for tests.

### 3. Runtime Proxy Usage Recording

Updated downstream proxy pipeline to record usage after successful proxy responses.

Recorded data:

- requestId
- route path
- route method
- response status code
- durationMs
- cache status
- apiKeyAuthSource
- apiKeyId
- consumerId

Important behavior:

- Usage recording failure does not fail the user response.
- Cache HIT is recorded.
- Cache MISS is recorded.
- Cache BYPASS is recorded.
- Usage recording happens only after the request reaches downstream proxy handler.

Current limitation:

- Requests rejected by preHandler such as missing API key, invalid API key, missing JWT, invalid JWT, or rate limit block are not recorded yet.

### 4. API Usage Summary Repository

Added:

- apps/api-gateway/src/api-usage/api-usage-summary.types.ts
- apps/api-gateway/src/api-usage/api-usage-summary.mapper.ts
- apps/api-gateway/src/api-usage/api-usage-summary.mapper.test.ts
- apps/api-gateway/src/api-usage/api-usage-summary.repository.ts
- apps/api-gateway/src/api-usage/api-usage-summary.repository.test.ts

Summary fields:

- subjectType
- subjectId
- totalRequests
- successfulRequests
- errorRequests
- averageDurationMs
- cacheHits
- cacheMisses
- cacheBypasses
- lastRequestAt

Supported subjects:

- consumer
- apiKey

### 5. Admin Usage Summary APIs

Added:

- apps/api-gateway/src/routes/admin-api-usage.route.ts
- apps/api-gateway/src/routes/admin-api-usage.route.test.ts

Added endpoints:

- GET /internal/admin/usage/consumers/:consumerId/summary
- GET /internal/admin/usage/api-keys/:apiKeyId/summary

Behavior:

- Requires x-admin-api-key.
- Returns 401 when admin API key is missing.
- Returns 404 API_CONSUMER_NOT_FOUND when consumer does not exist.
- Returns 404 API_KEY_NOT_FOUND when API key does not exist.
- Returns usage summary in data envelope.
- Wired into buildApiGatewayApp.

## Runtime Validation

Docker validation proved:

- Docker stack builds and starts.
- API Gateway is healthy.
- Product Service is healthy.
- PostgreSQL is healthy.
- Redis is healthy.
- Prometheus and Grafana start.
- Migration 20260703150000_add_api_usage_events applies successfully.
- gateway.api_usage_events table exists.
- DB-backed API key request records usage event.
- Usage event includes apiKeyId and consumerId.
- Consumer usage summary API returns totalRequests=1.
- API key usage summary API returns totalRequests=1.
- Revoked DB-backed key returns 403.
- Revoked key request does not create additional successful usage event.

## Final Validation

Final validation passed:

- npm run test
- npm run typecheck
- npm run build
- Docker runtime validation

Final test result:

- 40 test files passed
- 270 tests passed

## Commits

Technical commits:

- db9e16a feat(gateway): add api usage event schema
- 378b5e4 feat(gateway): add api usage recorder
- f07c893 feat(gateway): record api usage during proxy
- 7d0acfc feat(gateway): add api usage summary repository
- 7fd4ec8 feat(gateway): add admin api usage summary routes

## Current Limitations

- Failed authentication requests are not tracked yet.
- Rate-limited requests are not tracked yet.
- Usage data is event-based only.
- No aggregate rollup table yet.
- No retention policy yet.
- No per-consumer Grafana dashboard yet.
- No Admin Dashboard usage UI yet.
- No usage plan or quota enforcement yet.
- No async event pipeline yet.

## Recommended Next Sprint

Sprint 15 - Usage Plans and Quota Foundation

Recommended scope:

- Add usage plan schema.
- Attach API consumers or API keys to usage plans.
- Define quota windows.
- Prepare quota counters.
- Start enforcing simple quota limits.
- Keep API usage event recording as source of truth.
