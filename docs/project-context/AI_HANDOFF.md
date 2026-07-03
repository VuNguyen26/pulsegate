# PulseGate AI Handoff

## Purpose

This file gives enough context to continue PulseGate work in a new AI chat.

It should stay compact.

Detailed sprint history lives in:

- docs/sdlc/sprint-history/

Manual validation commands live in:

- docs/runbooks/

Long decision records live in:

- docs/project-context/decisions/

---

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

Repository:

- https://github.com/VuNguyen26/pulsegate.git

Local path:

- E:\pulsegate

Current version:

- v0.14.0

Latest completed sprint:

- Sprint 13 - API Consumer and API Key Lifecycle Foundation

Current checkpoint:

- Checkpoint 14.0 - Documentation Compaction and Archive Strategy

Recommended next technical sprint:

- Sprint 14 - API Key Usage Tracking and Consumer Analytics Foundation

---

## Long-Term Goal

PulseGate is not just a portfolio backend project.

The long-term target is to build it toward a product-like API Gateway and API Management Platform inspired by:

- Kong
- Apache APISIX
- Tyk
- Apigee
- AWS API Gateway

Long-term product direction:

- Admin Dashboard
- Developer Portal
- API key request flow
- Dynamic route configuration
- Runtime route registry
- Catch-all dynamic router
- Route management APIs
- Service registry foundation
- API consumer management
- API key lifecycle management
- API key usage tracking
- Consumer analytics
- Usage plans and quotas
- Observability stack
- CI/CD
- Kubernetes/cloud deployment later
- Event streaming later
- Background jobs later

---

## Tech Stack

Current stack:

- Node.js
- TypeScript
- Fastify
- npm workspaces
- Vitest
- Docker Compose
- PostgreSQL
- Prisma
- Redis
- Prometheus
- Grafana
- GitHub Actions CI/CD

Current ports:

- API Gateway -> 3000
- Product Service -> 3001
- Grafana -> 3002
- PostgreSQL -> 5432
- Redis -> 6379
- Prometheus -> 9090

---

## Current Validation Status

Latest stable validation from Sprint 13:

- npm run test -> passed
- npm run typecheck -> passed
- npm run build -> passed
- Docker runtime validation -> passed
- GitHub Actions CI -> passing

Latest automated test result:

- 36 test files passed
- 256 tests passed

Sprint 13 runtime validation proved:

- Admin can create API consumer.
- Admin can issue DB-backed API key.
- Issued DB-backed key can call GET /api/products with JWT.
- Revoked DB-backed key returns 403.
- Legacy dev-api-key env fallback still returns 200.

---

## Current Architecture Summary

API Gateway currently supports:

- Startup route config loading from PostgreSQL.
- Static route config fallback.
- Runtime route registry.
- Runtime registry status endpoint.
- Runtime registry reload endpoint.
- Catch-all dynamic router for /api/*.
- Shared downstream proxy pipeline.
- Route policy model.
- DB-backed issued API key authentication.
- Env API_KEYS fallback.
- JWT authentication.
- Redis-backed rate limiting.
- Redis response caching.
- Request transform foundation.
- Response transform foundation.
- Timeout policy.
- Retry policy foundation.
- Downstream error normalization.
- Internal/admin route management APIs.
- Internal/admin API consumer APIs.
- Internal/admin API key lifecycle APIs.
- Structured access logs.
- Prometheus metrics.
- Grafana dashboard.

Product Service currently supports:

- GET /health
- GET /products
- PostgreSQL-backed product data through Prisma

---

## Current Data Ownership

PostgreSQL database:

- pulsegate

Product Service owns:

- public.products
- public._prisma_migrations

API Gateway owns:

- gateway.gateway_routes
- gateway.api_consumers
- gateway.api_keys
- gateway._prisma_migrations

Reason:

- Product Service owns product data.
- API Gateway owns Gateway route config, API consumers, and issued API keys.
- Separate schemas avoid Prisma migration drift and ownership conflicts.

---

## Current Runtime Route Behavior

Startup:

- API Gateway tries to load active routes from gateway.gateway_routes.
- Active means enabled=true and deleted_at IS NULL.
- DB records are mapped to runtime route config.
- Mapped routes are validated.
- If DB load fails or returns no active routes, API Gateway falls back to static route config.
- Runtime route registry is created from resolved startup routes.
- Known startup routes are registered.
- A stable /api/* catch-all dynamic router is registered.

Reload:

- POST /internal/admin/routes/reload loads active DB routes.
- Reload validates mapped route configs.
- Reload replaces runtime registry snapshot when valid.
- Existing registered paths use updated config after reload.
- Brand-new DB-backed /api/* paths work after reload without API Gateway restart.

Current reload metadata:

- mode = runtime-registry-refresh
- registryAvailable = true
- registryApplied = true
- runtimeApplied = true
- runtimeScope = dynamic-router
- newRoutesRequireRestart = false
- requiresRestart = false

Important routing limitation:

- Exact method + exact path matching only.
- No path params yet.
- No wildcard upstream path mapping yet.
- No host-based routing yet.
- No weighted upstreams yet.
- No service discovery yet.

---

## Current API Key Behavior

API consumers:

- Stored in gateway.api_consumers.
- Statuses: ACTIVE, DISABLED.

API keys:

- Stored in gateway.api_keys.
- Statuses: ACTIVE, REVOKED.

Secret storage rule:

- Raw API keys are never persisted.
- keyHash is persisted.
- keyPrefix is persisted.
- rawKey is returned only once during issue response.
- keyHash is never exposed in API responses.

Runtime DB-backed API key auth:

- Reads x-api-key.
- Hashes incoming raw key.
- Looks up gateway.api_keys by keyHash.
- Includes related API consumer.
- Accepts active key if consumer is active and key is not expired.
- Rejects revoked key.
- Rejects expired key.
- Rejects key belonging to disabled consumer.
- Updates lastUsedAt as best-effort metadata.
- Attaches request.apiKeyId for DB-backed keys.
- Attaches request.apiConsumerId for DB-backed keys.
- Attaches request.apiKeyAuthSource.

Security rule:

- If a DB-backed key is found but revoked, expired, or belongs to a disabled consumer, reject the request.
- Do not fall back to env API_KEYS in that case.

Env fallback rule:

- If DB key is not found, fallback to env API_KEYS.
- If DB lookup is unavailable, fallback to env API_KEYS.
- Local dev fallback key is dev-api-key.

Current limitation:

- lastUsedAt is metadata only.
- Full usage tracking does not exist yet.
- Per-consumer analytics do not exist yet.
- Per-key analytics do not exist yet.
- Rate limit identity still uses raw API key value.

---

## Current Main Endpoints

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

Admin auth:

- Header: x-admin-api-key
- Local key: local-admin-key
- Optional actor header: x-admin-actor

---

## Important Files

API Gateway:

- apps/api-gateway/src/app.ts
- apps/api-gateway/src/server.ts
- apps/api-gateway/src/proxy/downstream-proxy-handler.ts
- apps/api-gateway/src/routes/product-proxy.route.ts
- apps/api-gateway/src/routes/admin-route-config.route.ts
- apps/api-gateway/src/routes/admin-consumer.route.ts
- apps/api-gateway/src/routes/admin-api-key.route.ts
- apps/api-gateway/src/runtime/route-runtime-registry.ts
- apps/api-gateway/src/api-consumers/
- apps/api-gateway/src/api-keys/
- apps/api-gateway/src/route-management/
- apps/api-gateway/prisma/schema.prisma

Product Service:

- apps/product-service/src/server.ts
- apps/product-service/src/routes/product.route.ts
- apps/product-service/src/products/product.repository.ts
- apps/product-service/prisma/schema.prisma

Docs:

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/DECISION_LOG.md
- docs/project-context/AI_HANDOFF.md
- docs/sdlc/sprint-history/sprint-13.md
- docs/project-context/decisions/2026-07-03-documentation-compaction.md
- docs/runbooks/

---

## Current Documentation Strategy

From Checkpoint 14.0 onward:

- Keep README public-facing and compact.
- Keep overview focused on current architecture.
- Keep requirements focused on FR/NFR and future requirements.
- Keep CURRENT_PROGRESS focused on current state.
- Keep AI_HANDOFF compact enough for a new chat.
- Keep DECISION_LOG as an index/recent decisions file.
- Move sprint history to docs/sdlc/sprint-history/.
- Move long decisions to docs/project-context/decisions/.
- Move command-heavy validation steps to docs/runbooks/.

---

## User Working Preferences

Use Vietnamese when explaining.

Work style:

- Work like a careful senior backend reviewer.
- Explain the goal of the current checkpoint.
- Change a small number of files at a time.
- Provide copy-paste-ready PowerShell blocks.
- For docs replacement, provide one single copyable PowerShell block.
- Explain what changed and why.
- Ask user to run commands and paste terminal output.
- Review terminal output carefully before moving forward.
- Run focused tests when useful.
- Run npm run test.
- Run npm run typecheck.
- Run npm run build.
- Run Docker/runtime validation when runtime behavior changes.
- Commit only after stable validation.
- Push after each stable commit.
- Keep final docs compact.
- Do not overbuild.
- Do not silently skip tests.
- Do not claim production-ready when only foundation exists.

---

## Current Known Limitations

- No API usage event table yet.
- No per-consumer analytics yet.
- No per-key analytics yet.
- No usage plans yet.
- No quotas yet.
- No Admin Dashboard yet.
- No Developer Portal yet.
- No admin user/RBAC system yet.
- No route management audit log table yet.
- Dynamic router supports exact method + exact path matching only.
- No path params yet.
- No wildcard upstream path mapping yet.
- No host-based routing yet.
- No weighted upstreams yet.
- No service discovery yet.
- Rate limit identity still uses raw API key value.
- Grafana does not yet include per-consumer or per-key usage dashboards.
- CI does not run full Docker Compose runtime stack yet.
- CI does not push Docker images to registry yet.
- CI does not deploy automatically yet.
- Kafka and RabbitMQ are not implemented yet.
- Kubernetes and cloud deployment are planned later.

---

## Recommended Next Step

Finish Checkpoint 14.0:

- Compact DECISION_LOG.md.
- Run npm run test.
- Run npm run typecheck.
- Run npm run build.
- Review git status.
- Commit docs with message: docs: compact project documentation structure.
- Push.

Then start:

- Sprint 14 - API Key Usage Tracking and Consumer Analytics Foundation

Recommended Sprint 14 scope:

- Add API usage event or aggregate table.
- Record apiKeyId, consumerId, route, method, statusCode, durationMs, and timestamp.
- Support env fallback traffic safely.
- Expose admin consumer usage summary API.
- Expose admin API key usage summary API.
- Prepare usage plans and quotas for later.
