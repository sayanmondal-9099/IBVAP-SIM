# 03 - Software Requirements Specification (SRS)

## Purpose
Detail the functional and non-functional software requirements for the IBVAP-SIM simulation engine and platform.

## Scope
Covers backend simulation logic, edge processing simulation, frontend dashboard, and internal API communication.

## Terminology
- **Scenario**: A predefined script dictating synthetic object movements, trajectories, and events.

## Requirements
- **FR-SRS-001**: The edge simulator must buffer events in a local event store when the network is simulated as disconnected.
- **FR-SRS-002**: The system must correlate multiple synthetic tracks into a single unified event.
- **NFR-PERF-001**: The UI must render synthetic alerts within 2 seconds of the simulated event time.
- **NFR-REL-001**: The edge simulator must flush the offline queue completely upon simulated network recovery.

## Dependencies
- Real-time communication protocol (e.g., WebSockets or Server-Sent Events) for dashboard updates.

## Assumptions
- The host machine has at least 8GB RAM to ensure smooth local simulation.

## Open Decisions
- OPEN ARCHITECTURAL DECISION: Maximum retention period or byte-size limit for the local event store on the simulated edge before dropping old events.

## Acceptance Criteria
- Edge buffer seamlessly and automatically flushes to the central dashboard upon simulated network recovery without data loss.
