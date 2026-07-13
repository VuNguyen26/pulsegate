# End-to-End Demo and Lightweight k6 Validation

Date: 2026-07-13

Status: Accepted

Sprint: Sprint 78 - End-to-End Demo and Lightweight k6 Validation

## Context

PulseGate already had a public Developer Portal, a dynamic API Gateway route to Product Service health, successful-usage persistence, rejected-event persistence, Docker Compose runtime, and a lightweight k6 smoke. Sprint 78 needed coherent product evidence without inventing a new feature or turning the repository into a performance laboratory.

## Decision

Use one shared public GET flow for both the human-readable demo and the lightweight k6 smoke:

~~~text
Developer Portal /api-docs
  -> GET /api/product-service/health
  -> API Gateway
  -> Product Service /health
  -> bounded JSON response
~~~

The flow requires no API key, JWT, Admin key, seed, mutation, or fake account capability.

## Demo contract

The demo validates:

1. API Gateway `/health`.
2. Product Service `/health`.
3. Developer Portal `/api-docs`.
4. Admin Dashboard `/`.
5. Gateway-proxied Product Service health.

The summary artifact stores status and bounded response fields only. It does not store credentials or raw response bodies.

One approved demo run is expected to create exactly one successful usage event and zero rejected events.

## k6 contract

The existing k6 script remains the single smoke entry point.

- Readiness: Gateway `/health`.
- Workload: `/api/product-service/health`.
- Executor: shared iterations.
- VUs: 1.
- Iterations: 10.
- Maximum duration: 30 seconds.
- Graceful stop: 5 seconds.
- Request timeout: 2 seconds.
- Failed smoke request rate: 0.
- Smoke p95: below 1000 ms.
- Check rate: 100%.

Checks require HTTP 200, `service=product-service`, and `status=ok`.

One approved k6 run is expected to create exactly ten successful usage events and zero rejected events.

## Runtime and persistence evidence

Observed Sprint 78 evidence:

- Demo route usage count: `3 -> 4`.
- k6 route usage count: `4 -> 14`.
- Rejected-event count remained `17`.
- k6 completed 10/10 iterations and 30/30 checks.
- Smoke-phase p95 was 34.19 ms.
- Required service container IDs and image IDs remained unchanged.
- Restart counts remained zero.
- The disposable k6 container was removed.
- Release validation added no usage or rejected events.

The eleven usage events are retained as bounded evidence. No broad database cleanup is performed.

## Artifact policy

Sanitized evidence is stored outside the repository under `E:\pulsegate-artifacts`.

Tracked source must not contain:

- runtime logs
- generated summaries
- credentials
- authorization headers
- raw response bodies
- broad database dumps

## Cleanup policy

Remove only Sprint-started containers after validation. Do not delete named volumes or bounded database evidence.

## Boundaries

Sprint 78 adds no:

- product feature
- backend endpoint
- Admin mutation
- database schema or migration
- seed
- dependency
- environment variable
- Compose service
- public port
- Kubernetes resource
- npm workspace version
- Git tag

The smoke is local-only and does not establish production capacity, scalability, stress, soak, durability, availability, or SLO claims.

## Alternatives rejected

### Add a new demo-only endpoint

Rejected because it would create product behavior solely for validation.

### Use Admin or API-key lifecycle flows

Rejected because they require credentials or unsupported public ownership semantics.

### Run a broad load, stress, or soak test

Rejected because Sprint 78 requires lightweight bounded validation, not capacity engineering.

### Delete usage events after validation

Rejected because broad cleanup is riskier than retaining eleven bounded evidence rows.

### Add another k6 script

Rejected because the existing smoke entry point can express the approved flow without duplicate tooling.

## Consequences

- Demo and k6 evidence describe the same product path.
- Persistence effects are explicit and measurable.
- Runtime stability is part of acceptance.
- Artifacts remain reviewable without polluting source control.
- Sprint 79 can clean documentation without reopening Sprint 78 runtime behavior.
