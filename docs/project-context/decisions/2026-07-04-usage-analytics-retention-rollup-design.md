# Decision Record: Usage Analytics Retention and Rollup Design

Date:

- 2026-07-04

Status:

- Accepted as design direction.
- Not implemented as runtime migration in Sprint 19.

---

## Context

PulseGate now records two categories of traffic events:

- gateway.api_usage_events for successful downstream proxy/cache handler responses.
- gateway.api_rejected_events for rejected/security traffic such as failed auth, rate limits, and quota-denied requests.

gateway.api_usage_events is also the source of truth for current quota counting.

Sprint 19 added filtered usage summary APIs over gateway.api_usage_events.

The project still needs a future data lifecycle strategy because raw event tables will grow over time.

---

## Decision

Keep Sprint 19 implementation event-based and read-only for successful usage analytics.

Do not add retention jobs, aggregate rollup tables, or migrations in Sprint 19.

Use the following future direction:

1. Keep raw usage events for recent investigation.

   gateway.api_usage_events should remain useful for recent per-request investigation and quota-related audit.

2. Keep raw rejected events for recent security investigation.

   gateway.api_rejected_events should remain useful for rejected traffic drilldown and security/debug workflows.

3. Add retention later.

   A future retention job should eventually prune or archive old raw usage and rejected events after the retention window is defined.

4. Add rollups later.

   Future aggregate tables can support long-range dashboard queries, for example hourly or daily totals by consumer, API key, route, status class, and cache status.

5. Protect quota correctness.

   Any future rollup implementation must not silently change quota counting unless quota logic is explicitly redesigned and tested.

---

## Reasoning

Filtered summaries provide immediate admin analytics value without increasing schema complexity.

Retention and rollup require careful design around:

- Storage growth.
- Query performance.
- Quota correctness.
- Backfill strategy.
- Time-zone boundaries.
- Partial rollup recalculation.
- Raw-event retention windows.
- Compatibility with future dashboards.

Adding rollup tables too early would risk overbuilding before usage investigation and dashboard needs are clearer.

---

## Consequences

Current consequences:

- Usage and rejected analytics remain event-based.
- No migration is needed in Sprint 19.
- Current summary APIs query raw event tables.
- Large historical windows may become slower as event volume grows.

Future implementation should consider:

- Raw usage event listing with safe pagination.
- Cursor pagination for large event datasets.
- Retention configuration.
- Background retention job.
- Aggregate rollup schema.
- Rollup backfill command.
- Grafana panels based on rollups.
- Clear quota counting source after rollup adoption.

---

## Non-Goals

This decision does not implement:

- Retention jobs.
- Rollup tables.
- Backfill scripts.
- Dashboard panels.
- Kafka/RabbitMQ event streaming.
- Kubernetes CronJobs.
- Billing usage metering.

---

## Related Files

Usage analytics:

- apps/api-gateway/src/api-usage/api-usage-summary-query.ts
- apps/api-gateway/src/api-usage/api-usage-summary.repository.ts
- apps/api-gateway/src/api-usage/api-usage-summary.types.ts
- apps/api-gateway/src/routes/admin-api-usage.route.ts

Rejected analytics:

- apps/api-gateway/src/api-rejections/
- apps/api-gateway/src/routes/admin-api-rejection.route.ts

Docs:

- docs/sdlc/sprint-history/sprint-19.md
- docs/runbooks/api-usage-analytics.md
- docs/project-context/CURRENT_PROGRESS.md
