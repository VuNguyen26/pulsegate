# AI Handoff

PulseGate is complete through Sprint 76 - Admin RBAC/Platform Security Hardening.

## Canonical state

- Product/documentation version: `v1.16.0`.
- Private npm workspace versions: `0.1.0`.
- Latest implementation commit before docs: `9cd147d0565be99ddfc1c20b815f9fb230b8f67f`.
- Sprint 75 documentation baseline: `e62ce96b4502ee5b71aa88185de906e0d2ed5b11`.
- Protected annotated tag `v1.0.0` remains unchanged.
- Tag object: `726feb46e62a3224f7e27d55ae4f9e74dd6b1123`.
- Tag target: `407d03678674219e7228b15f0cd7a23074493f31`.
- Sprint 76 creates no tag.
- Current sprint: Sprint 77 - UI Loading/Empty/Error/Responsive Polish.
- Next sprint: Sprint 78 - End-to-End Demo and Lightweight k6 Validation.

## Sprint 76 implementation commits

- `fce89f224e81335ae78024a22be89cf784c9b6cb` - `fix(security): trust authenticated admin actor context`
- `d82af694b0642de6a2efd5771bf2dc21f1df5c9e` - `test(security): lock admin authorization matrix`
- `9cd147d0565be99ddfc1c20b815f9fb230b8f67f` - `test(dashboard): lock admin credential boundary`

## Admin security invariants

- Every exact `/internal/admin` route and descendant must register the marked Admin API-key authentication middleware.
- Current matrix: 29 routes total, 18 read and 11 mutation routes.
- Missing credential: `401 ADMIN_API_KEY_MISSING`.
- Invalid credential: `403 ADMIN_API_KEY_INVALID`.
- Read-only mutation: `403 ADMIN_API_KEY_READ_ONLY`.
- Full-access and read-only keys must be non-empty when enabled and must differ.
- Credential comparison remains timing-safe through the API-key hashing helper.
- Caller-controlled `x-admin-actor` is ignored for authenticated identity.
- Full-access actor is `admin-api-key`.
- Read-only actor is `admin-read-only-api-key`.
- Trusted authentication context is request-local and stored outside client-controlled request data.

## Dashboard credential invariants

- Dashboard has 18 fixed GET-only BFF resources.
- No catch-all Admin proxy.
- Dashboard uses only `ADMIN_READ_ONLY_API_KEY` server-side.
- Full-access `ADMIN_API_KEY` must remain absent from Dashboard runtime, browser code, HTML, responses, bundles, and logs.
- No browser-stored Admin credential and no Dashboard mutation control.

## Validation evidence

- Admin Dashboard: 54 test files / 248 tests.
- API Gateway: 163 test files / 1177 tests.
- Developer Portal: 2 test files / 7 tests.
- Product Service: 10 test files / 36 tests.
- Root release validation, typecheck, builds, diff checks, clean-tree verification, and origin synchronization passed.
- Runtime authorization and Dashboard boundary proofs passed.
- Admin credential reflection and Gateway log exposure checks passed.
- Runtime proof created no source or database mutation.

## Observability invariants

- Preserve existing Prometheus, Grafana, Loki, Alloy, tracing, and logging behavior.
- Application/Alloy-configured Loki labels remain `service`, `level`, and `event`.
- Loki label discovery may additionally report managed `service_name`; do not treat it as a new client-controlled or application-configured label.
- Correlation identifiers remain JSON body fields only.
- Loki remains without a public host port.
- Observability remains operational tooling, not authentication, authorization, quota, billing, analytics, routing, failover, or audit truth.

## Sprint 77 starting boundary

Sprint 77 is UI Loading/Empty/Error/Responsive Polish.

Audit before patching:

- Existing loading, empty, error, retry, and responsive behavior across all Dashboard pages.
- Shared components and CSS primitives before introducing page-specific variants.
- Browser/server boundaries and production-route behavior.
- Accessibility, keyboard, layout, overflow, narrow viewport, and long-content behavior.
- Existing tests and production build output.

Preserve the 18 fixed GET-only Dashboard BFF resources, server-only read-only credential, trusted Gateway Admin context, all 29 Admin route protections, routing, quota, analytics, tracing, logging, metrics, scheduler, retention, and protected tags. Do not implement Sprint 78 demo or broad load testing early.
