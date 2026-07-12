# AI Handoff

PulseGate is complete through Sprint 73 - OpenTelemetry tracing foundation.

## Canonical state

- Product/documentation version: `v1.13.0`.
- Private npm workspace versions: `0.1.0`.
- Latest implementation commit before docs: `dea8f62965acad25aa91ece87fe836ff958dba86`.
- Protected annotated tag `v1.0.0` remains unchanged: tag object `726feb46e62a3224f7e27d55ae4f9e74dd6b1123`, target `407d03678674219e7228b15f0cd7a23074493f31`.
- Sprint 73 creates no tag.
- Next sprint: Sprint 74 - Loki logging foundation.

## Sprint 73 implementation commits

- `1f71d56a46b824ada4393bd3486f14569fb0a320` - `feat(observability): add tracing contract foundation`
- `bdd7c97e2133a9deca858f36e2c64ac18c206969` - `feat(gateway): add inbound tracing foundation`
- `dca60387b214f4b690bda15147debd5e1048f78b` - `feat(gateway): propagate downstream trace context`
- `dea8f62965acad25aa91ece87fe836ff958dba86` - `feat(product): add inbound tracing foundation`

## Tracing contract

- API Gateway and Product Service use explicit local OpenTelemetry providers.
- Runtime sampling is AlwaysOff and there is no exporter, collector, or backend.
- Tests use AlwaysOn sampling with an in-memory exporter.
- W3C `traceparent` and `tracestate` are supported; `baggage` is removed and not propagated.
- Gateway creates one SERVER span per request and one CLIENT span per actual downstream fetch attempt.
- Product Service creates one SERVER span and continues valid Gateway client context.
- Cache hits and pre-proxy rejections create no downstream CLIENT spans.
- Existing GET-only retry/failover limits and non-GET no-replay remain authoritative.
- Gateway access logs include bounded `traceId` and `spanId` fields.

## Security and cardinality contract

Do not add raw credentials, API keys, JWTs, cookies, bodies, queries, headers, request IDs, consumer or API-key identifiers, admin actors, database URLs, Redis credentials, Kubernetes Secrets, raw downstream URLs, raw unmatched paths, or free-form exception messages to spans.

Span names and attributes must remain bounded by route templates, canonical service names, fixed enums, response status, bounded retry attempt, and failover Boolean.

## Source-of-truth contract

- Traces are operational diagnostics only.
- Usage and rejected-event tables remain analytics and quota truth.
- Route configuration and the runtime registry remain routing truth.
- Process-local health remains failover eligibility state.
- Prometheus remains metrics; structured logs remain request completion logs.

## Validation baseline

- Admin Dashboard: 53 test files / 244 tests.
- API Gateway: 158 test files / 1160 tests.
- Developer Portal: 2 test files / 7 tests.
- Product Service: 2 test files / 8 tests.
- Root tests, typecheck, build, release-readiness, and diff checks passed.
- Kustomize base and local overlay renders passed.
- Docker images built; migrations reported no pending work.
- Product Service health, Gateway health, and Gateway proxy health returned HTTP 200.
- Fixed W3C trace ID continuity and Gateway access-log span correlation passed.
- Docker containers/network were cleaned and Git remained synchronized.
- Kubernetes cluster runtime was not re-applied because Sprint 73 changed no manifest or workload contract.

## Sprint 74 boundary

Sprint 74 owns Loki logging foundation only.

Before patching:

- audit current structured logs, log fields, Docker, Compose, Kubernetes, Prometheus, Grafana, and tracing correlation
- preserve access-log bounded fields and existing analytics sources of truth
- define log shipping, retention, labels, and secret handling explicitly
- keep raw credentials, bodies, queries, and unbounded paths out of Loki labels and log payloads
- keep tracing exporter, service mesh, cloud lock-in, billing, marketplace, and enterprise IAM out of scope unless the fixed roadmap explicitly changes

Do not change private npm workspace versions or create a Git tag during Sprint 74 implementation.
