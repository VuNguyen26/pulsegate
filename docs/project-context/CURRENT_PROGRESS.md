# Current Progress

## Canonical state after Sprint 73

- Product/documentation version: `v1.13.0`.
- Private npm workspace versions: `0.1.0`.
- Latest completed sprint: Sprint 73 - OpenTelemetry tracing foundation.
- Latest implementation commit before documentation finalization: `dea8f62965acad25aa91ece87fe836ff958dba86`.
- Protected annotated tag `v1.0.0` remains unchanged at `407d03678674219e7228b15f0cd7a23074493f31`.
- Sprint 73 creates no Git tag.
- Next sprint: Sprint 74 - Loki logging foundation.

## Sprint 73 implementation commits

- `1f71d56a46b824ada4393bd3486f14569fb0a320` - tracing runtime contract and deterministic test seam.
- `bdd7c97e2133a9deca858f36e2c64ac18c206969` - Gateway inbound tracing and access-log correlation.
- `dca60387b214f4b690bda15147debd5e1048f78b` - per-fetch Gateway client spans and W3C downstream propagation.
- `dea8f62965acad25aa91ece87fe836ff958dba86` - Product Service inbound tracing foundation.

## Delivered behavior

- Explicit OpenTelemetry providers in API Gateway and Product Service.
- AlwaysOff runtime sampling with no exporter or collector.
- Deterministic AlwaysOn in-memory test runtime.
- Bounded Gateway and Product Service SERVER spans.
- One bounded Gateway CLIENT span per actual fetch attempt.
- W3C trace context continuation across Gateway and Product Service.
- Trusted trace-header injection after request transform.
- No baggage propagation.
- Gateway structured access-log trace/span correlation.
- Bounded error and rejection outcomes without raw exception messages.
- Preserved retry, failover, cache, auth, quota, rate-limit, analytics, metrics, and routing semantics.

## Validation baseline

- Admin Dashboard: 53 test files / 244 tests.
- API Gateway: 158 test files / 1160 tests.
- Developer Portal: 2 test files / 7 tests.
- Product Service: 2 test files / 8 tests.
- Root tests, typecheck, build, release-readiness, and diff checks passed.
- Kustomize base and local overlay renders passed.
- Backend images built with required OpenTelemetry modules.
- Product Service and API Gateway migrations reported no pending work.
- Product Service health, Gateway health, and Gateway proxy health returned HTTP 200.
- Fixed inbound trace ID and bounded Gateway access-log span ID were observed.
- Compose runtime was cleaned and Git refs remained synchronized.

## Preserved boundaries

- No runtime exporter, collector, tracing backend, browser tracing, or auto-instrumentation.
- No new environment variable, service, port, endpoint, migration, or Kubernetes manifest.
- No raw sensitive or unbounded trace attributes.
- No change to authentication, quota, billing, analytics, routing, service discovery, health, metrics, or logging sources of truth.
- Kubernetes cluster runtime was not re-applied because manifests were unchanged.
- No private npm version bump and no Sprint 73 tag.

## Fixed roadmap

- Sprint 61 - Admin Dashboard foundation - complete.
- Sprint 62 - Dashboard consumers/API keys/usage plans - complete.
- Sprint 63 - Dashboard quota/usage/rejected events - complete.
- Sprint 64 - Dashboard rollup/retention/scheduler panels - complete.
- Sprint 65 - Developer Portal foundation - complete.
- Sprint 66 - Developer Portal API docs and API-key self-service foundation - complete.
- Sprint 67 - Host-based routing foundation - complete.
- Sprint 68 - Weighted routing foundation - complete.
- Sprint 69 - Service discovery foundation - complete.
- Sprint 70 - Service discovery health/failover hardening - complete.
- Sprint 71 - Kubernetes foundation - complete.
- Sprint 72 - Kubernetes runtime validation and deployment documentation - complete.
- Sprint 73 - OpenTelemetry tracing foundation - complete.
- Sprint 74 - Loki logging foundation - next.
- Sprint 75 - Grafana observability integration.
- Sprint 76 - Platform RBAC/security hardening.
- Sprint 77 - UI state and responsive polish.
- Sprint 78 - E2E demo and bounded k6 validation.
- Sprint 79 - v2 docs, runbooks, and architecture cleanup.
- Sprint 80 - v2.0.0 release; no new feature scope.
