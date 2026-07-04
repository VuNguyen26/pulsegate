# Sprint 17 - API Rejection Tracking and Rejected Events Observability

## Status

Done.

## Version

v0.18.0

## Goal

Sprint 17 added rejected request tracking without corrupting the existing event-based usage and quota model.

Main goals:

- Track failed API key authentication.
- Track failed JWT authentication.
- Track rate-limited requests.
- Track quota-denied requests.
- Keep rejected traffic out of gateway.api_usage_events.
- Expose rejected traffic summary for admins.

---

## Completed Checkpoints

### Checkpoint 17.1 - Design Contract

Defined rejected request tracking design.

Decision:

- Use a separate gateway.api_rejected_events table.
- Do not add rejected traffic to gateway.api_usage_events.
- Keep gateway.api_usage_events as quota counting source of truth.

Tracked reasons:

- API_KEY_MISSING
- API_KEY_INVALID
- JWT_TOKEN_MISSING
- JWT_TOKEN_INVALID
- RATE_LIMIT_EXCEEDED
- QUOTA_EXCEEDED

---

### Checkpoint 17.2 - Prisma Rejected Event Model

Added Prisma enum and model for rejected events.

Main table:

- gateway.api_rejected_events

Main fields:

- requestId
- routePath
- routeMethod
- statusCode
- rejectionReason
- apiKeyAuthSource
- apiKeyId
- consumerId
- metadata
- occurredAt

Commit:

- cbf6ca4 feat(gateway): add rejected request event model

---

### Checkpoint 17.3 - Rejected Event Recorder Foundation

Added rejected event recorder.

Main files:

- apps/api-gateway/src/api-rejections/api-rejected-event-recorder.ts
- apps/api-gateway/src/api-rejections/api-rejected-event-recorder.test.ts

Commit:

- 6de1a19 feat(gateway): add rejected request event recorder

---

### Checkpoint 17.4 - Track QUOTA_EXCEEDED

Added runtime tracking for quota-denied requests.

Behavior:

- Records QUOTA_EXCEEDED into gateway.api_rejected_events.
- Keeps 429 QUOTA_EXCEEDED response behavior unchanged.
- Does not write quota-denied requests into gateway.api_usage_events.
- Recorder failures do not block the 429 response.

Commit:

- 8676027 feat(gateway): track quota rejected events

---

### Checkpoint 17.5 - Track RATE_LIMIT_EXCEEDED

Added runtime tracking for route-level rate limit rejections.

Behavior:

- Records RATE_LIMIT_EXCEEDED into gateway.api_rejected_events.
- Keeps 429 TOO_MANY_REQUESTS response behavior unchanged.
- Captures safe metadata from rate limit headers.

Commit:

- daa814e feat(gateway): track rate limit rejected events

---

### Checkpoint 17.6 - Track Failed Auth Rejected Events

Added runtime tracking for failed API key and JWT auth.

Tracked reasons:

- API_KEY_MISSING
- API_KEY_INVALID
- JWT_TOKEN_MISSING
- JWT_TOKEN_INVALID

Security rule:

- Raw API keys, JWTs, and Authorization headers are not stored.

Commit:

- 02a1259 feat(gateway): track auth rejected events

---

### Checkpoint 17.7 - Admin Rejected Events Summary

Added admin summary endpoint:

- GET /internal/admin/api-rejections/summary

Response summary:

- totalRejectedRequests
- byReason
- byStatusCode
- lastRejectedAt

Main files:

- apps/api-gateway/src/api-rejections/api-rejected-events-summary.types.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-summary.repository.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-summary.mapper.ts
- apps/api-gateway/src/routes/admin-api-rejection.route.ts

Commit:

- 014e654 feat(gateway): expose rejected events summary

---

### Checkpoint 17.8 - Docker Runtime Validation

Docker runtime validation passed.

Validated flow:

1. Apply API Gateway migrations.
2. Build and start product-service and api-gateway.
3. Confirm gateway health.
4. Clear Redis counters for deterministic rate limit behavior.
5. Call /api/products without API key.
6. Call /api/products with invalid API key.
7. Call /api/products with valid env API key but missing JWT.
8. Repeat until route rate limit rejects the request.
9. Query GET /internal/admin/api-rejections/summary.
10. Query gateway.api_rejected_events directly in PostgreSQL.

Runtime results:

- API_KEY_MISSING -> 401 -> count 1
- API_KEY_INVALID -> 403 -> count 1
- JWT_TOKEN_MISSING -> 401 -> count 5
- RATE_LIMIT_EXCEEDED -> 429 -> count 1
- totalRejectedRequests -> 8

---

## Final Validation

Final automated validation:

- npm run test -> passed
- npm run typecheck -> passed
- npm run build -> passed

Latest automated test count:

- 52 test files passed
- 342 tests passed

Docker runtime validation:

- Rejected events validation passed.

---

## New and Updated Endpoints

Added in Sprint 17:

- GET /internal/admin/api-rejections/summary

Runtime behavior added:

- Failed API key auth rejected event tracking.
- Failed JWT auth rejected event tracking.
- Rate limit rejected event tracking.
- Quota exceeded rejected event tracking.

---

## Important Design Notes

gateway.api_usage_events remains the source of truth for successful/proxied/cache usage.

gateway.api_rejected_events is the source for rejected/security traffic.

Rejected requests are intentionally not recorded in gateway.api_usage_events because the quota checker counts usage events directly.

Future work:

- Add filterable rejected event listing.
- Add date-range filters.
- Add route, API key, consumer, and reason filters.
- Consider aggregate rollups for high-volume analytics.
