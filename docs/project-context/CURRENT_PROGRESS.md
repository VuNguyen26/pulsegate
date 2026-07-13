# Current Progress

## Canonical state after Sprint 75

- Product/documentation version: `v1.15.0`.
- Private npm workspace versions: `0.1.0`.
- Latest completed sprint: Sprint 75 - Grafana observability integration.
- Latest implementation commit before documentation finalization: `3750bb8a30c0a5fb3a0a871523472113b21c9561`.
- Protected annotated tag `v1.0.0` remains unchanged at `407d03678674219e7228b15f0cd7a23074493f31`.
- Sprint 75 creates no Git tag.
- Current sprint: Sprint 76 - Admin RBAC/Platform Security Hardening.
- Next sprint: Sprint 77 - UI Loading/Empty/Error/Responsive Polish.

## Sprint 75 implementation commits

- `d741518763e5f75d6b52dde86d0633a4317a1c26` - `feat(observability): provision grafana loki datasource`
- `788891fd4dbcd816a56b44448e874dc31829d279` - `feat(observability): add bounded grafana log views`
- `3750bb8a30c0a5fb3a0a871523472113b21c9561` - `fix(observability): poll grafana dashboard files`

## Delivered behavior

- Loki datasource UID `pulsegate-loki`, proxy access, internal URL `http://loki:3100`.
- Loki is non-default and provisioned read-only.
- Prometheus remains the default datasource.
- Existing `PulseGate API Gateway Overview` remains unchanged with five panels.
- Added `PulseGate Logs Overview`, UID `pulsegate-logs-overview`, in folder `PulseGate`.
- Added four panels and only `service`, `level`, and `event` variables.
- Logs panels are bounded to 100 lines and a 15-minute default range.
- Dashboard provider polls every 30 seconds.
- Stored Loki labels remain exactly `event`, `level`, and `service`.
- `requestId`, `traceId`, and `spanId` remain non-label JSON body fields.
- API Gateway and Product Service correlation search works through Grafana.
- Loki/Alloy outage does not affect application, Grafana, or Prometheus health.
- Loki/Alloy recovery restores end-to-end log transport.

## Validation baseline

- Admin Dashboard: 53 test files / 244 tests.
- API Gateway: 162 test files / 1177 tests.
- Developer Portal: 2 test files / 7 tests.
- Product Service: 10 test files / 36 tests.
- Root release validation, typecheck, builds, bounded k6 smoke, Compose validation, and three Kustomize renders passed.
- API Gateway, Product Service, Prometheus, and Grafana returned HTTP 200.
- Loki and Prometheus datasource health returned `OK`.
- Both PulseGate dashboards were provisioned.
- Loki has no public host-port binding.
- Outage and recovery proof passed.
- Git refs remained synchronized and the working tree remained clean.

## Preserved boundaries

- No database migration or schema change.
- No dependency, environment variable, service, or port change.
- No public Loki endpoint.
- No new Loki label.
- No sensitive credential or payload logging.
- No product-facing log explorer.
- No browser or Kubernetes workload logging.
- No trace backend or cloud observability vendor.
- No production HA, backup, or durability claim.
- No application source-of-truth change.
- No npm version bump.
- No Sprint 75 Git tag.

## Sprint 76 boundary

Sprint 76 owns Admin RBAC/Platform Security Hardening.

Begin with an exact audit of Admin authentication, authorization, roles, credentials, actor attribution, browser exposure, and fail-closed behavior. Preserve routing, quota, analytics, tracing, logging, Grafana, Loki, Alloy, and Prometheus behavior. Do not implement Sprint 77 UI polish early.

## Fixed roadmap

### Backend Portfolio v1

- Sprints 45-60 complete.
- Sprint 60 released protected annotated tag `v1.0.0`.

### Product/Platform Expansion v2

- Sprint 61 - Admin Dashboard Foundation - complete.
- Sprint 62 - Dashboard Consumers/API Keys/Usage Plans/Routes - complete.
- Sprint 63 - Dashboard Quota/Usage/Rejected Events - complete.
- Sprint 64 - Dashboard Rollup/Retention/Scheduler Panels - complete.
- Sprint 65 - Developer Portal Foundation - complete.
- Sprint 66 - Portal API Docs and API-Key Self-Service Foundation - complete.
- Sprint 67 - Host-Based Routing Foundation - complete.
- Sprint 68 - Weighted Routing Foundation - complete.
- Sprint 69 - Service Discovery Foundation - complete.
- Sprint 70 - Service Discovery Health/Failover Hardening - complete.
- Sprint 71 - Kubernetes Manifests/Deployment Foundation - complete.
- Sprint 72 - Kubernetes Runtime Validation and Deployment Docs - complete.
- Sprint 73 - OpenTelemetry Tracing Foundation - complete.
- Sprint 74 - Loki Logging Foundation - complete.
- Sprint 75 - Grafana Observability Integration - complete.
- Sprint 76 - Admin RBAC/Platform Security Hardening - current.
- Sprint 77 - UI Loading/Empty/Error/Responsive Polish - next.
- Sprint 78 - End-to-End Demo and Lightweight k6 Validation - planned.
- Sprint 79 - v2 Docs, Runbooks and Architecture Cleanup - planned.
- Sprint 80 - Product/Platform v2 Release - planned; `v2.0.0` tag.
