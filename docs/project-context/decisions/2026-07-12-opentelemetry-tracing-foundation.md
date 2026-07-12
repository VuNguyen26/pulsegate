# Decision Record: OpenTelemetry tracing foundation

Date: 2026-07-12

Status: Accepted

## Context

PulseGate already had request IDs, structured access logs, bounded Prometheus metrics, configured service discovery, retry/failover, Docker Compose, and Kubernetes deployment artifacts. Sprint 73 needed distributed request correlation across API Gateway and Product Service without introducing an exporter platform, vendor lock-in, auto-instrumentation risk, sensitive telemetry, or new runtime exposure.

## Decision

Use bounded manual OpenTelemetry instrumentation with explicit local providers in API Gateway and Product Service.

- Pin direct dependencies to `@opentelemetry/api@1.9.1`, `@opentelemetry/core@2.9.0`, and `@opentelemetry/sdk-trace-base@2.9.0`.
- Use an AlwaysOff runtime sampler and no exporter or collector.
- Use an AlwaysOn in-memory test provider for deterministic assertions.
- Support only W3C `traceparent` and `tracestate`.
- Remove and never propagate `baggage`.
- Create one Gateway SERVER span per inbound request.
- Create one Gateway CLIENT span per actual downstream fetch attempt.
- Create one Product Service SERVER span per inbound request.
- Inject trusted downstream context after request-header transformation.
- Add bounded trace ID and span ID fields to Gateway access logs.
- Keep span names and attributes strictly allowlisted and bounded.

## Rationale

Manual instrumentation keeps the tracing boundary reviewable and avoids global monkey-patching. A CLIENT span per actual fetch preserves retry and failover evidence. AlwaysOff runtime sampling avoids hidden storage and export cost before an approved backend exists. Post-transform propagation prevents configuration from forging trusted trace context. Strict attribute allowlists protect credentials and prevent cardinality growth.

## Consequences

- Runtime trace continuity exists but spans are not exported or persisted.
- Tests can prove parent-child relationships, propagation, retry/failover behavior, cache behavior, and sensitive-data exclusion.
- A future exporter or collector must be a separate explicit decision.
- Loki and Grafana integration remain Sprint 74 and Sprint 75 work.
- Kubernetes deployment artifacts remain unchanged.

## Security and cardinality rules

Never record raw API keys, hashes, JWTs, Authorization, Cookie, session data, request or response bodies, raw queries, raw headers, request IDs, consumer IDs, API-key IDs, admin actors, database URLs, Redis credentials, Kubernetes Secrets, raw downstream URLs, raw unmatched paths, or free-form exception messages.

## Validation evidence

- API Gateway: 158 test files / 1160 tests.
- Product Service: 2 test files / 8 tests.
- Root tests, typecheck, build, and release-readiness passed.
- Backend images built and started.
- Migrations reported no pending work.
- Three bounded Docker Compose HTTP surfaces returned 200.
- A fixed W3C trace ID continued into Gateway access logs with a bounded span ID.
- Kustomize renders passed; cluster runtime was not re-applied because manifests did not change.
