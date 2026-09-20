# ADR-002 — Edge-First Simulation Architecture

## Status
ACCEPTED

## Date
2026-09-13

## Context
Modern border systems process heavy sensor data (video/radar) at the edge (on towers or local servers) to save bandwidth, forwarding only normalized "Tracks" or "Events" to the central command. 

## Problem
How do we represent this distributed hardware topology in a single software repository?

## Decision
We will use an edge-first conceptual architecture, even though the current prototype is simplified and runs on a single machine.

**Target Conceptual Flow:**
```text
Synthetic Scenario Generator
↓
Simulation Sensor Streams
↓
Simulation Adapter
↓
Edge Processing Simulator
↓
Normalization
↓
Detection
↓
Tracking
↓
Rules
↓
Alert Engine
↓
Local Event Store
↓
Offline Queue
↓
Central Simulation Services
↓
Operator Console
```

**Note on Current Implementation:** The current repository does NOT implement every layer separately. `scenarios.py` acts as a shortcut, directly generating tracked events and injecting them into the `edge_buffer`, skipping visual normalization/ML detection for prototype simplicity.

## Alternatives Considered
- *Central-heavy processing (sending raw video to the cloud):* Rejected as it does not reflect the required target defense architecture.

## Consequences
### Positive
- Clearly demonstrates offline capabilities (the edge buffer).
- Reduces API load between the simulation engine and the backend.
### Negative
- Requires maintaining simulated network connections internally.

## Implementation Impact
The `SimulationEngine` must continue to operate independently of the FastAPI backend.

## Testing Impact
Requires offline/disconnect tests.
