# PulseGate Requirements

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

## Current Version

v0.14.0

## Current Status

Sprint 13 - API Consumer and API Key Lifecycle Foundation Complete

Latest validation:

- 36 test files passed
- 256 tests passed
- npm run typecheck passed
- npm run build passed
- Docker runtime validation passed
- GitHub Actions CI passing

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
- Traffic protection.
- Response caching.
- Observability.
- CI/CD.
- Production-oriented backend architecture.

Long-term target:

Build PulseGate toward a product-like API Gateway/API Management platform, not only a portfolio backend project.

---

## Target Users

PulseGate is designed for:

- Backend Developers.
- DevOps Engineers.
- SREs.
- Tech Leads.
- Teams managing multiple APIs or microservices.
- Teams needing API consumer and API key lifecycle management.
- Teams wanting route config, API keys, usage tracking, quotas, and observability.

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
- DB-backed API key authentication.
- Admin route management APIs.
- Admin consumer APIs.
- Admin API key lifecycle APIs.

Current Docker services:

- api-gateway
- product-service
- postgres
- redis
- prometheus
- grafana

Current ports:

- API Gateway -> 3000
- Product Service -> 3001
- Grafana -> 3002
- PostgreSQL -> 5432
- Redis -> 6379
- Prometheus -> 9090

---

## Current Endpoints

Public:

- GET /health
- GET /metrics
- GET /api/product-service/health

Protected:

- GET /api/products

Dynamic dispatcher:

- GET /api/*
- POST /api/*
- PUT /api/*
- PATCH /api/*
- DELETE /api/*

Internal/admin route management:

- GET /internal/admin/routes
- GET /internal/admin/routes/runtime
- GET /internal/admin/routes/:id
- POST /internal/admin/routes
- PATCH /internal/admin/routes/:id
- DELETE /internal/admin/routes/:id
- POST /internal/admin/routes/reload

Internal/admin consumers:

- GET /internal/admin/consumers
- POST /internal/admin/consumers
- GET /internal/admin/consumers/:id
- PATCH /internal/admin/consumers/:id

Internal/admin API keys:

- GET /internal/admin/consumers/:consumerId/api-keys
- POST /internal/admin/consumers/:consumerId/api-keys
- PATCH /internal/admin/api-keys/:id/revoke

---

# Functional Requirements

## FR-001: API Gateway Service

The system must have an API Gateway service.

Acceptance criteria:

- API Gateway runs on port 3000.
- API Gateway uses Fastify and TypeScript.
- API Gateway exposes public, protected, dynamic, and internal/admin endpoints.
- API Gateway can run locally and through Docker Compose.
- API Gateway Docker image can be built in CI.
- API Gateway can generate Prisma Client in CI and inside Docker image.

Status:

Done.

---

## FR-002: Product Service

The system must have a Product Service.

Acceptance criteria:

- Product Service runs on port 3001.
- Product Service uses Fastify and TypeScript.
- Product Service exposes GET /health.
- Product Service exposes GET /products.
- Product Service reads product data from PostgreSQL through Prisma.
- Product Service can run locally and through Docker Compose.
- Product Service Docker image can be built in CI.

Status:

Done.

---

## FR-003: Gateway Product Proxy Route

API Gateway must route product requests to Product Service.

Acceptance criteria:

- Client can call GET /api/products through API Gateway.
- API Gateway calls Product Service GET /products on cache MISS.
- API Gateway can return cached response on cache HIT.
- Product route behavior is driven by route policy configuration.
- Product route requires API key and JWT by default.
- Product route accepts valid DB-backed issued API keys.
- Product route accepts env fallback key dev-api-key.
- Product route rejects revoked DB-backed API keys.
- Product route uses Redis-backed rate limiting by default.
- Product route uses Redis response caching by default.
- Product route can be loaded from database route config.
- Product route can be refreshed at runtime through registry reload.

Status:

Done.

---

## FR-004: Public Product Service Health Proxy Route

API Gateway must expose a public proxy route to Product Service health.

Acceptance criteria:

- Client can call GET /api/product-service/health through API Gateway.
- API Gateway proxies request to Product Service GET /health.
- Route does not require API key by default.
- Route does not require JWT by default.
- Route does not apply Redis-backed rate limiting by default.
- Route does not use Redis response cache by default.
- Route returns x-cache: BYPASS.
- Route returns x-request-id.
- Route returns x-response-time-ms.
- Route can be loaded from database route config.
- Route can be refreshed at runtime through registry reload.

Status:

Done.

---

## FR-005: Authentication and Authorization

API Gateway must support route-level authentication behavior.

Acceptance criteria:

- Protected routes can require API key.
- Protected routes can require JWT.
- Public routes can disable API key and JWT requirements.
- Dynamic DB-backed routes can require or skip API key and JWT based on policy.
- Missing API key returns 401 API_KEY_MISSING.
- Invalid API key returns 403 API_KEY_INVALID.
- Missing Bearer token returns 401 JWT_TOKEN_MISSING.
- Invalid token returns 403 JWT_TOKEN_INVALID.
- JWT validation checks signature, issuer, audience, and expiration.
- Internal/admin APIs use admin API key instead of consumer API key/JWT.
- Runtime API key authentication supports DB-backed issued API keys.
- Runtime API key authentication preserves env API_KEYS fallback.

Status:

Done.

---

## FR-006: Admin API Key Authentication

API Gateway must protect internal/admin APIs with a separate admin API key.

Acceptance criteria:

- Default local admin API key header is x-admin-api-key.
- Default local admin API key is local-admin-key.
- Missing admin API key returns 401 ADMIN_API_KEY_MISSING.
- Invalid admin API key returns 403 ADMIN_API_KEY_INVALID.
- Valid admin API key allows internal/admin behavior.
- Consumer x-api-key is not used for internal/admin APIs.
- Admin API key variables are documented in environment config.

Status:

Done.

---

## FR-007: Traffic Protection

API Gateway must protect selected routes from excessive traffic and unsafe payloads.

Acceptance criteria:

- API Gateway supports Redis-backed rate limiting.
- Product route is rate limited by API key, HTTP method, and route path.
- Dynamic DB-backed routes can enable or disable rate limiting by policy.
- Rate limit exceeded returns 429 TOO_MANY_REQUESTS.
- API Gateway returns rate limit headers.
- Product Service is not called for blocked requests.
- API Gateway rejects oversized request bodies with 413 REQUEST_BODY_TOO_LARGE.
- API Gateway adds basic HTTP security headers globally.

Status:

Done.

---

## FR-008: Redis Response Caching

API Gateway must cache selected downstream responses in Redis.

Acceptance criteria:

- API Gateway stores product responses in Redis.
- API Gateway reads product responses from Redis.
- Cache MISS returns x-cache: MISS.
- Cache HIT returns x-cache: HIT.
- Cache BYPASS is supported.
- Product Service is not called on cache HIT.
- Cache write failure does not fail a valid downstream response.
- Dynamic DB-backed routes can enable or disable response caching by policy.

Status:

Done.

---

## FR-009: Downstream Error Normalization

API Gateway must return clean and consistent errors when downstream services fail.

Acceptance criteria:

- Product Service unavailable returns 503 DOWNSTREAM_SERVICE_UNAVAILABLE.
- Product Service timeout returns 504 DOWNSTREAM_TIMEOUT.
- Product Service 5xx response returns 502 DOWNSTREAM_HTTP_ERROR.
- Product Service invalid JSON returns 502 DOWNSTREAM_INVALID_RESPONSE.
- Error response includes request ID.
- Raw runtime errors are not exposed.

Status:

Done.

---

## FR-010: PostgreSQL and Prisma

PulseGate must use PostgreSQL and Prisma for persistent data.

Acceptance criteria:

- Product Service owns product data in PostgreSQL public schema.
- API Gateway owns route config data in PostgreSQL gateway schema.
- API Gateway owns API consumer data in PostgreSQL gateway schema.
- API Gateway owns issued API key data in PostgreSQL gateway schema.
- Product Service has Prisma schema, migration, and seed script.
- API Gateway has Prisma schema, migrations, and seed script.
- Prisma Clients can be generated locally, in CI, and inside Docker where needed.

Status:

Done.

---

## FR-011: Database-Backed Gateway Route Configuration

API Gateway must support loading downstream route configuration from PostgreSQL.

Acceptance criteria:

- API Gateway route config is stored in gateway.gateway_routes.
- Gateway route config supports method, gateway path, downstream URL, enabled flag, priority, policies, and lifecycle metadata.
- Gateway route config supports active route uniqueness through a partial unique index.
- Database records can be mapped to runtime route config.
- Mapped route configs are validated before use.
- API Gateway loads DB route config at startup.
- API Gateway falls back to static route config when DB loading fails or returns no active routes.

Status:

Done.

---

## FR-012: Policy-Driven Gateway Behavior

API Gateway must support policy-driven route behavior.

Acceptance criteria:

- Policy model includes auth, timeout, cache, rate limit, request transform, response transform, and retry.
- Product route uses policy helpers.
- Product Service health proxy route uses policy config.
- Dynamic DB-backed routes use the same policy model.
- Policy helpers are unit tested.
- Policy behavior is covered by integration tests.
- Route management APIs reuse route validation before persistence and reload validation.

Status:

Done.

---

## FR-013: Route Management APIs

API Gateway must expose internal/admin APIs to manage route config records.

Acceptance criteria:

- Route list, detail, create, update, soft delete, runtime status, and reload endpoints exist.
- All route management APIs require admin API key.
- List/detail endpoints exclude soft-deleted routes.
- Create/update endpoints validate route config.
- Create/update endpoints reject duplicate active method + gatewayPath conflicts.
- PATCH can enable or disable route configs.
- DELETE performs soft delete.
- Reload applies active DB routes to the runtime registry.
- Route management behavior is covered by tests.

Status:

Done.

---

## FR-014: Runtime Route Registry and Reload

API Gateway must maintain a runtime route config registry and support safe reload.

Acceptance criteria:

- Runtime registry has current route snapshot.
- Snapshot includes version, loadedAt, routeCount, and routes.
- Registry can find route config by method and gateway path.
- Registry can replace routes only after validation succeeds.
- Invalid replacement keeps the old snapshot.
- Existing registered route handlers resolve latest config from registry per request.
- Catch-all dynamic router resolves route config from registry per request.
- POST /internal/admin/routes/reload refreshes the runtime registry.
- Reload returns runtimeScope=dynamic-router.
- Reload returns newRoutesRequireRestart=false when registry replacement succeeds.
- Reload behavior is covered by tests and Docker validation.

Status:

Done.

---

## FR-015: Catch-All Dynamic Router

API Gateway must support brand-new DB-backed /api/* routes without API Gateway restart after reload.

Acceptance criteria:

- API Gateway registers catch-all dynamic routes for GET, POST, PUT, PATCH, and DELETE /api/*.
- Dynamic router extracts request method and pathname.
- Dynamic router looks up runtime route config by exact method + exact path.
- Dynamic router returns 404 ROUTE_NOT_FOUND when no runtime route exists.
- Dynamic router uses the same downstream proxy pipeline as registered routes.
- Brand-new DB-backed /api/* route returns 404 before reload.
- Brand-new DB-backed /api/* route can return 200 after reload without app restart.

Status:

Done.

---

## FR-016: API Consumer Management

API Gateway must support backend API consumer management.

Acceptance criteria:

- gateway.api_consumers table exists.
- API consumer has id, name, description, status, timestamps, createdBy, and updatedBy.
- API consumer status supports ACTIVE and DISABLED.
- Admin consumer list, create, detail, and update endpoints exist.
- All Admin Consumer API endpoints require x-admin-api-key.
- Create consumer requires non-empty name.
- Create consumer defaults status to ACTIVE.
- Update consumer can change name, description, or status.
- Consumer detail returns 404 API_CONSUMER_NOT_FOUND when missing.
- Invalid consumer request returns 400 API_CONSUMER_INVALID.
- Admin Consumer API behavior is covered by tests.

Status:

Done.

---

## FR-017: API Key Lifecycle Management

API Gateway must support issued API key lifecycle management.

Acceptance criteria:

- gateway.api_keys table exists.
- API key belongs to an API consumer.
- API key has id, consumerId, name, keyPrefix, keyHash, status, expiresAt, lastUsedAt, timestamps, createdBy, revokedAt, and revokedBy.
- API key status supports ACTIVE and REVOKED.
- Admin key list-by-consumer, issue, and revoke endpoints exist.
- All Admin API Key lifecycle endpoints require x-admin-api-key.
- Listing API keys verifies the consumer exists.
- Listing API keys does not expose keyHash or rawKey.
- Issuing API key generates raw API key.
- Issuing API key stores keyHash and keyPrefix.
- Issuing API key returns rawKey once.
- Revoking API key sets status=REVOKED, revokedAt, and revokedBy.
- Admin API Key lifecycle API behavior is covered by tests.

Status:

Done.

---

## FR-018: API Key Hashing and Secret Storage

API Gateway must store issued API keys safely.

Acceptance criteria:

- Raw API keys are generated by the Gateway.
- Raw API keys are never persisted.
- API key prefix is persisted as keyPrefix.
- API key hash is persisted as keyHash.
- keyHash is unique.
- keyPrefix is indexed.
- hashApiKey returns deterministic SHA-256 hex hash.
- verifyApiKeyHash supports timing-safe comparison.
- API responses never expose keyHash.
- API responses expose rawKey only during key issue response.
- API key hashing behavior is covered by tests.

Status:

Done.

---

## FR-019: DB-Backed Runtime API Key Authentication

API Gateway must support runtime authentication using DB-backed issued API keys.

Acceptance criteria:

- Runtime API key auth reads x-api-key.
- Runtime API key auth hashes incoming raw API key.
- Runtime API key auth looks up gateway.api_keys by keyHash.
- Runtime API key auth includes related API consumer during lookup.
- Runtime API key auth accepts active keys.
- Runtime API key auth rejects revoked keys.
- Runtime API key auth rejects expired keys.
- Runtime API key auth rejects keys belonging to disabled consumers.
- Runtime API key auth updates lastUsedAt as best-effort metadata.
- Runtime API key auth attaches request.apiKey, request.apiKeyId, request.apiConsumerId, and request.apiKeyAuthSource.
- Runtime API key auth falls back to env API_KEYS when DB key is not found or DB lookup is unavailable.
- Runtime API key auth does not fall back when a known DB key is revoked, expired, or belongs to a disabled consumer.
- Runtime DB-backed auth is wired into downstream proxy when route policy requires API key.
- Runtime DB-backed auth is covered by tests and Docker validation.

Status:

Done.

---

## FR-020: Automated Tests

The project must include automated tests for Gateway behavior.

Acceptance criteria:

- Tests can be run with npm run test.
- API Gateway can be tested with app.inject().
- Unit tests cover middleware, policies, mappers, stores, registry, auth helpers, and validators.
- Integration tests cover protected, public, dynamic, route management, consumer, API key, and downstream proxy flows.
- Test, typecheck, and build pass before stable commits.

Current test status:

- 36 test files passed
- 256 tests passed

Status:

Done.

---

## FR-021: GitHub Actions CI/CD Foundation

The project must support automated CI validation through GitHub Actions.

Acceptance criteria:

- CI runs on push to main.
- CI runs on pull request to main.
- CI uses Node.js 20.
- CI installs dependencies with npm ci.
- CI generates Product Service Prisma Client.
- CI generates API Gateway Prisma Client.
- CI runs automated tests.
- CI runs TypeScript typecheck.
- CI runs production build.
- CI validates API Gateway Docker image build.
- CI validates Product Service Docker image build.
- CI status is visible through README badge.

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

The codebase must be organized clearly by config, routes, middlewares, policies, repositories, database helpers, runtime registry, proxy handler, tests, and server startup.

Status:

Done.

## NFR-004: Type Safety

The project must use TypeScript with strict checking.

Status:

Done.

## NFR-005: Observability

The project must provide request ID, structured access logs, latency headers, Prometheus metrics, Prometheus scraping, and Grafana dashboards.

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

---

# Current Constraints

Current constraints after Sprint 13:

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
- API key usage tracking does not exist yet.
- Per-consumer analytics do not exist yet.
- Usage plans and quotas do not exist yet.
- Runtime API key auth supports DB-backed issued keys.
- Runtime API key auth still preserves env API_KEYS fallback.
- Rate limit identity still uses raw API key value.
- JWT validation is local-secret based.
- Request and response transformation foundations support headers only.
- Retry foundation exists, but retry is disabled by default for current routes.
- Redis failure currently causes protected product route to return generic 500.
- /metrics is public in local development.
- Grafana does not yet include per-consumer or per-key usage dashboards.
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

## Future FR: API Key Usage Tracking and Consumer Analytics

Recommended for Sprint 14.

Planned features:

- Store API usage events or usage aggregates.
- Track apiKeyId.
- Track consumerId.
- Track route path.
- Track HTTP method.
- Track status code.
- Track response duration.
- Track request timestamp.
- Support env fallback traffic safely.
- Expose admin API for consumer usage summary.
- Expose admin API for API key usage summary.
- Prepare Grafana/Admin Dashboard usage panels.

Status:

Recommended next technical sprint.

---

## Future FR: Usage Plans and Quotas

Planned after usage tracking foundation.

Features:

- Define usage plans.
- Attach consumers or keys to plans.
- Enforce quotas.
- Enforce per-plan rate limits.
- Track quota usage.

Status:

Planned.

---

## Future FR: Route Management Audit Log

Planned features:

- Track route create, update, enable, disable, delete, reload, and failed reload events.
- Store actor, timestamp, action, route id, and useful snapshots.
- Prepare Admin Dashboard history view.

Status:

Planned.

---

## Future FR: Stronger Admin Authentication

Planned features:

- Replace or extend local admin API key with stronger admin auth.
- Add admin user model if needed.
- Add role-based authorization.
- Prepare Admin Dashboard login flow.

Status:

Planned.

---

## Future FR: Advanced Route Matching

Planned features:

- Path parameters.
- Wildcard upstream path forwarding.
- Host-based routing.
- Header-based routing.
- Weighted upstreams.
- Route priority matching beyond exact lookup.
- Upstream pools.

Status:

Planned.

---

## Future FR: Service Registry Foundation

Planned features:

- Register downstream services.
- Store service name, base URL, health path, and status.
- Connect route configs to service records.
- Prepare service discovery behavior.

Status:

Planned.

---

## Future FR: Admin Dashboard

Planned features:

- View routes.
- Create routes.
- Update routes.
- Enable or disable routes.
- Soft delete routes.
- Validate runtime reload status.
- View registry status.
- View API consumers.
- View API keys.
- View traffic metrics.
- View consumer usage after usage tracking exists.

Status:

Planned after backend route lifecycle, API key lifecycle, and usage tracking remain stable.

---

## Future FR: Developer Portal

Planned features:

- API documentation.
- API key request flow.
- Usage overview.
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
- Per-consumer and per-key metrics after usage tracking exists.

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

Finish Checkpoint 14.0 documentation compaction, validate with:

- npm run test
- npm run typecheck
- npm run build
- git status

Then commit:

docs: compact project documentation structure

Next technical sprint:

Sprint 14 - API Key Usage Tracking and Consumer Analytics Foundation
