# Decision Log

## Purpose

This file is now a compact decision index.

Detailed decision records live in:

- docs/project-context/decisions/

Detailed sprint history lives in:

- docs/sdlc/sprint-history/

Manual validation commands live in:

- docs/runbooks/

Older full decision history remains available in Git history before Checkpoint 14.0.

---

## Current Project Direction

PulseGate is being built toward a product-like API Gateway and API Management Platform.

It should not be treated as a small portfolio backend only.

Long-term inspiration:

- Kong
- Apache APISIX
- Tyk
- Apigee
- AWS API Gateway

Current product direction:

- API Gateway
- API Management
- Dynamic route configuration
- Runtime route reload
- API consumer management
- API key lifecycle management
- API key usage tracking
- Consumer analytics
- Usage plans and quotas
- Admin Dashboard later
- Developer Portal later
- Observability
- CI/CD
- Kubernetes/cloud deployment later

Status:

Accepted.

---

# Current Major Decisions

## Use Node.js, TypeScript, and Fastify

Decision:

Use Node.js, TypeScript, and Fastify for API Gateway and services.

Reason:

- Node.js fits backend API development.
- TypeScript improves safety and maintainability.
- Fastify is lightweight and has good TypeScript support.
- The stack is suitable for learning production-style API Gateway patterns.

Status:

Accepted.

---

## Use npm Workspaces

Decision:

Use npm workspaces for the monorepo.

Current structure:

- apps/api-gateway
- apps/product-service
- packages/shared

Reason:

- The project has multiple apps.
- npm workspaces are simple and enough for this project stage.
- Avoids unnecessary monorepo complexity early.

Status:

Accepted.

---

## Build in Small Stable Checkpoints

Decision:

Implement one small stable checkpoint at a time.

Reason:

- Keeps changes reviewable.
- Reduces regression risk.
- Makes Git history cleaner.
- Makes rollback easier.

Status:

Accepted.

---

## Keep Project Local-First and Cost-Safe

Decision:

Run locally first through Docker Compose before cloud deployment.

Reason:

- Avoid paid cloud infrastructure early.
- Make the project reproducible locally.
- Build product behavior before production deployment complexity.

Status:

Accepted.

---

## Use PostgreSQL and Prisma

Decision:

Use PostgreSQL and Prisma for persistent data.

Current ownership:

- Product Service owns public schema.
- API Gateway owns gateway schema.

Reason:

- PostgreSQL is production-grade.
- Prisma provides type-safe database access.
- Separate schemas prevent migration ownership conflicts.

Status:

Accepted.

---

## Use Redis for Rate Limiting and Response Cache

Decision:

Use Redis for API Gateway traffic protection and caching.

Current usage:

- Redis-backed rate limit counters.
- Redis response cache payloads.

Reason:

- Redis is common in API Gateway architectures.
- It supports distributed counters and cache behavior.
- It prepares the project for scalable Gateway patterns.

Status:

Accepted.

---

## Use Prometheus and Grafana for Observability

Decision:

Use Prometheus and Grafana for local observability.

Current observability:

- Request ID
- Structured access logs
- x-response-time-ms
- Prometheus metrics
- Grafana dashboard

Reason:

- Observability is core to API Gateway products.
- Prometheus and Grafana are production-relevant and demo-friendly.

Status:

Accepted.

---

## Use GitHub Actions for CI

Decision:

Use GitHub Actions to validate repository health.

Current CI validates:

- npm ci
- Prisma Client generation
- npm run test
- npm run typecheck
- npm run build
- API Gateway Docker image build
- Product Service Docker image build

Reason:

- Main branch should stay stable.
- CI badge improves GitHub project credibility.
- CI catches test, typecheck, build, and Docker issues early.

Status:

Accepted.

---

# Gateway Architecture Decisions

## Use Policy-Driven Route Behavior

Decision:

Gateway route behavior should be controlled by route policies.

Current policy model:

- auth
- timeout
- cache
- rateLimit
- requestTransform
- responseTransform
- retry

Reason:

- Avoid hardcoding behavior in route handlers.
- Support public and protected routes differently.
- Prepare for dynamic route management and Admin Dashboard.

Status:

Accepted.

---

## Store Gateway Route Config in PostgreSQL

Decision:

Store Gateway route config in gateway.gateway_routes.

Reason:

- Static TypeScript route config is not enough for a product-like API Gateway.
- Route config should be persistent and manageable through APIs.
- Admin Dashboard later needs backend route management.

Status:

Accepted.

---

## Keep Static Route Config Fallback

Decision:

Keep static downstream route config as startup fallback.

Reason:

- Gateway startup should not become fragile.
- If DB route loading fails or returns no active routes, stable local routes should still work.
- This makes database-backed route config rollout safer.

Status:

Accepted.

---

## Use Soft Delete for Route Config

Decision:

Use soft delete for Gateway route config records.

Current behavior:

- DELETE marks route as disabled.
- deleted_at is set.
- deleted_by is set.
- Record remains in DB.
- Runtime ignores soft-deleted routes.

Reason:

- Route config is operationally important.
- History should remain available.
- Recreate-after-delete should be safe.

Status:

Accepted.

---

## Use Active-Route Partial Unique Index

Decision:

Enforce route uniqueness only for active non-deleted route identities.

Rule:

- method + gateway_path must be unique where deleted_at IS NULL.

Reason:

- Soft-deleted historical routes should not block recreating the same route.
- Active routes must still avoid duplicate identity conflicts.

Status:

Accepted.

---

## Use Runtime Route Registry

Decision:

Use a runtime route registry snapshot for active route configs.

Current capabilities:

- getSnapshot()
- replaceRoutes(routes)
- findRoute(method, gatewayPath)

Reason:

- Avoid unsafe Fastify runtime route mutation.
- Let existing registered routes resolve latest config per request.
- Allow safe reload after validation.

Status:

Accepted.

---

## Use Catch-All Dynamic Router

Decision:

Use a stable /api/* catch-all dynamic router instead of unsafe Fastify unregister/register.

Current scope:

- GET /api/*
- POST /api/*
- PUT /api/*
- PATCH /api/*
- DELETE /api/*

Reason:

- Fastify route table remains stable.
- Brand-new DB-backed /api/* paths can work after reload.
- Avoids stale handlers and duplicate route registration risks.

Status:

Accepted.

---

## Keep Dynamic Router Exact-Match Only for Now

Decision:

Dynamic router currently uses exact method + exact path matching.

Reason:

- Sprint 12 goal was no-restart runtime apply for new DB-backed /api/* paths.
- Advanced matching requires separate design.

Deferred:

- Path parameters
- Wildcard upstream mapping
- Host-based routing
- Header-based routing
- Weighted upstreams
- Service discovery

Status:

Accepted.

---

# API Management Decisions

## Store API Consumers in Gateway Schema

Decision:

Store API consumers in gateway.api_consumers.

Reason:

- API consumers are part of API Management.
- Product Service should not own consumer data.
- Consumers are needed before API key ownership, usage tracking, quotas, and Developer Portal.

Status:

Accepted.

---

## Store Issued API Keys in Gateway Schema

Decision:

Store issued API keys in gateway.api_keys.

Reason:

- API keys are owned by API Gateway/API Management.
- API keys need lifecycle management independent from downstream services.
- Keys need to belong to consumers.

Status:

Accepted.

---

## Never Persist Raw API Keys

Decision:

Never store raw issued API keys.

Stored:

- keyHash
- keyPrefix

Returned only once:

- rawKey

Reason:

- Raw API keys are secrets.
- Losing the raw key should require issuing a new key.
- Admins only need prefix and lifecycle metadata after issuance.

Status:

Accepted.

---

## Use Deterministic API Key Hashing

Decision:

Use deterministic hashing for API key lookup.

Current implementation:

- SHA-256 hex hash

Reason:

- Enables lookup by keyHash.
- Keeps raw keys out of the database.
- Provides a simple local-first foundation.

Status:

Accepted.

---

## Use API Key Status for Revocation

Decision:

Use API key status instead of hard delete.

Current statuses:

- ACTIVE
- REVOKED

Reason:

- Revoked keys should remain visible for audit and troubleshooting.
- Lifecycle metadata should not disappear.

Status:

Accepted.

---

## Use API Consumer Status for Runtime Key Eligibility

Decision:

Consumer status affects whether keys are accepted.

Current statuses:

- ACTIVE
- DISABLED

Runtime rule:

- Keys belonging to DISABLED consumers are rejected.

Reason:

- Admins need a way to disable all keys for a consumer without deleting records.

Status:

Accepted.

---

## Do Not Fall Back When Known DB Key Is Invalid

Decision:

If a DB-backed key is found but revoked, expired, or belongs to a disabled consumer, reject it.

Reason:

- Fallback should not bypass revocation or disabled status.
- Revocation must be authoritative.

Status:

Accepted.

---

## Keep Env API_KEYS Fallback

Decision:

Keep env API_KEYS fallback after DB-backed API key auth.

Reason:

- dev-api-key remains useful for local development.
- Existing tests and local workflows remain stable.
- DB-backed auth rollout stays safe.

Status:

Accepted.

---

## Keep lastUsedAt as Metadata Only

Decision:

Update lastUsedAt as best-effort metadata.

Reason:

- Useful for admin visibility.
- Should not fail a valid request if metadata update fails.
- Full usage tracking belongs in a later sprint.

Status:

Accepted.

---

## Keep Rate Limit Identity Based on Raw API Key for Sprint 13

Decision:

Do not change rate limit identity during Sprint 13.

Current limitation:

- Rate limit identity still uses raw API key value.

Reason:

- Sprint 13 focused on API key lifecycle and DB-backed auth.
- apiKeyId/consumerId rate limit identity should be designed after usage tracking.

Status:

Accepted.

---

# Documentation Decisions

## Documentation Compaction and Archive Strategy

Decision:

From Sprint 14 onward, keep main docs compact and role-based.

Main files:

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/AI_HANDOFF.md
- docs/project-context/DECISION_LOG.md

Archive folders:

- docs/sdlc/sprint-history/
- docs/project-context/decisions/
- docs/runbooks/

Detailed decision record:

- docs/project-context/decisions/2026-07-03-documentation-compaction.md

Reason:

- Avoid documentation bloat.
- Reduce duplicated content.
- Make future AI handoff faster.
- Keep README cleaner for GitHub.

Status:

Accepted.

---

# Sprint Direction Decisions

## Sprint 13 Completed Direction

Decision:

Sprint 13 focused on API Consumer and API Key Lifecycle Foundation.

Included:

- API consumers
- Issued API keys
- Key hashing
- Admin Consumer API
- Admin API Key lifecycle API
- DB-backed runtime API key auth
- Env API_KEYS fallback

Detailed archive:

- docs/sdlc/sprint-history/sprint-13.md

Status:

Done.

---

## Sprint 14 Recommended Direction

Decision:

Sprint 14 should focus on API Key Usage Tracking and Consumer Analytics Foundation.

Reason:

- Sprint 13 introduced real API consumers and issued API keys.
- Next product-like API Management step is traffic attribution.
- Usage tracking should come before usage plans, quotas, dashboard analytics, and Developer Portal usage views.

Recommended scope:

- API usage event table or aggregate table.
- Record apiKeyId.
- Record consumerId.
- Record route.
- Record method.
- Record statusCode.
- Record durationMs.
- Record timestamp.
- Support env fallback traffic safely.
- Admin consumer usage summary API.
- Admin API key usage summary API.

Status:

Recommended next technical sprint.

---

# Deferred Decisions

These are intentionally deferred:

- Admin Dashboard UI
- Developer Portal UI
- Usage plans and quotas
- Billing
- Paid plans
- Multi-tenant organization model
- Stronger admin users and RBAC
- Route management audit log table
- Advanced route matching
- Service registry
- OpenTelemetry tracing
- Loki centralized logs
- k6 load testing
- Kafka
- RabbitMQ
- Docker image registry push
- Kubernetes deployment
- Production cloud deployment
