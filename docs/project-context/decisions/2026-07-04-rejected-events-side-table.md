# Decision Record: Rejected Requests Use Separate Table

## Date

2026-07-04

## Status

Accepted.

## Context

Before Sprint 17, PulseGate recorded successful proxy/cache handler usage in:

- gateway.api_usage_events

The runtime quota checker counts gateway.api_usage_events directly for DB-backed API keys with assigned usage plans.

Rejected traffic needed observability for:

- missing API keys
- invalid API keys
- missing JWTs
- invalid JWTs
- rate limit rejects
- quota rejects

However, storing rejected traffic in gateway.api_usage_events would risk corrupting quota counts unless the entire usage model gained event type, outcome, and rejection reason semantics.

## Decision

Use a separate table for rejected requests:

- gateway.api_rejected_events

Keep successful/proxied/cache usage in:

- gateway.api_usage_events

## Rejected Reasons

Supported reasons:

- API_KEY_MISSING
- API_KEY_INVALID
- JWT_TOKEN_MISSING
- JWT_TOKEN_INVALID
- RATE_LIMIT_EXCEEDED
- QUOTA_EXCEEDED

## Consequences

Positive:

- Quota counting remains safe.
- Successful usage and rejected/security traffic are clearly separated.
- Rejected request observability can evolve independently.
- Admin summary can be added without changing quota behavior.

Trade-offs:

- Combined analytics across successful and rejected traffic requires joining or querying two tables.
- Future rollups may need separate aggregate models.

## Security Rule

Do not store:

- raw API keys
- JWT tokens
- Authorization header values

Allowed rejected event context:

- requestId
- routePath
- routeMethod
- statusCode
- rejectionReason
- apiKeyAuthSource
- apiKeyId when safely available
- consumerId when safely available
- safe metadata
- occurredAt
