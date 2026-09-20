# ADR-003 — Simulation Engine as Source of Synthetic Events

## Status
ACCEPTED

## Date
2026-09-13

## Context
Because real sensors (CCTV, radar) are prohibited (ADR-001), the system requires a data source to drive the Command Map and Alert Engine.

## Problem
How do we generate convincing, repeatable data to trigger alerts?

## Decision
The Simulation Engine (`src/simulation/engine.py`) is solely responsible for generating deterministic, replayable synthetic scenarios and sensor observations.

It must generate and manage:
- Scenario identity & Simulation identity
- Synthetic sensors, tracks, and trajectories
- Environmental degradation (e.g., weather, blur)
- Network degradation and sensor failures
- Replay and deterministic behavior (seedable RNG)

This differs from real sensor ingestion because the engine has "omniscient" knowledge of the synthetic object's true location, which it then degrades before sending to the backend to simulate uncertainty.

## Alternatives Considered
- *Playing back pre-recorded JSON files:* Rejected. Does not allow dynamic failure injection or randomized scenarios.

## Consequences
### Positive
- Perfect repeatability for demos.
- Complete control over edge cases (e.g., forcing two sensors to disagree).
### Negative
- Engineering effort spent on simulating data rather than processing real data.

## Implementation Impact
`src/simulation/scenarios.py` acts as the definitive data source.

## Testing Impact
Requires tests verifying that given a seed, the engine produces identical events.
