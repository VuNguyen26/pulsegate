# 2026-07-03 - Documentation Compaction and Archive Strategy

## Status

Accepted.

## Context

By the end of Sprint 13, PulseGate documentation had become very detailed but started to repeat the same information across several files.

The main files had overlapping responsibilities:

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/AI_HANDOFF.md
- docs/project-context/DECISION_LOG.md

Repeated content included:

- Sprint history
- Runtime validation commands
- Manual API testing commands
- Route management examples
- API key lifecycle examples
- Runtime reload examples
- Long architecture explanations
- Long decision history
- Future roadmap details

This made the documentation harder to update after every sprint.

## Decision

From Sprint 14 onward, keep main documentation files compact and role-based.

Use archive and runbook files for long details.

## New Documentation Structure

docs/sdlc/sprint-history/
  -> detailed sprint archive files

docs/project-context/decisions/
  -> detailed decision records

docs/runbooks/
  -> manual validation and operational command guides

## Main File Responsibilities

README.md
  -> public-facing project summary, badges, quick start, architecture diagram, roadmap links

docs/architecture/overview.md
  -> current architecture only, not full sprint history

docs/sdlc/requirements.md
  -> current functional requirements, non-functional requirements, constraints, and future requirements

docs/project-context/CURRENT_PROGRESS.md
  -> current version, latest completed sprint, validation status, limitations, and next step

docs/project-context/AI_HANDOFF.md
  -> concise context for continuing work in a new AI chat

docs/project-context/DECISION_LOG.md
  -> decision index and latest important decisions, with long records moved to docs/project-context/decisions/

## Archive Files Added

docs/sdlc/sprint-history/sprint-13.md

Purpose:

Store Sprint 13 details so main docs do not need to repeat the full Sprint 13 history.

## Runbooks Added

docs/runbooks/local-validation.md
docs/runbooks/admin-route-management.md
docs/runbooks/api-key-lifecycle.md
docs/runbooks/runtime-reload.md

Purpose:

Store PowerShell/manual validation flows outside README.md and requirements.md.

## Rules Going Forward

1. Do not append full sprint history to every main documentation file.
2. Keep README public-facing and compact.
3. Keep CURRENT_PROGRESS focused on current state, not long history.
4. Keep AI_HANDOFF useful for new chat continuation, but not a copy of all docs.
5. Keep requirements focused on current FR/NFR and future requirements.
6. Keep architecture overview focused on current architecture.
7. Move detailed sprint history to docs/sdlc/sprint-history/.
8. Move long decisions to docs/project-context/decisions/.
9. Move command-heavy validation steps to docs/runbooks/.
10. At the end of each future sprint, update compact main docs and create or update a sprint archive file.

## Expected Benefit

- Faster documentation updates
- Less duplication
- Less risk of stale status across files
- Smaller AI handoff context
- Cleaner GitHub README
- Easier maintenance after Sprint 14 and beyond

## Related Checkpoint

Checkpoint 14.0 - Documentation Compaction and Archive Strategy

## Next Documentation Step

Compact the main documentation files:

- README.md
- docs/architecture/overview.md
- docs/sdlc/requirements.md
- docs/project-context/CURRENT_PROGRESS.md
- docs/project-context/AI_HANDOFF.md
- docs/project-context/DECISION_LOG.md
