# Decision Record: Quota-Denied Usage Event Tracking

Date:

- 2026-07-04

Status:

- Accepted for Sprint 16

Related sprint:

- Sprint 16 - Quota Observability and Usage Management Hardening

---

## Context

PulseGate currently records API usage events into:

- gateway.api_usage_events

The quota checker uses this table as the source of truth for quota counting.

Current quota behavior:

- DB-backed API key request passes auth.
- Gateway checks usage plan quota before cache/proxy execution.
- If current-window usage has reached quotaLimit, Gateway returns 429 QUOTA_EXCEEDED.
- If allowed, Gateway proceeds to cache/proxy and records a usage event after successful proxy/cache handling.

Current usage event table does not yet have an event type, outcome, or rejection reason field.

---

## Problem

If PulseGate records quota-denied requests into gateway.api_usage_events without event classification, then quota counts become incorrect.

Example:

- quotaLimit = 1
- first valid request returns 200 and records one usage event
- second request returns 429 QUOTA_EXCEEDED
- if the 429 is also recorded into api_usage_events, usedRequests becomes 2
- every denied retry would keep increasing usedRequests even though the request was not served

This would corrupt:

- API key quota state
- usage plan usage summary
- quota checker results
- future billing-like analytics

---

## Decision

Do not record quota-denied requests into gateway.api_usage_events in Sprint 16.

Keep gateway.api_usage_events focused on successful/proxied/cache-handler usage for now.

Add quota metadata to 429 QUOTA_EXCEEDED responses instead.

429 details now include:

- quotaLimit
- quotaWindow
- usedRequests
- remainingRequests
- windowStartedAt
- windowEndsAt
- resetAt

---

## Consequences

Positive:

- Quota counting remains correct.
- API key quota state remains accurate.
- Usage plan usage summary remains accurate.
- Sprint 16 can deliver observability without a risky schema change.
- Future rejected-event tracking can be designed cleanly.

Negative:

- Admins cannot yet see how many quota-denied attempts happened.
- Grafana cannot yet show quota-denied traffic.
- Security/rejection analytics are still incomplete.

---

## Future Options

Option A:

- Add eventType/outcome/rejectionReason fields to api_usage_events.
- Quota checker must count only quota-countable events.

Option B:

- Create a separate gateway.api_rejected_events table.
- Keep successful usage and rejected/security events separate.

Option C:

- Add a broader security/audit event pipeline for auth failures, rate limits, quota denials, and admin actions.

---

## Recommendation

Sprint 17 should consider:

- API Usage Rejection Tracking Design, or
- Advanced Usage Analytics Hardening

The next implementation should keep successful/proxied usage and rejected/security events clearly separated or clearly typed.
