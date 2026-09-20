# ADR-010 — Separate Operational UI Pages

## Status
ACCEPTED

## Date
2026-09-13

## Context
Operators interacting with complex spatial data, alerts, and audit logs can suffer from cognitive overload if all information is crammed into a single view.

## Problem
How should the React frontend be structured to maintain operator efficiency and information hierarchy?

## Decision
Do not build a single overloaded dashboard. The React application will use separate operational pages:
- Command Map (Primary high-level spatial awareness)
- Simulation
- Camera Intelligence
- Radar/Sensor View
- Tracks
- Alerts (Tabular management)
- Incidents
- Audit Trail
- System Health
- 3D Operational View
- Human Review (Dedicated focus workspace for single-alert resolution)

The Command Map should remain clean. Detailed camera, track, radar, alert, and review workflows will have dedicated views.

## Alternatives Considered
- *A monolithic "single-pane-of-glass" UI:* Rejected. Leads to cramped panels, hidden data, and poor SIH presentation on standard monitors.

## Consequences
### Positive
- Cleaner codebase with distinct React routing.
- Easier to demonstrate specific features to judges.
### Negative
- Requires managing state (like selected alert) across different routes.

## Implementation Impact
Requires expanding `src/frontend/src/App.tsx` routing.

## Testing Impact
React tests must verify navigation between these separate operational areas.
