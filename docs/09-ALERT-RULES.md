# 09 - Alert Rules

## Purpose
Define the logic and conditions that trigger events and alerts from synthetic tracks.

## Scope
Rule engine logic including spatial (geofence breach, line-crossing) and temporal (loitering) rules.

## Terminology
- **Event**: A raw rule violation detected by the edge simulator.
- **Alert**: A processed event raised to the central dashboard for human review.

## Requirements
- **FR-ALT-001**: System must support simulated directional line-crossing alerts.
- **FR-ALT-002**: System must support simulated loitering alerts based on configurable time thresholds within a zone.

## Dependencies
- Synthetic tracking and trajectory data.

## Assumptions
- Geofences and tripwires are statically defined per scenario and known to the edge simulator.

## Open Decisions
- OPEN ARCHITECTURAL DECISION: Should the rule engine logic be hardcoded for the prototype, or dynamically configurable via the central dashboard UI?

## Acceptance Criteria
- An alert is correctly generated immediately when a synthetic track violates a predefined spatial or temporal rule.
