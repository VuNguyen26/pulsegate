# PulseGate Requirements

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

## Current Version

v0.26.0

## Latest Completed Sprint

Sprint 25 - Analytics Rollup Read Model Foundation

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
- Analytics retention and rollups
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

Designed. Rollup calculation, persistence, manual backfill, and read model foundations are implemented.

---

### FR-023 Successful Usage Event Listing

PulseGate shall expose raw successful usage events for admin investigation.

Current endpoint:

- GET /internal/admin/usage/events

Status:

Implemented.

---

### FR-024 Event Listing Cursor Pagination

PulseGate shall support cursor pagination for raw successful usage events and raw rejected events to improve investigation on larger event datasets.

Current endpoints:

- GET /internal/admin/usage/events
- GET /internal/admin/api-rejections/events

Status:

Implemented.

---

### FR-025 Analytics Rollup Calculation Foundation

PulseGate shall provide safe code-level foundations for future analytics rollups.

Current helper capabilities:

- UTC hourly and daily bucket calculation.
- Rollup window planning for partial ranges.
- maxBuckets guardrail for planned rebuild windows.
- Usage event aggregate builder.
- Rejected event aggregate builder.

Status:

Implemented.

---

### FR-026 Analytics Rollup Persistence Foundation

PulseGate shall provide persistence foundations for future analytics rollup backfill and long-range analytics.

Current persistence capabilities:

- Separate usage and rejected rollup tables.
- Stable dimensionHash for idempotent upsert keys.
- Usage rollup persistence repository.
- Rejected rollup persistence repository.
- Internal persistence service that aggregates raw-shaped events and persists rollups.

Required safety:

- Must keep successful usage and rejected/security traffic separate.
- Must not change quota counting.
- Must not change usage or rejected event recorders.
- Must not switch runtime summary APIs to rollup reads until explicitly designed.
- Must not delete raw events.

Status:

Implemented as foundation.

---

### FR-027 Analytics Rollup Manual Backfill

PulseGate shall provide a controlled manual command for analytics rollup backfill.

Current command:

- npm run analytics:rollup:backfill --workspace api-gateway -- --from <iso> --to <iso> --granularity <hour|day>

Required safety:

- Dry-run by default.
- Execute mode must be explicit.
- Usage and rejected sources must remain separate.
- Event limit guardrail must prevent partial persistence.
- No quota counting change.
- No retention deletion.

Status:

Implemented.

---

### FR-028 Analytics Rollup Read Model

PulseGate shall expose read-only analytics rollup rows for admin investigation.

Current endpoint:

- GET /internal/admin/analytics/rollups

Required behavior:

- Require admin API key.
- Require source=usage or source=rejected.
- Require from, to, and granularity.
- Support hour and day granularity.
- Support safe limit guardrails.
- Support shared filters by route, method, status, auth source, API key, and consumer.
- Support cacheStatus for usage rollups only.
- Support rejectionReason for rejected rollups only.
- Return 400 INVALID_QUERY_PARAMETER for invalid source-specific filters.
- Keep existing usage and rejected summary APIs on raw event tables.
- Keep quota counting on gateway.api_usage_events.

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

- 76 test files passed
- 521 tests passed

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

Latest validation:

- Docker Compose build and startup passed.
- Runtime migration deploy applied analytics rollup tables.
- GET /health returned 200.
- GET /internal/admin/analytics/rollups returned 401 without admin API key.
- Usage rollup read returned 200.
- Rejected rollup read returned 200.
- Invalid rejected rollup query with cacheStatus returned 400.

Status:

Implemented.

---

### NFR-005 Observability

Current signals include request IDs, structured logs, Prometheus metrics, Grafana dashboard, usage event tables, rejected event tables, usage summary APIs, usage event listing API, quota observability APIs, rejected event APIs, rollup persistence foundations, and rollup read API.

Status:

Implemented as foundation.

---

### NFR-006 Secure API Key Storage

Raw API keys shall not be persisted.

Status:

Implemented.

---

## Important Current Limitations

- Usage summary APIs still read raw events.
- Rejected summary APIs still read raw events.
- Rollup read endpoint exists, but summary APIs have not switched to rollup reads.
- No retention policy job yet.
- No scheduled/background rollup job yet.
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

- Implement analytics retention safety dry-run foundation.
- Switch selected long-range analytics reads to rollups later after explicit design.
- Implement event retention policy for api_usage_events and api_rejected_events later.
- Add Grafana panels for quota, usage, rejected traffic, and rollups later.
- Add Admin Dashboard later.
- Add Developer Portal later.
- Add service discovery later.
- Add Kubernetes/cloud deployment later.
