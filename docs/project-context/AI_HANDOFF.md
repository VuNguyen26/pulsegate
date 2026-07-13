# AI Handoff

PulseGate is complete through Sprint 75 - Grafana observability integration.

## Canonical state

- Product/documentation version: `v1.15.0`.
- Private npm workspace versions: `0.1.0`.
- Latest implementation commit before docs: `3750bb8a30c0a5fb3a0a871523472113b21c9561`.
- Protected annotated tag `v1.0.0` remains unchanged.
- Tag object: `726feb46e62a3224f7e27d55ae4f9e74dd6b1123`.
- Tag target: `407d03678674219e7228b15f0cd7a23074493f31`.
- Sprint 75 creates no tag.
- Current sprint: Sprint 76 - Admin RBAC/Platform Security Hardening.
- Next sprint: Sprint 77 - UI Loading/Empty/Error/Responsive Polish.

## Sprint 75 implementation commits

- `d741518763e5f75d6b52dde86d0633a4317a1c26` - `feat(observability): provision grafana loki datasource`
- `788891fd4dbcd816a56b44448e874dc31829d279` - `feat(observability): add bounded grafana log views`
- `3750bb8a30c0a5fb3a0a871523472113b21c9561` - `fix(observability): poll grafana dashboard files`

## Grafana and Loki contract

- Grafana validated at version 13.1.0.
- Prometheus UID `pulsegate-prometheus`, URL `http://prometheus:9090`, default.
- Loki UID `pulsegate-loki`, URL `http://loki:3100`, non-default, provisioned read-only.
- Loki has no public host port.
- Metrics dashboard UID `pulsegate-api-gateway-overview`.
- Logs dashboard UID `pulsegate-logs-overview`.
- Logs dashboard folder `PulseGate`.
- Logs dashboard has four panels.
- Variables are `service`, `level`, and `event`.
- Log result limit is 100.
- Default range is 15 minutes.
- Dashboard provider polling interval is 30 seconds.

## Logging invariants

- Loki labels remain exactly `service`, `level`, and `event`.
- `requestId`, `traceId`, and `spanId` remain JSON body fields only.
- Do not add high-cardinality labels.
- Do not log API keys, JWTs, authorization headers, cookies, request bodies, response bodies, database URLs, Redis credentials, Secret values, arbitrary headers, or raw exception objects.
- Logs and metrics are operational signals, not business or security sources of truth.
- Application health is independent from Grafana, Loki, and Alloy.
- Existing Prometheus behavior must remain intact.

## Validation evidence

- Admin Dashboard: 53 test files / 244 tests.
- API Gateway: 162 test files / 1177 tests.
- Developer Portal: 2 test files / 7 tests.
- Product Service: 10 test files / 36 tests.
- Root release validation, typecheck, builds, k6 smoke, Compose validation, and three Kustomize renders passed.
- Grafana provisioned both datasources and both dashboards.
- Loki and Prometheus health returned `OK`.
- Gateway and Product Service correlation searches passed.
- Loki/Alloy outage independence and end-to-end recovery passed.

## Sprint 76 starting boundary

Sprint 76 is Admin RBAC/Platform Security Hardening.

Audit before patching:

- Admin API authentication middleware and route coverage.
- Admin role and permission representation.
- Admin actor attribution and trusted identity sources.
- Full-access versus read-only server-side credentials.
- Dashboard BFF credential handling.
- Browser, logs, errors, and configuration exposure.
- Fail-closed behavior for missing, invalid, or insufficient permissions.
- Tests, Compose runtime, and backward compatibility.

Preserve all existing observability and application contracts. Do not implement Sprint 77 UI polish, enterprise SSO/SAML, billing, marketplace, broad organization redesign, cloud observability, production HA logging, or a new Git tag.
