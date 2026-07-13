# Sprint 75 - Grafana observability integration

Status: Complete

Product/documentation version: `v1.15.0`

Private npm workspace versions: `0.1.0`

## Goal

Integrate the Sprint 74 Loki logging foundation with Grafana while preserving bounded cardinality, sensitive-data rules, Prometheus behavior, application availability, and all existing sources of truth.

## Implementation commits

- `d741518763e5f75d6b52dde86d0633a4317a1c26` - `feat(observability): provision grafana loki datasource`
- `788891fd4dbcd816a56b44448e874dc31829d279` - `feat(observability): add bounded grafana log views`
- `3750bb8a30c0a5fb3a0a871523472113b21c9561` - `fix(observability): poll grafana dashboard files`

## Delivered

- Provisioned Loki datasource `pulsegate-loki` at `http://loki:3100`.
- Kept Loki non-default and provisioned read-only.
- Preserved Prometheus as default.
- Added `PulseGate Logs Overview` in folder `PulseGate`.
- Added four bounded panels.
- Added only `service`, `level`, and `event` variables.
- Bounded logs panels to 100 lines and a 15-minute default range.
- Changed dashboard detection to 30-second polling.
- Preserved exact Loki labels `service`, `level`, and `event`.
- Preserved correlation IDs as JSON body fields only.
- Preserved the five-panel metrics dashboard.
- Proved outage isolation and logging recovery.

## Validation

- Admin Dashboard: 53 test files / 244 tests.
- API Gateway: 162 test files / 1177 tests.
- Developer Portal: 2 test files / 7 tests.
- Product Service: 10 test files / 36 tests.
- Root release validation, typecheck, builds, bounded k6 smoke, Compose validation, and three Kustomize renders passed.
- API Gateway, Product Service, Prometheus, and Grafana returned HTTP 200.
- Both datasource health checks returned `OK`.
- Both PulseGate dashboards were provisioned.
- Dashboard polling import and deletion passed.
- Gateway and Product Service correlation searches passed.
- Loki/Alloy outage independence passed.
- Fresh post-recovery logs reached Loki through Alloy.
- Loki had no public host-port binding.
- Working tree remained clean and refs remained synchronized.

## Preserved boundaries

- No migration.
- No dependency.
- No environment variable.
- No service or port.
- No new Loki label.
- No sensitive payload logging.
- No product-facing or Kubernetes workload log collection.
- No trace backend or cloud vendor.
- No production durability or HA claim.
- No application source-of-truth change.
- No npm version bump.
- No Sprint 75 Git tag.

## Next sprint

Sprint 76 - Admin RBAC/Platform Security Hardening.

Sprint 76 must begin with an exact audit of Admin authentication, authorization, roles, credentials, actor attribution, browser exposure, and fail-closed behavior. It must preserve all completed observability and application contracts.
