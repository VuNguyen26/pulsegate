# PulseGate Requirements

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

## Current Version

v0.29.0

## Latest Completed Sprint

Sprint 28 - Analytics Retention Execution Repository Safety Foundation

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

Designed. Rollup calculation, persistence, manual backfill, read model, retention dry-run, retention execution guardrail, and retention repository safety foundations are implemented.

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

Status:

Implemented.

---

### FR-026 Analytics Rollup Persistence Foundation

PulseGate shall provide persistence foundations for future analytics rollup backfill and long-range analytics.

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

Status:

Implemented.

---

### FR-029 Analytics Retention Dry-Run Foundation

PulseGate shall provide a safe dry-run foundation for future retention of raw analytics events.

Current command:

- npm run analytics:retention:dry-run --workspace api-gateway -- --enabled true --source <usage|rejected|both> --usage-retention-days <n> --rejected-retention-days <n>

Required behavior:

- Default to disabled dry-run planning.
- Support source=usage, source=rejected, and source=both.
- Support separate usage and rejected retention day windows.
- Enforce positive integer and minimum retention day guardrails.
- Count candidate rows older than computed cutoffs.
- Return dryRunOnly=true and deleteAllowed=false.
- Reject execute mode.
- Do not delete raw events.
- Do not change quota counting.
- Do not switch summary APIs to rollup reads.

Status:

Implemented as dry-run foundation.

---

### FR-030 Analytics Retention Execution Guardrails

PulseGate shall provide guardrail foundations for future analytics retention execution without deleting raw analytics events yet.

Current command:

- npm run analytics:retention:execution-preview --workspace api-gateway -- --enabled true --source <usage|rejected|both> --usage-retention-days <n> --rejected-retention-days <n> --mode execute --confirm-execute I_UNDERSTAND_ANALYTICS_RETENTION_DELETE --hard-delete-limit <n>

Required behavior:

- Dry-run must remain the safe default.
- Execute preview must require explicit confirmation phrase.
- Execute preview must require a hard delete limit.
- Delete batch planning must require candidate recheck.
- Hard delete limit must apply as one total cap across selected sources.
- Execution preview must report deleteImplementationAvailable=false.
- No operator-facing raw event deletion is exposed by this requirement.
- No quota counting change.
- No usage or rejected recorder change.
- No summary API switch to rollup reads.

Status:

Implemented as guardrail foundation.

---

### FR-031 Analytics Retention Delete Repository Safety Foundation

PulseGate shall provide repository-level safety primitives for future analytics retention execution without exposing destructive operator controls yet.

Required behavior:

- Repository safety must require an allowed delete batch plan.
- Repository safety must require candidate recheck before delete.
- Repository safety must keep usage and rejected sources separate.
- Repository safety must require valid cutoff and positive requested limit.
- Requested limit must not exceed the hard delete limit, source max delete count, or rechecked candidates.
- Prisma delete repository must select bounded candidate IDs before deleting.
- Prisma delete repository must delete by selected IDs only, not by an unbounded cutoff delete.
- Current execution preview command must continue to report deleteImplementationAvailable=false.
- No retention execute command, API, scheduled job, or quota path may use this repository until explicitly designed.

Status:

Implemented as repository safety foundation.

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

- 89 test files passed
- 621 tests passed

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

- PostgreSQL and Redis containers started or reused successfully.
- Runtime migration deploy found 7 migrations and no pending migrations.
- Analytics retention dry-run DB-backed candidate validation passed with candidateCount=0 and deleteAllowed=false.
- Analytics retention execution preview command passed with deleteImplementationAvailable=false.

Status:

Implemented.

---

### NFR-005 Observability

Current signals include request IDs, structured logs, Prometheus metrics, Grafana dashboard, usage event tables, rejected event tables, usage summary APIs, usage event listing API, quota observability APIs, rejected event APIs, rollup persistence foundations, rollup read API, and retention dry-run candidate previews, retention execution guard previews, and retention repository safety tests.

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
- Retention execution has repository-level safety foundations, but no operator-facing execute command yet.
- Retention Prisma delete repository is not wired to any command, API, scheduled job, or quota path yet.
- No retention delete job is implemented yet.
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

- Add a service-level analytics retention execution orchestration preview behind existing guardrails.
- Keep retention execution explicit, limited, and blocked from operator-facing delete until approved.
- Switch selected long-range analytics reads to rollups later after explicit design.
- Add Grafana panels for quota, usage, rejected traffic, rollups, and retention dry-run candidates later.
- Add Admin Dashboard later.
- Add Developer Portal later.
- Add service discovery later.
- Add Kubernetes/cloud deployment later.
