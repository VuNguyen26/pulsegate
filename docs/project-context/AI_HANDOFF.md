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

- v0.15.0

Latest completed sprint:

- Sprint 14 - API Key Usage Tracking and Consumer Analytics Foundation

Recommended next technical sprint:

- Sprint 15 - Usage Plans and Quota Foundation

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

Latest stable validation from Sprint 14:

- npm run test -> passed
- npm run typecheck -> passed
- npm run build -> passed
- Docker runtime validation -> passed

Latest automated test result:

- 40 test files passed
- 270 tests passed

Sprint 14 runtime validation proved:

- gateway.api_usage_events table exists.
- DB-backed API key request records usage event.
- Usage event includes apiKeyId and consumerId.
- Usage event includes apiKeyAuthSource=database.
- Consumer usage summary API works.
- API key usage summary API works.
- Revoked DB-backed key returns 403.
- Revoked request does not create a new successful usage event.

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
- Consumer usage summary.
- API key usage summary.
- Internal/admin route management APIs.
- Internal/admin API consumer APIs.
- Internal/admin API key lifecycle APIs.
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
- gateway.api_usage_events
- gateway._prisma_migrations

Reason:

- Product Service owns product data.
- API Gateway owns Gateway route config, API consumers, issued API keys, and usage events.
- Separate schemas avoid Prisma migration drift and ownership conflicts.

---

## Current API Usage Behavior

Usage event table:

- gateway.api_usage_events

Recorded for successful downstream proxy handler responses:

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

Cache status values:

- HIT
- MISS
- BYPASS

Admin usage summary endpoints:

- GET /internal/admin/usage/consumers/:consumerId/summary
- GET /internal/admin/usage/api-keys/:apiKeyId/summary

Summary fields:

- totalRequests
- successfulRequests
- errorRequests
- averageDurationMs
- cacheHits
- cacheMisses
- cacheBypasses
- lastRequestAt

Current limitation:

- Failed auth requests are not tracked yet.
- Rate-limited requests are not tracked yet.
- No usage plan or quota enforcement yet.

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

Admin auth:

- Header: x-admin-api-key
- Local key: local-admin-key
- Optional actor header: x-admin-actor

---

## Important Files

API Gateway usage tracking:

- apps/api-gateway/prisma/schema.prisma
- apps/api-gateway/prisma/migrations/20260703150000_add_api_usage_events/migration.sql
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
- docs/sdlc/sprint-history/sprint-14.md
- docs/runbooks/api-usage-tracking.md

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

- Failed auth requests are not tracked yet.
- Rate-limited requests are not tracked yet.
- No usage plan model yet.
- No quota enforcement yet.
- No aggregate rollup table yet.
- No retention policy yet.
- No per-consumer Grafana dashboard yet.
- No per-key Grafana dashboard yet.
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

Finish Sprint 14 docs:

- Update overview.md.
- Update requirements.md.
- Update DECISION_LOG.md.
- Run npm run test.
- Run npm run typecheck.
- Run npm run build.
- Commit docs with message: docs: finalize sprint 14 documentation.
- Push.

Then start:

- Sprint 15 - Usage Plans and Quota Foundation
