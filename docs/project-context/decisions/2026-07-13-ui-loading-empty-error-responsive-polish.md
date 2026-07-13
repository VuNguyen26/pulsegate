# UI Loading/Empty/Error/Responsive Polish

Date: 2026-07-13

Status: Accepted

Product/documentation version: `v1.17.0`

## Context

The Admin Dashboard and Developer Portal already had broad loading, empty, error, responsive, wrapping, and horizontal-scroll foundations. Sprint 77 needed to improve consistency, keyboard access, focus visibility, and encoding without redesigning either application or widening server/browser privileges.

The audit identified missing explicit state semantics, unreachable horizontal-scroll regions, missing focus treatment, decorative skeleton noise, and four confirmed route-registry mojibake delimiters.

## Decision

- Reuse the existing UI primitives and CSS architecture.
- Add polite status semantics to loading and empty states.
- Add alert semantics to bounded error states.
- Hide decorative skeleton elements from assistive technology.
- Make Dashboard table wrappers keyboard-focusable labeled regions.
- Make Portal code examples and the HTTP error-reference table keyboard focusable.
- Add visible focus indicators while preserving layout and button contrast.
- Correct the four confirmed mojibake delimiters.
- Validate production images, healthchecks, routes, CSS assets, encoding, and browser-secret boundaries.

## Rejected alternatives

- No component-framework or design-system rewrite.
- No breakpoint rewrite without a concrete failure.
- No conversion of wide semantic tables into unrelated card layouts.
- No removal of bounded horizontal scrolling.
- No backend, database, identity, credential, route, or policy expansion.
- No broad accessibility-conformance claim.

## Consequences

- Existing product behavior and contracts remain unchanged.
- Keyboard users can reach bounded horizontal content.
- State changes have clearer assistive-technology semantics.
- Primary-button focus remains visible without losing primary contrast.
- Source and production HTML remain free of the confirmed mojibake pattern.

## Validation evidence

- Admin Dashboard: 55 test files / 253 tests.
- API Gateway: 163 test files / 1177 tests.
- Developer Portal: 2 test files / 8 tests.
- Product Service: 10 test files / 36 tests.
- Root typecheck, production build, release validation, Compose configuration, package-lock integrity, and clean-tree checks passed.
- Both UI containers were healthy.
- Ten Dashboard routes and four Portal routes returned HTTP 200.
- Production CSS, focusable-region, encoding, and browser-secret checks passed.

## Preserved boundaries

- Private npm workspace versions remain `0.1.0`.
- Protected annotated tag `v1.0.0` remains unchanged.
- No Sprint 77 tag.
- No new dependency, backend endpoint, database migration, environment variable, service, public port, Kubernetes resource, Admin mutation, generic proxy, billing, marketplace, or enterprise IAM work.
