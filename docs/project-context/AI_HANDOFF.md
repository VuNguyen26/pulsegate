# AI Handoff

PulseGate is complete through Sprint 74 - Loki logging foundation.

## Canonical state

- Product/documentation version: `v1.14.0`.
- Private npm workspace versions: `0.1.0`.
- Latest implementation commit before docs: `db639c2aee1b4cf56b9209c2fb26a983d4cd8e93`.
- Protected annotated tag `v1.0.0` remains unchanged: tag object `726feb46e62a3224f7e27d55ae4f9e74dd6b1123`, target `407d03678674219e7228b15f0cd7a23074493f31`.
- Sprint 74 creates no tag.
- Next sprint: Sprint 75 - Grafana observability integration.

## Sprint 74 implementation commits

- `47b2d616d83602a09316aa26da3fa8b0354749bf` - `feat(observability): bound request correlation ids`
- `f5bd45210eba58387481be0560a61d68a487047a` - `feat(logging): bound gateway access logs`
- `c05d1e08746565d032ec8268f6a66862950576a7` - `feat(logging): add bounded gateway error logs`
- `633f7afbaba520988217cb8f1e423bdec3532249` - `feat(logging): add bounded product error logs`
- `62d40f359e3b1b20a8dedd3067dc5dac68b27943` - `feat(logging): bound runtime dependency errors`
- `29392daae26ff4414d12dfd293a2c967aedf69dd` - `feat(logging): bound gateway lifecycle logs`
- `b97c45f233192128570c300b873b38d0e3151dff` - `feat(logging): bound product lifecycle logs`
- `0bc993c48b602faa26439f036151ca87a0655014` - `feat(logging): bound jwt rejection logs`
- `1f8af94499660516de0d6288b12c24a17d224bcb` - `feat(logging): bound proxy recorder errors`
- `d20dec7a68361599050dbec44c4fb21163b070d2` - `feat(logging): bound response cache errors`
- `06bf1d80848385d2498df23b070c262c763cfaa2` - `feat(logging): disable gateway automatic request logs`
- `3430a1532c43d8f410c870231c45b2187fed6d15` - `feat(logging): add bounded product access logs`
- `e5536b46a74d86b587253e6944a39773238ef5f0` - `feat(observability): add loki logging transport`
- `0ab687d249400ddfc7b5a33e7ca06467a306ee8f` - `feat(logging): bound tracing lifecycle logs`
- `148584bb1627a5086b13082f6030c123cfa72e49` - `feat(logging): bound missing rate-limit identifier logs`
- `ef496693c465163a0fef2a2820af4bfd0c3f229d` - `feat(logging): bound retry-exhausted downstream logs`
- `db639c2aee1b4cf56b9209c2fb26a983d4cd8e93` - `feat(logging): structure runtime route loader logs`

## Logging contract

- API Gateway and Product Service emit bounded structured JSON runtime logs.
- Automatic Fastify request logging is disabled.
- Custom access logs use fixed event `http_request_completed`.
- Runtime error, rejection, lifecycle, dependency, retry, rate-limit, tracing, and route-loading paths use fixed events and bounded error codes.
- Free-form exception content is not written to operational logs.
- Request IDs, trace IDs, and span IDs remain correlation fields in JSON bodies.
- Correlation identifiers must never become Loki labels.
- Loki label allowlist is exactly `service`, `level`, and `event`.
- Raw paths, raw URLs, client-controlled identifiers, credentials, bodies, query strings, API keys, JWTs, database URLs, Redis credentials, and Kubernetes Secrets must not become labels or log payload fields.

## Transport contract

    API Gateway / Product Service
      -> Pino-compatible JSON on stdout
      -> Grafana Alloy Docker discovery
      -> JSON parsing and bounded label extraction
      -> Loki local filesystem storage

- Alloy collects only containers named `pulsegate-api-gateway` and `pulsegate-product-service`.
- Loki is reachable only inside the Compose network.
- Logging backend failure must not fail application startup, request processing, or health endpoints.
- Loki filesystem storage is local/development evidence, not a production durability or retention claim.

## Source-of-truth contract

- Logs and traces are operational diagnostics only.
- Prometheus remains the metrics signal path.
- Usage and rejected-event tables remain analytics and quota truth.
- Route configuration and the runtime registry remain routing truth.
- Process-local service health remains failover eligibility state.
- Authentication and authorization remain enforced by existing middleware and stored configuration.

## Validation baseline

- Admin Dashboard: 53 test files / 244 tests.
- API Gateway: 162 test files / 1177 tests.
- Developer Portal: 2 test files / 7 tests.
- Product Service: 10 discovered files / 36 tests, including compiled `dist` mirrors.
- Full workspace test, typecheck, build, Compose configuration, and diff checks passed.
- Product Service and API Gateway migrations reported 1 and 11 migrations respectively, with no pending work.
- Kustomize renders passed with 13 base, 10 local bootstrap, and 13 local application resources.
- Kubernetes context `docker-desktop` was configured but unreachable; no cluster apply was attempted.
- Gateway and Product health returned HTTP 200.
- Loki and Alloy readiness passed.
- Loki streams contained only `event`, `level`, and `service`.
- Request, trace, and span correlation remained in JSON bodies.
- Both backend services remained healthy while Loki and Alloy were stopped.
- Logging services restarted successfully.
- Repository refs remained synchronized and clean.

## Sprint 75 boundary

Sprint 75 owns Grafana observability integration.

Before patching:

- audit current Grafana provisioning, Prometheus datasource, dashboards, Loki endpoint, and Compose dependencies
- preserve the exact Loki label allowlist
- preserve correlation identifiers as body fields only
- design bounded Loki queries before adding panels or exploration links
- keep raw log content, credentials, bodies, queries, raw paths, and client-controlled values out of labels
- keep Grafana, Loki, Prometheus, logs, metrics, and traces outside authentication, routing, quota, billing, and analytics sources of truth
- preserve application independence from observability backend availability
- do not add cloud vendor lock-in, production HA claims, billing, marketplace, or enterprise IAM scope

Do not change private npm workspace versions or create a Git tag during Sprint 75 implementation.
