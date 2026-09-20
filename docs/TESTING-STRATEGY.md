# Testing Strategy

## Overview
IBVAP-SIM relies on automated testing to prove the resilience of the simulation architecture (offline recovery, deduplication, auditability). 

## Current Baseline (IMPLEMENTED)
The repository uses `pytest` and `httpx` for backend/API testing.

### 1. Alert Pipeline Tests (`test_alert_pipeline.py`)
- Verifies priority score calculations fall into correct bands (P1-P4).
- Verifies 60-second spatial deduplication works.
- **Status:** PASSING

### 2. Audit Chain Tests (`test_audit_chain.py`)
- Verifies SHA-256 hashing.
- Verifies tampering detection.
- **Status:** PASSING

### 3. Offline Recovery Tests (`test_offline_recovery.py`)
- Verifies the `edge_buffer` correctly holds and flushes events.
- **Status:** PASSING

### 4. API / Mock Receiver Tests (`test_api.py`)
- Simulates the full central API routing and sanitized handoff.
- **Status:** FAILING
- **Cause:** `AuditLog` initialization uses `entity_type` instead of `resource`. This is a documented implementation bug and is explicitly left unfixed in the current documentation phase.

## Future Acceptance Criteria (PLANNED)

### 1. Frontend Tests
- Implement Vitest/Playwright tests to verify the UI renders the correct empty, loading, and offline states.
- Verify the Human Review interface correctly updates the API when an alert is resolved.

### 2. Simulation Tests
- Add deterministic seed tests to ensure the exact same synthetic events generate the exact same priority scores across runs.
