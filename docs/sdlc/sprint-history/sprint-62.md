# Sprint 62 - Dashboard consumers/API keys/usage plans

## Status

Complete.

## Product Version

```txt
v1.2.0
```

Private npm workspace versions remain `0.1.0`.

The annotated Git tag `v1.0.0` remains unchanged at `407d03678674219e7228b15f0cd7a23074493f31`. Sprint 62 does not create a new tag.

## Goal

Extend the Sprint 61 Admin Dashboard foundation with bounded read-only views for core API management resources while preserving the server-only credential boundary and all existing persistence and safety semantics.

## Delivered

### Shared resource foundation

- Added reusable loading, empty, error, retry, and table primitives.
- Added fixed browser response envelopes and strict DTO validation.
- Added shared server-side read-resource handling.
- Added bounded list handling and identity validation.
- Kept requests no-store.

Commit:

- `7b7c3a0 feat(dashboard): add admin resource view foundation`

### Consumer registry

- Added `/consumers`.
- Added fixed consumer list/detail BFF resources.
- Added safe consumer metadata rendering.
- Added missing-consumer handling.
- Added no consumer mutation controls.

Commit:

- `710d331 feat(dashboard): add consumer registry read view`

### Consumer-scoped API keys

- Added `/api-keys`.
- Added fixed consumer-scoped API key BFF resource.
- Added consumer selection before key loading.
- Rendered key prefix and lifecycle metadata only.
- Excluded raw issued key material.
- Added no issue, revoke, or plan-assignment controls.

Commit:

- `5b0dda3 feat(dashboard): add consumer api key read view`

### Usage plans

- Added `/usage-plans`.
- Added fixed usage-plan list/detail BFF resources.
- Rendered quota window, quota limit, enabled state, description, and audit metadata.
- Added no create or update controls.
- Kept quota enforcement unchanged.

Commit:

- `b4cd8b1 feat(dashboard): add usage plan read view`

### Route registry

- Added `/routes`.
- Added fixed persisted route list/detail BFF resources.
- Added a separate fixed runtime registry BFF resource.
- Rendered bounded route policy data.
- Added no create, update, delete, or reload controls.
- Added no downstream proxy surface.

Commit:

- `05e9443 feat(dashboard): add route registry read view`

## Automated Validation

Final implementation baseline before docs:

- Admin Dashboard: 21 test files / 110 tests passed.
- API Gateway: 136 test files / 988 tests passed.
- Root typecheck passed.
- Root build passed.
- `docker compose config --quiet` passed.
- Working and staged diff checks passed.

## Runtime Validation

Checkpoint runtime proofs established:

- Dashboard pages returned successful responses.
- Fixed Dashboard BFF responses matched direct Gateway resources.
- Consumer identities matched.
- Consumer-scoped API key identities matched.
- Raw API key material was absent.
- Usage-plan list/detail identity parity passed.
- Persisted route list/detail identity parity passed.
- Runtime route snapshot parity passed.
- Persisted and runtime route resources remained distinct.
- Missing consumers, usage plans, and routes mapped to bounded `404` responses.
- Unsupported BFF mutation methods returned `405`.
- Read-only Gateway route reload returned `403 ADMIN_API_KEY_READ_ONLY`.
- Consumer, usage-plan, persisted-route, and runtime-route registries remained unchanged.
- Successful runtime mutation count was zero.
- Dashboard received the read-only Admin key and not the full-access key.
- Credential leakage checks passed.

## Security Boundaries

Sprint 62 preserves:

- fixed server-side BFF resources
- server-only `ADMIN_READ_ONLY_API_KEY`
- no full-access Admin key in Dashboard runtime
- no browser-stored Admin credentials
- no generic Admin API proxy
- no raw API key exposure
- no consumer, API key, usage-plan, or route mutation
- no persistence contract change
- no quota source-of-truth change
- successful/rejected event separation
- no scheduler execution expansion
- no retention execution
- no raw-event deletion
- no database migration
- no enterprise IAM, Developer Portal, Kubernetes, OpenTelemetry, or Loki scope

## Documentation

Updated:

- `README.md`
- `docs/architecture/overview.md`
- `docs/sdlc/requirements.md`
- `docs/project-context/CURRENT_PROGRESS.md`
- `docs/project-context/AI_HANDOFF.md`
- `docs/project-context/DECISION_LOG.md`
- `docs/runbooks/admin-dashboard.md`

Added:

- `docs/sdlc/sprint-history/sprint-62.md`
- `docs/project-context/decisions/2026-07-10-dashboard-resource-read-views.md`

## Next Sprint

Sprint 63 - Dashboard quota/usage/rejected events.

Sprint 63 should reuse the fixed read-only BFF foundation for quota state, successful usage analytics, usage event investigation, and rejected-event investigation without changing raw-event quota counting or successful/rejected event separation.
