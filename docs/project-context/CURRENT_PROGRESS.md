# Current Progress

## Current Version

v0.60.0

## Latest Completed Sprint

Sprint 59 - Observability + Grafana/k6 lightweight validation

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

Sprint 60 - Final polish, docs, demo script, architecture cleanup, release v1.0.0.

Sprint 60 must remain a polish/release sprint and must not add a large new feature.

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
