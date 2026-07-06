# Sprint 27 - Analytics Retention Execution Guardrails

## Status

Done.

## Version

v0.28.0

## Goal

Add safe execution guardrails for future analytics retention deletion without deleting raw events yet.

Sprint 27 intentionally stopped at guardrails, preview composition, command preview, and delete batch planning.

No retention delete repository, execute command, scheduled job, migration, quota change, usage recorder change, or rejected recorder change was added.

---

## Commits

- 4d61bc0 feat(gateway): add analytics retention execution guard
- a90204a feat(gateway): add analytics retention execution args parser
- ada6dd5 feat(gateway): add analytics retention execution preview
- 6cdbba7 feat(gateway): add analytics retention execution preview command
- aa7fb49 feat(gateway): add analytics retention delete batch plan

---

## Checkpoints

### Checkpoint 27.1 - Analytics Retention Execution Guard Model Foundation

Added a pure TypeScript execution guard model.

The guard models:
- dry-run as the safe default
- explicit execute mode
- required execute confirmation
- required hard delete limit
- retention disabled blocking
- missing source plan blocking
- deleteAllowed decision output

No DB read, DB write, delete, migration, or runtime API change was added.

### Checkpoint 27.2 - Analytics Retention Execution Command Args Foundation

Added an execution args parser for:
- --mode dry-run|execute
- --confirm-execute I_UNDERSTAND_ANALYTICS_RETENTION_DELETE
- --hard-delete-limit positive integer

The parser rejects unknown args, duplicate args, missing values, unsafe confirmation values, invalid limits, and execute-only flags in dry-run mode.

### Checkpoint 27.3 - Analytics Retention Execution Preview Composition

Added a pure composition model connecting:
- retention policy parsing
- retention plan creation
- execution args parsing
- execution guard decision

The preview output includes deleteImplementationAvailable=false.

### Checkpoint 27.4 - Analytics Retention Execution Preview Command

Added:

    npm run analytics:retention:execution-preview --workspace api-gateway -- [options]

The command:
- does not connect to Prisma
- does not connect to PostgreSQL
- does not delete raw events
- prints JSON preview only
- reports deleteImplementationAvailable=false

### Checkpoint 27.5 - Analytics Retention Delete Batch Plan Model

Added a pure TypeScript delete batch plan model.

The model:
- requires execution guard success
- requires hardDeleteLimit
- requires candidate counts for selected sources
- models candidate recheck requirement
- applies hardDeleteLimit as one total cap across selected sources
- keeps usage and rejected source plans separate
- blocks no-candidate delete plans

No delete repository or execute command was added.

---

## Final Validation

Final validation passed:
- npm run test -> 85 test files / 591 tests passed
- npm run typecheck -> passed
- npm run build -> passed
- PostgreSQL migration deploy -> passed, 7 migrations found, no pending migrations
- analytics:retention:execution-preview dry-run preview -> passed
- analytics:retention:execution-preview execute preview -> passed with deleteImplementationAvailable=false
- analytics:retention:dry-run DB-backed candidate validation -> passed with candidateCount=0, dryRunOnly=true, deleteAllowed=false

---

## Safety Notes

Sprint 27 did not:
- delete raw usage events
- delete raw rejected events
- add retention execute mode to the existing dry-run command
- add a delete repository
- add a scheduled retention job
- add a migration
- change quota counting
- change usage recorder
- change rejected event recorder
- switch summary APIs to rollup reads

Important invariants:
- gateway.api_usage_events remains the source of truth for successful usage analytics and quota counting.
- gateway.api_rejected_events remains the source of truth for rejected/security traffic.
- Rollup tables are not used for quota counting.
- Retention preview and dry-run are not used for quota counting.

---

## Recommended Next Sprint

Sprint 28 - Analytics Retention Execution Repository Safety Foundation

Recommended scope:
- Add repository-level delete safety primitives behind Sprint 27 guardrails.
- Keep delete behind explicit guard decision.
- Require candidate recheck before delete.
- Require hard delete limit before delete.
- Keep usage and rejected delete paths separate.
- Do not expose an operator-facing execute command until explicitly approved.
