# Current Progress

## Current Version

v1.1.0

Private npm workspace package versions remain `0.1.0`.

The existing annotated Git tag `v1.0.0` remains unchanged at the final Sprint 60 documentation commit.

## Latest Completed Sprint

Sprint 61 - Admin Dashboard foundation

## Sprint 61 Completion Summary

Sprint 61 established the first PulseGate Admin Dashboard foundation without expanding mutation, quota, scheduler, retention, persistence, or raw-event behavior.

Delivered:

- Added `apps/admin-dashboard` with Next.js App Router, React, TypeScript, and plain CSS.
- Added a responsive application shell, top bar, sidebar navigation, Overview page, and loading/error/not-found boundaries.
- Added roadmap placeholders for Dashboard functionality assigned to Sprints 62-64.
- Added the root `npm run dev:dashboard` command.
- Reserved Dashboard port `3003`.
- Added a strict server-only Admin API configuration boundary.
- Added a fixed read-only Gateway client for:
  - `GET /internal/admin/routes/runtime`
- Added a fixed browser-facing BFF endpoint:
  - `GET /api/admin/runtime-status`
- Added no generic Admin API proxy.
- Added fail-closed handling for missing or invalid configuration.
- Added normalized unauthorized, forbidden, timeout, unavailable, upstream, and invalid-response errors.
- Added a runtime status panel showing only safe runtime registry metadata.
- Added loading, connected, unavailable, and retry states.
- Added browser-side response contract validation.
- Added a multi-stage production Dashboard Dockerfile.
- Runs the Dashboard image as the non-root `node` user.
- Added the Docker Compose `admin-dashboard` service on port `3003`.
- Added a Dashboard health check.
- Added Dashboard environment documentation to `.env.example`.
- Added `docs/runbooks/admin-dashboard.md`.

Sprint 61 implementation commits:

- `82926c6 feat(dashboard): add admin dashboard foundation`
- `9e35b5b feat(dashboard): add secure admin api boundary`
- `0475e51 feat(dashboard): show gateway runtime status`
- `12d1148 feat(dashboard): add production runtime wiring`

Automated validation before documentation finalization:

- Admin Dashboard: 5 test files / 22 tests passed.
- API Gateway: 136 test files / 988 tests passed.
- Root typecheck passed.
- Root production build passed.
- `docker compose config --quiet` passed.
- `git diff --check` passed.
- Browser-facing production source secret audit passed.
- Dashboard Docker image secret inspection passed.

Docker runtime validation:

- PostgreSQL healthy.
- Redis healthy.
- Product Service healthy.
- API Gateway running on port `3000`.
- Admin Dashboard healthy on port `3003`.
- Direct read-only Gateway runtime request returned `HTTP 200`.
- Dashboard Overview returned `HTTP 200`.
- Dashboard BFF returned `HTTP 200`.
- Runtime registry returned `available=true` with two loaded routes.
- Dashboard access mode returned `read-only`.
- Invalid Dashboard credentials returned `HTTP 403`.
- Invalid credential errors were normalized to `ADMIN_DASHBOARD_FORBIDDEN`.
- The Dashboard container received `ADMIN_READ_ONLY_API_KEY`.
- The Dashboard container did not receive full-access `ADMIN_API_KEY`.
- Admin credentials were absent from HTML, BFF responses, client bundles, logs, and image configuration.

Security and safety boundaries preserved:

- No Dashboard mutation controls.
- No generic Admin API proxy.
- No full-access Admin credential in the Dashboard runtime.
- No Admin credential in `NEXT_PUBLIC_*` variables or browser storage.
- No consumer, API key, usage-plan, or route persistence changes.
- No quota behavior changes.
- No successful-usage or rejected-event recorder changes.
- No scheduler execution expansion.
- No retention execution.
- No raw-event deletion.
- No database migration.
- No database-backed administrator, organization, tenant, or enterprise IAM model.
- No Developer Portal, Kubernetes, OpenTelemetry, or Loki scope.

Known dependency note:

- Next.js `16.2.10` currently resolves a transitive PostCSS version reported by npm audit with moderate findings.
- Sprint 61 does not use `npm audit fix --force`, framework downgrade, or canary releases.
- The Dashboard does not accept untrusted CSS input.

## Sprint 60 Completion Summary

Sprint 60 completed Backend Portfolio v1 and released `v1.0.0`.

Delivered:

- Added `npm run validate:release`.
- Added `npm run demo:runtime`.
- Added bounded Gateway, Prometheus, Grafana, Admin authorization, metric-label, and k6 runtime validation.
- Added release notes and final recurring documentation.
- Created and pushed annotated Git tag `v1.0.0`.
- Tag `v1.0.0` points to commit `407d03678674219e7228b15f0cd7a23074493f31`.
- Private npm workspace package versions remained `0.1.0`.

Final Sprint 60 validation:

- 136 test files / 988 tests passed.
- Typecheck and build passed.
- Release-readiness validation passed.
- Runtime demo passed.
- k6 completed 10/10 iterations and 20/20 checks with 0% failures.

## Sprint 59 Completion Summary

Sprint 59 completed a bounded observability and demo-validation pass without changing API management business semantics.

Delivered:

- Audited the existing Prometheus metrics, labels, scrape target, Grafana provisioning, and dashboard queries.
- Replaced raw unmatched request paths in metric labels with the fixed `__unmatched__` label.
- Preserved Fastify route templates for matched routes.
- Kept the existing metric contract:
  - `http_requests_total`
  - `http_request_duration_seconds`
  - `http_response_cache_total`
- Added a Docker Compose `tools` profile for a bounded Grafana k6 smoke test.
- Added `npm run test:k6:smoke`.
- Bounded k6 to 1 VU, 10 iterations, 30-second maximum duration, 5-second graceful stop, and 2-second request timeout.
- Refined the provisioned Grafana dashboard to exclude `/metrics` scrape traffic from HTTP request/latency panels.
- Added a `5xx Responses (5m)` stat panel using the existing request counter.
- Added reproducible observability validation documentation.

Sprint 59 implementation commits:

- `ec09747 fix(gateway): bound unmatched metrics route labels`
- `3f5c428 test(observability): add bounded k6 gateway smoke`
- `c9da0cb feat(observability): refine gateway Grafana dashboard`

Validation before docs finalization:

- `npm run test`: 136 test files / 988 tests passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.
- API Gateway health returned `200`.
- Prometheus readiness returned `200`.
- Prometheus target `pulsegate-api-gateway` was `up`.
- Two distinct unmatched paths returned `404` and were aggregated under one `__unmatched__` metric label.
- Raw unmatched paths were absent from metric output.
- k6 completed 10/10 bounded iterations with 20/20 checks, 0% failures, and all thresholds passing.
- Grafana database health was `ok`.
- Grafana Prometheus datasource health was `OK`.
- All five dashboard PromQL queries succeeded.
- The dashboard was provisioned with five panels.

Preserved boundaries:

- Prometheus and Grafana are not quota sources of truth.
- `gateway.api_usage_events` remains the successful-usage and quota-counting source of truth.
- Successful and rejected traffic remain separated.
- No usage recorder, rejected recorder, quota checker, rollup scheduler, retention execution, or raw event deletion behavior changed.
- No Admin Dashboard, Developer Portal, OpenTelemetry, Loki, Kubernetes, billing, marketplace, or organization model was added.

## Next Sprint

Sprint 62 - Dashboard consumers/API keys/usage plans.

Sprint 62 may add bounded Dashboard views and controls for:

- API consumers
- API keys
- usage plans
- route configuration

Sprint 62 must preserve:

- full-access and read-only Admin authorization
- sanitized actor attribution
- current persistence semantics
- quota source-of-truth behavior
- successful and rejected event separation
- scheduler and retention safety boundaries
- raw-event deletion prohibition

It must not introduce a generic Admin API proxy, browser-stored credentials, enterprise IAM, unrelated analytics panels, scheduler execution expansion, or retention execution.

## Fixed Roadmap

Sprint 45-60 = Backend Portfolio v1.

- 45 Fail-Closed Error Model
- 46 Command Dry-Run Service Invocation Wiring Contract
- 47 Command Dry-Run Runtime Service Invocation
- 48 Dry-Run Runtime Output Hardening
- 49 Command Execute Contract Review
- 50 Command Execute Wiring Preview blocked-by-default
- 51 Command Execute Runtime Wiring with strict guardrails
- 52 Rollup Summary API Switch Preview
- 53 Switch selected summary reads to rollup read model with fallback
- 54 Background Scheduler Contract/Runner
- 55 Background Scheduler Runtime Wiring with guardrails
- 56 Retention Execute Contract Review
- 57 Retention Execute Preview Hardening/rollback expectation
- 58 Minimal Admin/RBAC hardening
- 59 Observability + Grafana/k6 lightweight validation
- 60 Final polish, docs, demo script, architecture cleanup, release v1.0.0

Sprint 61-80 remains the fixed Product/Platform Expansion v2 roadmap.
