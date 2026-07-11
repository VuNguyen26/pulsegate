# Developer Portal runbook

## Purpose

The Developer Portal is the public application boundary introduced in Sprint 65. It is separate from the privileged Admin Dashboard.

## Local development

```powershell
cd E:\pulsegate
npm.cmd run dev:portal
```

Open `http://127.0.0.1:3004`.

## Public routes

- `/`
- `/getting-started`
- `/api-docs`
- `/api-keys`

The API documentation and API-key pages are Sprint 66 placeholders. They do not provide working account or credential behavior.

## Production build

```powershell
npm.cmd run typecheck -w apps/developer-portal
npm.cmd run test -w apps/developer-portal
npm.cmd run build -w apps/developer-portal
```

## Docker validation

```powershell
docker compose config --quiet
docker compose build developer-portal admin-dashboard
docker compose up -d developer-portal
docker compose ps developer-portal
```

Expected public endpoint: `http://127.0.0.1:3004`.

## HTTP validation

```powershell
Invoke-WebRequest http://127.0.0.1:3004/ -UseBasicParsing
Invoke-WebRequest http://127.0.0.1:3004/getting-started -UseBasicParsing
Invoke-WebRequest http://127.0.0.1:3004/api-docs -UseBasicParsing
Invoke-WebRequest http://127.0.0.1:3004/api-keys -UseBasicParsing
```

All routes should return HTTP 200 and the container health status should become `healthy`.

## Security boundary

The Portal must not:

- Receive or expose `ADMIN_API_KEY` or `ADMIN_READ_ONLY_API_KEY`.
- Call `/internal/admin/*`.
- Call the Admin Dashboard `/api/admin/*` BFF boundary.
- Store credentials or sessions in `localStorage` or `sessionStorage`.
- Present fake users, sessions, API keys, usage records, or billing state as real capabilities.

## Current limitations

Sprint 65 does not include:

- Authentication or registration.
- Account/session ownership.
- API-key creation, rotation, revocation, or listing.
- Billing or organizations.
- Backend or database integration.
- OpenAPI/Swagger assets.

These areas require explicit later-sprint design, beginning with Sprint 66.
