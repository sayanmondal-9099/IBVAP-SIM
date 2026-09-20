---
name: ibvap-backend-fastapi
description: Backend implementation rules for IBVAP-SIM using FastAPI.
---

# IBVAP-SIM: Backend & FastAPI Guidelines

## Purpose
Guide the development of the Python/FastAPI central backend, enforcing schemas, validation, error handling, and audit logging.

## When to use
Use when modifying `src/backend/`, adding new REST/WebSocket endpoints, or updating database models.

## Core Rules
1. **FastAPI Conventions:** Use explicit Pydantic response models, dependency injection (e.g., for DB sessions), and standard HTTP semantics.
2. **Router Organization:** Keep routers small and domain-focused (e.g., `alerts.py`, `mock_receiver.py`, `simulation.py`).
3. **Service Boundaries:** Business logic (e.g., priority scoring) goes in services (`alert_engine.py`), not routers.
4. **Validation:** Rely strictly on Pydantic to validate synthetic payloads. Fast failure for invalid payload types.
5. **Error Handling:** Return structured JSON error handling (e.g., `HTTPException`).
6. **Idempotency:** The `/api/simulation/sync_events` endpoint MUST be idempotent. Suppress duplicate sync events rather than throwing 500 errors.
7. **Audit Logging:** Sensitive actions (Acknowledge, Escalate, Mock Transfer) must append a chained log via `AuditService`.
8. **Mock Receiver Behavior:** The mock receiver is an internal dummy endpoint mimicking an external base. It must accept sanitized data.
9. **Testing:** All new routes must have `pytest` tests validating status codes, validation errors, and idempotency.

## Repository-Specific Constraints (CRITICAL)
- **KNOWN ISSUE:** The `AuditLog` initialization in `mock_receiver.py` and `alerts.py` currently uses the argument `entity_type` where the SQLAlchemy model expects `resource`.
- **AGENT DIRECTIVE:** You MUST NOT silently work around this issue or alter unrelated code. Fix it directly if instructed, or document its failure if testing.

## Common Mistakes
- **Mistake:** Putting heavy database logic or alert priority formulas directly inside the router definition.
- **Mistake:** Returning 500 server errors for duplicate offline syncs instead of handling them idempotently.
- **Mistake:** Hardcoding secrets.

## Verification Checklist
- [ ] Are Pydantic models used for input/output?
- [ ] Is the action generating an `AuditLog`?
- [ ] Does the endpoint gracefully handle offline-sync duplicates?
- [ ] Did you check if the `entity_type` vs `resource` bug affects your new code?
