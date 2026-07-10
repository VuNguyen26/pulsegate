# AI Handoff

## Current Version

- v0.60.0

## Latest Completed Sprint

- Sprint 59 - Observability + Grafana/k6 lightweight validation

## Latest Implementation Commit Before Docs Finalization

- `c9da0cb feat(observability): refine gateway Grafana dashboard`

## Sprint 59 Summary

Sprint 59 completed a lightweight observability hardening and reproducible demo-validation pass.

Implementation commits:

- `ec09747 fix(gateway): bound unmatched metrics route labels`
- `3f5c428 test(observability): add bounded k6 gateway smoke`
- `c9da0cb feat(observability): refine gateway Grafana dashboard`

Key outcomes:

- Matched requests continue to use bounded Fastify route templates in Prometheus labels.
- Unmatched requests use `route="__unmatched__"` instead of raw request paths.
- Existing metric names remain unchanged:
  - `http_requests_total`
  - `http_request_duration_seconds`
  - `http_response_cache_total`
- Existing labels remain bounded to method, route template/fixed unmatched value, status code, and allowlisted cache status.
- `npm run test:k6:smoke` runs through the Docker Compose `tools` profile.
- k6 is limited to 1 VU, 10 iterations, 30 seconds, 5-second graceful stop, and 2-second request timeout.
- The Grafana dashboard now has five real Prometheus-backed panels.
- Request-rate, request-count, and p95-latency panels exclude `/metrics` scrape traffic.
- A `5xx Responses (5m)` stat panel uses the existing HTTP request counter.
- Prometheus scrape, Grafana datasource, dashboard provisioning, PromQL, and k6 runtime behavior were validated.

Validation before docs finalization:

- 136 test files / 988 tests passed.
- Typecheck passed.
- Build passed.
- Whitespace diff check passed.
- API Gateway health: `200`.
- Prometheus readiness: `200`.
- Prometheus gateway target: `up`.
- Unmatched route metric aggregation: passed.
- Raw unmatched paths absent from metric output: passed.
- k6: 10/10 iterations, 20/20 checks, 0% failures, thresholds passed.
- Grafana database: `ok`.
- Grafana Prometheus datasource: `OK`.
- Five dashboard queries: passed.
- Provisioned dashboard panel count: 5.

## Important Observability Interpretation

- Prometheus metrics and Grafana panels are operational signals only.
- They are not quota-counting or analytics-persistence sources of truth.
- `gateway.api_usage_events` remains the source of truth for successful usage and quota counting.
- `gateway.api_rejected_events` remains the source of truth for rejected/security traffic.
- The `__unmatched__` label intentionally trades raw-path detail for bounded metric cardinality.
- k6 is a local bounded smoke check, not a production load-test laboratory.

## Safety Boundaries

Do not open these without explicit approval:

- Retention execute command, delete API, or scheduled delete job.
- Operator-facing `deleteCandidates`.
- Prisma retention delete execution wiring.
- Raw event deletion.
- Quota-source changes.
- Background execute or external scheduler execution.
- Admin Dashboard UI before Sprint 61.
- Developer Portal UI before Sprint 65.
- OpenTelemetry before Sprint 73.
- Loki before Sprint 74.
- Kubernetes before Sprint 71.
- Billing, marketplace, enterprise SSO/SAML, or multi-tenant organization expansion before roadmap.

## Next Recommended Sprint

Sprint 60 - Final polish, docs, demo script, architecture cleanup, release v1.0.0.

Recommended scope:

- Compact stale live documentation where practical.
- Add or refine a reproducible end-to-end demo script.
- Perform architecture and naming cleanup only where low risk.
- Run final test/typecheck/build/Docker validation.
- Prepare v1.0.0 release documentation and tag only after a clean final validation.
- Do not add a major new runtime feature.

## Fixed Roadmap

Backend Portfolio v1:

- Sprint 45-59: complete.
- Sprint 60: final polish and v1.0.0 release.

Product/Platform Expansion v2:

- 61 Admin Dashboard foundation
- 62 Dashboard consumers/API keys/usage plans
- 63 Dashboard quota/usage/rejected events
- 64 Dashboard rollup/retention/scheduler panels
- 65 Developer Portal foundation
- 66 Developer Portal API docs/key self-service foundation
- 67 Host-based routing
- 68 Weighted upstream routing
- 69 Service discovery foundation
- 70 Service discovery health/failover
- 71 Kubernetes foundation
- 72 Kubernetes runtime validation/docs
- 73 OpenTelemetry foundation
- 74 Loki foundation
- 75 Grafana observability integration
- 76 Platform RBAC/security hardening
- 77 UI state/responsive polish
- 78 E2E demo and bounded k6 validation
- 79 v2 docs/runbooks/architecture cleanup
- 80 v2.0.0 release

## Required Docs Checklist at Sprint Finalization

Always audit/update:

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/AI_HANDOFF.md
- docs/project-context/DECISION_LOG.md
- relevant runbooks
- docs/sdlc/sprint-history/sprint-N.md
- docs/project-context/decisions/YYYY-MM-DD-*.md
