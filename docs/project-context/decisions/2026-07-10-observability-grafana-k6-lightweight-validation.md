# Observability, Grafana, and k6 Lightweight Validation

Date: 2026-07-10

Sprint: Sprint 59 - Observability + Grafana/k6 lightweight validation

## Status

Accepted.

## Context

PulseGate already exposed Prometheus metrics and provisioned a Grafana dashboard, but unmatched routes could fall back to raw request paths in metric labels. This created a cardinality risk.

The repository also lacked a bounded k6 smoke command, and the dashboard included Prometheus `/metrics` scrape traffic in HTTP request and latency panels.

## Decision

PulseGate will keep Sprint 59 lightweight and use the existing observability stack.

### Metric labels

- Keep existing metric families.
- Use Fastify route templates for matched routes.
- Use `__unmatched__` for unmatched requests.
- Never use raw unmatched paths, request IDs, API keys, actor values, timestamps, or free-form error messages as Prometheus labels.

### Grafana

- Reuse the existing Prometheus datasource.
- Keep a compact provisioned gateway dashboard.
- Exclude `/metrics` scrape traffic from general request and latency panels.
- Add a five-minute 5xx stat using the existing request counter.
- Do not add fake panels or metrics only to satisfy dashboard presentation.

### k6

- Run through a Docker Compose `tools` profile.
- Use safe `GET /health` traffic only.
- Bound VUs, iterations, duration, graceful stop, request timeout, and readiness retries.
- Treat it as a local smoke check, not a production load-test platform.

### Sources of truth

- Prometheus and Grafana remain operational signals.
- `gateway.api_usage_events` remains the successful-usage and quota source of truth.
- `gateway.api_rejected_events` remains the rejected/security traffic source of truth.
- Rollup tables and metrics are not used for quota enforcement.

## Consequences

Benefits:

- Unmatched traffic cannot create raw-path metric series.
- Dashboard panels represent application traffic more clearly.
- Local observability validation is reproducible without installing k6 directly.
- The sprint remains small and portfolio-oriented.

Trade-offs:

- All unmatched routes share one metric route label.
- The k6 script measures only a bounded health smoke path.
- No distributed tracing, centralized log aggregation, or production load laboratory is introduced.

## Explicit Non-Goals

Sprint 59 does not add:

- OpenTelemetry
- Loki
- distributed tracing
- production-scale load testing
- Admin Dashboard UI
- quota-source changes
- usage/rejected recorder changes
- background execute
- retention execution
- raw event deletion
- Kubernetes or cloud deployment

## Validation

Before docs finalization:

- 136 test files / 988 tests passed.
- Typecheck passed.
- Build passed.
- Whitespace diff check passed.
- Prometheus scrape target was `up`.
- Unmatched route cardinality smoke passed.
- Bounded k6 smoke passed.
- Grafana datasource, PromQL, and dashboard provisioning checks passed.
