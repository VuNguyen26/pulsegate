# Current Progress

## Canonical state after Sprint 74

- Product/documentation version: `v1.14.0`.
- Private npm workspace versions: `0.1.0`.
- Latest completed sprint: Sprint 74 - Loki logging foundation.
- Latest implementation commit before documentation finalization: `db639c2aee1b4cf56b9209c2fb26a983d4cd8e93`.
- Protected annotated tag `v1.0.0` remains unchanged at target `407d03678674219e7228b15f0cd7a23074493f31`.
- Protected annotated tag object remains `726feb46e62a3224f7e27d55ae4f9e74dd6b1123`.
- Sprint 74 creates no Git tag.
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

## Delivered behavior

- Bounded structured runtime logging for API Gateway and Product Service.
- Fixed event names and allowlisted operational fields for access, error, dependency, authentication, retry, rate-limit, tracing lifecycle, startup, shutdown, and runtime-route loader logs.
- Automatic Fastify request logging disabled in both backend services.
- Custom completion logs include bounded method, route template, status code, duration, request ID, trace ID, and span ID fields.
- Free-form errors, raw exception messages, credentials, bodies, queries, raw unmatched paths, downstream URLs, API keys, JWTs, database URLs, Redis credentials, and Kubernetes Secrets are excluded.
- Loki 3.7.3 added as an internal local Docker Compose logging backend.
- Grafana Alloy 1.17.1 collects Docker stdout for API Gateway and Product Service only.
- Alloy parses JSON logs and permits exactly `service`, `level`, and `event` as Loki labels.
- Request, trace, and span identifiers remain in the log body and never become Loki labels.
- Loki has no public host port.
- Loki uses local filesystem storage for bounded local/development validation only.
- Application startup and health remain independent of Loki and Alloy availability.
- Existing tracing, metrics, routing, failover, authentication, quota, cache, analytics, and persistence semantics remain unchanged.

## Validation baseline

- Admin Dashboard: 53 test files / 244 tests.
- API Gateway: 162 test files / 1177 tests.
- Developer Portal: 2 test files / 7 tests.
- Product Service: 10 discovered test files / 36 tests, including compiled `dist` mirrors present during the full workspace run.
- Full workspace tests passed.
- Full workspace typecheck passed.
- Full workspace production build passed.
- Docker Compose configuration validation passed.
- API Gateway and Product Service health returned HTTP 200.
- Loki readiness returned `ready`.
- Alloy readiness returned `Alloy is ready`.
- Product Service reported 1 migration with no pending migration.
- API Gateway reported 11 migrations with no pending migration.
- Kustomize base render contained 13 resources.
- Kustomize local bootstrap render contained 10 resources.
- Kustomize local applications render contained 13 resources.
- Kubernetes context remained `docker-desktop`, but its API server was unreachable; no cluster apply was attempted.
- Gateway and Product Service Loki streams contained exactly `event`, `level`, and `service`.
- Correlated request, trace, and span identifiers remained in JSON log bodies.
- Both applications remained healthy with Loki and Alloy stopped.
- Loki and Alloy restarted successfully.
- Git refs remained synchronized and the working tree remained clean.

## Preserved boundaries

- No Grafana Loki datasource, log dashboard, log panel, or operator log UI; those remain Sprint 75 scope.
- No tracing exporter, collector, Tempo, Jaeger, Zipkin, or cloud telemetry vendor.
- No browser, Dashboard, or Developer Portal log collection.
- No Kubernetes logging agent, DaemonSet, Sidecar, ServiceAccount, RBAC, Secret, Service, port, or manifest change.
- No production high-availability, durable storage, backup, restore, compaction, sizing, or retention claim for Loki.
- No database schema or migration was added.
- No npm workspace version changed.
- No Git tag was created.
- Logging remains an operational signal and is not a routing, authentication, quota, billing, analytics, or health source of truth.

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
- Sprint 74 - Loki logging foundation - complete.
- Sprint 75 - Grafana observability integration - next.
- Sprint 76 - Platform RBAC/security hardening.
- Sprint 77 - UI state and responsive polish.
- Sprint 78 - E2E demo and bounded k6 validation.
- Sprint 79 - v2 docs, runbooks, and architecture cleanup.
- Sprint 80 - v2.0.0 release; no new feature scope.
