# ADR-008 — Auditable Event Chain

## Status
ACCEPTED

## Date
2026-09-13

## Context
In a defense/security context, every system action (alert escalation, incident resolution, configuration change) must be definitively traceable to an actor and protected against tampering.

## Problem
How do we prove to evaluators that our prototype's event logs cannot be silently altered or deleted?

## Decision
Important system actions must be cryptographically auditable.
The `AuditLog` will capture:
- actor
- resource
- outcome
- reason
- request ID
- timestamp
- previous hash
- current hash (SHA-256)

Hash chaining demonstrates integrity and tamper evidence. 
*Note:* This does NOT prove that a sensor classification is physically correct; it only proves that the system's *record* of that classification has not been altered. Denied actions (e.g., unauthorized access attempts) must also generate auditable events.

## Alternatives Considered
- *Standard linear text logs:* Rejected as they are easily modified by anyone with database/server access.

## Consequences
### Positive
- High credibility for SIH demonstration.
- Provable sequence of events.
### Negative
- Performance overhead of hashing.
- Complexity in resolving the currently failing `entity_type` vs `resource` bug.

## Implementation Impact
Implemented in `src/backend/audit_service.py` and `src/backend/models.py`.

## Testing Impact
`test_audit_chain.py` explicitly validates the hash chain logic.
