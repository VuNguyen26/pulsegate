# Admin Dashboard Foundation

Date: 2026-07-10

Sprint: Sprint 61 - Admin Dashboard foundation

## Status

Accepted.

## Context

PulseGate completed Backend Portfolio v1 in Sprint 60 and released Git tag `v1.0.0`.

The fixed Product/Platform Expansion v2 roadmap begins with a minimal Admin Dashboard foundation in Sprint 61.

Existing internal Admin APIs already provide bounded full-access and read-only shared-secret authorization. Sprint 61 needs a browser-facing administration shell without exposing Admin credentials, introducing a generic proxy, or expanding mutation behavior.

## Decision

### Dashboard application

PulseGate will add a separate Next.js App Router workspace:

```txt
apps/admin-dashboard
```

The Dashboard will:

- run locally on port `3003`
- use React, TypeScript, and plain CSS
- provide responsive navigation and page boundaries
- include placeholders only for roadmap functionality assigned to later sprints
- avoid fake operational and analytics data

### Server-only Admin API boundary

The browser must not call protected Gateway Admin APIs directly.

The Dashboard server runtime will read:

```txt
PULSEGATE_GATEWAY_BASE_URL
ADMIN_READ_ONLY_API_KEY
ADMIN_API_KEY_HEADER
ADMIN_DASHBOARD_REQUEST_TIMEOUT_MS
```

The read-only Admin credential must remain server-side.

The Dashboard must not use:

- `NEXT_PUBLIC_*` Admin credential variables
- browser local storage
- browser session storage
- query-string credentials
- client-side Admin headers
- a generic Admin API proxy

### Bounded endpoint allowlist

Sprint 61 permits only:

```txt
GET /internal/admin/routes/runtime
```

through the Dashboard server boundary.

The browser-facing BFF endpoint is:

```txt
GET /api/admin/runtime-status
```

The BFF exposes only safe runtime metadata and normalized errors.

### Read-only operation

The Dashboard uses only `ADMIN_READ_ONLY_API_KEY`.

The full-access `ADMIN_API_KEY` is not passed to the Dashboard process or container.

Sprint 61 adds no mutation controls.

### Runtime status presentation

The Overview page may display:

- Dashboard access mode
- runtime registry mode
- registry availability
- loaded version
- loaded timestamp
- registered route count

It may display normalized error codes and safe `requestId` attribution.

It must not display credentials, raw environment configuration, internal exception details, or arbitrary Gateway responses.

### Production runtime

The Dashboard will use:

- a multi-stage Docker build
- Node.js 20
- a non-root runtime user
- Docker Compose port `3003`
- Docker-internal Gateway origin `http://api-gateway:3000`
- runtime-only read-only credential injection
- a bounded health check

Admin credentials must not be baked into the image.

### Versioning

- Product and documentation version becomes `v1.1.0`.
- Private npm workspace package versions remain `0.1.0`.
- Existing Git tag `v1.0.0` remains unchanged.
- Sprint 61 documentation work does not automatically create a new Git tag.

## Consequences

Benefits:

- PulseGate gains its first product-facing administration shell.
- Admin credentials remain outside browser execution and storage.
- The Dashboard defaults to read-only access.
- Gateway connectivity failures are visible through safe normalized states.
- Later Sprints 62-64 can extend bounded Dashboard functionality on top of an established security boundary.
- Local Docker runtime remains reproducible.

Trade-offs:

- The Dashboard still uses a shared-secret operational model.
- There is no administrator login or individual identity.
- There is no database-backed Dashboard authorization model.
- Only one fixed runtime-status resource is available in Sprint 61.
- The Overview page performs a client request to the local BFF after page load.
- Dashboard deployment requires securely supplying a read-only credential.

## Explicit Non-Goals

Sprint 61 does not add:

- Dashboard mutation controls
- a generic Admin API proxy
- consumer management UI
- API key management UI
- usage-plan management UI
- route management UI
- quota analytics UI
- rejected-event UI
- rollup, scheduler, or retention operator controls
- administrator accounts
- organization or tenant models
- SSO, OAuth, or enterprise IAM
- database migrations
- quota behavior changes
- event recorder changes
- scheduler execution expansion
- retention execution
- raw-event deletion
- Developer Portal functionality
- Kubernetes, OpenTelemetry, or Loki

## Security Requirements

- Fail closed when Dashboard environment configuration is missing or invalid.
- Accept only HTTP or HTTPS Gateway origins without credentials, paths, queries, or fragments.
- Restrict Admin header names to valid HTTP token syntax.
- Bound Dashboard-to-Gateway timeouts.
- Use `cache: no-store`.
- Normalize upstream failures without returning raw exception content.
- Validate BFF success and error payloads before presentation.
- Do not log or return Admin credentials.
- Do not expose full-access Admin credentials to the Dashboard container.
- Run the production image as a non-root user.

## Validation

Automated validation passed:

- Admin Dashboard: 5 test files / 22 tests.
- API Gateway: 136 test files / 988 tests.
- Root typecheck passed.
- Root build passed.
- Docker Compose configuration validation passed.
- Git whitespace diff validation passed.
- Browser-facing production source secret audit passed.
- Docker image secret inspection passed.

Runtime validation passed:

- Direct read-only Gateway runtime request returned `HTTP 200`.
- Dashboard Overview returned `HTTP 200`.
- Dashboard BFF returned `HTTP 200`.
- Invalid Dashboard credential returned `HTTP 403`.
- Dashboard runtime access mode was `read-only`.
- Dashboard container was healthy on port `3003`.
- Full-access `ADMIN_API_KEY` was absent from the Dashboard container.
- Credentials were absent from HTML, responses, bundles, logs, and image configuration.

## Known Dependency Note

Next.js `16.2.10` currently resolves a transitive PostCSS version reported by npm audit with moderate findings.

Sprint 61 does not use forced dependency remediation, framework downgrade, or canary releases.

The Dashboard does not accept untrusted CSS input.

## References

- `docs/sdlc/sprint-history/sprint-61.md`
- `docs/runbooks/admin-dashboard.md`
- `docs/runbooks/admin-route-management.md`
- `docs/architecture/overview.md`
- `docs/sdlc/requirements.md`
