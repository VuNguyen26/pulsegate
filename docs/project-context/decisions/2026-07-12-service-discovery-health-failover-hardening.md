# Decision: Bounded process-local service discovery health and failover

## Date

2026-07-12

## Sprint

Sprint 70 - Service discovery health/failover hardening

## Context

Sprint 69 introduced trusted route-owned service discovery without health observation or retry-to-another-instance behavior.

Sprint 70 needed failure handling while preserving route identity, legacy compatibility, the shared proxy pipeline, GET-only retries, non-GET replay protection, bounded configuration, fail-closed security, and low metric cardinality.

## Decision

Use a bounded process-local service-instance health registry beside the runtime route registry.

### Identity and bounds

```txt
serviceName + canonical baseUrl
```

- 64 services
- 8 instances per service
- 512 health entries

### Failure and recovery

- Two consecutive qualifying failures enter a 30-second cooldown.
- Network failures, timeouts, and downstream 5xx responses qualify.
- Any HTTP response below 500 records transport success and resets health.
- Post-cooldown selection acts as a recovery probe.
- Valid reload preserves unchanged identities, initializes new identities, and prunes removed identities.
- Invalid reload preserves previous routing and health.
- Process restart resets health.

### Selection and failover

- Direct discovery filters eligible instances and selects uniformly.
- Weighted discovery filters ineligible origins and preserves remaining relative weights.
- Failed targets are excluded from later attempts in the same request.
- Failover uses only the existing GET retry policy.
- Non-GET requests execute once.
- Retry attempts are capped at 7.
- Total executions are capped at 8.
- No eligible target fails closed.
- Legacy routes without `serviceInstances` preserve previous behavior.

### Security and observability

- Client input cannot select or reset an instance.
- Raw instance URLs are absent from error envelopes and metric labels.
- No unbounded instance-level metric dimension is introduced.

## Rejected alternatives

- Active background polling: introduces scheduling and lifecycle scope.
- Database or Redis health persistence: requires a wider distributed ownership design.
- External registry: adds control-plane dependencies outside Sprint 70.
- General circuit breaker: adds broader admission and half-open semantics.
- Retry all methods: risks duplicated non-idempotent side effects.
- Change legacy weighted retries: violates Sprint 68 compatibility.

## Consequences

Positive:

- Failed configured instances can be bypassed during GET retries.
- Direct and weighted discovery share one bounded health contract.
- Existing persistence requires no schema change.
- Existing retry and proxy pipelines remain authoritative.

Tradeoffs:

- Health is independent per Gateway process.
- Restart resets health.
- Recovery occurs only after cooldown when traffic selects the instance.
- Failover depth is limited by the retry budget.

## Validation

- API Gateway: 155 test files / 1140 tests.
- Targeted retry and discovery failover coverage.
- Typecheck and production build.
- Active retry attempts above 7: 0.
- Runtime JSONB roundtrip, failover, cooldown, fail-closed response, no raw URL disclosure, soft deletion, runtime removal, and clean-tree validation.

## Deferred work

- Sprint 71: Kubernetes foundation.
- Sprint 72: Kubernetes runtime validation and deployment docs.
- Sprint 73: OpenTelemetry.
- Sprint 74: Loki.
- Sprint 75: Grafana integration.
- Sprint 80: v2.0.0 release.
