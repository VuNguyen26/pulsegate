# PulseGate

<p align="center">
  <strong>High-Traffic API Gateway & Observability Platform</strong>
</p>

<p align="center">
  A local-first API Gateway, API Management, and Observability learning project built with Node.js, TypeScript, Fastify, Docker Compose, PostgreSQL, Prisma, Redis, Prometheus, Grafana, GitHub Actions CI/CD, route policies, database-backed dynamic route configuration, runtime route reload, API consumers, issued API keys, DB-backed API key authentication, API usage analytics, usage plans, and runtime quota enforcement.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-Sprint%2015%20Complete-brightgreen" />
  <img src="https://img.shields.io/badge/version-v0.16.0-blue" />
  <a href="https://github.com/VuNguyen26/pulsegate/actions/workflows/ci.yml">
    <img src="https://github.com/VuNguyen26/pulsegate/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI" />
  </a>
  <img src="https://img.shields.io/badge/tests-314%20passing-brightgreen" />
  <img src="https://img.shields.io/badge/typecheck-passing-brightgreen" />
  <img src="https://img.shields.io/badge/build-passing-brightgreen" />
  <img src="https://img.shields.io/badge/Node.js-20%2B-green" />
  <img src="https://img.shields.io/badge/TypeScript-strict-blue" />
  <img src="https://img.shields.io/badge/Fastify-API%20Gateway-black" />
  <img src="https://img.shields.io/badge/Auth-DB%20API%20Key%20%2B%20JWT-purple" />
  <img src="https://img.shields.io/badge/Quota-Usage%20Plans-purple" />
  <img src="https://img.shields.io/badge/Rate%20Limit-Redis-red" />
  <img src="https://img.shields.io/badge/Cache-Redis-red" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-blue" />
  <img src="https://img.shields.io/badge/ORM-Prisma-2D3748" />
  <img src="https://img.shields.io/badge/Metrics-Prometheus-orange" />
  <img src="https://img.shields.io/badge/Dashboard-Grafana-F46800" />
  <img src="https://img.shields.io/badge/Docker%20Compose-enabled-blue" />
  <img src="https://img.shields.io/badge/License-MIT-lightgrey" />
</p>

---

## Overview

PulseGate is a mini API Gateway, API Management, and Observability Platform inspired by Kong, Apache APISIX, Tyk, Apigee, and AWS API Gateway.

The project demonstrates backend engineering around:

- API Gateway routing.
- Microservice communication.
- Database-backed dynamic route configuration.
- Runtime route registry reload.
- Catch-all dynamic routing for DB-backed `/api/*` routes.
- API consumer management.
- Issued API key lifecycle management.
- DB-backed API key authentication.
- Usage plans and API key quota enforcement.
- API usage event tracking.
- Consumer and API key usage summary APIs.
- JWT authentication.
- Redis-backed rate limiting.
- Redis response caching.
- Prometheus and Grafana observability.
- GitHub Actions CI/CD.
- Production-oriented backend system design.

Current version:

    v0.16.0

Current status:

    Sprint 15 - Usage Plans and Quota Foundation Complete

Current validation:

    44 test files passed
    314 tests passed
    npm run typecheck passed
    npm run build passed
    Docker runtime quota validation passed
    GitHub Actions CI passing

Recommended next sprint:

    Sprint 16 - Quota Observability and Usage Management Hardening

---

## Current Architecture

High-level runtime flow:

    Client / API Consumer
      -> PulseGate API Gateway :3000
        -> Request ID
        -> Structured access logs
        -> Metrics timer
        -> Security headers
        -> Request size limit
        -> Runtime route registry lookup
        -> DB-backed API key auth or env API_KEYS fallback
        -> Redis rate limit
        -> JWT auth
        -> Usage quota check
        -> Redis response cache
        -> Downstream proxy
      -> Product Service :3001
      -> PostgreSQL / Redis / Prometheus / Grafana

Current data ownership:

    Product Service
      -> PostgreSQL public schema
      -> public.products

    API Gateway
      -> PostgreSQL gateway schema
      -> gateway.gateway_routes
      -> gateway.api_consumers
      -> gateway.api_keys
      -> gateway.usage_plans
      -> gateway.api_usage_events

Current infrastructure:

    API Gateway      -> 3000
    Product Service  -> 3001
    Grafana          -> 3002
    PostgreSQL       -> 5432
    Redis            -> 6379
    Prometheus       -> 9090

---

## Key Capabilities

### Gateway Core

- Fastify API Gateway.
- Multi-route downstream proxy.
- Shared downstream proxy pipeline.
- Policy-driven route behavior.
- Database-backed Gateway route config.
- Static route config fallback.
- Runtime route registry snapshot.
- Runtime reload through admin API.
- Catch-all dynamic router for `/api/*`.
- No-restart apply for brand-new DB-backed `/api/*` routes after reload.

### API Management Foundation

- API consumers stored in `gateway.api_consumers`.
- Issued API keys stored in `gateway.api_keys`.
- API key hashing with `keyHash`.
- API key display prefix with `keyPrefix`.
- Raw API key returned only once.
- API key revocation.
- API key expiration check.
- Disabled consumer rejection.
- `lastUsedAt` best-effort metadata.
- DB-backed runtime API key authentication.
- Local env `API_KEYS` fallback.

### Usage Plans and Quotas

- Usage plans stored in `gateway.usage_plans`.
- API keys can be assigned to usage plans.
- Usage plans support `DAILY` and `MONTHLY` quota windows.
- Runtime quota enforcement applies to DB-backed API keys with assigned usage plans.
- Quota counting is event-based and reads from `gateway.api_usage_events`.
- Over-quota requests return `429 QUOTA_EXCEEDED`.
- Env fallback API keys and public routes are not quota-enforced.

### Route Management

- Internal/admin route list, detail, create, update, soft delete.
- Runtime registry status endpoint.
- Runtime registry reload endpoint.
- Soft delete with lifecycle metadata.
- Active-route uniqueness through PostgreSQL partial unique index.
- Validation before persistence and reload.

### Traffic Protection

- DB-backed API key auth.
- Env API key fallback.
- JWT auth.
- Usage plan quota enforcement.
- Redis-backed rate limiting.
- Request size limit.
- Basic security headers.
- Redis response caching.
- Normalized downstream errors.

### Observability

- Request ID propagation.
- Structured access logs.
- `x-response-time-ms`.
- Prometheus metrics endpoint.
- Prometheus Docker service.
- Grafana Docker service.
- Provisioned API Gateway dashboard.
- API usage event tracking.
- Consumer and API key usage summary APIs.

### CI/CD

GitHub Actions validates:

- `npm ci`
- Product Service Prisma Client generation.
- API Gateway Prisma Client generation.
- Automated tests.
- TypeScript typecheck.
- Production build.
- API Gateway Docker image build.
- Product Service Docker image build.

---

## Main Endpoints

Public:

    GET /health
    GET /metrics
    GET /api/product-service/health

Protected:

    GET /api/products

Dynamic dispatcher:

    GET /api/*
    POST /api/*
    PUT /api/*
    PATCH /api/*
    DELETE /api/*

Internal/admin route management:

    GET /internal/admin/routes
    GET /internal/admin/routes/runtime
    GET /internal/admin/routes/:id
    POST /internal/admin/routes
    PATCH /internal/admin/routes/:id
    DELETE /internal/admin/routes/:id
    POST /internal/admin/routes/reload

Internal/admin consumers:

    GET /internal/admin/consumers
    POST /internal/admin/consumers
    GET /internal/admin/consumers/:id
    PATCH /internal/admin/consumers/:id

Internal/admin API keys:

    GET /internal/admin/consumers/:consumerId/api-keys
    POST /internal/admin/consumers/:consumerId/api-keys
    PATCH /internal/admin/api-keys/:id/revoke
    PATCH /internal/admin/api-keys/:id/usage-plan

Internal/admin usage plans:

    GET /internal/admin/usage-plans
    POST /internal/admin/usage-plans
    GET /internal/admin/usage-plans/:id
    PATCH /internal/admin/usage-plans/:id

Internal/admin usage analytics:

    GET /internal/admin/usage/consumers/:consumerId/summary
    GET /internal/admin/usage/api-keys/:apiKeyId/summary

---

## Quick Start

Clone and install:

    git clone https://github.com/VuNguyen26/pulsegate.git
    cd pulsegate
    npm install

Start local infrastructure and services:

    docker compose up --build -d
    docker compose ps

Run validation:

    npm run test
    npm run typecheck
    npm run build

Validate API Gateway:

    Invoke-RestMethod http://localhost:3000/health | ConvertTo-Json -Depth 10
    Invoke-WebRequest http://localhost:3000/metrics -UseBasicParsing
    Invoke-WebRequest http://localhost:3000/api/product-service/health -UseBasicParsing

For detailed local validation commands, see:

- `docs/runbooks/local-validation.md`
- `docs/runbooks/admin-route-management.md`
- `docs/runbooks/api-key-lifecycle.md`
- `docs/runbooks/api-usage-tracking.md`
- `docs/runbooks/runtime-reload.md`
- `docs/runbooks/usage-plans-and-quotas.md`

---

## Tech Stack

| Category | Technology |
| --- | --- |
| Runtime | Node.js 20+ |
| Language | TypeScript |
| Web Framework | Fastify |
| Monorepo | npm workspaces |
| Database | PostgreSQL |
| ORM | Prisma |
| Cache / Rate Limit Store | Redis |
| Metrics | prom-client |
| Metrics Backend | Prometheus |
| Dashboard | Grafana |
| Testing | Vitest |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Auth | DB-backed API key, env API key fallback, JWT, admin API key |
| API Management | Consumers, issued API keys, usage plans, quotas |
| Analytics | API usage events, consumer summary, API key summary |

---

## Documentation

| Document | Description |
| --- | --- |
| `docs/architecture/overview.md` | Current architecture overview |
| `docs/sdlc/requirements.md` | Functional and non-functional requirements |
| `docs/project-context/CURRENT_PROGRESS.md` | Current project progress |
| `docs/project-context/AI_HANDOFF.md` | Context for continuing with AI help |
| `docs/project-context/DECISION_LOG.md` | Decision log index |
| `docs/project-context/decisions/` | Detailed decision records |
| `docs/sdlc/sprint-history/` | Detailed sprint archive |
| `docs/runbooks/` | Manual validation and operational commands |

---

## Roadmap

Completed:

    Sprint 0  -> Core setup and basic Gateway flow
    Sprint 1  -> API Gateway core features
    Sprint 2  -> Gateway traffic protection
    Sprint 3  -> Data and infrastructure foundation
    Sprint 4  -> Observability foundation
    Sprint 5  -> Advanced Gateway policies
    Sprint 6  -> CI/CD foundation
    Sprint 7  -> Multi-route Gateway expansion
    Sprint 8  -> Dynamic route config from database
    Sprint 9  -> Route Management API foundation
    Sprint 10 -> Route Management Hardening
    Sprint 11 -> Route Runtime Reload / Admin Hardening Foundation
    Sprint 12 -> Catch-All Dynamic Router Foundation
    Sprint 13 -> API Consumer and API Key Lifecycle Foundation
    Sprint 14 -> API Key Usage Tracking and Consumer Analytics Foundation
    Sprint 15 -> Usage Plans and Quota Foundation

Recommended next:

    Sprint 16 -> Quota Observability and Usage Management Hardening

Later:

- Advanced route matching.
- Route management audit log.
- Stronger admin authentication and RBAC.
- Service registry.
- OpenAPI documentation.
- Admin Dashboard.
- Developer Portal.
- OpenTelemetry tracing.
- Loki logs.
- k6 load testing.
- Kafka event streaming.
- RabbitMQ background jobs.
- Docker image registry.
- Kubernetes deployment.
- Production cloud deployment.

---

## Current Limitations

- Dynamic router supports exact method + exact path matching only.
- Path parameters are not implemented yet.
- Wildcard upstream path forwarding is not implemented yet.
- Host-based routing is not implemented yet.
- Weighted upstreams are not implemented yet.
- Service discovery is not implemented yet.
- Failed auth request usage tracking is not implemented yet.
- Rate-limited request usage tracking is not implemented yet.
- Quota-denied requests are not recorded as usage events yet.
- Usage data is event-based only.
- No aggregate rollup table exists yet.
- No usage retention policy exists yet.
- Disabled usage plans currently skip quota enforcement.
- Env fallback API keys are not quota-enforced.
- Admin Dashboard is not implemented yet.
- Developer Portal is not implemented yet.
- Admin auth is still local admin API key based.
- JWT auth is still local secret based.
- Rate limit identity still uses raw API key value, not `apiKeyId` or `consumerId`.
- Grafana does not yet include per-consumer, per-key, or quota usage dashboards.
- CI does not run the full Docker Compose runtime stack yet.
- CI does not push Docker images to a registry yet.
- CI does not deploy automatically yet.
- Kubernetes and cloud deployment are planned for later.

---

## License

This project is licensed under the MIT License.