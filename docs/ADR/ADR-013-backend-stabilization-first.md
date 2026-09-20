# ADR-013 — Backend Stabilization Before Feature Expansion

## Status
ACCEPTED

## Date
2026-09-13

## Context
The current structural verification identified a specific bug: The `AuditLog` initialization in the FastAPI routers uses the keyword `entity_type`, while the SQLAlchemy model expects `resource`. This causes 3 backend tests to fail.

## Problem
Should we proceed with building the missing Frontend UI (3D, Human Review) while the backend API is failing?

## Decision
Before major new frontend capabilities are declared complete, the existing backend regression must be corrected. Backend stabilization is the immediate next priority. 

The API handles the core simulation-safety workflow (cryptographic auditing of alerts and mock transfers). Building UI on top of a 500 Server Error will result in un-demonstrable frontend components.

## Alternatives Considered
- *Building the UI with mocked API responses:* Rejected. The SIH demo requires end-to-end integration, and masking the backend bug delays the inevitable fix.

## Consequences
### Positive
- Ensures the foundation is solid before adding complex 3D or WebSockets.
- Restores the test baseline to 100% green.
### Negative
- Delays the visual/UI progress of the project.

## Implementation Impact
`mock_receiver.py` and `alerts.py` will require a small syntax update (`entity_type` -> `resource`).

## Testing Impact
Will unblock `tests/backend/test_api.py`.
