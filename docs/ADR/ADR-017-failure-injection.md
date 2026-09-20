# ADR-017 — Failure Injection as a First-Class Feature

## Status
ACCEPTED

## Date
2026-09-13

## Context
A major selling point of edge-computing architectures is their resilience to failure. A demo where everything works perfectly fails to demonstrate the architecture's true value.

## Problem
How do we prove to SIH evaluators that the system is resilient?

## Decision
Failure simulation is part of the product demonstration, not merely a background testing tool. 

The `SimulationEngine` must support and visually demonstrate:
- **Network loss:** Triggers the edge buffer.
- **Camera/Radar outage:** Tests corroboration rules.
- **Edge restart:** Tests local storage resilience.
- **Packet loss / Clock drift:** Tests the idempotency and timestamp sorting of the backend.
- **Blur/Occlusion:** Lowers the `confidence` score of the synthetic observation.

## Alternatives Considered
- *Only testing failures in CI/CD:* Rejected. Evaluators need to see the system survive live.

## Consequences
### Positive
- Creates a highly compelling, interactive hackathon demo.
### Negative
- Increases the complexity of the `scenarios.py` generator.

## Implementation Impact
`SimulationEngine` and `CommandMap.tsx` must expose UI toggles to manually trigger these failures (e.g., a "Kill Network" button).

## Testing Impact
Requires extensive end-to-end testing to ensure injected failures recover gracefully.
