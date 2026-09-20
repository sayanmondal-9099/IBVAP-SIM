# ADR-007 — Offline-First Recovery

## Status
ACCEPTED

## Date
2026-09-13

## Context
Edge surveillance infrastructure often suffers from degraded or fully severed network links to the central command. The system must not lose critical events during these periods.

## Problem
How do we simulate edge resilience and ensure no synthetic tracks are lost when the simulated network drops?

## Decision
The simulation engine must continue operating locally during network loss. 

The defined lifecycle is:
`NORMAL → DISCONNECTED → LOCAL OPERATION (Edge Buffer) → NETWORK RESTORED → SYNCHRONIZATION → DUPLICATE PROTECTION → VERIFIED STATE`

During synchronization, the system must preserve:
- Source/local sequence
- Original event time
- Central receipt time
- Simulation ID
- Event identity

## Alternatives Considered
- *Dropping events during network loss:* Rejected, as it fails to demonstrate the resilience capabilities required for the SIH demo.

## Consequences
### Positive
- Demonstrates advanced distributed systems architecture.
### Negative
- Requires maintaining an in-memory or on-disk buffer in the `SimulationEngine`.
- Requires the backend to process bulk, out-of-order, or backdated events safely.

## Implementation Impact
The `SimulationEngine` uses an `edge_buffer` array.
The backend exposes `/api/simulation/sync_events` to ingest this buffer.

## Testing Impact
`test_offline_recovery.py` verifies this flow.

## Security/Safety Impact
Ensures audit logs accurately reflect the time an event occurred at the edge, not just when it hit the server.
