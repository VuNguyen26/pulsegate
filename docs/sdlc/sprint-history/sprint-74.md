# Sprint 74 - Loki logging foundation

Status: Complete

Product/documentation version: `v1.14.0`

Private npm workspace versions: `0.1.0`

## Goal

Add bounded centralized backend logging for API Gateway and Product Service while preserving application availability, correlation safety, low-cardinality labels, and all existing routing, security, quota, analytics, tracing, and deployment contracts.

## Delivered

- Bounded request correlation identifiers.
- Bounded Gateway and Product Service access logs.
- Fixed events and error codes for Gateway and Product Service error paths.
- Bounded runtime dependency, lifecycle, JWT, recorder, cache, rate-limit, tracing lifecycle, retry-exhausted, and runtime-route loader logs.
- Automatic Fastify request logging disabled in both services.
- Pino-compatible structured bootstrap route-loader logs.
- Loki 3.7.3 local logging backend.
- Grafana Alloy 1.17.1 Docker log collection.
- Collection limited to API Gateway and Product Service.
- Loki labels limited to `service`, `level`, and `event`.
- Correlation identifiers retained in log bodies only.
- No public Loki host port.
- Local filesystem storage with explicit local/development limitations.
- Application availability independent from logging backend availability.

## Implementation commits

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

## Validation

- Admin Dashboard: 53 test files / 244 tests.
- API Gateway: 162 test files / 1177 tests.
- Developer Portal: 2 test files / 7 tests.
- Product Service: 10 discovered test files / 36 tests, including compiled `dist` mirrors present during validation.
- Full workspace tests passed.
- Full workspace typecheck passed.
- Full workspace production build passed.
- Docker Compose configuration passed.
- Gateway and Product Service returned HTTP 200.
- Loki returned `ready`.
- Alloy returned `Alloy is ready`.
- Product Service found 1 migration and reported no pending migrations.
- API Gateway found 11 migrations and reported no pending migrations.
- Kustomize resource counts were 13 base, 10 local bootstrap, and 13 local applications.
- Kubernetes context was `docker-desktop`, but its API server refused the connection; no apply was attempted.
- Gateway and Product Service streams used exactly `event`, `level`, and `service`.
- Gateway and Product Service access-log bodies contained request ID, trace ID, and span ID.
- No correlation identifier became a label.
- Gateway and Product Service remained healthy while Loki and Alloy were stopped.
- Loki and Alloy recovered after restart.
- Git refs remained synchronized and the working tree remained clean.

## Boundaries

- No Grafana Loki datasource, dashboard, log panel, or operator log UI.
- No client-side, Admin Dashboard, or Developer Portal log collection.
- No Kubernetes logging DaemonSet, Sidecar, ServiceAccount, RBAC, Secret, Service, port, or manifest change.
- No tracing exporter or tracing backend.
- No raw credentials, bodies, queries, headers, paths, URLs, exception messages, API keys, JWTs, database URLs, Redis credentials, or Kubernetes Secrets in the logging contract.
- No request, trace, or span identifier labels.
- No production high-availability, durable storage, backup, restore, retention, sizing, or cloud logging claim.
- No database schema or migration change.
- No routing, health, retry, authentication, quota, cache, analytics, metrics, or tracing source-of-truth change.
- No private npm version bump.
- No Sprint 74 Git tag.

## Next sprint

Sprint 75 - Grafana observability integration.
