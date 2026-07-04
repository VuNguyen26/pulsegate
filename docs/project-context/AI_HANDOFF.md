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

- v0.19.0

Latest completed sprint:

- Sprint 18 - Advanced Usage Analytics and Rejected Event Drilldown

Recommended next technical sprint:

- Sprint 19 - Usage Analytics Hardening and Retention/Rollup Design

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
- Quota observability
- Rejected request tracking and drilldown
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

Latest stable validation from Sprint 18:

- npm run test -> passed
- npm run typecheck -> passed
- npm run build -> passed
- Docker runtime rejected events listing and filtered summary validation -> passed

Latest automated test result:

- 55 test files passed
- 362 tests passed

Sprint 18 runtime validation proved:

- GET /health returns 200.
- GET /internal/admin/api-rejections/summary returns aggregate rejected event totals and filters.
- GET /internal/admin/api-rejections/summary with filters returns filtered aggregate totals.
- Invalid rejected summary query returns 400 INVALID_QUERY_PARAMETER.
- GET /internal/admin/api-rejections/events returns raw rejected event listing.
- Listing pagination supports limit, offset, total, and hasNextPage.
- Listing filters support rejection reason, status code, route method, route path, auth source, API key, consumer, and time range.
- Invalid rejected event listing query returns 400 INVALID_QUERY_PARAMETER.
- gateway.api_rejected_events persists rejected traffic without corrupting gateway.api_usage_events quota counts.

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
- API usage event recording.
- API rejected event recording.
- Consumer usage summary.
- API key usage summary.
- Usage plan management.
- API key usage plan assignment.
- Event-based quota checker.
- Runtime quota enforcement.
- API key quota state endpoint.
- Usage plan usage summary endpoint.
- Rejected events summary endpoint.
- Filtered rejected events summary endpoint.
- Rejected events listing endpoint.
- 429 QUOTA_EXCEEDED responses with quota metadata.
- Internal/admin route management APIs.
- Internal/admin API consumer APIs.
- Internal/admin API key lifecycle APIs.
- Internal/admin usage plan APIs.
- Internal/admin API usage summary APIs.
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
- gateway.usage_plans
- gateway.api_usage_events
- gateway.api_rejected_events
- gateway._prisma_migrations

Reason:

- Product Service owns product data.
- API Gateway owns Gateway route config, API consumers, issued API keys, usage plans, usage events, and rejected request events.
- Separate schemas avoid Prisma migration drift and ownership conflicts.

---

## Current API Usage, Quota, and Rejected Event Behavior

Usage event table:

- gateway.api_usage_events

Usage plan table:

- gateway.usage_plans

Rejected event table:

- gateway.api_rejected_events

Recorded for successful downstream proxy/cache handler responses:

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

Quota behavior:

- Applies to DB-backed API keys with assigned enabled usage plans.
- Supports DAILY and MONTHLY quota windows.
- Counts usage events from gateway.api_usage_events.
- Returns 429 QUOTA_EXCEEDED when the current window quota is exhausted.
- 429 response includes quotaLimit, quotaWindow, usedRequests, remainingRequests, windowStartedAt, windowEndsAt, and resetAt.
- Does not enforce quota for env fallback API keys.
- Does not enforce quota for public routes.
- Records quota-denied requests into gateway.api_rejected_events.
- Does not record rejected requests into gateway.api_usage_events.

Rejected event behavior:

- Records API_KEY_MISSING, API_KEY_INVALID, JWT_TOKEN_MISSING, JWT_TOKEN_INVALID, RATE_LIMIT_EXCEEDED, and QUOTA_EXCEEDED.
- Stores route, method, auth source, status, reason, API key id, consumer id, request id, and occurredAt when available.
- Does not store raw API keys, JWTs, or Authorization headers.
- Supports aggregate summary and raw listing read APIs.
- Supports filters by time range, reason, status code, route, auth source, API key, and consumer.

Admin usage summary endpoints:

- GET /internal/admin/usage/consumers/:consumerId/summary
- GET /internal/admin/usage/api-keys/:apiKeyId/summary

Admin rejected events endpoints:

- GET /internal/admin/api-rejections/summary
- GET /internal/admin/api-rejections/events

Admin quota observability endpoints:

- GET /internal/admin/api-keys/:id/quota
- GET /internal/admin/usage-plans/:id/usage-summary

Admin usage plan endpoints:

- GET /internal/admin/usage-plans
- POST /internal/admin/usage-plans
- GET /internal/admin/usage-plans/:id
- PATCH /internal/admin/usage-plans/:id

API key usage plan assignment endpoint:

- PATCH /internal/admin/api-keys/:id/usage-plan

Current limitations:

- Usage and rejected traffic analytics are event-based only.
- No aggregate rollup table yet.
- No retention policy yet.
- No cursor pagination for very large event datasets yet.

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

Internal/admin usage analytics:

- GET /internal/admin/usage/consumers/:consumerId/summary
- GET /internal/admin/usage/api-keys/:apiKeyId/summary
- GET /internal/admin/api-rejections/summary
- GET /internal/admin/api-rejections/events

Internal/admin quota observability:

- GET /internal/admin/api-keys/:id/quota
- GET /internal/admin/usage-plans/:id/usage-summary

Internal/admin usage plans:

- GET /internal/admin/usage-plans
- POST /internal/admin/usage-plans
- GET /internal/admin/usage-plans/:id
- PATCH /internal/admin/usage-plans/:id

Internal/admin API key usage plan assignment:

- PATCH /internal/admin/api-keys/:id/usage-plan

Admin auth:

- Header: x-admin-api-key
- Local key: local-admin-key
- Optional actor header: x-admin-actor

JWT local validation:

- JWT_SECRET=local-dev-jwt-secret-change-me
- JWT_ISSUER=pulsegate-api-gateway
- JWT_AUDIENCE=pulsegate-clients

---

## Important Files

Rejected events:

- apps/api-gateway/prisma/schema.prisma
- apps/api-gateway/src/api-rejections/api-rejected-event-recorder.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-summary.types.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-summary.mapper.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-summary.repository.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-listing.types.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-listing.mapper.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-listing.repository.ts
- apps/api-gateway/src/api-rejections/api-rejected-events-listing-query.ts
- apps/api-gateway/src/routes/admin-api-rejection.route.ts
- apps/api-gateway/src/proxy/downstream-proxy-handler.ts

Usage plans, quota, and quota observability:

- apps/api-gateway/prisma/schema.prisma
- apps/api-gateway/src/usage-plans/usage-plan-management.types.ts
- apps/api-gateway/src/usage-plans/usage-plan-management.mapper.ts
- apps/api-gateway/src/usage-plans/usage-plan-management.repository.ts
- apps/api-gateway/src/usage-plans/usage-quota-checker.ts
- apps/api-gateway/src/usage-plans/usage-quota-state.ts
- apps/api-gateway/src/usage-plans/usage-plan-usage-summary.ts
- apps/api-gateway/src/routes/admin-usage-plan.route.ts
- apps/api-gateway/src/routes/admin-api-key.route.ts
- apps/api-gateway/src/proxy/downstream-proxy-handler.ts

API Gateway usage tracking:

- apps/api-gateway/prisma/schema.prisma
- apps/api-gateway/src/api-usage/api-usage-recorder.ts
- apps/api-gateway/src/api-usage/api-usage-summary.repository.ts
- apps/api-gateway/src/api-usage/api-usage-summary.mapper.ts
- apps/api-gateway/src/api-usage/api-usage-summary.types.ts
- apps/api-gateway/src/routes/admin-api-usage.route.ts
- apps/api-gateway/src/proxy/downstream-proxy-handler.ts

Docs:

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/DECISION_LOG.md
- docs/project-context/AI_HANDOFF.md
- docs/sdlc/sprint-history/sprint-18.md
- docs/runbooks/api-rejected-events.md
- docs/project-context/decisions/2026-07-04-rejected-events-side-table.md

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

- Usage data is event-based only.
- Rejected event analytics is event-based only.
- No aggregate rollup table yet.
- No retention policy yet.
- No cursor pagination for very large event datasets yet.
- No per-consumer Grafana dashboard yet.
- No per-key Grafana dashboard yet.
- No quota usage dashboard yet.
- Disabled usage plans currently skip quota enforcement.
- Env fallback API keys are not quota-enforced.
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
- CI does not run full Docker Compose runtime stack yet.
- CI does not push Docker images to registry yet.
- CI does not deploy automatically yet.
- Kafka and RabbitMQ are not implemented yet.
- Kubernetes and cloud deployment are planned later.

---

## Recommended Next Step

Start Sprint 19 after confirming Sprint 18 docs are committed and pushed.

Recommended direction:

- Usage Analytics Hardening and Retention/Rollup Design.
- Add time-range and filter support to successful usage analytics.
- Evaluate retention policy for usage and rejected events.
- Design aggregate rollups for high-volume analytics.
- Consider Grafana panels for quota, usage, and rejected traffic.

Before starting:

- Confirm git status is clean.
- Confirm latest docs commit is pushed.
- Keep implementation small and testable.
