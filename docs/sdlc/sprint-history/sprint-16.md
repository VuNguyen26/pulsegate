# Sprint 16 - Quota Observability and Usage Management Hardening

## Status

Done.

## Version

v0.17.0

## Goal

Sprint 16 hardened the usage plan and quota foundation from Sprint 15 by adding quota visibility for admins and safer quota exceeded responses.

Main goals:

- Make quota state inspectable per API key.
- Make usage plan consumption inspectable per usage plan.
- Return useful metadata when quota is exceeded.
- Avoid corrupting quota counts by not recording quota-denied requests into api_usage_events yet.

---

## Completed Checkpoints

### Checkpoint 16.1 - API Key Quota State Foundation

Added API key quota state reader.

Main file:

- apps/api-gateway/src/usage-plans/usage-quota-state.ts

Behavior:

- Reads one API key.
- Resolves assigned usage plan.
- Computes DAILY or MONTHLY quota window.
- Counts current-window usage from gateway.api_usage_events.
- Returns quota state.

Supported reasons:

- API_KEY_NOT_FOUND
- NO_USAGE_PLAN
- USAGE_PLAN_DISABLED
- ACTIVE_USAGE_PLAN

Quota fields:

- usedRequests
- remainingRequests
- windowStartedAt
- windowEndsAt
- resetAt
- exceeded
- enforced

Commit:

- f40ade6 feat(gateway): add api key quota state reader

---

### Checkpoint 16.2 - Admin API Key Quota State Endpoint

Added admin endpoint:

- GET /internal/admin/api-keys/:id/quota

Behavior:

- Requires x-admin-api-key.
- Returns 404 API_KEY_NOT_FOUND for missing API key.
- Returns quota state for existing key.

Main files:

- apps/api-gateway/src/routes/admin-api-key.route.ts
- apps/api-gateway/src/routes/admin-api-key.route.test.ts
- apps/api-gateway/src/usage-plans/usage-quota-state.ts

Commit:

- 6fd86bd feat(gateway): expose api key quota state endpoint

---

### Checkpoint 16.3 - Usage Plan Usage Summary Endpoint

Added usage plan usage summary reader and endpoint.

Admin endpoint:

- GET /internal/admin/usage-plans/:id/usage-summary

Behavior:

- Requires x-admin-api-key.
- Returns 404 USAGE_PLAN_NOT_FOUND for missing usage plan.
- Computes current quota window.
- Counts assigned API keys.
- Counts active API keys.
- Counts total current-window requests.
- Counts exceeded API keys.
- Counts near-limit API keys.
- Returns top API keys by usage.

Main files:

- apps/api-gateway/src/usage-plans/usage-plan-usage-summary.ts
- apps/api-gateway/src/usage-plans/usage-plan-usage-summary.test.ts
- apps/api-gateway/src/routes/admin-usage-plan.route.ts
- apps/api-gateway/src/routes/admin-usage-plan.route.test.ts

Commit:

- 769755b feat(gateway): expose usage plan usage summary endpoint

---

### Checkpoint 16.4 - Quota Exceeded Metadata

Added quota details to 429 QUOTA_EXCEEDED responses.

Response details:

- quotaLimit
- quotaWindow
- usedRequests
- remainingRequests
- windowStartedAt
- windowEndsAt
- resetAt

Decision:

- Do not record quota-denied requests into gateway.api_usage_events yet.

Reason:

- gateway.api_usage_events is currently the source of truth for quota counting.
- Recording quota-denied requests without event classification would corrupt quota counts.
- Rejected request tracking needs a separate future design.

Main files:

- apps/api-gateway/src/proxy/downstream-proxy-handler.ts
- apps/api-gateway/src/proxy/downstream-proxy-quota.test.ts

Commit:

- 388e393 feat(gateway): include quota metadata in exceeded responses

---

### Checkpoint 16.5 - Docker Runtime Validation

Docker runtime validation passed.

Validated flow:

1. Start PostgreSQL and Redis.
2. Apply Product Service migrations.
3. Apply API Gateway migrations.
4. Rebuild and start Product Service and API Gateway.
5. Create consumer.
6. Issue DB-backed API key.
7. Create usage plan with quotaLimit=1 and quotaWindow=DAILY.
8. Assign usage plan to API key.
9. First GET /api/products returns 200.
10. GET /internal/admin/api-keys/:id/quota returns usedRequests=1, remainingRequests=0, exceeded=true, enforced=true.
11. Second GET /api/products returns 429 QUOTA_EXCEEDED with quota metadata.
12. GET /internal/admin/usage-plans/:id/usage-summary returns usage summary.

Runtime output:

- First /api/products status: 200
- API key quota state status: 200
- Second /api/products status: 429
- Usage plan summary status: 200
- Sprint 16 quota observability runtime validation PASSED

---

## Final Validation

Final automated validation:

- npm run test -> passed
- npm run typecheck -> passed
- npm run build -> passed
- git status -> working tree clean before docs update

Latest automated test count:

- 46 test files passed
- 329 tests passed

---

## New and Updated Endpoints

Added in Sprint 16:

- GET /internal/admin/api-keys/:id/quota
- GET /internal/admin/usage-plans/:id/usage-summary

Updated behavior:

- 429 QUOTA_EXCEEDED now includes quota metadata.

---

## Important Design Notes

api_usage_events remains the source of truth for successful/proxied usage.

Current recording scope:

- Successful downstream proxy handler responses.
- Cache HIT.
- Cache MISS.
- Cache BYPASS.

Not tracked yet:

- Failed auth requests.
- Rate-limited requests.
- Quota-denied requests.

Reason:

- These rejected requests should not be mixed into quota-counted successful usage without a clear event type/outcome model.

---

## Recommended Next Sprint

Sprint 17 recommended direction:

- API Usage Rejection Tracking Design, or
- Advanced Usage Analytics Hardening

Recommended scope:

- Decide how to track failed auth, rate-limited, and quota-denied requests.
- Keep successful/proxied usage and rejected/security events clearly separated or clearly typed.
- Avoid corrupting event-based quota counts.
