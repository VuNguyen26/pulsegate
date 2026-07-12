# Sprint 73 - OpenTelemetry tracing foundation

Status: Complete

Product/documentation version: `v1.13.0`

Private npm workspace versions: `0.1.0`

## Goal

Add a secure, bounded backend tracing foundation across API Gateway and Product Service while preserving every existing routing, retry, cache, authentication, quota, analytics, metrics, deployment, and source-of-truth contract.

## Implementation

### Tracing runtime contract

- Added direct OpenTelemetry API, core, and trace SDK dependencies.
- Added explicit local providers and context propagation helpers.
- Runtime sampler is AlwaysOff with no exporter.
- Test runtime is AlwaysOn with an in-memory exporter.

### API Gateway inbound tracing

- Added one SERVER span per inbound request.
- Added bounded route naming and unmatched fallback.
- Added bounded auth, rate-limit, quota, request-size, downstream, not-found, and internal-error outcomes.
- Added trace ID and span ID correlation to structured access logs.

### Downstream propagation

- Added one CLIENT span per actual fetch attempt.
- Added retry-attempt and failover attributes.
- Injected trusted `traceparent` and `tracestate` after request transformation.
- Removed configured or inbound `baggage` from outbound headers.
- Preserved zero CLIENT spans for cache hits and requests that never reach fetch.

### Product Service inbound tracing

- Added one SERVER span per request.
- Continued valid Gateway CLIENT context.
- Added bounded route-not-found and internal-error outcomes.
- Added graceful tracing flush/shutdown alongside Prisma shutdown.

## Implementation commits

- `1f71d56a46b824ada4393bd3486f14569fb0a320` - `feat(observability): add tracing contract foundation`
- `bdd7c97e2133a9deca858f36e2c64ac18c206969` - `feat(gateway): add inbound tracing foundation`
- `dca60387b214f4b690bda15147debd5e1048f78b` - `feat(gateway): propagate downstream trace context`
- `dea8f62965acad25aa91ece87fe836ff958dba86` - `feat(product): add inbound tracing foundation`

## Validation

- Admin Dashboard: 53 test files / 244 tests.
- API Gateway: 158 test files / 1160 tests.
- Developer Portal: 2 test files / 7 tests.
- Product Service: 2 test files / 8 tests.
- Root test, typecheck, build, release-readiness, and diff checks passed.
- Kustomize base and local overlay renders passed.
- Product Service and API Gateway images built successfully.
- Product Service and API Gateway migrations reported no pending migrations.
- Docker Compose Product Service health returned HTTP 200.
- Docker Compose API Gateway health returned HTTP 200.
- Gateway-to-Product-Service proxy health returned HTTP 200 with a fixed incoming W3C trace ID.
- Gateway structured access logs contained the fixed trace ID and a bounded span ID.
- Compose containers and network were removed after validation.
- Final implementation commit and origin were synchronized with a clean working tree.

## Boundaries

- No exporter, collector, backend, browser instrumentation, or global auto-instrumentation.
- No baggage propagation.
- No sensitive or unbounded attributes.
- No change to retry/failover execution budgets or non-GET replay rules.
- No new environment variable, endpoint, service, port, migration, or Kubernetes manifest.
- Kubernetes cluster runtime was not re-applied because manifests did not change.
- No private npm version bump and no Git tag.

## Next sprint

Sprint 74 - Loki logging foundation.
