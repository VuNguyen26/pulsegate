# Use bounded stdout collection with Alloy and Loki

Date: 2026-07-13

Status: Accepted

## Context

PulseGate already had bounded Prometheus metrics, explicit OpenTelemetry trace correlation, structured Gateway access logs, Docker Compose, Grafana, and Kubernetes deployment artifacts.

Sprint 74 needed a local centralized logging foundation without allowing high-cardinality labels, sensitive payloads, observability backend outages, or a new cloud control plane to affect application behavior.

## Decision

- Normalize API Gateway and Product Service operational logs as bounded JSON.
- Disable automatic Fastify request logging and retain one explicit bounded completion event per request.
- Use fixed event names and bounded error codes for runtime error, dependency, authentication, lifecycle, retry, rate-limit, tracing, and route-loader logs.
- Keep request ID, trace ID, and span ID in JSON bodies for correlation.
- Never use request ID, trace ID, span ID, raw path, URL, client identity, credential, or free-form error text as Loki labels.
- Permit exactly three Loki labels:
  - `service`
  - `level`
  - `event`
- Collect only API Gateway and Product Service Docker stdout through Grafana Alloy.
- Send Alloy output to Loki over the internal Compose network.
- Do not publish Loki on a host port.
- Use Loki filesystem storage only for bounded local/development validation.
- Keep application availability independent from Loki and Alloy.
- Defer Grafana Loki datasource and log visualization to Sprint 75.

## Reason

A three-label allowlist gives useful service, severity, and event filtering without creating per-request or client-controlled stream cardinality.

Using structured stdout preserves normal container behavior and avoids adding Loki clients or blocking network dependencies inside the applications.

Alloy provides a separate collection boundary that can stop or fail without changing Gateway or Product Service request behavior.

Internal-only Loki exposure and local filesystem storage are appropriate for the current local portfolio runtime, while avoiding false production durability or high-availability claims.

## Consequences

- Operators can query bounded backend logs centrally through Loki APIs.
- Correlation requires searching JSON bodies by request, trace, or span ID rather than selecting those values as labels.
- Loki and Alloy outages do not make the applications unavailable.
- Local Loki data is not claimed to be durable, backed up, highly available, or production sized.
- Browser applications and Kubernetes workloads are not collected in Sprint 74.
- Grafana has no Loki datasource or log dashboard until Sprint 75.
- Logs remain operational evidence only and cannot become authentication, routing, quota, billing, health, or analytics truth.
- No database migration, Kubernetes manifest, npm workspace version, or Git tag is introduced.

## Validation

- Full workspace tests, typecheck, build, Compose configuration, and diff checks passed.
- Gateway and Product Service health returned HTTP 200.
- Loki and Alloy readiness passed.
- Both services produced streams with exactly `event`, `level`, and `service`.
- Request, trace, and span identifiers remained in JSON log bodies.
- Applications remained healthy while Loki and Alloy were stopped.
- Logging services recovered after restart.
- Product Service and Gateway migrations had no pending work.
- Kustomize renders passed.
- Kubernetes API was unreachable, so no cluster apply was performed.

## References

- `docs/runbooks/observability-validation.md`
- `docs/sdlc/sprint-history/sprint-74.md`
- `docs/project-context/CURRENT_PROGRESS.md`
