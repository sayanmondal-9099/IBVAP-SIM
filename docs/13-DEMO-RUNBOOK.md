# 13 - Demo Runbook

## Purpose
Provide a structured, step-by-step guide for executing the technical demonstration during the SIH event.

## Scope
Environment setup, scenario execution steps, expected outcomes, and talking points.

## Terminology
- **Runbook**: The script followed by the presenter to ensure a flawless demonstration.

## Requirements
- **FR-DEMO-001**: The runbook must include explicit instructions (and scripts) to quickly reset the simulation state.
- **FR-DEMO-002**: The runbook must explicitly script the demonstration of the offline-queue recovery feature.

## Dependencies
- A fully functional, stable IBVAP-SIM prototype.

## Assumptions
- The demo environment is local, self-contained, and immune to venue internet connectivity issues.

## Open Decisions
- OPEN ARCHITECTURAL DECISION: Should there be a dedicated "Demo Mode" toggle in the UI to artificially speed up slow scenarios for presentation purposes?

## Acceptance Criteria
- A presenter with no prior exposure to the codebase can successfully run through the demo end-to-end using only this runbook.
