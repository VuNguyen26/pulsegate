# PulseGate Requirements

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

## Current Version

v0.18.0

## Latest Completed Sprint

Sprint 17 - API Rejection Tracking and Rejected Events Observability

---

## Document Scope

This file tracks current and future requirements compactly.

Detailed sprint history lives in:

- docs/sdlc/sprint-history/

Manual validation commands live in:

- docs/runbooks/

Long decision records live in:

- docs/project-context/decisions/

---

## Product Vision

PulseGate should grow from a backend learning project into a product-like API Gateway and API Management Platform.

Reference products:

- Kong
- Apache APISIX
- Tyk
- Apigee
- AWS API Gateway

Long-term target:

- API Gateway runtime
- Admin APIs
- Admin Dashboard later
- Developer Portal later
- API consumers
- API keys
- Usage plans
- Quotas
- Usage analytics
- Rejected request tracking
- Observability
- CI/CD
- Cloud/Kubernetes deployment later

---

## Current Functional Requirements

### FR-001 Health and Metrics

PulseGate shall expose:

- GET /health
- GET /metrics

Status:

Implemented.

---

### FR-002 Product Service Proxy

PulseGate shall proxy Product Service endpoints through the gateway.

Current endpoints:

- GET /api/product-service/health
- GET /api/products

Status:

Implemented.

---

### FR-003 API Key Authentication

PulseGate shall protect selected routes with API key authentication.

Supported modes:

- DB-backed issued API keys.
- Env fallback API_KEYS for local development.

Status:

Implemented.

---

### FR-004 JWT Authentication

PulseGate shall protect selected routes with JWT authentication.

Current local values:

- JWT_SECRET=local-dev-jwt-secret-change-me
- JWT_ISSUER=pulsegate-api-gateway
- JWT_AUDIENCE=pulsegate-clients

Status:

Implemented.

---

### FR-005 Rate Limiting

PulseGate shall support route-level rate limiting.

Current store:

- Redis-backed rate limit store

Status:

Implemented.

---

### FR-006 Response Caching

PulseGate shall support route-level response caching.

Current store:

- Redis response cache

Supported cache statuses:

- HIT
- MISS
- BYPASS

Status:

Implemented.

---

### FR-007 Route Policies

PulseGate shall support route-level policies.

Current policies:

- auth
- timeout
- cache
- rateLimit
- requestTransform
- responseTransform
- retry

Status:

Implemented as foundation.

---

### FR-008 Dynamic Route Configuration

PulseGate shall support route configuration from PostgreSQL.

Current behavior:

- Load active route configs from database at startup.
- Fallback to static route config when database config is unavailable.
- Manage route configs through internal/admin APIs.
- Reload runtime registry without app restart.

Status:

Implemented.

---

### FR-009 Catch-All Dynamic Router

PulseGate shall dispatch dynamic /api/* routes through a stable catch-all route.

Current supported methods:

- GET
- POST
- PUT
- PATCH
- DELETE

Status:

Implemented.

---

### FR-010 API Consumer Management

PulseGate shall support API consumer management.

Current endpoints:

- GET /internal/admin/consumers
- POST /internal/admin/consumers
- GET /internal/admin/consumers/:id
- PATCH /internal/admin/consumers/:id

Status:

Implemented.

---

### FR-011 API Key Lifecycle

PulseGate shall support DB-backed issued API keys.

Current behavior:

- Issue API key for consumer.
- Return raw key only once.
- Persist key hash and key prefix.
- Revoke API key.
- List consumer API keys.
- Track lastUsedAt best-effort.

Current endpoints:

- GET /internal/admin/consumers/:consumerId/api-keys
- POST /internal/admin/consumers/:consumerId/api-keys
- PATCH /internal/admin/api-keys/:id/revoke

Status:

Implemented.

---

### FR-012 API Usage Tracking

PulseGate shall record usage events for successful proxy/cache responses.

Current usage table:

- gateway.api_usage_events

Current fields:

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

Status:

Implemented.

---

### FR-013 Admin Usage Summary

PulseGate shall expose admin usage summaries.

Current endpoints:

- GET /internal/admin/usage/consumers/:consumerId/summary
- GET /internal/admin/usage/api-keys/:apiKeyId/summary

Status:

Implemented.

---

### FR-014 Usage Plans

PulseGate shall support usage plans.

Current usage plan fields:

- name
- description
- quotaLimit
- quotaWindow
- enabled
- createdBy
- updatedBy

Current quota windows:

- DAILY
- MONTHLY

Current endpoints:

- GET /internal/admin/usage-plans
- POST /internal/admin/usage-plans
- GET /internal/admin/usage-plans/:id
- PATCH /internal/admin/usage-plans/:id

Status:

Implemented.

---

### FR-015 API Key Usage Plan Assignment

PulseGate shall allow assigning a usage plan to an API key.

Current endpoint:

- PATCH /internal/admin/api-keys/:id/usage-plan

Status:

Implemented.

---

### FR-016 Runtime Quota Enforcement

PulseGate shall enforce usage plan quotas at runtime.

Current behavior:

- Applies to DB-backed API keys.
- Requires assigned enabled usage plan.
- Uses gateway.api_usage_events as source of truth.
- Rejects over-quota requests with 429 QUOTA_EXCEEDED.
- Does not enforce quota for env fallback API keys.
- Does not enforce quota for public routes.

Status:

Implemented.

---

### FR-017 API Key Quota State

PulseGate shall expose quota state for one API key.

Current endpoint:

- GET /internal/admin/api-keys/:id/quota

Response includes:

- apiKeyId
- consumerId
- reason
- usagePlan
- usedRequests
- remainingRequests
- windowStartedAt
- windowEndsAt
- resetAt
- exceeded
- enforced

Status:

Implemented in Sprint 16.

---

### FR-018 Usage Plan Usage Summary

PulseGate shall expose usage summary for one usage plan.

Current endpoint:

- GET /internal/admin/usage-plans/:id/usage-summary

Response includes:

- usagePlan
- windowStartedAt
- windowEndsAt
- resetAt
- assignedApiKeys
- activeApiKeys
- totalRequestsInCurrentWindow
- exceededApiKeys
- nearLimitApiKeys
- topApiKeysByUsage

Status:

Implemented in Sprint 16.

---

### FR-019 Quota Exceeded Metadata

PulseGate shall include quota metadata in 429 QUOTA_EXCEEDED responses.

Current response details:

- quotaLimit
- quotaWindow
- usedRequests
- remainingRequests
- windowStartedAt
- windowEndsAt
- resetAt

Status:

Implemented in Sprint 16.

---

## Current Non-Functional Requirements

### NFR-001 Type Safety

The project shall use TypeScript and pass typecheck.

Validation:

- npm run typecheck

Status:

Implemented.

---

### NFR-002 Automated Tests

The project shall have automated unit/integration-style tests.

Current result:

- 52 test files passed
- 342 tests passed

Validation:

- npm run test

Status:

Implemented.

---

### NFR-003 Build Stability

The project shall build successfully.

Validation:

- npm run build

Status:

Implemented.

---

### NFR-004 Docker Local Runtime

The project shall run locally through Docker Compose.

Current services:

- api-gateway
- product-service
- postgres
- redis
- prometheus
- grafana

Status:

Implemented.

---

### NFR-005 Observability

The gateway shall expose basic observability signals.

Current signals:

- Request ID
- Structured logs
- x-response-time-ms
- Prometheus metrics
- Grafana dashboard
- API usage events
- Admin usage summary APIs
- Quota observability APIs

Status:

Implemented as foundation.

---

### NFR-006 Secure API Key Storage

Raw API keys shall not be persisted.

Current behavior:

- keyHash is stored.
- keyPrefix is stored.
- rawKey is returned only once.
- keyHash is never exposed in admin responses.

Status:

Implemented.

---

## Important Current Limitations

- Failed authentication requests are tracked in gateway.api_rejected_events.
- Rate-limited requests are tracked in gateway.api_rejected_events.
- Quota-denied requests are tracked in gateway.api_rejected_events.
- Usage data is event-based only.
- No aggregate rollup table yet.
- No retention policy yet.
- No per-consumer Grafana dashboard yet.
- No per-key Grafana dashboard yet.
- No quota usage Grafana dashboard yet.
- Env fallback API keys are not quota-enforced.
- Admin Dashboard is not implemented yet.
- Developer Portal is not implemented yet.
- Admin auth is still local admin API key based.
- Admin RBAC is not implemented yet.
- Dynamic router supports exact method + exact path matching only.
- Path parameters are not implemented yet.
- Wildcard upstream path forwarding is not implemented yet.
- Host-based routing is not implemented yet.
- Weighted upstreams are not implemented yet.
- Service discovery is not implemented yet.
- CI does not run full Docker Compose runtime validation yet.
- Kubernetes/cloud deployment is planned later.
- Kafka/RabbitMQ event streaming is planned later.

---

## Future Requirements Backlog

Recommended next:

- Rejected request tracking design.
- Decide whether failed auth, rate-limited, and quota-denied events should use typed api_usage_events or a separate rejected/security event table.
- Keep quota counts accurate.
- Add aggregate rollups later.
- Add retention policy later.
- Add quota dashboard later.
- Add Admin Dashboard later.
- Add Developer Portal later.
- Add service discovery later.
- Add Kubernetes/cloud deployment later.


---

### FR-020 API Rejection Tracking

PulseGate shall record rejected gateway requests separately from successful/proxied usage events.

Rejected event table:

- gateway.api_rejected_events

Tracked rejection reasons:

- API_KEY_MISSING
- API_KEY_INVALID
- JWT_TOKEN_MISSING
- JWT_TOKEN_INVALID
- RATE_LIMIT_EXCEEDED
- QUOTA_EXCEEDED

Required behavior:

- Failed auth requests are recorded as rejected events.
- Rate-limited requests are recorded as rejected events.
- Quota-denied requests are recorded as rejected events.
- Rejected requests are not recorded into gateway.api_usage_events.
- gateway.api_usage_events remains the source of truth for quota counting.
- Raw API keys, JWTs, and Authorization headers must never be stored.

Admin endpoint:

- GET /internal/admin/api-rejections/summary

Status:

Implemented in Sprint 17.
