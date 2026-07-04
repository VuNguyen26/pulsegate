# PulseGate Requirements

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

## Current Version

v0.21.0

## Latest Completed Sprint

Sprint 20 - Usage Analytics Listing and Event Investigation

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

PulseGate should grow from a backend learning project into a product-like API Gateway and API Management Platform inspired by Kong, Apache APISIX, Tyk, Apigee, and AWS API Gateway.

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
- Successful usage event investigation
- Rejected request tracking and drilldown
- Observability
- CI/CD
- Cloud/Kubernetes deployment later

---

## Current Functional Requirements

### FR-001 Health and Metrics

PulseGate shall expose GET /health and GET /metrics.

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

PulseGate shall protect selected routes with DB-backed issued API keys or env fallback API_KEYS.

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

PulseGate shall support route-level Redis-backed rate limiting.

Status:

Implemented.

---

### FR-006 Response Caching

PulseGate shall support route-level Redis response caching with HIT, MISS, and BYPASS statuses.

Status:

Implemented.

---

### FR-007 Route Policies

PulseGate shall support auth, timeout, cache, rateLimit, requestTransform, responseTransform, and retry policies.

Status:

Implemented as foundation.

---

### FR-008 Dynamic Route Configuration

PulseGate shall support PostgreSQL-backed route configuration, internal/admin route management, and runtime registry reload.

Status:

Implemented.

---

### FR-009 Catch-All Dynamic Router

PulseGate shall dispatch dynamic /api/* routes through a stable catch-all route for GET, POST, PUT, PATCH, and DELETE.

Status:

Implemented.

---

### FR-010 API Consumer Management

PulseGate shall support API consumer management.

Status:

Implemented.

---

### FR-011 API Key Lifecycle

PulseGate shall support issuing, listing, revoking, and assigning usage plans to DB-backed API keys.

Status:

Implemented.

---

### FR-012 API Usage Tracking

PulseGate shall record usage events for successful proxy/cache responses into gateway.api_usage_events.

Status:

Implemented.

---

### FR-013 Admin Usage Summary

PulseGate shall expose consumer and API key usage summaries over gateway.api_usage_events.

Current endpoints:

- GET /internal/admin/usage/consumers/:consumerId/summary
- GET /internal/admin/usage/api-keys/:apiKeyId/summary

Supported filters:

- from
- to
- routePath
- routeMethod
- statusCode
- cacheStatus
- apiKeyAuthSource

Status:

Implemented.

---

### FR-014 Usage Plans

PulseGate shall support usage plans with DAILY and MONTHLY quota windows.

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

PulseGate shall enforce usage plan quotas for DB-backed API keys using gateway.api_usage_events as the source of truth.

Status:

Implemented.

---

### FR-017 API Key Quota State

PulseGate shall expose quota state for one API key.

Current endpoint:

- GET /internal/admin/api-keys/:id/quota

Status:

Implemented.

---

### FR-018 Usage Plan Usage Summary

PulseGate shall expose usage summary for one usage plan.

Current endpoint:

- GET /internal/admin/usage-plans/:id/usage-summary

Status:

Implemented.

---

### FR-019 Quota Exceeded Metadata

PulseGate shall include quota metadata in 429 QUOTA_EXCEEDED responses.

Status:

Implemented.

---

### FR-020 API Rejection Tracking

PulseGate shall record failed auth, rate-limited, and quota-denied requests into gateway.api_rejected_events, not gateway.api_usage_events.

Status:

Implemented.

---

### FR-021 API Rejected Event Drilldown

PulseGate shall expose rejected event summary and raw rejected event listing for admin investigation.

Current endpoints:

- GET /internal/admin/api-rejections/summary
- GET /internal/admin/api-rejections/events

Status:

Implemented.

---

### FR-022 Usage Analytics Retention and Rollup Design

PulseGate shall keep a clear design path for high-volume analytics storage lifecycle.

Status:

Designed only. Not implemented yet.

---

### FR-023 Successful Usage Event Listing

PulseGate shall expose raw successful usage events for admin investigation.

Current endpoint:

- GET /internal/admin/usage/events

Source table:

- gateway.api_usage_events

Required behavior:

- Endpoint requires x-admin-api-key.
- Listing returns raw successful usage event rows.
- Listing supports safe pagination with limit, offset, total, and hasNextPage.
- Default limit is 20.
- Maximum limit is 100.
- Sort order is occurredAt desc and id desc.
- Supported filters include from, to, routePath, routeMethod, statusCode, cacheStatus, apiKeyAuthSource, apiKeyId, and consumerId.
- Query validation returns 400 INVALID_QUERY_PARAMETER for invalid values.
- Usage event listing must not expose raw API keys, JWTs, or Authorization headers.
- Usage event listing must read from gateway.api_usage_events only.
- Usage event listing must not mix in gateway.api_rejected_events.
- Usage event listing must not change quota counting.

Status:

Implemented.

---

## Current Non-Functional Requirements

### NFR-001 Type Safety

Validation:

- npm run typecheck

Status:

Implemented.

---

### NFR-002 Automated Tests

Current result:

- 59 test files passed
- 396 tests passed

Validation:

- npm run test

Status:

Implemented.

---

### NFR-003 Build Stability

Validation:

- npm run build

Status:

Implemented.

---

### NFR-004 Docker Local Runtime

Latest runtime validation:

- Docker runtime usage events listing validation passed.

Status:

Implemented.

---

### NFR-005 Observability

Current signals include request IDs, structured logs, Prometheus metrics, Grafana dashboard, usage event tables, rejected event tables, usage summary APIs, usage event listing API, quota observability APIs, and rejected event APIs.

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
- Usage and rejected event analytics do not store or return raw API keys.

Status:

Implemented.

---

## Important Current Limitations

- Usage data is event-based only.
- Rejected event analytics is event-based only.
- No aggregate rollup table yet.
- No retention policy job yet.
- No cursor pagination for very large event datasets yet.
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

- Consider cursor pagination for very large event datasets.
- Implement event retention policy for api_usage_events and api_rejected_events.
- Implement aggregate rollup tables for high-volume analytics.
- Add Grafana panels for quota, usage, and rejected traffic later.
- Add Admin Dashboard later.
- Add Developer Portal later.
- Add service discovery later.
- Add Kubernetes/cloud deployment later.
