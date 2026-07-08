# Current Progress

## Project

PulseGate - High-Traffic API Gateway & Observability Platform

## Document Scope

This file is intentionally compact.

Detailed sprint history lives in:

- docs/sdlc/sprint-history/

Manual validation commands live in:

- docs/runbooks/

Long decision records live in:

- docs/project-context/decisions/

---

## Current Version

v0.49.0

---

## Latest Completed Sprint

Sprint 48 - Command Dry-Run Runtime Output Hardening

Status:

Done.

Sprint 48 hardened analytics rollup scheduler command dry-run runtime output after Sprint 47 wired direct command dry-run service invocation.

It preserved command-only, dry-run-only service invocation while strengthening failure handling, guardrails, source separation, and operator-visible output:

- Locked external-scheduler dry-run with --event-limit as blocked before runtime service factory resolution.
- Locked fail-closed service error output for injected dry-run backfill service failures.
- Locked source-separated partial failure output so one source failure does not drop the other source result.
- Preserved dryRunServiceInvocationResults when runtime cleanup fails and exposed dryRunRuntimeCleanupError only on cleanup failure.
- Locked invalid event-limit and invalid max-bucket inputs to fail fast before runtime factory resolution.
- Exposed dryRunRuntimeFactoryError when runtime service factory creation fails before invocation.
- Locked runtime output field visibility for success, cleanup failure, factory failure, preview, and blocked paths.
- Validated Docker/PostgreSQL runtime smoke behavior with migration deploy and direct scheduler command dry-run.
- Kept execute mode blocked with backfill-execution-not-wired.
- Kept process-local and external scheduler execution blocked with automatic-trigger-not-wired.
- Did not create scheduled/background jobs.
- Did not execute backfill.
- Did not read raw events through service dry-run.
- Did not persist rollups through service dry-run.
- Did not change quota counting, usage recording, rejected event recording, rollup read APIs, summary APIs, migrations, or retention/delete paths.
- Did not delete raw events.

Sprint 48 details are archived in:

- docs/sdlc/sprint-history/sprint-48.md

Related decision record:

- docs/project-context/decisions/2026-07-08-analytics-rollup-scheduler-command-dry-run-runtime-output-hardening.md

---
## Latest Validation Status

Latest stable validation from Sprint 48:

- npm run test -> passed with 105 test files and 763 tests
- npm run typecheck -> passed
- npm run build -> passed

Docker/PostgreSQL runtime validation:

- PostgreSQL container was healthy.
- DATABASE_URL was set to postgresql://pulsegate:pulsegate_password@localhost:5432/pulsegate?schema=gateway for host-local validation.
- npm run db:migrate:deploy --workspace api-gateway passed with 7 migrations and no pending migrations.
- analytics:rollup:scheduler-preview command dry-run runtime validation passed with --event-limit=500.
- Runtime output reached executionDecision.status=dry-run-ready.
- Runtime output exposed dryRunServiceInvocationResults for usage and rejected sources.
- Runtime output exposed service-dry-run-invoked results with serviceResult.mode=dry-run.
- Runtime output exposed runtimeConsistency.status=runtime-dry-run-service-invocation-wired.
- Runtime output did not expose dryRunRuntimeCleanupError or dryRunRuntimeFactoryError on the happy path.
- Runtime output preserved executesBackfill=false, readsEvents=false, persistsRollups=false, affectsQuotaCounting=false, and deletesRawEvents=false.

Blocked-path and failure validation:

- External-scheduler dry-run with --event-limit remained blocked before runtime factory resolution.
- Dry-run without --event-limit remained blocked with backfill-service-invocation-not-wired.
- process-local dry-run with --event-limit remained blocked with automatic-trigger-not-wired.
- command execute with --event-limit remained blocked with backfill-execution-not-wired.
- Runtime service failures returned source-scoped failed-closed-service-error output.
- Runtime cleanup failures preserved invocation results and exposed dryRunRuntimeCleanupError.
- Runtime factory failures exposed dryRunRuntimeFactoryError without invoking the dry-run service.

---
## Current Limitations

- Usage summary APIs still read raw events.
- Rejected summary APIs still read raw events.
- Rollup read endpoint exists, but summary APIs have not switched to rollup reads.
- Direct command dry-run service invocation is wired, but no scheduled/background rollup job exists yet.
- Execute mode is still blocked.
- process-local and external scheduler execution are still blocked.
- Retention execution has repository-level, service-level, and operator preview safety foundations, but no operator-facing execute command yet.
- Retention Prisma delete repository is not wired to any operator-facing execute command, API, scheduled job, or quota path yet.
- No retention delete job is implemented yet.
- No Admin Dashboard or Developer Portal yet.
- Dynamic router supports exact method + exact path matching only.
- CI does not run the full Docker Compose runtime stack yet.
- Kubernetes and cloud deployment are planned for later.

---

## Recommended Next Sprint

Sprint 49 - Command Execute Contract Review

Recommended scope:

- Review command execute request and response contracts.
- Keep execute wiring blocked until explicit execute guardrails are designed.
- Define rollback expectations and operator output before any execute-mode runtime wiring.
- Keep command dry-run behavior unchanged.
- Keep process-local/external-scheduler execution blocked until automatic execution semantics are explicitly designed.
- Keep successful usage and rejected/security events separate.
- Keep quota counting on gateway.api_usage_events.
- Keep raw event deletion forbidden.