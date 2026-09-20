# Roadmap

This roadmap defines the staged implementation path for the IBVAP-SIM prototype.

## PHASE 0 — Governance (COMPLETED)
- **Objective:** Establish the Simulation-Only safety boundaries and repository constitution.
- **Deliverables:** `AGENTS.md`, `CURRENT-STATE.md`, `CHANGE-CONTROL.md`.

## PHASE 1 — Documentation (COMPLETED)
- **Objective:** Produce a professional, SIH-ready documentation pack mapping the current architecture.
- **Deliverables:** PRD, SRS, Architecture, API Specs, Demo Runbook.

## PHASE 2 — Backend Stabilization (PLANNED)
- **Objective:** Fix existing API bugs to allow full test suite execution.
- **Deliverables:** Resolve the `entity_type` `AuditLog` bug.
- **Blockers:** None.

## PHASE 3 — Simulation Engine Hardening (PLANNED)
- **Objective:** Introduce sensor disagreements and deterministic weather degradation to the edge simulation.
- **Deliverables:** Updated `scenarios.py`.

## PHASE 4 — Frontend Operational Workflows (PLANNED)
- **Objective:** Separate the Command Map from the detailed event dashboards.
- **Deliverables:** Polished 2D MapLibre view.

## PHASE 5 — 3D Operational View (PLANNED)
- **Objective:** Introduce spatial volumetric visualization.
- **Deliverables:** Cesium or Three.js integration for drone/aircraft altitude monitoring.

## PHASE 6 — Human Review / Incident Resolution (PLANNED)
- **Objective:** Build the operator interface for verifying synthetic alerts.
- **Deliverables:** Evidence Panel UI, Escalate/Acknowledge API integration.
- **Dependencies:** Phase 2 (Backend fix).

## PHASE 7 — Audit / System Health (PLANNED)
- **Objective:** Expose the cryptographic hash chain to the UI.
- **Deliverables:** Audit Trail read-only table.

## PHASE 8 — Full Integration Testing (PLANNED)
- **Objective:** End-to-end Vitest/Playwright tests simulating the operator workflow.
- **Deliverables:** Automated UI tests.

## PHASE 9 — SIH Demo Hardening (PLANNED)
- **Objective:** Final polish for the hackathon demonstration.
- **Deliverables:** Rehearsal of the `DEMO-RUNBOOK.md`.
