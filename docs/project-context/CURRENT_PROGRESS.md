# Current Progress

## Current Version

v1.0.0

## Latest Completed Sprint

Sprint 60 - Final polish, docs, demo script, architecture cleanup, release v1.0.0

## Sprint 60 Completion Summary

Sprint 60 completed Backend Portfolio v1 release preparation without adding a major runtime feature.

Delivered:

- Added `npm run validate:release` for tests, typecheck, build, diff checks, clean-tree verification, and `origin/main` synchronization.
- Added `npm run demo:runtime` for bounded Docker, Gateway, Prometheus, Grafana, Admin auth, metric-label, and k6 validation.
- Corrected stale scheduler documentation for guarded direct command execute and process-local dry-run.
- Added `docs/releases/v1.0.0.md`.
- Added the Sprint 60 history and v1 release-readiness decision record.
- Kept private npm workspace versions at `0.1.0`.
- Prepared Git/product documentation version `v1.0.0`; the Git tag remains pending final validation and explicit approval.

Sprint 60 commits so far:

- `4fb3c70 chore: add release readiness validation`
- `5059d61 chore: add bounded runtime demo`
- `33c05a3 docs: fix scheduler runtime runbook`
- `d653d9c docs: add sprint 60 release records`

Validation:

- 136 test files / 988 tests passed.
- Typecheck and build passed.
- Clean release-readiness validation passed.
- Runtime demo passed Gateway, Prometheus, Grafana, Admin authorization, bounded metric-label, and k6 checks.
- k6 completed 10/10 iterations and 20/20 checks with 0% failures.

Boundaries preserved:

- No destructive retention execution or raw event deletion.
- No autonomous scheduled/background execute.
- No external scheduler runtime execution.
- No quota source-of-truth change.
- No Admin Dashboard or Developer Portal was added in Sprint 60.

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

Sprint 61 - Admin Dashboard foundation.

Sprint 61 must remain limited to the Admin Dashboard foundation defined by the fixed roadmap.

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
