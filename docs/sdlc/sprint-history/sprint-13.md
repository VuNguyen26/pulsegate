# Sprint 13 - API Consumer and API Key Lifecycle Foundation

## Status

Done.

## Version

v0.14.0

## Goal

Sprint 13 added the first API Management ownership layer to PulseGate.

Before Sprint 13, consumer `x-api-key` authentication only supported static environment keys such as:

```txt
dev-api-key
```

After Sprint 13, PulseGate supports:

```txt
API consumers
Issued API keys
Hashed API key storage
Admin Consumer API
Admin API Key lifecycle API
DB-backed runtime API key authentication
API key revocation
API key expiration check
Disabled consumer rejection
API key last-used metadata
Env API_KEYS fallback for local/dev compatibility
```

---

## Technical Scope

Sprint 13 stayed backend-only.

Included:

```txt
API consumer schema
API key schema
API key hashing foundation
API consumer management repository and mapper
Admin Consumer API
API key management repository and mapper
Admin API Key lifecycle API
DB-backed API key verifier
Injectable API key auth middleware factory
Runtime DB-backed API key authentication
Env API_KEYS fallback
Docker runtime validation
```

Not included:

```txt
Admin Dashboard UI
Developer Portal UI
Self-service API key request flow
Usage plans
Quotas
Billing
Per-consumer analytics
API usage event table
Kafka
RabbitMQ
Kubernetes
Production cloud deployment
Complex service discovery
```

---

## Completed Work

1. Added API consumer Prisma schema.
2. Added API key Prisma schema.
3. Added `ApiConsumerStatus` enum.
4. Added `ApiKeyStatus` enum.
5. Added `gateway.api_consumers` table.
6. Added `gateway.api_keys` table.
7. Added API key hash uniqueness.
8. Added key prefix indexing.
9. Added consumer/key status indexing.
10. Added API key expiry and last-used metadata.
11. Added API key revocation metadata.
12. Added API key hashing foundation.
13. Added raw API key generation.
14. Added SHA-256 API key hashing.
15. Added timing-safe hash verification helper.
16. Added API key prefix extraction.
17. Added API consumer management repository.
18. Added API consumer request/response mapper.
19. Added Admin Consumer API.
20. Added API key management repository.
21. Added API key request/response mapper.
22. Added Admin API Key lifecycle API.
23. Added DB-backed API key verifier foundation.
24. Added injectable API key auth middleware factory.
25. Preserved legacy env `API_KEYS` fallback behavior.
26. Added request API key context fields.
27. Wired DB-backed API key verifier into downstream proxy runtime auth.
28. Added tests for API key hashing.
29. Added tests for API consumer mapper.
30. Added tests for Admin Consumer API.
31. Added tests for API key management mapper.
32. Added tests for Admin API Key lifecycle API.
33. Added tests for DB-backed API key verifier.
34. Added tests for injected API key middleware.
35. Added downstream proxy integration test proving injected API key middleware is used.
36. Ran focused API Gateway validation.
37. Ran full monorepo test validation.
38. Ran typecheck validation.
39. Ran build validation.
40. Ran Docker runtime validation.
41. Validated issued DB-backed API key can call protected `/api/products`.
42. Validated revoked DB-backed API key returns `403`.
43. Validated legacy `dev-api-key` still works through env fallback.
44. Committed and pushed all Sprint 13 technical checkpoints.
45. Completed final Sprint 13 documentation update.

---

## Database Changes

API Gateway owns API consumer and API key data in the PostgreSQL `gateway` schema.

New tables:

```txt
gateway.api_consumers
gateway.api_keys
```

API consumer statuses:

```txt
ACTIVE
DISABLED
```

API key statuses:

```txt
ACTIVE
REVOKED
```

API consumer model:

```txt
id
name
description
status
created_at
updated_at
created_by
updated_by
```

API key model:

```txt
id
consumer_id
name
key_prefix
key_hash
status
expires_at
last_used_at
created_at
updated_at
created_by
revoked_at
revoked_by
```

Storage rule:

```txt
Raw API keys are never persisted.
Only key_hash and key_prefix are stored.
Raw API key is returned only once when issued.
key_hash is never exposed through API responses.
rawKey is never exposed after the issue response.
```

---

## Runtime Auth Behavior

When a protected route requires API key authentication:

```txt
Incoming request
  -> read x-api-key
  -> hash incoming raw key
  -> lookup gateway.api_keys by keyHash
  -> include related API consumer
  -> if key exists:
       check key status
       check consumer status
       check expiresAt
       update lastUsedAt best-effort
       attach API key context to request
  -> if key does not exist:
       fallback to env API_KEYS
  -> if DB lookup fails:
       fallback to env API_KEYS
```

Successful DB-backed auth attaches:

```txt
request.apiKey
request.apiKeyId
request.apiConsumerId
request.apiKeyAuthSource = database
```

Successful env fallback auth attaches:

```txt
request.apiKey
request.apiKeyAuthSource = env
```

Rejected DB-backed key states:

```txt
status=REVOKED
expiresAt in the past
consumer.status=DISABLED
```

Important security rule:

```txt
If a DB-backed key is found but revoked, expired, or belongs to a disabled consumer,
PulseGate rejects the request and does not fall back to env API_KEYS.
```

---

## Admin Consumer API

Endpoints:

```txt
GET /internal/admin/consumers
POST /internal/admin/consumers
GET /internal/admin/consumers/:id
PATCH /internal/admin/consumers/:id
```

Behavior:

```txt
GET /internal/admin/consumers
  -> list API consumers

POST /internal/admin/consumers
  -> create API consumer
  -> requires name
  -> status defaults to ACTIVE

GET /internal/admin/consumers/:id
  -> get API consumer detail
  -> 404 API_CONSUMER_NOT_FOUND when missing

PATCH /internal/admin/consumers/:id
  -> update name, description, or status
  -> 404 API_CONSUMER_NOT_FOUND when missing
```

All endpoints require:

```txt
x-admin-api-key
```

Optional actor header:

```txt
x-admin-actor
```

---

## Admin API Key Lifecycle API

Endpoints:

```txt
GET /internal/admin/consumers/:consumerId/api-keys
POST /internal/admin/consumers/:consumerId/api-keys
PATCH /internal/admin/api-keys/:id/revoke
```

Behavior:

```txt
GET /internal/admin/consumers/:consumerId/api-keys
  -> verifies consumer exists
  -> lists keys for consumer
  -> does not expose keyHash
  -> does not expose rawKey

POST /internal/admin/consumers/:consumerId/api-keys
  -> verifies consumer exists
  -> validates request body
  -> generates raw API key
  -> stores keyHash and keyPrefix
  -> returns rawKey once
  -> does not expose keyHash

PATCH /internal/admin/api-keys/:id/revoke
  -> verifies key exists
  -> sets status=REVOKED
  -> sets revokedAt
  -> sets revokedBy
  -> returns key response without keyHash/rawKey
```

All endpoints require:

```txt
x-admin-api-key
```

---

## Validation

Automated validation:

```txt
npm run test       -> passed
npm run typecheck  -> passed
npm run build      -> passed
```

Test result:

```txt
36 test files passed
256 tests passed
```

Docker runtime validation:

```txt
docker compose up -d --build -> passed
docker compose ps -> passed
```

Validated runtime flow:

```txt
Created API consumer
Issued DB-backed API key
Generated local JWT
Called protected /api/products with issued DB key + JWT
Received 200 OK
Revoked issued DB key
Called protected /api/products with revoked key
Received 403
Called protected /api/products with dev-api-key fallback
Received 200 OK
```

---

## Stable Commits

Technical commits:

```txt
24217ac feat(gateway): add api consumer key schema
229c9be feat(gateway): add api key hashing foundation
5ef8ed0 feat(gateway): add api consumer management foundation
abea27c feat(gateway): add admin consumer api
13faa44 feat(gateway): add api key management foundation
595435a feat(gateway): add admin api key lifecycle api
2c53ff1 feat(gateway): add db backed api key verifier foundation
b7bd095 feat(gateway): wire db backed api key auth
```

Documentation commit:

```txt
8644244 docs: finalize sprint 13 documentation
```

---

## Known Limitations After Sprint 13

```txt
No API usage event table yet.
No per-consumer analytics yet.
No per-key analytics yet.
No usage plans yet.
No quotas yet.
No billing yet.
No Admin Dashboard yet.
No Developer Portal yet.
Rate limit identity still uses raw API key value.
lastUsedAt is metadata only, not full analytics.
Admin auth still uses local admin API key.
```

---

## Recommended Next Sprint

Recommended next sprint:

```txt
Sprint 14 - API Key Usage Tracking and Consumer Analytics Foundation
```

Reason:

```txt
Sprint 13 introduced real API consumers and issued API keys.
The next product-like API Management step is to attribute traffic to consumers and keys.
Usage tracking should come before usage plans, quotas, Admin Dashboard analytics, and Developer Portal usage views.
```

Recommended Sprint 14 scope:

```txt
Add API usage event table or aggregate usage table.
Record apiKeyId, consumerId, route, method, statusCode, durationMs, and timestamp.
Support env fallback traffic safely.
Expose admin read API for consumer usage summary.
Expose admin read API for API key usage summary.
Prepare usage plans and quotas for later.
```
