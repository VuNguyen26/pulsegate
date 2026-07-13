# AI Handoff

PulseGate is complete through Sprint 77 - UI Loading/Empty/Error/Responsive Polish.

## Canonical state

- Product/documentation version: `v1.17.0`.
- Private npm workspace versions: `0.1.0`.
- Latest implementation commit before docs: `63a02880c93558e87b56e48db1e21b07b80b5417`.
- Sprint 76 documentation baseline: `89108d30e4371ed7feef8ae10b2cf963ee9b9536`.
- Protected annotated tag `v1.0.0` remains unchanged.
- Tag object: `726feb46e62a3224f7e27d55ae4f9e74dd6b1123`.
- Tag target: `407d03678674219e7228b15f0cd7a23074493f31`.
- Sprint 77 creates no tag.
- Current sprint: Sprint 78 - End-to-End Demo and Lightweight k6 Validation.
- Next sprint: Sprint 79 - v2 Docs, Runbooks and Architecture Cleanup.

## Sprint 77 implementation commits

- `063b25f66b8f1992b46c2932e2e25bbb87735675` - shared interface states and encoding correction.
- `1c38237a4426b8874434c2f43c49feed22e706f8` - responsive keyboard access.
- `63a02880c93558e87b56e48db1e21b07b80b5417` - Dashboard focus and loading-decoration polish.

## UI invariants

- Loading boundaries retain visible content, `role="status"`, polite live announcements, and busy state.
- Shared empty states remain explicit and non-mutating.
- Error boundaries use bounded alert semantics and safe retry actions.
- Raw errors, internal configuration, and Admin credentials must not render.
- Decorative loading blocks remain hidden from assistive technology.
- Semantic tables retain captions and scoped headers.
- Horizontally scrollable tables and code regions remain keyboard focusable with visible focus indicators.
- Existing responsive breakpoints and horizontal-scroll strategies remain authoritative.
- Tracked UI source and runtime HTML must remain valid UTF-8 without mojibake.

## Security invariants

- Preserve the trusted Gateway Admin context and all 29 Admin route protections.
- Preserve the 18 fixed GET-only Dashboard BFF resources.
- Preserve the server-only `ADMIN_READ_ONLY_API_KEY`.
- Keep full-access `ADMIN_API_KEY` out of Dashboard runtime and browser surfaces.
- Keep Portal source free of Admin APIs, Admin credentials, fake issued keys, and browser secret storage.
- Do not add a generic proxy or browser-selected Admin resource.

## Validation evidence

- Admin Dashboard: 55 test files / 253 tests.
- API Gateway: 163 test files / 1177 tests.
- Developer Portal: 2 test files / 8 tests.
- Product Service: 10 test files / 36 tests.
- Root typecheck, build, release validation, Compose config, package-lock integrity, clean-tree verification, and origin synchronization passed.
- Both UI production containers were healthy.
- Ten Dashboard routes and four Portal routes returned HTTP 200.
- Production CSS focus checks passed.
- Portal rendered six keyboard-focusable regions.
- Mojibake and browser-secret HTTP regression checks passed.

## Sprint 78 starting boundary

Sprint 78 is End-to-End Demo and Lightweight k6 Validation.

Audit before patching:

- Existing demo, smoke, k6, runtime, seed, API-key, quota, analytics, Dashboard, Portal, and observability scripts.
- Exact currently running services and ports.
- Existing test data and safe cleanup boundaries.
- Existing k6 scenarios and thresholds before adding or replacing anything.
- The exact end-to-end flow that can be demonstrated without fake functionality.
- Secret handling, log output, artifact directories, and non-destructive execution.

Preserve all completed application, security, database, routing, quota, analytics, observability, Kubernetes, Dashboard, Portal, package, and tag contracts. Do not perform Sprint 79 documentation cleanup or Sprint 80 release work early.
