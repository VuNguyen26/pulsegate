# PulseGate Requirements

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

## Current Version

v0.16.0

## Current Status

Sprint 15 - Usage Plans and Quota Foundation Complete

Latest validation:

- 44 test files passed
- 314 tests passed
- npm run typecheck passed
- npm run build passed
- Docker runtime quota validation passed

---

## Document Scope

This file tracks current functional requirements, non-functional requirements, constraints, and future requirements.

Detailed sprint history lives in:

- docs/sdlc/sprint-history/

Manual validation commands live in:

- docs/runbooks/

Long decision records live in:

- docs/project-context/decisions/

---

## Product Purpose

PulseGate is a mini API Gateway, API Management, and Observability Platform.

The project demonstrates backend engineering around:

- API Gateway design.
- Microservice communication.
- Dynamic route configuration.
- Runtime route reload.
- API consumer management.
- API key lifecycle management.
- DB-backed runtime API key authentication.
- API usage tracking.
- Consumer analytics.
- API key analytics.
- Usage plans and quotas.
- Traffic protection.
- Response caching.
- Observability.
- CI/CD.
- Production-oriented backend architecture.

Long-term target:

Build PulseGate toward a product-like API Gateway/API Management platform, not only a portfolio backend project.

---

## Current System Summary

Current architecture includes:

- API Gateway.
- Product Service.
- PostgreSQL.
- Prisma.
- Redis.
- Prometheus.
- Grafana.
- Docker Compose.
- GitHub Actions CI/CD.
- Database-backed route config.
- Runtime route registry.
- Catch-all dynamic router.
- API consumers.
- Issued API keys.
- Usage plans.
- API usage events.
- DB-backed API key authentication.
- Runtime quota enforcement.
- Admin route management APIs.
- Admin consumer APIs.
- Admin API key lifecycle APIs.
- Admin usage plan APIs.
- Admin usage summary APIs.

---

# Functional Requirements

## FR-001: API Gateway Service

The system must have an API Gateway service.

Status:

Done.

---

## FR-002: Product Service

The system must have a Product Service.

Status:

Done.

---

## FR-003: Gateway Product Proxy Route

API Gateway must route product requests to Product Service.

Status:

Done.

---

## FR-004: Public Product Service Health Proxy Route

API Gateway must expose a public proxy route to Product Service health.

Status:

Done.

---

## FR-005: Authentication and Authorization

API Gateway must support route-level authentication behavior.

Status:

Done.

---

## FR-006: Admin API Key Authentication

API Gateway must protect internal/admin APIs with a separate admin API key.

Status:

Done.

---

## FR-007: Traffic Protection

API Gateway must protect selected routes from excessive traffic and unsafe payloads.

Status:

Done.

---

## FR-008: Redis Response Caching

API Gateway must cache selected downstream responses in Redis.

Status:

Done.

---

## FR-009: Downstream Error Normalization

API Gateway must return clean and consistent errors when downstream services fail.

Status:

Done.

---

## FR-010: PostgreSQL and Prisma

PulseGate must use PostgreSQL and Prisma for persistent data.

Status:

Done.

---

## FR-011: Database-Backed Gateway Route Configuration

API Gateway must support loading downstream route configuration from PostgreSQL.

Status:

Done.

---

## FR-012: Policy-Driven Gateway Behavior

API Gateway must support policy-driven route behavior.

Status:

Done.

---

## FR-013: Route Management APIs

API Gateway must expose internal/admin APIs to manage route config records.

Status:

Done.

---

## FR-014: Runtime Route Registry and Reload

API Gateway must maintain a runtime route config registry and support safe reload.

Status:

Done.

---

## FR-015: Catch-All Dynamic Router

API Gateway must support brand-new DB-backed /api/* routes without API Gateway restart after reload.

Status:

Done.

---

## FR-016: API Consumer Management

API Gateway must support backend API consumer management.

Status:

Done.

---

## FR-017: API Key Lifecycle Management

API Gateway must support issued API key lifecycle management.

Status:

Done.

---

## FR-018: API Key Hashing and Secret Storage

API Gateway must store issued API keys safely.

Status:

Done.

---

## FR-019: DB-Backed Runtime API Key Authentication

API Gateway must support runtime authentication using DB-backed issued API keys.

Status:

Done.

---

## FR-020: Automated Tests

The project must include automated tests for Gateway behavior.

Current test status:

- 44 test files passed
- 314 tests passed

Status:

Done.

---

## FR-021: GitHub Actions CI/CD Foundation

The project must support automated CI validation through GitHub Actions.

Status:

Done.

---

## FR-022: API Usage Event Tracking

API Gateway must record successful proxied API traffic as usage events.

Acceptance criteria:

- gateway.api_usage_events table exists.
- Usage event records requestId.
- Usage event records routePath.
- Usage event records routeMethod.
- Usage event records statusCode.
- Usage event records durationMs.
- Usage event records cacheStatus.
- Usage event records apiKeyAuthSource.
- Usage event records apiKeyId when DB-backed key is used.
- Usage event records consumerId when DB-backed key is used.
- Usage event supports env fallback traffic without apiKeyId and consumerId.
- Usage event is recorded for cache HIT.
- Usage event is recorded for cache MISS.
- Usage event is recorded for cache BYPASS.
- Usage recorder failure does not fail the client response.
- Runtime Docker validation proves DB-backed key traffic creates usage event.

Status:

Done.

---

## FR-023: Admin Usage Summary APIs

API Gateway must expose admin APIs for consumer and API key usage summaries.

Acceptance criteria:

- GET /internal/admin/usage/consumers/:consumerId/summary exists.
- GET /internal/admin/usage/api-keys/:apiKeyId/summary exists.
- Both endpoints require x-admin-api-key.
- Missing admin API key returns 401 ADMIN_API_KEY_MISSING.
- Missing consumer returns 404 API_CONSUMER_NOT_FOUND.
- Missing API key returns 404 API_KEY_NOT_FOUND.
- Consumer summary returns totalRequests.
- Consumer summary returns successfulRequests.
- Consumer summary returns errorRequests.
- Consumer summary returns averageDurationMs.
- Consumer summary returns cacheHits.
- Consumer summary returns cacheMisses.
- Consumer summary returns cacheBypasses.
- Consumer summary returns lastRequestAt.
- API key summary returns the same summary fields.
- Runtime Docker validation proves summary APIs return usage totals after DB-backed traffic.

Status:

Done.

---

## FR-024: Usage Plan Management

API Gateway must support internal/admin usage plan management.

Acceptance criteria:

- gateway.usage_plans table exists.
- Usage plan has name.
- Usage plan has optional description.
- Usage plan has quotaLimit.
- Usage plan has quotaWindow.
- quotaWindow supports DAILY.
- quotaWindow supports MONTHLY.
- Usage plan has enabled flag.
- GET /internal/admin/usage-plans exists.
- POST /internal/admin/usage-plans exists.
- GET /internal/admin/usage-plans/:id exists.
- PATCH /internal/admin/usage-plans/:id exists.
- All usage plan endpoints require x-admin-api-key.
- Invalid quotaLimit returns validation error.
- Invalid quotaWindow returns validation error.
- Missing usage plan returns 404 USAGE_PLAN_NOT_FOUND.

Status:

Done.

---

## FR-025: API Key Usage Plan Assignment

API Gateway must allow usage plans to be assigned to API keys.

Acceptance criteria:

- gateway.api_keys has usage_plan_id.
- API key responses include usagePlanId.
- PATCH /internal/admin/api-keys/:id/usage-plan exists.
- Endpoint requires x-admin-api-key.
- usagePlanId can be a string to assign a plan.
- usagePlanId can be null to unassign a plan.
- Missing API key returns 404 API_KEY_NOT_FOUND.
- Missing usage plan returns 404 USAGE_PLAN_NOT_FOUND.
- Updated API key response returns the assigned usagePlanId.

Status:

Done.

---

## FR-026: Runtime Quota Enforcement

API Gateway must enforce usage plan quotas for DB-backed API keys.

Acceptance criteria:

- Quota checker reads API key usage plan assignment.
- Quota checker ignores API keys without usage plans.
- Quota checker ignores disabled usage plans.
- Quota checker ignores env fallback API keys.
- Quota checker counts usage events in the current quota window.
- DAILY quota window uses UTC day boundaries.
- MONTHLY quota window uses UTC month boundaries.
- Runtime preHandler checks quota after API key/JWT validation and before cache/proxy execution.
- Over-quota requests return 429 QUOTA_EXCEEDED.
- Docker runtime validation proves first request returns 200 and second request returns 429 for a DAILY limit of 1.

Status:

Done.

---

# Non-Functional Requirements

## NFR-001: Local First

The project must run locally before cloud deployment.

Status:

Done.

## NFR-002: Cost Safe

The project must avoid unnecessary paid services during early development.

Status:

Done.

## NFR-003: Maintainable Structure

The codebase must be organized clearly by config, routes, middlewares, policies, repositories, database helpers, runtime registry, proxy handler, API management modules, usage modules, quota modules, tests, and server startup.

Status:

Done.

## NFR-004: Type Safety

The project must use TypeScript with strict checking.

Status:

Done.

## NFR-005: Observability

The project must provide request ID, structured access logs, latency headers, Prometheus metrics, Prometheus scraping, Grafana dashboards, and API usage events.

Status:

Done.

## NFR-006: Testability

The project must support automated unit and integration testing without requiring live infrastructure for every test.

Status:

Done.

## NFR-007: Failure Isolation

Non-critical failures should not break successful business responses when avoidable.

Status:

Done.

## NFR-008: Reproducible Local Infrastructure

The local infrastructure stack must be reproducible from repository files.

Status:

Done.

## NFR-009: Policy-Driven Gateway Behavior

Gateway route behavior should be policy-driven instead of hardcoded directly inside route handlers.

Status:

Done.

## NFR-010: Automated CI Validation

The project must validate repository health automatically.

Status:

Done.

## NFR-011: Safe Dynamic Config Rollout

Database-backed Gateway route config must be introduced safely with static fallback and validation.

Status:

Done.

## NFR-012: Safe Runtime Registry Reload

Runtime route config reload must validate configs before registry replacement and report runtime scope clearly.

Status:

Done.

## NFR-013: Avoid Unsafe Fastify Runtime Route Mutation

Runtime dynamic routing must avoid unsafe Fastify unregister/register behavior.

Status:

Done.

## NFR-014: Safe API Key Secret Handling

Issued API key secrets must be handled safely.

Status:

Done.

## NFR-015: DB-Backed API Key Auth Must Be Testable

Runtime DB-backed API key auth must remain testable through verifier and middleware injection.

Status:

Done.

## NFR-016: API Usage Recording Must Not Break Traffic

Usage recording failure must not fail an otherwise successful proxied response.

Status:

Done.

## NFR-017: Quota Enforcement Must Be Testable

Runtime quota enforcement must be testable without requiring live infrastructure in every test.

Status:

Done.

---

# Current Constraints

Current constraints after Sprint 15:

- Usage tracking records successful downstream proxy handler responses only.
- Failed authentication requests are not tracked yet.
- Rate-limited requests are not tracked yet.
- Quota-denied requests are not tracked yet.
- Usage tracking is event-based only.
- No aggregate rollup table exists yet.
- No retention policy exists yet.
- Quota evaluation currently counts usage events directly.
- Redis quota counters are not implemented yet.
- Disabled usage plans currently skip quota enforcement.
- Env fallback API keys are not quota-enforced.
- API Gateway currently proxies Product Service, but supports more than one Gateway route.
- Startup route configs are loaded from PostgreSQL when available.
- Static route configs still exist as safe startup fallback.
- Runtime route registry can refresh existing registered route config.
- Brand-new DB-backed /api/* paths can be applied through reload without restart.
- Catch-all dynamic router supports exact method + exact path matching only.
- Advanced path parameters are not implemented yet.
- Wildcard upstream path mapping is not implemented yet.
- Host-based routing is not implemented yet.
- Weighted upstreams are not implemented yet.
- Service discovery is not implemented yet.
- Route management audit log table is not implemented yet.
- Admin APIs use a local admin API key foundation, not a full admin user system yet.
- JWT validation is local-secret based.
- Request and response transformation foundations support headers only.
- Retry foundation exists, but retry is disabled by default for current routes.
- Redis failure currently causes protected product route to return generic 500.
- /metrics is public in local development.
- Grafana does not yet include per-consumer, per-key, or quota usage dashboards.
- CI does not run the full Docker Compose runtime stack yet.
- CI does not push Docker images to a registry yet.
- CI does not deploy automatically yet.
- There is no distributed tracing yet.
- There is no Kafka or RabbitMQ yet.
- There is no Admin Dashboard yet.
- There is no Developer Portal yet.
- There is no Kubernetes deployment yet.
- There is no production cloud deployment yet.

---

# Future Requirements

## Future FR: Quota Observability and Usage Management Hardening

Recommended for Sprint 16.

Planned features:

- Show usage plan assignment in more admin usage views.
- Add quota usage summary endpoints.
- Consider tracking quota-denied requests.
- Improve quota response metadata if needed.
- Keep API usage events as source of truth unless performance requires rollups.

Status:

Recommended next technical sprint.

---

## Future FR: Failed Request Usage Tracking

Planned features:

- Track missing API key attempts.
- Track invalid API key attempts.
- Track missing JWT attempts.
- Track invalid JWT attempts.
- Track rate-limited requests.
- Decide whether rejected traffic belongs in same usage event table or separate security event table.

Status:

Planned.

---

## Future FR: Usage Aggregates and Retention

Planned features:

- Add aggregate rollup table if event table becomes too large.
- Define retention policy.
- Define daily/hourly aggregation strategy.
- Prepare faster dashboard queries.

Status:

Planned.

---

## Future FR: Admin Dashboard

Planned features:

- View routes.
- View consumers.
- View API keys.
- View usage summaries.
- View usage charts.
- View quota usage.
- Manage usage plans.

Status:

Planned after backend route lifecycle, API key lifecycle, usage tracking, and usage plans remain stable.

---

## Future FR: Developer Portal

Planned features:

- API documentation.
- API key request flow.
- Usage overview.
- Quota overview.
- Developer onboarding.
- Self-service key management after backend lifecycle is stable.

Status:

Planned.

---

## Future FR: Advanced Observability

Planned features:

- OpenTelemetry instrumentation.
- Trace ID propagation.
- Jaeger or Tempo trace viewer.
- Loki centralized logs.
- k6 load testing.
- Advanced Grafana dashboards.
- Per-consumer, per-key, and per-plan metrics.

Status:

Planned.

---

## Future FR: Event-Driven Architecture

Planned features:

- Kafka event streaming.
- RabbitMQ background jobs.
- Notification Service.
- Async processing examples.

Status:

Planned.

---

## Future FR: Kubernetes and Cloud Deployment

Planned features:

- Docker image registry push.
- Kubernetes manifests.
- ConfigMaps and Secrets.
- Ingress.
- Horizontal scaling examples.
- Production cloud demo.

Status:

Future.

---

# Recommended Next Step

Finalize Sprint 15 documentation, validate with:

- npm run test
- npm run typecheck
- npm run build
- git status

Then commit:

docs: finalize sprint 15 documentation

Next technical sprint:

Sprint 16 - Quota Observability and Usage Management Hardening