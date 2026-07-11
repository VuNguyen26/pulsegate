# Decision Log

## Current Version

v1.3.0

Private npm workspace package versions remain `0.1.0`.

The annotated `v1.0.0` Git tag remains unchanged at the final Sprint 60 documentation commit.

## Latest Completed Sprint

Sprint 63 - Dashboard quota/usage/rejected events

## Latest Decision

### 2026-07-11 - Extend the Dashboard with bounded quota, usage, and rejected-event reads

Decision:

- Add dedicated `/usage-analytics` and `/rejected-events` pages.
- Add seven explicit GET-only BFF resources for successful usage summaries/events, quota state, usage-plan summary, rejected summary, and rejected events.
- Reuse only the server-side `ADMIN_READ_ONLY_API_KEY`.
- Enforce same-origin fixed `/internal/admin/` URLs.
- Reject arbitrary methods, paths, hosts, headers, unknown/duplicate keys, offset pagination, and rollup runtime flags.
- Bound date ranges to 31 days, event limits to 100, and Dashboard cursor navigation to opaque cursors.
- Keep successful usage and rejected/security events as separate DTOs and pages.
- Validate and remove rejected-event metadata before BFF/browser output.
- Add no mutation controls and no generic Admin API proxy.
- Use product/documentation version `v1.3.0`.
- Keep private npm workspace versions at `0.1.0`.
- Keep the protected annotated `v1.0.0` tag unchanged.

Reason:

- Sprint 63 requires operator-visible quota and event investigation without widening the administration credential or mutation boundary.
- Fixed resources and strict DTOs preserve the Dashboard security model established in Sprints 61-62.
- Cursor-only UI navigation and bounded filters keep event investigation predictable.
- Removing rejected-event metadata prevents arbitrary upstream JSON from entering the browser rendering contract.
- Separate successful/rejected models preserve quota and security semantics.

Consequences:

- Operators can inspect quota, successful usage, and rejected traffic from the Dashboard.
- Offset pagination and rollup runtime switching remain Gateway capabilities but are not exposed by the Dashboard.
- `gateway.api_usage_events` remains the quota-counting source of truth.
- No Gateway persistence, migration, scheduler execution, retention execution, or raw-event deletion behavior changes.

Validation:

- Admin Dashboard: 38 test files / 200 tests passed.
- API Gateway: 136 test files / 988 tests passed.
- Root tests, typecheck, build, Compose config, and diff checks passed.
- Next.js build exposed both pages and seven fixed BFF resources.

References:

- `docs/project-context/decisions/2026-07-11-dashboard-quota-usage-rejected-events.md`
- `docs/sdlc/sprint-history/sprint-63.md`
- `docs/runbooks/admin-dashboard.md`
- `docs/runbooks/api-usage-analytics.md`
- `docs/runbooks/api-rejected-events.md`
- `docs/runbooks/usage-plans-and-quotas.md`

---

### 2026-07-10 - Extend the Dashboard with fixed read-only resource boundaries

Decision:

- Add bounded Dashboard read views for consumers, consumer-scoped API key metadata, usage plans, persisted route configuration, and runtime route state.
- Reuse shared loading, empty, error, retry, and table primitives.
- Keep every browser-facing resource as an explicit GET-only BFF route.
- Keep `ADMIN_READ_ONLY_API_KEY` server-only.
- Keep full-access `ADMIN_API_KEY` out of the Dashboard.
- Keep persisted route configuration separate from runtime registry state.
- Expose safe API key metadata only; never expose raw issued key material.
- Add no create, update, revoke, assign, delete, or reload controls.
- Use product/documentation version `v1.2.0`.
- Keep private npm workspace versions at `0.1.0`.
- Keep the existing annotated `v1.0.0` tag unchanged.

Reason:

- The fixed Sprint 62 roadmap requires product-facing administration views without expanding mutation risk.
- Explicit BFF resources preserve the Sprint 61 credential boundary and prevent arbitrary Admin API forwarding.
- Consumer scoping and strict DTO validation reduce accidental cross-resource exposure.
- Separating persisted and runtime route data avoids presenting runtime state as editable configuration.
- Read-only scope preserves current persistence, quota, analytics, scheduler, retention, and raw-event behavior.

Consequences:

- Operators can inspect core API management resources from the Dashboard.
- Mutation workflows remain deferred until separately designed and explicitly approved.
- Sprint 63 can reuse the same fixed-resource pattern for quota, usage, and rejected-event panels.
- No database migration, Gateway backend contract change, quota change, or runtime mutation is introduced.

Validation:

- Admin Dashboard: 21 test files / 110 tests passed.
- API Gateway: 136 test files / 988 tests passed.
- Typecheck, build, Compose config, and diff checks passed.
- Runtime BFF/direct Gateway parity checks passed.
- Missing-resource and mutation-method boundaries passed.
- Credential leakage checks passed.
- Successful runtime mutation count remained zero.

References:

- `docs/project-context/decisions/2026-07-10-dashboard-resource-read-views.md`
- `docs/sdlc/sprint-history/sprint-62.md`
- `docs/runbooks/admin-dashboard.md`

---

### 2026-07-10 - Use a server-only read-only boundary for the Admin Dashboard

Decision:

- Add a separate Next.js App Router workspace at `apps/admin-dashboard`.
- Run the Dashboard locally and through Docker Compose on port `3003`.
- Keep protected Gateway Admin credentials inside the Dashboard server runtime.
- Use only `ADMIN_READ_ONLY_API_KEY` for Sprint 61 Dashboard connectivity.
- Do not pass full-access `ADMIN_API_KEY` to the Dashboard process or container.
- Permit only the fixed Gateway endpoint:
  - `GET /internal/admin/routes/runtime`
- Expose only the fixed browser-facing BFF endpoint:
  - `GET /api/admin/runtime-status`
- Do not add a generic Admin API proxy.
- Normalize configuration, authorization, timeout, Gateway availability, upstream, and invalid-response failures.
- Preserve only safe Gateway `requestId` attribution.
- Validate BFF payloads before displaying runtime metadata.
- Keep credentials out of HTML, browser requests to the Gateway, bundles, browser storage, logs, responses, and Docker image configuration.
- Use a multi-stage Node.js 20 production image running as the non-root `node` user.
- Use product/documentation version `v1.1.0`.
- Keep private npm workspace versions at `0.1.0`.
- Leave the existing `v1.0.0` Git tag unchanged.

Reason:

- Sprint 61 begins Product/Platform Expansion v2 and requires a product-facing administration foundation.
- Calling protected Gateway Admin APIs directly from the browser would expose the shared Admin credential.
- A fixed server-only BFF keeps the credential outside browser execution and prevents arbitrary Admin endpoint forwarding.
- Read-only access limits the impact of Dashboard credential exposure or implementation mistakes.
- A separate workspace and Compose service provide a stable foundation for bounded Dashboard expansion in Sprints 62-64.
- Existing authorization, persistence, quota, analytics, scheduler, retention, and raw-event boundaries must remain unchanged.

Runtime contract:

- Dashboard Overview may display:
  - access mode
  - runtime registry mode
  - registry availability
  - loaded version
  - loaded timestamp
  - registered route count
- Missing or invalid Dashboard configuration fails closed.
- Invalid Dashboard credentials return a normalized forbidden response.
- The Dashboard Docker image contains no Admin credential configuration.
- The Dashboard container receives the read-only credential only at runtime.
- The Dashboard container does not receive the full-access Admin credential.

Validation:

- Admin Dashboard: 5 test files / 22 tests passed.
- API Gateway: 136 test files / 988 tests passed.
- Root typecheck passed.
- Root production build passed.
- `docker compose config --quiet` passed.
- `git diff --check` passed.
- Browser-facing production source secret audit passed.
- Docker image secret inspection passed.
- Direct read-only Gateway runtime access returned `HTTP 200`.
- Dashboard Overview and BFF returned `HTTP 200`.
- Invalid Dashboard credentials returned `HTTP 403`.
- Dashboard container health passed on port `3003`.
- Credential leak checks passed for HTML, BFF responses, client bundles, logs, and image configuration.

Boundaries:

- No Dashboard mutation controls.
- No generic Admin API proxy.
- No browser-stored Admin credentials.
- No consumer, API key, usage-plan, or route persistence changes.
- No quota behavior changes.
- No successful-usage or rejected-event recorder changes.
- No scheduler execution expansion.
- No retention execution.
- No raw-event deletion.
- No database migration.
- No database-backed administrator, organization, tenant, SSO, or enterprise IAM model.
- No Developer Portal, Kubernetes, OpenTelemetry, or Loki scope.

Known dependency note:

- Next.js `16.2.10` currently resolves a transitive PostCSS version reported by npm audit with moderate findings.
- Do not use `npm audit fix --force`, an unsupported override, a framework downgrade, or a canary release without explicit approval.
- Sprint 61 does not accept or process untrusted CSS input.

References:

- `docs/project-context/decisions/2026-07-10-admin-dashboard-foundation.md`
- `docs/sdlc/sprint-history/sprint-61.md`
- `docs/runbooks/admin-dashboard.md`
- `docs/runbooks/local-validation.md`

---
### 2026-07-10 - Use bounded release validation and separate Git/product versioning

Decision:

- Use `v1.0.0` as the Git and product documentation release version.
- Keep private npm workspace versions at `0.1.0`.
- Do not publish npm packages as part of Sprint 60.
- Use `npm run validate:release` for automated release-readiness validation.
- Use `npm run demo:runtime` for bounded Docker runtime demonstration.
- Require final documentation, automated validation, runtime validation, repository synchronization, and explicit approval before creating the Git tag.
- Keep the runtime demo non-destructive.
- Do not invoke retention deletion, raw-event deletion, autonomous background execute, or external scheduler execution.
- Preserve Prometheus metrics and analytics rollups as non-quota sources.
- Keep Sprint 60 limited to release preparation, documentation, demo flow, and low-risk cleanup.

Validation:

- 136 test files / 988 tests passed.
- Typecheck and build passed.
- Clean release-readiness validation passed.
- Gateway, Prometheus, Grafana, Admin authorization, bounded metric-label, and k6 runtime checks passed.
- k6 completed 10/10 iterations and 20/20 checks with 0% failures.

References:

- docs/project-context/decisions/2026-07-10-v1-release-readiness.md
- docs/releases/v1.0.0.md
- docs/sdlc/sprint-history/sprint-60.md

---

### 2026-07-10 - Keep observability bounded and separate from business sources of truth

Decision:

- Preserve the existing Prometheus metric families.
- Use Fastify route templates for matched requests and `__unmatched__` for unmatched requests.
- Exclude raw unmatched paths and other unbounded or sensitive values from metric labels.
- Reuse the provisioned Prometheus datasource and keep a compact five-panel Grafana gateway dashboard.
- Exclude `/metrics` scrape traffic from general HTTP request and latency panels.
- Add a bounded Docker-based k6 `GET /health` smoke through the optional `tools` profile.
- Keep Prometheus, Grafana, metrics, and rollup tables outside quota source-of-truth behavior.
- Preserve successful usage and rejected/security traffic separation.
- Do not add OpenTelemetry, Loki, Admin UI, Kubernetes, retention execution, raw event deletion, external scheduler runtime, or background execute in Sprint 59.

Validation:

- 136 test files / 988 tests passed.
- Typecheck and build passed.
- Prometheus target health, unmatched route cardinality, bounded k6, Grafana datasource, PromQL, and dashboard provisioning checks passed.

References:

- docs/project-context/decisions/2026-07-10-observability-grafana-k6-lightweight-validation.md
- docs/sdlc/sprint-history/sprint-59.md
- docs/runbooks/observability-validation.md

---
### 2026-07-09 - Analytics retention execute preview hardening remains non-destructive

Decision:
- Harden retention execute preview output in Sprint 57 without opening destructive retention execution.
- Expose `executeContractReview.expectations` for candidate recheck, rollback, and audit output expectations.
- Fail closed when candidate recheck preparation fails and surface `preparedOperationErrors` in service/operator summaries.
- Keep `executeContractReview.summary.allowed=false`.
- Do not expose a retention execute command, delete API, scheduled retention delete job, or Admin UI path.
- Do not call `deleteCandidates` from operator-facing flows.
- Do not wire Prisma retention delete repository execution into a destructive path.
- Do not mutate quota counting.
- Do not delete raw events.

Rationale:
- Sprint 57 strengthens operator visibility before any future destructive retention execution.
- Candidate recheck preparation must fail closed so future delete wiring cannot proceed after stale or unavailable candidate counts.
- Summary/operator output must show rollback/audit/candidate-recheck expectations and preparation failures clearly.

Validation:
- `npm run test` passed: 133 test files / 961 tests.
- `npm run typecheck` passed.
- `npm run build` passed.
- `git diff --check` passed.
- Docker/PostgreSQL runtime validation was not required because no new DB runtime path, migration, destructive delete path, quota path, scheduled job, or raw event deletion path was introduced.

Docs:
- docs/project-context/decisions/2026-07-09-analytics-retention-execute-preview-hardening.md
- docs/sdlc/sprint-history/sprint-57.md

## Historical Decision Index

### 2026-07-09 - Analytics retention execute contract review remains review-only

Decision:

- Add `executeContractReview` for analytics retention execute review.
- Expose the review in execution-preview, service-preview, and operator-preview outputs.
- Document command usage/output behavior for review-only execute contract output.
- Report operator confirmation, hard delete limit, candidate recheck expectation, rollback expectation, audit output expectation, and safety flags.
- Keep `executeContractReview.summary.allowed=false`.
- Do not expose a retention execute command.
- Do not expose a retention delete API.
- Do not create a scheduled retention delete job.
- Do not call `deleteCandidates` from an operator-facing flow.
- Do not wire the Prisma retention delete repository into command/API/job execution.
- Do not mutate quota counting.
- Do not delete raw events.

Validation:

- 133 test files passed.
- 956 tests passed.
- Typecheck passed.
- Build passed.
- Docker/PostgreSQL runtime validation was not required because Sprint 56 did not add a new DB runtime or destructive execution path.

References:

- docs/sdlc/sprint-history/sprint-56.md
- docs/project-context/decisions/2026-07-09-analytics-retention-execute-contract-review.md

## Scope

This file is a compact index of important decisions.

Detailed decision records live in:

- docs/project-context/decisions/

---

## Current Version

v0.56.0

## Latest Completed Sprint

Sprint 55 - Background Scheduler Runtime Wiring with guardrails

---

## Recent Decisions

### 2026-07-09 - Background scheduler contract/runner remains contract-only

Decision:

- Add DB-free background scheduler contract, runner plan, and operator output models.
- Expose backgroundScheduler in scheduler preview command JSON output.
- Keep command trigger owned by direct CLI runtime semantics.
- Allow process-local and external-scheduler preview contract output only.
- Keep process-local and external-scheduler dry-run/execute runtime invocation blocked with background-runtime-execution-not-wired.
- Keep direct command dry-run and execute behavior unchanged.
- Do not create scheduled/background jobs, invoke backfill service from background triggers, read events, persist rollups, affect quota counting, delete raw events, or run retention execution.

Rationale:

- Background scheduler runtime wiring needs a clear contract and operator output boundary before any runner loop or external scheduler integration exists.
- Separating command runtime from background semantics prevents accidental interpretation of preview output as execution.
- Keeping Sprint 54 DB-free preserves the safe validation model before Sprint 55 runtime wiring.

Detailed record:

- docs/project-context/decisions/2026-07-09-analytics-rollup-background-scheduler-contract-runner.md

### 2026-07-09 - Selected summary runtime reads can use rollup read model behind explicit flag

Decision:

- Add a runtime read decision model for selected summary API targets.
- Map real consumer usage, API key usage, and rejected summary filters into runtime read decisions.
- Adapt usage and rejected rollup read records back into the existing summary response read models.
- Add a runtime resolver and read-service seam with raw-summary fallback.
- Map runtime read decisions into rollup read queries for the existing analytics rollup read service.
- Wire consumer usage summary, API key usage summary, and rejected summary routes behind `rollupSummaryRuntimeRead=true`.
- Keep default summary responses on `raw-event-summary`.
- Keep `rollupSummaryPreview=true` as preview output only.
- Fall back to raw summary for unbounded, unsupported, empty, missing, failed, or mismatched rollup read paths.
- Do not change quota counting, persist rollups from summary APIs, delete raw events, add background jobs, add retention execution, or change Admin UI.

Validation:

- 122 test files passed.
- 887 tests passed.
- Typecheck passed.
- Build passed.
- Docker/PostgreSQL runtime validation passed for usage and rejected summary runtime-read switching.

References:

- docs/sdlc/sprint-history/sprint-53.md
- docs/project-context/decisions/2026-07-09-rollup-summary-runtime-read-switch.md
### 2026-07-09 - Rollup summary API switch preview is exposed behind explicit flag

Decision:

- Add a DB-free rollup summary switch preview contract for selected summary API targets.
- Add query compatibility preview for bounded summary query shapes.
- Compose switch preview, query compatibility, fallback plan, operator decision, reviewer notes, and safety flags into one preview output.
- Map real consumer usage, API key usage, and rejected summary filters into preview output.
- Expose `rollupSummaryPreview=true` on selected summary APIs.
- Keep default summary responses unchanged when the flag is absent or not exactly true.
- Keep the runtime summary path on `raw-event-summary`.
- Do not use rollup repositories in summary API runtime paths.
- Do not mutate quota counting, persist rollups, delete raw events, create background jobs, or add retention execution.

Validation:

- 114 test files passed.
- 841 tests passed.
- Typecheck passed.
- Build passed.
- Docker/PostgreSQL runtime summary preview validation passed.

References:

- docs/sdlc/sprint-history/sprint-52.md
- docs/project-context/decisions/2026-07-09-rollup-summary-api-switch-preview.md

### 2026-07-09 - Scheduler command execute runtime is wired for direct CLI with strict guardrails

Decision:

- Wire analytics rollup scheduler command execute runtime for direct CLI command usage only.
- Allow execute-ready only when command trigger, execute mode, ready runner plan, explicit operator confirmation, explicit event limit, bounded bucket count, source separation, and runtime gate checks are satisfied.
- Invoke AnalyticsRollupBackfillService.runBackfill in execute mode through the scheduler execute adapter.
- Permit reads from usage/rejected event sources and persistence only to analytics rollup tables.
- Keep quota counting mutation false and raw event deletion false.
- Keep process-local execute, external scheduler execute, scheduled/background execute, retention delete execution, and summary API switch out of scope.

Validation:

- 110 test files passed.
- 812 tests passed.
- Typecheck passed.
- Build passed.
- Docker/PostgreSQL runtime execute validation passed.

References:

- docs/sdlc/sprint-history/sprint-51.md
- docs/project-context/decisions/2026-07-09-analytics-rollup-scheduler-command-execute-runtime-wiring.md

### 2026-07-09 - Rollup scheduler command execute wiring preview remains blocked-by-default

Decision:

- Expose commandExecuteWiringPreview for command:execute scheduler preview requests.
- Keep command execute blocked with backfill-execution-not-wired for ready runner plans.
- Keep skipped runner plans blocked with scheduler-runner-not-ready and zero source-scoped planned executions.
- Keep process-local and external-scheduler execute requests blocked with automatic-trigger-not-wired and without commandExecuteWiringPreview.
- Include planned source-scoped execute requests while keeping willInvokeBackfillService=false, willExecuteBackfill=false, willReadEvents=false, and willPersistRollups=false.
- Keep executeRuntimeCurrentlyAllowed=false, backfillExecutionWired=false, serviceInvocationCurrentlyAllowed=false, eventReadCurrentlyAllowed=false, rollupPersistenceCurrentlyAllowed=false, quotaCountingChangeAllowed=false, rawEventDeletionAllowed=false, processLocalExecutionAllowed=false, externalSchedulerExecutionAllowed=false, and scheduledJobCreationAllowed=false.
- Do not wire execute runtime, call AnalyticsRollupBackfillService.runBackfill in execute mode, persist rollups, read raw events, change quota counting, switch summary APIs, add retention execution, or delete raw events.

Rationale:

- Sprint 49 made execute contract/readiness/operator output visible, so Sprint 50 adds the next review boundary: a wiring preview that remains blocked-by-default.
- Source-scoped planned execute output lets operators see future execute shape without runtime permissions.
- Keeping the preview command-only prevents automatic scheduler semantics from being introduced before process-local/external scheduler execution is designed.

Detailed record:

- docs/project-context/decisions/2026-07-09-analytics-rollup-scheduler-command-execute-wiring-preview.md
### 2026-07-09 - Rollup scheduler command execute contract remains review-only

Decision:

- Expose commandExecuteContractReview for command:execute scheduler preview requests.
- Expose commandExecuteReadinessReview with source-aware planned request count, planned sources, planned granularity, required confirmation/event-limit/max-bucket/source-separation guardrails, and all execution permissions false.
- Expose commandExecuteOperatorOutputReview with confirmation requirement, blocked reason, readiness status, contract review status, rollup-tables-only persistence scope, rollback expectation, source-scoped planned requests, safety flags, no quota mutation, and no raw event deletion.
- Document command execute usage text for explicit operator confirmation, event-limit guardrail, max-bucket bound, bounded bucket count, source-separated execution, rollup-tables-only persistence, rollback expectation, no process-local/external scheduler execution, and no scheduled job creation.
- Keep command execute blocked with backfill-execution-not-wired.
- Keep process-local and external scheduler execution blocked with automatic-trigger-not-wired.
- Do not wire execute runtime, call AnalyticsRollupBackfillService.runBackfill in execute mode, persist rollups, read raw events, change quota counting, switch summary APIs, add retention execution, or delete raw events.

Rationale:

- Execute mode is the next high-risk boundary after command dry-run runtime output hardening, so its contract, readiness, and operator output must be visible before any runtime wiring.
- Source-aware readiness and operator output reduce future ambiguity around confirmation, planned requests, rollback, persistence scope, and safety flags.
- Keeping Sprint 49 DB-free protects the current validated dry-run behavior while preparing Sprint 50 for a blocked-by-default execute wiring preview.

Detailed record:

- docs/project-context/decisions/2026-07-09-analytics-rollup-scheduler-command-execute-contract-review.md
### 2026-07-08 - Rollup scheduler command dry-run runtime output is hardened

Decision:

- Harden command dry-run runtime output after direct command-only dry-run service invocation was wired.
- Keep external-scheduler dry-run blocked before runtime factory resolution.
- Expose source-scoped failed-closed-service-error output for dry-run service failures.
- Preserve source separation when one planned source fails and the other succeeds.
- Preserve dryRunServiceInvocationResults when runtime cleanup fails and expose dryRunRuntimeCleanupError only for cleanup failures.
- Reject invalid event-limit and invalid max-bucket inputs before runtime factory resolution.
- Expose dryRunRuntimeFactoryError when runtime service factory creation fails.
- Lock runtime output field visibility for success, cleanup failure, factory failure, preview, and blocked paths.
- Validate Docker/PostgreSQL runtime smoke behavior for command dry-run with usage and rejected sources.
- Do not create scheduled/background jobs, wire execute mode, wire process-local/external scheduler execution, change quota counting, persist rollups, read raw events, or delete raw events.

Rationale:

- Command dry-run now has a real runtime service invocation path, so operator output must remain explicit, source-scoped, and fail-closed across runtime failures.
- Factory and cleanup failures are different operator concerns and should not be conflated with service invocation results.
- Guardrails must fail before runtime factory resolution to avoid accidental DB-backed service construction for invalid commands.
- Runtime validation remains required because the command path resolves a Prisma-backed service factory.

Detailed record:

- docs/project-context/decisions/2026-07-08-analytics-rollup-scheduler-command-dry-run-runtime-output-hardening.md
### 2026-07-08 - Rollup scheduler command dry-run runtime service invocation is wired command-only

Decision:

- Wire direct CLI command dry-run to call AnalyticsRollupBackfillService.runBackfill in dry-run mode only.
- Require explicit --event-limit before runtime service invocation.
- Use mapped dry-run service inputs and preserve one invocation per planned source.
- Expose dryRunServiceInvocationResults with source-separated service-dry-run-invoked results.
- Expose runtimeConsistency with status=runtime-dry-run-service-invocation-wired.
- Keep dry-run without --event-limit blocked with backfill-service-invocation-not-wired.
- Keep process-local and external scheduler execution blocked with automatic-trigger-not-wired.
- Keep execute mode blocked with backfill-execution-not-wired.
- Do not create scheduled/background jobs.
- Do not execute backfill, read events through service dry-run, persist rollups through service dry-run, affect quota counting, or delete raw events.

Rationale:

- Sprint 46 defined the wiring contract, so Sprint 47 could safely introduce the direct command dry-run service invocation boundary.
- The runtime path remains command-only and dry-run-only to avoid introducing background scheduler semantics or execute-mode risk.
- Docker/PostgreSQL validation is required because the direct CLI path now resolves a Prisma-backed runtime service factory.
- Keeping service dry-run plan-only protects quota correctness, usage/rejected source separation, and raw event safety.

Detailed record:

- docs/project-context/decisions/2026-07-08-analytics-rollup-scheduler-command-dry-run-service-invocation-runtime-wiring.md

### 2026-07-08 - Rollup scheduler command dry-run service invocation wiring contract remains non-invoking

Decision:

- Expose dryRunServiceInvocationWiringContract under dryRunDesignReview for command:dry-run scheduler preview requests.
- Keep currentWiringState=not-wired.
- Keep backfillServiceInvocationWired=false.
- Keep serviceInvocationCurrentlyAllowed=false.
- Keep command dry-run blocked with backfill-service-invocation-not-wired.
- Define the future command-only, dry-run-only request contract from mapped dry-run service inputs.
- Require source-separated inputs, explicit eventLimit, and max bucket bound before future wiring.
- Define the future operator-visible dry-run response contract with source-scoped result summaries, per-source safety flags, dry-run service plan output, and partial failure output.
- Require validation of missing event limit, unbounded bucket count, non-command triggers, execute mode, and Docker/PostgreSQL runtime validation before future service invocation wiring.
- Require operator output for service invocation state, blocked reason, source-scoped result summary, safety flags, no quota mutation, and no raw event deletion.
- Do not call AnalyticsRollupBackfillService.runBackfill from scheduler preview.
- Do not read raw events, persist rollups, affect quota counting, or delete raw events.

Rationale:

- The scheduler command should not jump from readiness/fail-closed modeling to real service invocation without a precise wiring contract.
- The wiring contract makes future request, response, validation, and operator output expectations visible before runtime wiring.
- Keeping service invocation disallowed protects quota correctness, usage/rejected source separation, and raw event safety before Sprint 47 runtime validation.

Detailed record:

- docs/project-context/decisions/2026-07-08-analytics-rollup-scheduler-command-dry-run-service-invocation-wiring-contract.md

### 2026-07-08 - Rollup scheduler command dry-run service invocation fail-closed errors remain model-only

Decision:

- Expose dryRunServiceInvocationFailClosedErrorModel under dryRunDesignReview for command:dry-run scheduler preview requests.
- Keep currentServiceInvocationState=not-wired.
- Keep failureState=blocked.
- Keep blockedReason=backfill-service-invocation-not-wired.
- Keep serviceInvocationCurrentlyAllowed=false.
- Keep partialPersistenceAllowed=false.
- Keep quotaCountingChangeAllowed=false.
- Keep rawEventDeletionAllowed=false.
- Require operator-visible fail-closed service error review output, source-scoped error output, safety flags on failure, no partial persistence, no quota mutation, and no raw event deletion before future service invocation wiring.
- Do not call AnalyticsRollupBackfillService.runBackfill from scheduler preview.
- Do not read raw events, persist rollups, affect quota counting, or delete raw events.

Rationale:

- The scheduler command should not wire real service invocation before fail-closed error output is explicit and test-covered.
- The fail-closed model makes future service invocation failure behavior visible to operators while preserving the blocked state.
- Keeping partial persistence, quota mutation, and raw deletion disallowed protects quota correctness, usage/rejected source separation, and raw event safety.

Detailed record:

- docs/project-context/decisions/2026-07-08-analytics-rollup-scheduler-command-dry-run-service-invocation-fail-closed-error-model.md
### 2026-07-08 - Rollup scheduler command dry-run service invocation wiring readiness remains review-only

Decision:

- Expose dryRunServiceInvocationWiringReadinessReview under dryRunDesignReview for command:dry-run scheduler preview requests.
- Keep currentWiringState=not-wired.
- Keep readyForServiceInvocationWiring=false.
- Keep serviceInvocationCurrentlyAllowed=false.
- Keep command dry-run blocked with backfill-service-invocation-not-wired.
- Keep the readiness review command-only and dry-run-only for future service invocation wiring.
- Require mapped dry-run service inputs, adapter previews before wiring, source separation, event limit guardrails, max bucket guardrails, operator safety output, fail-closed service errors, and Docker/PostgreSQL runtime validation before future service invocation wiring.
- Do not call AnalyticsRollupBackfillService.runBackfill from scheduler preview.
- Do not read raw events, persist rollups, affect quota counting, or delete raw events.

Rationale:

- The scheduler command should not jump from adapter previews to real service invocation without an explicit wiring readiness boundary.
- The readiness review makes future wiring prerequisites visible in operator JSON output while preserving the blocked state.
- Keeping service invocation disallowed protects quota correctness, usage/rejected source separation, and raw event safety.

Detailed record:

- docs/project-context/decisions/2026-07-08-analytics-rollup-scheduler-command-dry-run-service-invocation-wiring-readiness-review.md

### 2026-07-08 - Rollup scheduler command dry-run adapter previews remain command-output-only

Decision:

- Expose dryRunServiceAdapterPreviews under dryRunDesignReview for command:dry-run scheduler preview requests when --event-limit is provided.
- Add --event-limit parsing for scheduler preview command args in both --option value and --option=value forms.
- Keep command dry-run blocked with backfill-service-invocation-not-wired.
- Keep adapter previews source-separated for usage and rejected mapped dry-run service inputs.
- Keep dryRunServiceAdapterPreviews=null when command dry-run is requested without --event-limit.
- Keep process-local and external scheduler dry-run blocked with automatic-trigger-not-wired and dryRunDesignReview=null, even when --event-limit is provided.
- Reject invalid --event-limit values before printing output.
- Do not call AnalyticsRollupBackfillService.runBackfill from scheduler preview.
- Do not read raw events, persist rollups, affect quota counting, or delete raw events.

Rationale:

- Adapter preview output is useful for operator review, but it must not be confused with real service invocation.
- Requiring an explicit eventLimit keeps the future service boundary guardrail visible before wiring.
- Keeping automatic triggers without dryRunDesignReview avoids leaking command-only dry-run semantics into process-local or external scheduler execution.
- Future service invocation wiring still requires explicit approval, fail-closed service errors, operator safety output, source separation, max bucket guardrails, and Docker/PostgreSQL runtime validation.

Detailed record:

- docs/project-context/decisions/2026-07-08-analytics-rollup-scheduler-command-dry-run-service-adapter-preview-output-integration.md

### 2026-07-08 - Rollup scheduler command dry-run service adapter boundary remains contract-model-only

Decision:

- Add a contract-model-only service adapter boundary from mapped dry-run AnalyticsRollupBackfillRunInput contracts to planned rollup backfill service dry-run result previews.
- Expose dryRunServiceAdapterBoundaryDesign for command:dry-run scheduler preview output.
- Keep currentAdapterState=not-implemented.
- Keep adapterCurrentlyAllowed=false and serviceInvocationCurrentlyAllowed=false.
- Keep adapterMayInvokeBackfillService=false, adapterMayReadEvents=false, adapterMayPersistRollups=false, quotaCountingChangeAllowed=false, and rawEventDeletionAllowed=false.
- Keep command dry-run blocked with backfill-service-invocation-not-wired.
- Keep process-local and external scheduler dry-run blocked with automatic-trigger-not-wired.
- Do not call AnalyticsRollupBackfillService.runBackfill from scheduler preview.

Rationale:

- The scheduler command should not jump from mapped request inputs to real service invocation without a visible adapter boundary.
- Future wiring must define adapter preview output, service invocation wiring, fail-closed service errors, operator safety output, source separation, event limit guardrails, max bucket guardrails, and Docker/PostgreSQL runtime validation first.

Detailed record:

- docs/project-context/decisions/2026-07-08-analytics-rollup-scheduler-command-dry-run-service-adapter-boundary-design.md

---
### 2026-07-08 - Rollup scheduler command dry-run request mapper remains mapper-only

Decision:

- Add a scheduler dry-run backfill request mapper from scheduler runner backfill request contracts to dry-run AnalyticsRollupBackfillRunInput contracts.
- Expose dryRunServiceInvocationRequestMapperDesign for command:dry-run scheduler preview output.
- Keep currentMapperState=implemented-model-only.
- Keep mapperCurrentlyAllowed=true but serviceInvocationCurrentlyAllowed=false.
- Keep mapperMayInvokeBackfillService=false, mapperMayReadEvents=false, mapperMayPersistRollups=false, quotaCountingChangeAllowed=false, and rawEventDeletionAllowed=false.
- Keep command dry-run blocked with backfill-service-invocation-not-wired.
- Keep process-local and external scheduler dry-run blocked with automatic-trigger-not-wired.

Rationale:

- The scheduler command should not jump from request mapping to real service invocation without a visible service adapter boundary.
- Future wiring must define service adapter semantics, fail-closed service errors, operator safety output, source separation, event limit guardrails, max bucket guardrails, and Docker/PostgreSQL runtime validation first.

Detailed record:

- docs/project-context/decisions/2026-07-08-analytics-rollup-scheduler-command-dry-run-service-invocation-request-mapper-design.md

---
### 2026-07-07 - Rollup scheduler command dry-run service invocation implementation remains design-only

Decision:

- Expose dryRunServiceInvocationImplementationDesign for command:dry-run scheduler preview output.
- Keep currentImplementationState=not-implemented.
- Keep implementationCurrentlyAllowed=false and serviceInvocationCurrentlyAllowed=false.
- Keep dry-run service event reads, rollup persistence, quota counting changes, and raw event deletion disallowed.
- Keep command dry-run blocked with backfill-service-invocation-not-wired.
- Keep process-local and external scheduler dry-run blocked with automatic-trigger-not-wired.

Rationale:

- The scheduler command should not jump from contract review to real service invocation without a visible implementation boundary.
- Future wiring must define the service adapter, request mapper, source separation, event limit guardrails, max bucket guardrails, operator safety output, fail-closed service errors, and Docker/PostgreSQL runtime validation first.

Detailed record:

- docs/project-context/decisions/2026-07-07-analytics-rollup-scheduler-command-dry-run-service-invocation-implementation-design.md

---

### 2026-07-07 - Analytics rollup scheduler command dry-run invocation design review stays review-only

Decision:

- Keep npm run analytics:rollup:scheduler-preview as a DB-free, non-destructive preview command.
- Add dryRunInvocationDesignReview under dryRunDesignReview for command:dry-run requests.
- Keep command dry-run blocked with backfill-service-invocation-not-wired.
- Document the future command-to-backfill-service dry-run boundary.
- Keep commandTriggerRequired=true and automaticTriggerAllowed=false.
- Keep executionModeAllowed=false so execute remains separate from dry-run design.
- Keep dryRunMayReadEvents=false, dryRunMayPersistRollups=false, dryRunMayAffectQuotaCounting=false, and dryRunMayDeleteRawEvents=false.
- Require per-source invocation, source separation, event limit guardrails, max bucket guardrails, and Docker/PostgreSQL runtime validation before future wiring.
- Keep process-local:dry-run blocked with automatic-trigger-not-wired and dryRunDesignReview=null.
- Keep execute mode blocked.
- Do not create scheduled/background jobs.
- Do not invoke the backfill service or execute backfill.
- Do not read raw events or persist rollups.
- Do not change quota counting, usage recording, rejected event recording, rollup read APIs, or summary APIs.
- Do not delete raw events.

Reason:

- Command dry-run service invocation is the next risk boundary, so its design review must be visible before any service call is wired.
- The design review clarifies that future dry-run invocation may only be command-triggered and guardrail-bound.
- Keeping event reads, persistence, quota changes, and raw event deletion explicitly disallowed prevents preview output from becoming execution by accident.
- Keeping automatic triggers separate prevents background/process-local semantics from being introduced implicitly.

Detailed record:

- docs/project-context/decisions/2026-07-07-analytics-rollup-scheduler-command-dry-run-invocation-design-review.md

---
### 2026-07-07 - Analytics rollup scheduler command dry-run invocation contract stays review-only

Decision:

- Keep npm run analytics:rollup:scheduler-preview as a DB-free, non-destructive preview command.
- Add dryRunInvocationContract under dryRunDesignReview for command:dry-run requests.
- Add dryRunInvocationReadiness under dryRunDesignReview for command:dry-run requests.
- Keep command dry-run blocked with backfill-service-invocation-not-wired.
- Derive plannedBackfillRequestCount, plannedSources, and plannedGranularity from the scheduler runner plan.
- Keep command dry-run currently not wired and not allowed to invoke the backfill service, read events, persist rollups, change quota counting, or delete raw events.
- Report scheduler-runner-not-ready readiness for skipped runner plans.
- Keep process-local:dry-run blocked with automatic-trigger-not-wired and dryRunDesignReview=null.
- Keep execute mode blocked.
- Do not create scheduled/background jobs.
- Do not invoke the backfill service or execute backfill.
- Do not read raw events or persist rollups.
- Do not change quota counting, usage recording, rejected event recording, rollup read APIs, or summary APIs.
- Do not delete raw events.

Reason:

- Command dry-run invocation is the next risk boundary after design review, so the contract must be visible before wiring.
- Source-aware readiness lets reviewers see what the scheduler runner would plan without confusing preview output with execution.
- Keeping all invocation permissions false prevents accidental backfill service calls, event reads, persistence, or quota behavior changes.
- Keeping automatic trigger dry-run separate prevents background/process-local semantics from being introduced implicitly.

Detailed record:

- docs/project-context/decisions/2026-07-07-analytics-rollup-scheduler-command-dry-run-invocation-contract-design.md

---
### 2026-07-07 - Analytics rollup scheduler command dry-run remains blocked while design requirements become explicit

Decision:

- Keep npm run analytics:rollup:scheduler-preview as a DB-free, non-destructive preview command.
- Add dryRunDesignReview under executionDecision.wiringReview for command:dry-run requests.
- Keep command dry-run blocked with backfill-service-invocation-not-wired.
- Make command dry-run currentlyWired=false and mustRemainNonDestructive=true explicit.
- Require explicit command invocation, backfill service dry-run contract, event limit guardrail, source separation, Docker/PostgreSQL runtime validation, quota safety, and raw event deletion prohibition before any future dry-run wiring.
- Keep process-local:dry-run blocked with automatic-trigger-not-wired and dryRunDesignReview=null.
- Keep execute mode blocked.
- Do not create scheduled/background jobs.
- Do not invoke the backfill service or execute backfill.
- Do not read raw events or persist rollups.
- Do not change quota counting, usage recording, rejected event recording, rollup read APIs, or summary APIs.
- Do not delete raw events.

Reason:

- Command dry-run is the next safe review boundary after scheduler wiring review, but it must not silently start reading events or invoking backfill service.
- dryRunDesignReview makes pre-wiring requirements visible in operator JSON output.
- Keeping automatic trigger dry-run separate prevents process-local/background semantics from being confused with command-only dry-run review.
- The command remains DB-free so validation stays lightweight until real backfill service invocation is explicitly designed.

Detailed record:

- docs/project-context/decisions/2026-07-07-analytics-rollup-scheduler-command-dry-run-design-review.md

---


### 2026-07-07 - Analytics rollup scheduler execution wiring stays command-preview-only until dry-run is explicitly designed

Decision:

- Keep npm run analytics:rollup:scheduler-preview as a DB-free, non-destructive preview command.
- Harden scheduler preview args so both --option value and --option=value forms are accepted.
- Keep command-triggered preview as the only allowed scheduler execution capability.
- Split blocked reasons for future command wiring:
  - dry-run mode is blocked with backfill-service-invocation-not-wired.
  - execute mode is blocked with backfill-execution-not-wired.
- Expose executionDecision.wiringReview in scheduler preview output.
- Set wiringReview.currentCapability to command-preview-only.
- Recommend command dry-run design before any backfill service invocation.
- Recommend command dry-run before command execute.
- Keep process-local and external-scheduler triggers unwired.
- Do not create scheduled/background jobs.
- Do not invoke the backfill service or execute backfill.
- Do not read raw events or persist rollups.
- Do not change quota counting, usage recording, rejected event recording, rollup read APIs, or summary APIs.
- Do not delete raw events.

Reason:

- Scheduler execution should not jump directly from preview to backfill execution.
- Command dry-run and command execute have different risk levels and need separate blocked reasons.
- wiringReview makes the current capability and next safe wiring step visible in operator JSON output.
- Keeping the command DB-free preserves the safe validation model from the scheduling and scheduler preview foundations.

Detailed record:

- docs/project-context/decisions/2026-07-07-analytics-rollup-scheduler-execution-wiring-review.md

---

### 2026-07-07 - Analytics rollup scheduler execution stays preview-only and explicitly blocked unless wired

Decision:

- Add a scheduler execution decision model after the scheduler runner preview foundation.
- Expose executionDecision in npm run analytics:rollup:scheduler-preview output.
- Add scheduler preview args for --execution-trigger command|process-local|external-scheduler.
- Add scheduler preview args for --execution-mode preview|dry-run|execute.
- Allow command-triggered preview only.
- Block process-local and external-scheduler triggers until automatic execution is explicitly wired.
- Block dry-run and execute modes until backfill service invocation and execution semantics are explicitly wired.
- Keep the command DB-free and non-destructive.
- Do not create scheduled/background jobs.
- Do not invoke the backfill service or execute backfill.
- Do not read raw events or persist rollups.
- Do not change quota counting, usage recording, rejected event recording, rollup read APIs, or summary APIs.
- Do not delete raw events.

Reason:

- Future scheduler execution needs explicit operator-visible boundaries before any work is wired.
- Showing blocked decisions for unwired triggers/modes prevents accidental interpretation of preview output as execution.
- Keeping the decision DB-free preserves the safe validation model from Sprint 32 and Sprint 33.

Detailed record:

- docs/project-context/decisions/2026-07-07-analytics-rollup-scheduler-execution-boundary-design.md

---

### 2026-07-07 - Analytics rollup scheduler runner starts as preview-only boundary

Decision:

- Add a scheduler runner contract/model after the schedule preview foundation exists.
- Convert schedule plans into dry-run backfill request contracts.
- Expose npm run analytics:rollup:scheduler-preview as a DB-free operator-facing preview command.
- Keep the command preview-only and non-destructive.
- Do not create scheduled/background jobs.
- Do not invoke the backfill service or execute backfill.
- Do not read raw events or persist rollups from the scheduler preview command.
- Do not change quota counting, usage recording, rejected event recording, rollup read APIs, or summary APIs.
- Do not delete raw events.

Reason:

- A scheduler runner boundary should be visible and testable before any real background execution exists.
- Dry-run request contracts make future backfill wiring explicit without coupling preview to persistence.
- Keeping the command DB-free allows runtime validation without Docker/PostgreSQL while preserving source separation and quota safety.

Detailed record:

- docs/project-context/decisions/2026-07-07-analytics-rollup-scheduler-runner-design.md

---

### 2026-07-06 - Analytics rollup scheduling starts as preview-only foundation

Decision:

- Add rollup schedule planning contracts before any real background scheduler exists.
- Add a schedule preview summary with explicit safety fields.
- Add an operator-facing npm run analytics:rollup:schedule-preview command.
- Keep the command DB-free and preview-only.
- Do not create scheduled/background jobs.
- Do not read raw events or persist rollups from the schedule preview command.
- Do not change quota counting, usage recording, rejected event recording, rollup read APIs, or summary APIs.
- Do not delete raw events.

Reason:

- Scheduled rollups need a clear operator-visible planning boundary before background execution is introduced.
- Previewing the intended window and safety flags reduces the risk of accidentally coupling scheduling to persistence or quota behavior.
- Keeping the command DB-free allows runtime command validation without Docker/PostgreSQL while preserving source separation.

Detailed record:

- docs/project-context/decisions/2026-07-06-analytics-rollup-scheduling-foundation.md

---

### 2026-07-06 - Analytics retention operator preview command fails fast before DB candidate reads

Decision:

- Harden npm run analytics:retention:operator-preview after exposing the DB-backed operator preview command.
- Preserve non-destructive safety fields in output and tests.
- Validate execution args before DB-backed candidate reads.
- Reject invalid execute-only flags such as dry-run hard-delete-limit before reading candidate counts.
- Lock usage text and safety wording with tests.
- Do not call deleteCandidates.
- Do not wire the Prisma delete repository into the operator preview command.
- Do not expose a retention execute command, delete API, scheduled job, or quota path in Sprint 31.
- Do not change quota counting, usage recording, rejected event recording, rollup reads, or summary APIs.

Reason:

- The operator preview command is operator-facing and DB-backed, so unsafe CLI input should fail before touching PostgreSQL candidate reads.
- The Prisma delete repository foundation exists, so the preview command must keep an explicit non-destructive boundary.
- Locking JSON safety and usage contracts reduces future regression risk before any retention execution design is considered.

Detailed record:

- docs/project-context/decisions/2026-07-06-analytics-retention-operator-preview-hardening.md

---

### 2026-07-06 - Analytics retention operator preview command stays read-only and non-destructive

Decision:

- Expose npm run analytics:retention:operator-preview as an operator-facing preview command.
- Use the existing Prisma candidate read repository for count-only DB-backed candidate counts.
- Build output through the candidate-read execution service preview and operator preview output model.
- Return explicit safety flags including commandDeletesEvents=false, candidateReadOnly=true, deleteRepositoryExecuted=false, deleteAllowed=false, and destructiveExecutionPerformed=false.
- Support execute-preview args for guard inspection without enabling delete execution.
- Keep the existing analytics:retention:execution-preview command DB-free with deleteImplementationAvailable=false.
- Do not call deleteCandidates.
- Do not wire the Prisma delete repository into the operator preview command.
- Do not expose a retention execute command, delete API, scheduled job, or quota path in Sprint 30.
- Do not change quota counting, usage recording, rejected event recording, rollup reads, or summary APIs.

Reason:

- Operators need DB-backed candidate counts before any destructive retention execution is considered.
- A dedicated operator preview command validates the service orchestration layer against PostgreSQL while keeping deletion unavailable.
- Explicit safety fields make accidental destructive behavior visible in the output contract.
- Keeping delete repository wiring out of the command protects raw analytics data and quota correctness.

Detailed record:

- docs/project-context/decisions/2026-07-06-analytics-retention-operator-preview-command.md

---

### 2026-07-06 - Analytics retention execution service orchestration stays non-destructive

Decision:

- Add service-level retention execution preview orchestration after repository safety primitives exist.
- Compose retention policy, plan, execution args, execution guard, delete batch plan, delete operation plan, and optional repository preparation.
- Add a compact service summary model for future operator preview output.
- Add a candidate count loader that normalizes count-only candidate read repository output.
- Add candidate-read preview composition over the existing read-only candidate repository.
- Keep service previews from calling deleteCandidates.
- Keep the existing analytics:retention:execution-preview command DB-free with deleteImplementationAvailable=false.
- Do not expose a retention execute command, delete API, scheduled job, or quota path in Sprint 29.
- Do not change quota counting, usage recording, rejected event recording, rollup reads, or summary APIs.

Reason:

- The bounded Prisma delete repository exists, so service-level orchestration must remain preview-first and non-destructive.
- Count-only candidate loading lets future operator previews show realistic planning data without deleting raw events.
- A summary model provides a safer output contract before any command or API wiring is considered.
- Keeping delete execution unavailable protects quota correctness and raw analytics event separation.

Detailed record:

- docs/project-context/decisions/2026-07-06-analytics-retention-execution-service-orchestration-preview.md

---

### 2026-07-06 - Analytics retention delete repository primitives stay behind guardrails

Decision:

- Add repository-level retention delete safety primitives only after execution guardrails and delete batch planning existed.
- Add a repository safety contract that requires source, cutoff, requested limit, candidate recheck, and batch-plan safety.
- Add a repository port/executor that rechecks candidates before prepared delete execution.
- Add an operation planner that derives repository requests from retention plan cutoffs and delete batch max counts.
- Add a Prisma repository implementation that selects bounded candidate IDs before deleting.
- Keep usage and rejected event delete paths separate.
- Keep analytics:retention:execution-preview reporting deleteImplementationAvailable=false.
- Do not expose a retention execute command, API, scheduled job, or quota path in Sprint 28.
- Do not change quota counting, usage recording, rejected event recording, rollup reads, or summary APIs.

Reason:

- Retention deletion is destructive and must be built behind layered safety checks.
- Selecting bounded IDs before delete avoids unbounded cutoff-based deleteMany operations.
- Keeping the repository unexposed preserves operator safety while allowing focused unit and runtime validation.
- Maintaining event separation protects quota correctness and rejected/security traffic observability.

Detailed record:

- docs/project-context/decisions/2026-07-06-analytics-retention-delete-repository-safety.md

---

### 2026-07-06 - Analytics retention execution starts with guardrails and preview only

Decision:

- Add execution guard model before any delete repository or execute command.
- Require explicit execute mode, confirmation phrase, and hard delete limit for execute preview.
- Add execution preview composition over policy, plan, args, and guard decision.
- Add npm run analytics:retention:execution-preview command.
- Keep execution preview DB-free and delete-free.
- Return deleteImplementationAvailable=false from execution preview.
- Add delete batch plan model with candidate recheck requirement and one total hard delete cap.
- Do not delete raw usage or rejected events in Sprint 27.
- Do not change quota counting, usage recording, rejected event recording, rollup reads, or summary APIs.

Reason:

- Retention execution is destructive and must be guarded before any repository-level delete primitive exists.
- A DB-free execution preview lets operators inspect guard decisions without touching data.
- Candidate recheck and hard delete limits need to be modeled before implementing delete operations.
- Keeping usage and rejected paths separate preserves current data ownership and quota safety.

---

### 2026-07-05 - Analytics retention starts as dry-run-only safety foundation

Decision:

- Add retention policy parsing and a retention plan model before any delete execution.
- Keep usage and rejected retention policies separate.
- Add minimum retention day guardrails.
- Add a read-only candidate repository that counts rows older than computed cutoffs.
- Add a dry-run service that returns policy, plan, and candidate count output.
- Add a dry-run command exposed as npm run analytics:retention:dry-run.
- Return dryRunOnly=true and deleteAllowed=false in retention previews.
- Reject execute mode in Sprint 26.
- Do not delete raw usage or rejected events.
- Do not change quota counting, usage recording, rejected event recording, rollup reads, or summary APIs.

Reason:

- Retention can affect quota and analytics correctness if introduced too quickly.
- A dry-run-only command gives operators visibility into candidate impact before any destructive behavior exists.
- Keeping usage and rejected event retention separate preserves current data ownership and security/usage separation.
- Rejecting execute mode prevents accidental raw event deletion before explicit guardrails are designed.

---

### 2026-07-05 - Analytics rollup read model stays read-only and separate from summaries

Decision:

- Add a read-only analytics rollup query model.
- Add separate read repositories for usage rollups and rejected rollups.
- Add a small read service that dispatches by source.
- Expose GET /internal/admin/analytics/rollups for internal/admin rollup reads.
- Require source, from, to, and granularity.
- Support usage-specific cacheStatus filtering only for usage rollups.
- Support rejected-specific rejectionReason filtering only for rejected rollups.
- Keep existing usage and rejected summary APIs on raw event tables.
- Keep quota counting on gateway.api_usage_events.
- Do not add retention deletion or scheduled/background jobs in Sprint 25.

Reason:

- Rollup tables need an observable read path before retention work.
- A separate read-only endpoint validates rollup table access without changing existing analytics semantics.
- Keeping summary APIs event-based prevents accidental behavior changes.
- Keeping quota counting on raw successful usage events protects quota correctness.

---

### 2026-07-05 - Analytics rollup persistence uses separate tables and dimension hashes

Decision:

- Add separate rollup tables for successful usage and rejected/security traffic.
- Use dimensionHash as a stable unique upsert key for rollup persistence.
- Build dimensionHash from rollup dimensions only, not metrics.
- Keep usage and rejected rollup repositories separate.
- Add an internal persistence service that aggregates raw-shaped events and delegates to repositories.
- Do not switch runtime summary APIs to rollup reads in Sprint 23.
- Do not change quota counting, usage recording, rejected event recording, retention, or runtime APIs.

Reason:

- PostgreSQL unique constraints over nullable dimensions are not safe for idempotent rollup upserts because NULL values do not compare as equal.
- A dimension hash gives a stable upsert key across nullable dimensions.
- Separate usage and rejected rollup tables preserve existing data ownership and quota safety.
- Keeping runtime reads on raw event tables avoids silently changing analytics or quota behavior before a backfill strategy exists.

---

### 2026-07-05 - Analytics rollup foundation starts as code/test-only helpers

Decision:

- Add UTC time bucket helpers for future rollups.
- Add rollup window planner for partial bucket rebuild planning.
- Add usage event aggregate builder for future successful usage rollups.
- Add rejected event aggregate builder for future rejected/security traffic rollups.
- Keep helpers code/test-only in Sprint 22.
- Do not add migrations, rollup tables, retention jobs, backfill commands, runtime API changes, quota rewrites, or recorder rewrites.

Reason:

- Rollup and retention need careful foundations around time boundaries, backfill scope, partial recalculation, and quota correctness.
- Code/test-only helpers provide a safe foundation before persistence.
- Keeping successful usage and rejected/security event aggregation separate preserves current data ownership and quota safety.

---

### 2026-07-05 - Event investigation uses cursor pagination for large listings

Decision:

- Add cursor pagination to successful usage events listing.
- Add cursor pagination to rejected events listing.
- Use occurredAt and id as cursor fields because both listings sort by occurredAt desc and id desc.
- Return nextCursor in raw event listing pagination responses.
- Reject requests that combine offset and cursor.
- Reject cursor on rejected event summary because cursor is only meaningful for raw event listing.
- Do not change usage recording, rejected event recording, quota counting, migrations, retention jobs, or rollup tables.

Reason:

- Offset pagination becomes less efficient and less stable on larger event datasets.
- Cursor pagination improves admin investigation continuity without changing storage schema.
- Keeping this as read-only listing behavior protects quota correctness and event separation.

---

### 2026-07-04 - Successful usage event investigation uses read-only listing API

Decision:

- Add raw successful usage event listing over gateway.api_usage_events.
- Expose GET /internal/admin/usage/events.
- Use safe pagination with limit, offset, total, and hasNextPage.
- Support filters by time range, route, method, status code, cache status, auth source, API key, and consumer.
- Keep rejected/security traffic in gateway.api_rejected_events.
- Do not change quota counting, usage recorder behavior, retention jobs, rollup tables, or migrations.

Reason:

- Admins need raw successful usage investigation similar to rejected event drilldown.
- A read-only listing endpoint is enough for Sprint 20.
- Keeping successful usage and rejected/security traffic separate protects quota correctness.

---

### 2026-07-04 - Usage analytics retention and rollup remain design-only in Sprint 19

Decision:

- Add filtered successful usage summary APIs over gateway.api_usage_events.
- Keep retention and rollup as documented design direction in Sprint 19.
- Do not add retention jobs, aggregate rollup tables, or migrations yet.
- Keep successful usage events and rejected/security events separate.

Reason:

- Filtered summaries provide immediate admin analytics value.
- Retention and rollup need careful schema and lifecycle design before implementation.
- gateway.api_usage_events is still used for quota counting, so changes must not corrupt quota behavior.

Detailed record:

- docs/project-context/decisions/2026-07-04-usage-analytics-retention-rollup-design.md

---

### 2026-07-04 - Rejected event drilldown uses filterable read endpoints

Decision:

- Keep rejected event drilldown as read-only admin APIs over gateway.api_rejected_events.
- Add raw rejected event listing with safe pagination.
- Add filters to rejected events summary.
- Reuse the same query parser and filter model for rejected summary and listing APIs.
- Keep gateway.api_usage_events for successful proxy/cache usage and quota counting.

Reason:

- Admins need both aggregate and raw rejected traffic visibility.
- Filterable read endpoints are enough for Sprint 18 without introducing rollup tables.
- Keeping successful usage and rejected/security traffic separate protects quota correctness.

---

### 2026-07-04 - Rejected requests use a separate table

Decision:

- Store failed auth, rate-limited, and quota-denied requests in gateway.api_rejected_events.
- Keep gateway.api_usage_events for successful proxy/cache usage and quota counting.
- Add admin summary endpoint for rejected request observability.

Reason:

- Quota enforcement counts gateway.api_usage_events.
- Recording rejected traffic in that table would risk corrupting quota counts.
- A separate table keeps usage analytics and security/rejection observability cleanly separated.

Detailed record:

- docs/project-context/decisions/2026-07-04-rejected-events-side-table.md

---

### 2026-07-03 - Keep main documentation compact

Decision:

- Keep README, architecture overview, requirements, current progress, AI handoff, and decision log compact.
- Move detailed sprint history into docs/sdlc/sprint-history/.
- Move command-heavy validation into docs/runbooks/.
- Move long decisions into docs/project-context/decisions/.

Reason:

- Main docs were getting too large.
- Large docs make future AI handoff and maintenance slower.
- Compact role-based docs are easier to update safely.

Detailed record:

- docs/project-context/decisions/2026-07-03-documentation-compaction.md

---

### 2026-07-07 - Rollup scheduler command dry-run service invocation contract remains review-only

Decision:

- Expose dryRunServiceInvocationContractReview for command:dry-run scheduler preview output.
- Keep currentServiceInvocationState=not-wired and serviceInvocationCurrentlyAllowed=false.
- Keep dry-run service event reads, rollup persistence, quota counting changes, and raw event deletion disallowed.
- Keep command dry-run blocked with backfill-service-invocation-not-wired.
- Keep process-local and external scheduler dry-run blocked with automatic-trigger-not-wired.

Reason:

- Future command-to-backfill-service dry-run wiring needs a clear service boundary before implementation.
- The scheduler preview must remain DB-free, preview-only, and non-destructive until explicit wiring and Docker/PostgreSQL validation are approved.
- Usage and rejected event separation and quota correctness must remain unchanged.

Detailed record:

- docs/project-context/decisions/2026-07-07-analytics-rollup-scheduler-command-dry-run-service-invocation-contract-review.md

---

### 2026-07-10 - Use a bounded full-access/read-only admin authorization boundary

Decision:

- Fail application startup when an exact `/internal/admin` route or descendant is registered without marked admin authentication middleware.
- Preserve `ADMIN_API_KEY` as the full-access administration credential.
- Support optional `ADMIN_READ_ONLY_API_KEY` access for `GET`, `HEAD`, and `OPTIONS`.
- Reject read-only mutations with `ADMIN_API_KEY_READ_ONLY`.
- Verify configured administration credentials through the existing timing-safe API key hashing helper.
- Normalize `x-admin-actor` as audit attribution metadata with a safe fallback.

Reason:

- Future admin routes must fail closed when authentication is accidentally omitted.
- A minimal read/write split improves operational safety without introducing database-backed enterprise IAM.
- Timing-safe verification avoids direct raw secret equality checks.
- Centralized actor attribution keeps audit fields consistent while avoiding false claims of authenticated user identity.

Boundaries:

- No Admin UI.
- No database-backed administrator, organization, tenant, or general role model.
- No migration.
- No quota, retention, scheduler, or raw event deletion behavior changes.

Detailed record:

- docs/project-context/decisions/2026-07-10-minimal-admin-rbac-hardening.md

---

## Historical Decisions

See:

- docs/sdlc/sprint-history/
- docs/project-context/decisions/

## Sprint 55 Decision - Background Scheduler Runtime Wiring with guardrails

Sprint 55 accepts a narrow runtime wiring step for analytics rollup scheduling:

- Direct CLI `process-local` + `dry-run` may invoke the existing dry-run backfill service adapter when explicit guardrails are satisfied.
- `backgroundScheduler.runtimeGate` exposes operator-visible readiness and safety data.
- External scheduler runtime execution remains closed.
- Background execute remains closed.
- Scheduled/background job creation remains closed.
- Quota mutation, raw event deletion, and retention execution remain blocked.

Validation:

- 129 test files / 940 tests passed.
- Typecheck passed.
- Build passed.
- Docker/PostgreSQL runtime validation passed with 7 migrations applied and 2 source-separated `service-dry-run-invoked` results.

<!-- pulsegate:sprint-64:start -->
## 2026-07-11 â€” Sprint 64 analytics operations remain observational

**Decision:** expose rollup inspection, scheduler preview, and retention preview as read-only Admin Dashboard resources.

**Rationale:**

- Operators need visibility into persisted rollups, scheduler contract state, and retention candidate counts.
- Operational visibility must not silently open runtime execution or deletion paths.
- Fixed server-owned scheduler and retention inputs prevent browser-controlled execution semantics.
- Strict DTO boundaries prevent secrets or unsafe state from crossing the Dashboard BFF.

**Consequences:**

- Scheduler preview is pure contract output and reports runtime invocation closed.
- Retention preview uses the existing dry-run candidate-count repository only.
- No delete repository, execution service, scheduled job, backfill adapter, or mutation route is introduced.
- Rollups remain derived analytics and cannot become quota, billing, authentication, or audit truth.
<!-- pulsegate:sprint-64:end -->
