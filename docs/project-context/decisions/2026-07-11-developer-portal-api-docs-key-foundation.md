# Developer Portal API docs and API-key foundation decision

Date: 2026-07-11

Sprint: 66

Status: accepted

## Context

PulseGate had a public static Developer Portal shell, but `/api-docs` and `/api-keys` were placeholders.

The repository has verified Gateway contracts and tests, but no canonical tracked OpenAPI specification. Existing API-key lifecycle routes are privileged administrative routes associated with API consumers. The platform has no public developer identity, session, or developer-to-consumer ownership mapping.

## Decision

- Build a static curated API reference from verified source and tests.
- Document only explicitly reviewed public-facing contracts.
- Keep downstream-owned success bodies unfrozen when no canonical public schema exists.
- Exclude internal Admin routes, Admin Dashboard BFF routes, and unpublished dynamic registry entries.
- Build a static non-operational API-key foundation.
- Do not expose forms, mutation controls, fetch calls, browser persistence, generated secrets, fake accounts, or fake success states.
- Do not reuse privileged Admin key-management routes.
- Require a future approved public identity and ownership boundary before real API-key self-service.

## Consequences

Positive:

- Developers receive truthful API and error guidance.
- The Portal establishes a clear future self-service workflow.
- Public and privileged boundaries remain separated.
- No backend, dependency, environment, database, or runtime-topology risk is introduced.

Limitations:

- No canonical OpenAPI document exists.
- No developer login or account exists.
- No API key can be listed, issued, revoked, or rotated through the Portal.
- Documentation must be maintained with future public contract changes.

## Follow-up

Sprint 67 proceeds to host-based routing foundation. API-key activation remains deferred until an explicitly approved authentication and ownership sprint.
