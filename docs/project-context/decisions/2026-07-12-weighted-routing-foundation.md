# Weighted Routing Foundation Decision

## Date

2026-07-12

## Sprint

Sprint 68 - Weighted routing foundation

## Status

Accepted

## Context

PulseGate completed exact host-based route identity in Sprint 67. Each selected route still had one `downstreamUrl`.

Sprint 68 needed a bounded weighted-routing foundation without beginning service discovery, health checks, failover, sticky sessions, Kubernetes traffic splitting, or a general load-balancing platform.

The existing shared proxy pipeline already owns authentication, quota, rate limiting, caching, transforms, timeout, retry, analytics, metrics, and access logging. Weighted selection needed to preserve that pipeline and existing route compatibility.

## Decision

### Representation

Keep `downstreamUrl` as the primary and legacy single-upstream target.

Add optional route-owned metadata:

```ts
type WeightedUpstream = {
  downstreamUrl: string;
  weight: number;
};
```

### Validation

A weighted set:

- contains 2-8 entries
- uses unique HTTP or HTTPS URLs
- uses integer weights from 1 through 1000
- treats weights as relative values
- does not require a sum of 100
- includes the primary `downstreamUrl` exactly once

Invalid configuration fails closed.

### Selection

- Resolve exact-host/path-only route identity first.
- Check cache before selection.
- Select one configured target on a cache miss.
- Use cumulative relative weights.
- Allow an injected random source for deterministic tests.
- Do not consume request headers, query values, request IDs, API keys, consumer IDs, or client-selected values.
- Reuse the selected target across retries.

This is weighted routing, not failover.

### Persistence

Use nullable JSONB:

```prisma
weightedUpstreams Json? @map("weighted_upstreams")
```

SQL `NULL` preserves legacy single-upstream behavior.

Admin semantics:

- create omission or null -> single-upstream mode
- update omission -> preserve
- update null -> clear
- update array -> replace

The repository uses `Prisma.DbNull` for explicit clearing.

### Dashboard

Expose weighted metadata through the existing read-only route registry view.

Validate the same bounded rules and render the mode, target count, URLs, and weights.

Do not add mutation or traffic-control UI.

## Consequences

Positive:

- Existing routes remain compatible.
- Weighted selection stays inside the existing security and policy pipeline.
- Host and path identity remain unchanged.
- Persistence and runtime reload are explicit and testable.
- Dashboard operators can inspect configuration safely.
- The model is bounded and ready for future discovery work without pretending discovery exists.

Limitations:

- No upstream health awareness.
- No automatic failover.
- No sticky routing.
- No retry target rotation.
- No distributed coordination.
- No per-upstream Prometheus label dimension.
- No service discovery.
- No Kubernetes traffic management.

## Validation

- API Gateway: 147 test files / 1059 tests.
- Admin Dashboard: 53 test files / 243 tests.
- Developer Portal: 2 test files / 7 tests.
- Prisma validation passed.
- Root tests, typecheck, and build passed.
- Compose validation passed.
- PostgreSQL migration and legacy compatibility passed.
- Bounded Admin/runtime create, reload, proxy, clear, single-upstream, delete, and cleanup probe passed.

## Follow-up

Sprint 69 may design service discovery foundations against this bounded route model.

Sprint 70 remains responsible for health and failover hardening.
