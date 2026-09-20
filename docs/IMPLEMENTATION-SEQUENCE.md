# Target Implementation Sequence

Based on the accepted Architecture Decision Records (ADRs) and the current structural reality of the repository, the following is the safest and most logical sequence of implementation.

## Sequence

### 1. Backend Stabilization (Phase 2)
**Action:** Fix the `AuditLog` initialization bug (`entity_type` -> `resource`) in `mock_receiver.py` and `alerts.py`.
**Reason:** ADR-013 dictates that we cannot build the frontend Audit Trail or Mock Transfer features on top of a failing API. This restores the test baseline to 100%.

### 2. Operational Frontend Structure (Phase 4)
**Action:** Build out the React Router structure to support the distinct pages mandated by ADR-010 (Simulation, Tracks, Alerts, System Health).
**Reason:** We need the "rooms" built before we can populate them with data.

### 3. Human Review & Incident Resolution (Phase 6)
**Action:** Build the UI workspace for inspecting synthetic evidence and escalating alerts.
**Reason:** ADR-009 mandates human-in-the-loop decisions. This is the primary interactive loop for the simulated operator.

### 4. Audit Trail & System Health (Phase 7)
**Action:** Connect the frontend to the `AuditLog` API to visualize the cryptographic hash chain.
**Reason:** Proves the system's security (ADR-008) to evaluators.

### 5. 3D Operational View (Phase 5)
**Action:** Approve dependency (Cesium/Three.js) and build the 3D map.
**Reason:** High visual impact for the demo (ADR-011), but placed later in the sequence because it requires external dependencies and complex state management, which could derail core logic if done too early.

### 6. Simulation Engine Hardening (Phase 3)
**Action:** Implement extended failure injections (ADR-017) like radar loss and weather degradation.
**Reason:** Enhances the demo, but relies on the UI (built in steps 2-4) being ready to visualize the failures.

### 7. SIH Demo Hardening
**Action:** End-to-end testing against `DEMO-RUNBOOK.md`.
**Reason:** Final polish.
