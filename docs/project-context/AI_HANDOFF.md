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

- v0.30.0

Latest completed sprint:

- Sprint 29 - Analytics Retention Execution Service Orchestration Preview

Recommended next technical sprint:

- Sprint 30 - Analytics Retention Execution Operator Preview Command

---

## Long-Term Goal

PulseGate is not just a portfolio backend project.

The long-term target is to build it toward a product-like API Gateway and API Management Platform inspired by Kong, Apache APISIX, Tyk, Apigee, and AWS API Gateway.

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
- Successful usage analytics and event investigation
- Analytics retention and rollups
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

Latest stable validation from Sprint 29:

- npm run test -> passed
- npm run typecheck -> passed
- npm run build -> passed

Latest automated test result:

- 93 test files passed
- 646 tests passed

Manual DB/runtime command validation:

- No new Docker/runtime validation was required in Sprint 29 because no command, API, migration, scheduled job, or operator-facing delete execution was added.
- Latest DB/runtime validation remains Sprint 28: migration deploy had no pending migrations, retention dry-run was DB-backed and deleteAllowed=false, and execution preview reported deleteImplementationAvailable=false.

Sprint 29 preserved:

- gateway.api_usage_events as the source of truth for successful usage and quota counting.
- gateway.api_rejected_events as the separate source of truth for rejected/security traffic.
- No quota checker changes.
- No usage recorder changes.
- No rejected event recorder changes.
- No retention execute command.
- No operator-facing raw event deletion.
- No scheduled/background job.
- No summary API switch to rollup reads.

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
- Consumer usage summary with filters.
- API key usage summary with filters.
- Successful usage events listing with filters, safe offset pagination, and cursor pagination.
- Usage plan management.
- API key usage plan assignment.
- Event-based quota checker.
- Runtime quota enforcement.
- API key quota state endpoint.
- Usage plan usage summary endpoint.
- Rejected events summary endpoint.
- Filtered rejected events summary endpoint.
- Rejected events listing endpoint with filters, safe offset pagination, and cursor pagination.
- Analytics rollup calculation, persistence, manual backfill, and read model foundations.
- Read-only analytics rollup endpoint.
- Analytics retention dry-run policy, candidate count, service, args parser, and command foundations.
- Analytics retention execution guard, execution args parser, execution preview command, delete batch plan model, repository safety contract, operation planner, Prisma delete repository foundation, execution service preview, summary model, candidate count loader, and candidate-read preview composition.
- 429 QUOTA_EXCEEDED responses with quota metadata.
- Internal/admin route management APIs.
- Internal/admin API consumer APIs.
- Internal/admin API key lifecycle APIs.
- Internal/admin usage plan APIs.
- Internal/admin API usage analytics APIs.
- Structured access logs.
- Prometheus metrics.
- Grafana dashboard.

Product Service currently supports:

- GET /health
- GET /products
- PostgreSQL-backed product data through Prisma

---

## Current Data Ownership

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
- gateway.api_usage_rollups
- gateway.api_rejected_rollups
- gateway._prisma_migrations

---

## Current API Usage, Quota, Rejected Event, Rollup, and Retention Behavior

Usage event table:

- gateway.api_usage_events

Usage plan table:

- gateway.usage_plans

Rejected event table:

- gateway.api_rejected_events

Rollup tables:

- gateway.api_usage_rollups
- gateway.api_rejected_rollups

Admin usage analytics endpoints:

- GET /internal/admin/usage/events
- GET /internal/admin/usage/consumers/:consumerId/summary
- GET /internal/admin/usage/api-keys/:apiKeyId/summary

Admin rejected analytics endpoints:

- GET /internal/admin/api-rejections/summary
- GET /internal/admin/api-rejections/events

Admin rollup analytics endpoint:

- GET /internal/admin/analytics/rollups

Retention commands:

- npm run analytics:retention:dry-run --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 90
- npm run analytics:retention:execution-preview --workspace api-gateway -- --enabled true --source both --usage-retention-days 90 --rejected-retention-days 120 --mode execute --confirm-execute I_UNDERSTAND_ANALYTICS_RETENTION_DELETE --hard-delete-limit 100

Usage events listing behavior:

- Reads from gateway.api_usage_events only.
- Returns raw successful usage event rows.
- Supports offset pagination and cursor pagination.
- Supports filters by from, to, routePath, routeMethod, statusCode, cacheStatus, apiKeyAuthSource, apiKeyId, and consumerId.
- Does not expose raw API keys, JWTs, or Authorization headers.

Usage summary behavior:

- Usage summaries still read from gateway.api_usage_events only.
- Supported filters include from, to, routePath, routeMethod, statusCode, cacheStatus, and apiKeyAuthSource.

Quota behavior:

- Applies to DB-backed API keys with assigned enabled usage plans.
- Counts usage events from gateway.api_usage_events.
- Returns 429 QUOTA_EXCEEDED when the current window quota is exhausted.
- Records quota-denied requests into gateway.api_rejected_events.
- Does not record rejected requests into gateway.api_usage_events.
- Does not use rollup tables or retention dry-run for quota counting.

Rejected event behavior:

- Records API_KEY_MISSING, API_KEY_INVALID, JWT_TOKEN_MISSING, JWT_TOKEN_INVALID, RATE_LIMIT_EXCEEDED, and QUOTA_EXCEEDED.
- Does not store raw API keys, JWTs, or Authorization headers.
- Supports aggregate summary and raw listing read APIs.
- Raw listing supports cursor pagination with nextCursor.
- Supports filters by time range, reason, status code, route, auth source, API key, and consumer.
- Rejected events summary rejects cursor.

Analytics rollup foundation:

- Rollup helpers live in apps/api-gateway/src/analytics.
- Helpers support UTC hourly/daily bucket calculation.
- Helpers support rebuild window planning and maxBuckets.
- Helpers aggregate raw successful usage events and raw rejected events.
- Dimension hash builder creates stable SHA-256 hashes from rollup dimensions.
- Usage and rejected rollup repositories upsert by dimensionHash.
- Persistence service aggregates raw-shaped events and delegates persistence.
- Manual backfill command can plan or execute controlled rollup rebuilds.
- Read model can query usage or rejected rollup rows through an internal/admin endpoint.
- Rollups are not used by runtime summaries, scheduled background jobs, retention delete, execution preview, or quota counting yet.

Analytics retention foundation:

- Dry-run policy parser supports disabled/default dry-run planning.
- Candidate reader counts usage or rejected events older than computed cutoffs.
- Dry-run service orchestrates policy, plan, and candidate read.
- Dry-run command prints DB-backed candidate JSON preview.
- Execution guard models dry-run, execute, confirmation, hard delete limit, and blocked reasons.
- Execution args parser accepts explicit execute preview flags.
- Execution preview command prints guard JSON preview without DB access.
- Delete batch plan model requires candidate recheck and one total hard delete limit.
- Delete repository safety contract blocks unsafe repository operations.
- Delete repository port and executor require candidate recheck before prepared delete execution.
- Delete operation planner derives bounded source-specific repository requests.
- Prisma delete repository can count candidates and delete only bounded selected IDs after safety checks.
- Execution service preview composes policy, plan, guard, batch plan, operation plan, optional repository preparation, and safe flags.
- Execution service summary provides a compact non-destructive summary contract.
- Candidate count loader normalizes count-only candidate read repository output for execution planning.
- Candidate-read execution preview composes existing read-only candidate counts into the service preview.
- Service previews do not call deleteCandidates.
- Execution preview command still reports deleteImplementationAvailable=false.
- No operator-facing raw event deletion exists yet.
- No retention execute command exists yet.

Current analytics limitations:

- Usage and rejected summary APIs are event-based at runtime.
- Rollup read endpoint exists, but summary APIs have not switched to rollup reads.
- No retention delete job yet.
- No scheduled/background rollup job yet.

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

Internal/admin analytics:

- GET /internal/admin/usage/events
- GET /internal/admin/usage/consumers/:consumerId/summary
- GET /internal/admin/usage/api-keys/:apiKeyId/summary
- GET /internal/admin/api-rejections/summary
- GET /internal/admin/api-rejections/events
- GET /internal/admin/analytics/rollups

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

---

## Important Files

Analytics foundation:

- apps/api-gateway/prisma/schema.prisma
- apps/api-gateway/src/analytics/
- apps/api-gateway/src/routes/admin-analytics-rollup.route.ts

API Gateway usage tracking and analytics:

- apps/api-gateway/src/api-usage/
- apps/api-gateway/src/routes/admin-api-usage.route.ts
- apps/api-gateway/src/proxy/downstream-proxy-handler.ts

Rejected events:

- apps/api-gateway/src/api-rejections/
- apps/api-gateway/src/routes/admin-api-rejection.route.ts
- apps/api-gateway/src/proxy/downstream-proxy-handler.ts

Usage plans, quota, and quota observability:

- apps/api-gateway/src/usage-plans/
- apps/api-gateway/src/routes/admin-usage-plan.route.ts
- apps/api-gateway/src/routes/admin-api-key.route.ts
- apps/api-gateway/src/proxy/downstream-proxy-handler.ts

Docs:

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/DECISION_LOG.md
- docs/project-context/AI_HANDOFF.md
- docs/sdlc/sprint-history/sprint-29.md
- docs/runbooks/api-usage-analytics.md
- docs/runbooks/api-rejected-events.md
- docs/runbooks/analytics-rollup-backfill.md
- docs/runbooks/analytics-rollup-read.md
- docs/runbooks/analytics-retention-dry-run.md
- docs/runbooks/analytics-retention-execution-preview.md
- docs/runbooks/analytics-retention-delete-repository.md
- docs/runbooks/analytics-retention-execution-service-preview.md
- docs/project-context/decisions/2026-07-06-analytics-retention-execution-service-orchestration-preview.md
- docs/project-context/decisions/2026-07-06-analytics-retention-delete-repository-safety.md
- docs/project-context/decisions/2026-07-04-usage-analytics-retention-rollup-design.md

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

- Usage summary APIs still read raw events.
- Rejected summary APIs still read raw events.
- Rollup read endpoint exists, but summary APIs have not switched to rollup reads.
- Retention execution has repository-level and service-level safety foundations, but no operator-facing execute command yet.
- Retention Prisma delete repository is not wired to any command, API, scheduled job, or quota path yet.
- No retention delete job yet.
- No scheduled/background rollup job yet.
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

Start Sprint 30 after confirming Sprint 29 docs are committed and pushed.

Recommended direction:

- Analytics Retention Execution Operator Preview Command.

Before starting:

- Confirm git status is clean.
- Confirm latest docs commit is pushed.
- Keep implementation small and testable.
- Preserve quota correctness.
- Keep successful usage and rejected/security event storage separate.
- Keep retention execution explicit and guarded.
- Prefer a non-destructive operator-facing preview command around the Sprint 29 service layer.
- Do not expose a destructive execute command until explicitly approved.
