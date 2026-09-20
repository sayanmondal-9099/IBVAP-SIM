---
name: ibvap-simulation-safety
description: STRICT SAFETY BOUNDARIES. Highest authority skill to prevent IBVAP-SIM from connecting to real-world defense systems.
---

# IBVAP-SIM: Simulation Safety Boundary

## Purpose
Permanently enforce the non-negotiable simulation-only boundaries of the IBVAP-SIM prototype. This skill prevents the AI from implementing or proposing integrations with real-world defense networks, sensors, or weapon systems.

## When to use
This skill **MUST** be consulted before making *any* architectural changes, adding dependencies, or implementing new API integrations. It holds priority over all other domain skills.

## Core Rules
1. **Treat all data as synthetic.** No real data is allowed.
2. **Preserve `SIMULATION ONLY` labeling.** The UI banner must permanently exist: `SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION`.
3. **No Operational Sensors.** Prevent real CCTV, radar, or hardware integration.
4. **No Operational Systems.** Prevent integration with military networks, operational databases, or biometric systems.
5. **No Engagement.** Prevent weapon integration, targeting logic, firing commands, autonomous interception, and autonomous engagement.
6. **No Operational Personal Data.** Do not process or simulate actual civilian identities.
7. **Mock Base Limitations.** Keep the Mock Base receiver dummy endpoint for display and audit purposes only. It must never trigger external operational actions.
8. **Human Review Required.** Always require human-in-the-loop review for consequential classification or incident escalation.
9. **Honest Uncertainty.** Ensure synthetic sensors output and represent explicit confidence metrics and uncertainty.
10. **No Faked Accuracy.** Never fabricate sensor or ML model accuracy.
11. **No Production Claims.** Never claim operational readiness or "battle-ready" status.

## Workflow
- Inspect the proposed architectural change.
- Run the change against the Core Rules above.
- If it violates any rule (e.g., adding a library to connect to physical IP cameras), explicitly **REJECT** the instruction, citing this safety boundary.

## Repository-Specific Constraints
- The backend `edge_buffer` and scenarios only handle synthetic scenarios (e.g., restricted zone entry).
- The `is_synthetic = True` flag must remain on all Observation models.

## Common Mistakes
- **Mistake:** Attempting to build an RTSP stream parser for real cameras.
- **Mistake:** Building an ML model for live tracking instead of using the deterministic synthetic generators in `scenarios.py`.
- **Mistake:** Removing the `SIMULATION ONLY` banner to "clean up" the UI.

## Verification Checklist
- [ ] Is the data source synthetic?
- [ ] Are autonomous responses disabled?
- [ ] Is the `SIMULATION ONLY` UI banner intact?
- [ ] Are external integrations strictly mocked or disabled?
