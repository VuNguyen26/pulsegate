# Sprint 59 - Observability + Grafana/k6 lightweight validation

Version: v0.60.0

Status: Complete

## Goal

Harden and validate the existing PulseGate observability surface with bounded, reproducible portfolio/demo checks.

## Delivered

### Bounded metric route labels

- Matched requests use Fastify route templates.
- Unmatched requests use `__unmatched__`.
- Raw unmatched paths no longer create unbounded Prometheus route-label values.
- Existing metric names and business semantics remain unchanged.

Commit:

- `ec09747 fix(gateway): bound unmatched metrics route labels`

### Bounded k6 smoke

- Added `observability/k6/api-gateway-smoke.js`.
- Added Docker Compose `tools` profile service using `grafana/k6`.
- Added `npm run test:k6:smoke`.
- Limited execution to 1 VU, 10 iterations, 30 seconds, 5-second graceful stop, and 2-second request timeout.
- Used health-only GET traffic and no credentials or mutations.

Commit:

- `3f5c428 test(observability): add bounded k6 gateway smoke`

### Grafana dashboard refinement

- Reused the provisioned Prometheus datasource.
- Excluded `/metrics` from request-rate, request-count, and p95-latency panels.
- Preserved the existing cache-outcome panel.
- Added `5xx Responses (5m)` using `http_requests_total`.
- Kept the dashboard compact at five panels.

Commit:

- `c9da0cb feat(observability): refine gateway Grafana dashboard`

## Validation

Automated validation:

- 136 test files / 988 tests passed.
- Typecheck passed.
- Build passed.
- `git diff --check` passed.

Runtime validation:

- API Gateway health returned `200`.
- Prometheus readiness returned `200`.
- Prometheus gateway target was `up`.
- Two distinct unmatched 404 paths aggregated into one `__unmatched__` series.
- Raw unmatched paths were absent from `/metrics`.
- k6 completed 10/10 iterations and 20/20 checks with 0% failures.
- Grafana database health was `ok`.
- Grafana Prometheus datasource health was `OK`.
- All five dashboard PromQL queries succeeded.
- The provisioned dashboard contained five panels.

## Boundaries Preserved

- Metrics and dashboards are not quota sources of truth.
- Successful and rejected event persistence remains separated.
- No quota checker or event recorder changed.
- No rollup scheduler runtime path changed.
- No retention execution or raw event deletion was added.
- No Admin UI, Developer Portal, OpenTelemetry, Loki, Kubernetes, billing, marketplace, or organization model was added.

## Documentation

Updated or added:

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/AI_HANDOFF.md
- docs/project-context/DECISION_LOG.md
- docs/runbooks/local-validation.md
- docs/runbooks/observability-validation.md
- docs/project-context/decisions/2026-07-10-observability-grafana-k6-lightweight-validation.md

## Next Sprint

Sprint 60 - Final polish, docs, demo script, architecture cleanup, release v1.0.0.
