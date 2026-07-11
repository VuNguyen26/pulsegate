# Developer Portal runbook

## Purpose

The Developer Portal is PulseGate's public developer-facing application. It remains separate from the privileged Admin Dashboard.

Sprint 66 provides:

- A static curated API documentation foundation.
- A static non-operational API-key self-service foundation.
- No developer account, session, billing, marketplace, or backend-management integration.

## Local development

```powershell
cd E:\pulsegate
npm.cmd run dev:portal
```

Open `http://127.0.0.1:3004`.

## Public Portal routes

- `/`
- `/getting-started`
- `/api-docs`
- `/api-keys`

## API documentation boundary

The `/api-docs` page currently documents:

- `GET /health`
- `GET /api/product-service/health`
- `GET /api/products`

The protected product route requires:

```text
x-api-key: <your-api-key>
Authorization: Bearer <your-bearer-token>
```

The page also documents request IDs, cache headers, route rate-limit headers, quota rejection, and downstream error envelopes.

The page does not claim that PulseGate has a canonical OpenAPI specification. It does not publish privileged Admin routes, Admin Dashboard BFF routes, or the full dynamic route registry.

## API-key foundation boundary

The `/api-keys` page is non-operational.

It does not:

- Authenticate a developer.
- Resolve consumer ownership.
- List, issue, revoke, or rotate an API key.
- Generate or display a fake secret.
- Submit a form or call a backend.
- Store credentials in browser local or session storage.
- Reuse Admin credentials or privileged Admin routes.

Real self-service requires a future approved public authentication and ownership contract.

## Production validation

```powershell
npm.cmd run test -w apps/developer-portal
npm.cmd run typecheck -w apps/developer-portal
npm.cmd run build -w apps/developer-portal

docker compose config --quiet
docker compose build developer-portal
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

Expected result:

- All four routes return HTTP 200.
- A Next.js static JavaScript asset returns HTTP 200.
- Container health becomes `healthy`.
- API docs render the verified endpoint and error guidance.
- API-key foundation renders `Not connected` and `No key will be created`.
- Rendered HTML contains no Admin credential names, Admin paths, or real-looking API keys.

## Security audit

Developer Portal production source must not contain:

- `ADMIN_API_KEY`
- `ADMIN_READ_ONLY_API_KEY`
- `NEXT_PUBLIC_ADMIN_`
- `/internal/admin/`
- `/api/admin/`
- `localStorage`
- `sessionStorage`
- Real-looking `pgk_live_` keys
- New fetch-based integration without explicit review

## Current limitations

- No public developer identity.
- No account or session model.
- No developer-to-consumer ownership mapping.
- No browser-safe API-key lifecycle endpoint.
- No canonical OpenAPI specification or generated API reference.
- No billing, organization, marketplace, or usage-analytics Portal.
