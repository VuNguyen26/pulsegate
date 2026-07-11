# Sprint 63 - Dashboard quota/usage/rejected events

## Status

Complete

## Product/Documentation Version

v1.3.0

Private npm workspace package versions remain `0.1.0`.

The protected annotated `v1.0.0` tag remains unchanged at commit `407d03678674219e7228b15f0cd7a23074493f31`. Sprint 63 creates no Git tag.

## Goal

Extend the Admin Dashboard with bounded read-only quota, successful usage, and rejected/security event investigation while preserving fixed server-only BFF resources, read-only credentials, raw-event quota counting, successful/rejected source separation, and all scheduler/retention safety boundaries.

## Implementation Commits

- `8bf27a2376a22ee057b000d1210d04b9dff64683 feat(dashboard): add analytics read foundation`
- `9a26de85e93e8deb6313a96b7042f391b0cc1eff feat(dashboard): add successful usage read boundary`
- `d6a0c383198665a4e1059c30f0348ec1bb99ce3c feat(dashboard): add usage analytics page`
- `ab550d0303487ff20bb3e21fd1bcd4b1ded5354c feat(dashboard): add rejected events read boundary`
- `d9823e76baf7a0c38e192482ee8ff15f5ed6d5d9 feat(dashboard): add rejected events page`

## Delivered

### Analytics foundation

- Strict query modes for successful summary/events and rejected summary/events.
- Unknown and duplicate query rejection.
- 31-day maximum date range.
- Default event limit 20 and maximum limit 100.
- Bounded identifiers, route paths, methods, status codes, cache states, rejection reasons, and cursors.
- Shared summary grid, filter controls, and cursor pagination.
- Cursor history for previous/next navigation.
- Offset and rollup flags excluded from the Dashboard contract.

### Successful usage and quota reads

- Consumer usage summary.
- API key usage summary.
- API key quota state.
- Usage-plan current-window usage summary.
- Successful usage event listing.
- Fixed same-origin `/internal/admin/` read URLs.
- Browser/server identity and DTO validation.
- Dedicated `/usage-analytics` page.

### Rejected/security reads

- Rejected request summary.
- Reason and status-code breakdowns.
- Rejected event listing.
- Dedicated `/rejected-events` page.
- Rejected metadata checked for sensitive fields and removed before BFF/browser output.
- Successful and rejected models remain separate.

### Fixed Dashboard BFF resources

```txt
GET /api/admin/usage/consumers/:consumerId/summary
GET /api/admin/usage/api-keys/:apiKeyId/summary
GET /api/admin/api-keys/:apiKeyId/quota
GET /api/admin/usage-plans/:usagePlanId/usage-summary
GET /api/admin/usage/events
GET /api/admin/api-rejections/summary
GET /api/admin/api-rejections/events
```

## Validation

- Admin Dashboard: 38 test files / 200 tests passed.
- API Gateway: 136 test files / 988 tests passed.
- Root workspace tests passed.
- Root typecheck passed.
- Root production build passed.
- Docker Compose configuration passed.
- Working and staged diff checks passed.
- Next.js production build exposed `/usage-analytics`, `/rejected-events`, and all seven new BFF routes.
- Docker/PostgreSQL runtime validation was not required because the sprint added no Gateway implementation, database query, schema migration, persistence path, container configuration, quota behavior, scheduler execution, retention execution, or raw-event deletion path.

## Preserved Boundaries

- No generic Admin API proxy.
- No browser-stored Admin credential.
- No full-access Admin credential in Dashboard runtime.
- No Dashboard mutation controls.
- No API management persistence changes.
- No quota source-of-truth change.
- No successful/rejected event merge.
- No rollup runtime flag exposure.
- No scheduler execution expansion.
- No retention execute command.
- No operator-facing raw-event deletion.
- No database migration.
- No dependency addition.
- No new Git tag.

## Documentation

- `README.md`
- `docs/architecture/overview.md`
- `docs/sdlc/requirements.md`
- `docs/project-context/CURRENT_PROGRESS.md`
- `docs/project-context/AI_HANDOFF.md`
- `docs/project-context/DECISION_LOG.md`
- `docs/runbooks/admin-dashboard.md`
- `docs/runbooks/api-usage-analytics.md`
- `docs/runbooks/api-rejected-events.md`
- `docs/runbooks/usage-plans-and-quotas.md`
- `docs/sdlc/sprint-history/sprint-63.md`
- `docs/project-context/decisions/2026-07-11-dashboard-quota-usage-rejected-events.md`

## Next Sprint

Sprint 64 - Dashboard rollup/retention/scheduler panels.
