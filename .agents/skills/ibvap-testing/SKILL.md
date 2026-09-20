---
name: ibvap-testing
description: Testing strategy and conventions for IBVAP-SIM.
---

# IBVAP-SIM: Testing Guidelines

## Purpose
Ensure every implementation change in IBVAP-SIM is empirically verified through a strict test-driven workflow.

## When to use
Consult this skill before, during, and after implementing new features, fixing bugs, or refactoring code.

## Core Rules
1. **The Testing Loop:** `Inspect → Modify → Test → Inspect Results → Document`
2. **Never Fabricate:** Never claim tests passed without actually running them via the terminal.
3. **Current Baseline & Blocker:** 
   - 3 backend tests (`tests/backend/test_api.py`) currently fail because of the `AuditLog` `entity_type` vs `resource` mismatch. 
   - **This is a known blocker and must not be hidden.** Do not fake test output to hide this failure.
4. **Required Coverage Areas:**
   - Unit/Integration tests for the API.
   - Deterministic alert scoring tests.
   - Deduplication cooldown tests.
   - Offline buffer / reconnect tests.
   - Cryptographic audit-chain integrity tests.
5. **Simulation Isolation:** Tests must verify that synthetic markers (e.g., `is_synthetic = True`) remain intact throughout the pipeline.
6. **Failure Injection:** Write tests that explicitly simulate network drops and corrupted data.

## Workflow
1. Identify the impacted component.
2. Run existing tests (`pytest`) to establish a baseline.
3. Write a new failing test for the planned feature/fix.
4. Implement the code.
5. Run tests until they pass (or fail expectedly, like the known `AuditLog` issue).

## Repository-Specific Constraints
- Tests reside in `tests/`.
- Fast API testing relies on `httpx` async clients.

## Common Mistakes
- **Mistake:** Writing a test for the `AlertEngine` that uses random data instead of deterministic seeds, causing flaky CI pipelines.
- **Mistake:** Assuming the Mock Receiver tests pass when they actually fail on the `AuditLog` bug.

## Verification Checklist
- [ ] Did you actually run the tests?
- [ ] Are failure injections (like network drops) tested?
- [ ] Did you acknowledge the existing baseline failures?
