# Backend Stabilization Report

## Objective
Restore a clean, verified backend baseline by fixing the known `AuditLog` initialization bug, enabling the next phases of frontend and API integration.

## Initial Failure
API endpoints for acknowledging alerts, escalating alerts, and mock transferring incidents failed with a 500 Internal Server Error.

## Root Cause
The `AuditLog` model in `src/backend/models.py` requires a `resource` field and a `current_hash` (non-nullable). However, `src/backend/routers/alerts.py` and `src/backend/routers/mock_receiver.py` were manually instantiating `AuditLog` using `entity_type` and `entity_id` kwargs, which are invalid for that SQLAlchemy model. Additionally, manual instantiation bypassed the `create_audit_log` service function which is responsible for computing the cryptographic hash chain.

## Files Changed
1. `src/backend/routers/mock_receiver.py`
2. `src/backend/routers/alerts.py`
3. `tests/backend/test_api.py`

## Exact Correction
1. Replaced manual `AuditLog` instantiations in `alerts.py` and `mock_receiver.py` with calls to `create_audit_log()` imported from `src.backend.audit_service`.
2. Mapped the old `entity_id` to the `resource` field using the format `f"alert:{alert.id}"` or `f"incident:{payload.incident_id}"`.
3. Updated `tests/backend/test_api.py` to assert against `audit.resource` instead of `audit.entity_id`.

## Targeted Test Results
Executed: `source .venv/bin/activate && PYTHONPATH=. pytest tests/backend/test_api.py`
Result: 7 passed, 0 failed

## Full Test Results
Executed: `source .venv/bin/activate && PYTHONPATH=. pytest tests/`
Result: 19 passed, 0 failed

## API Verification
- **Escalation:** PASS. (Verified via `test_alert_flow` API test).
- **Mock transfer:** PASS. (Verified via `test_mock_receiver_success` API test).
- **Audit:** PASS. (Audit records are created successfully).

## Audit Verification
- **Audit Integrity:** PASS. Cryptographic hash chain correctly generates without `IntegrityError` because `create_audit_log` handles the `current_hash` computation. Tested via `test_audit_chain.py` validations.

## Regression Verification
- **Regression Check:** PASS. Git diff reveals only the specific bugged endpoints and one test were altered. No application logic was modified.

## Remaining Failures
None. All 19 tests in the backend suite currently pass.

## Known Documentation Inconsistencies
The original PRD / specifications mandate a 30-second deduplication cooldown: `site_id + zone_id + event_type + track_id + 30-second-window`.
However, the codebase currently implements a 60-second cooldown in `alert_engine.py`, which is also documented in `docs/adr/ADR-006-alert-deduplication.md`. The discrepancy is noted here and preserved as instructed without arbitrary modification.

## Safety Verification
The simulation-only boundary remains intact. No external dependencies, real-world network requests, or hardware APIs were introduced. The mock base integration remains strictly audit/logging based.

## Final Status
PASS
