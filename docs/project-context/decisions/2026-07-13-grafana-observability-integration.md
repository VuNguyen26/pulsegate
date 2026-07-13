# Decision: Bounded Grafana observability integration

Date: 2026-07-13

Status: Accepted

## Context

Sprint 74 established bounded structured stdout collection from API Gateway and Product Service through Grafana Alloy into Loki. Grafana already contained the default Prometheus datasource and five-panel metrics dashboard, but no Loki datasource or bounded log visualization.

Sprint 75 needed local operator access without public Loki exposure, high-cardinality labels, sensitive payloads, product-facing log explorers, or new sources of truth.

Docker Desktop bind mounts also required deterministic dashboard detection rather than reliance on filesystem watch events.

## Decision

- Provision Loki datasource name `Loki`, UID `pulsegate-loki`.
- Use proxy access to `http://loki:3100`.
- Keep Loki non-default and provisioned read-only.
- Preserve Prometheus as the default datasource.
- Preserve the existing metrics dashboard.
- Add `PulseGate Logs Overview`, UID `pulsegate-logs-overview`, in folder `PulseGate`.
- Add four panels for log volume, higher-severity logs, structured logs, and correlation/security guidance.
- Limit stored labels and dashboard variables to `service`, `level`, and `event`.
- Keep `requestId`, `traceId`, and `spanId` in JSON bodies only.
- Limit logs panels to 100 lines and use a 15-minute default range.
- Set dashboard provider polling to 30 seconds.
- Keep application behavior independent from Grafana, Loki, and Alloy availability.

## Consequences

Operators can inspect Gateway and Product Service logs from Grafana without exposing Loki publicly. Existing Prometheus behavior remains unchanged. Correlation remains possible without high-cardinality labels. Docker Desktop detects dashboard file changes through polling. Logging-backend outages remain isolated from applications.

This local Loki deployment does not claim production durability, HA, backup, restore, retention sizing, alerting, SLOs, browser collection, Kubernetes workload collection, tracing storage, or cloud observability.

## Validation

- Grafana 13.1.0 provisioned both datasources and both dashboards.
- Dashboard polling imported and deleted a temporary dashboard without a second restart.
- Log volume and structured-log queries returned data.
- Higher-severity query executed successfully with a valid empty result.
- Gateway and Product Service correlation body searches passed.
- Loki/Alloy outage left applications, Grafana, and Prometheus healthy.
- Fresh logs reached Loki after recovery.
- Loki labels remained exactly `event`, `level`, and `service`.
- Loki retained no host-port binding.
- Root release validation, k6 smoke, Compose validation, and Kustomize renders passed.
