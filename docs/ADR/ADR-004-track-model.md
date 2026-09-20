# ADR-004 — Track Model

## Status
ACCEPTED

## Date
2026-09-13

## Context
The system tracks moving objects. In a real system, raw sensor observations are normalized, detected (ML), and tracked over time.

## Problem
How do we define the data contract for a tracked object in the simulation?

## Decision
The track model must encapsulate:
- track identity
- class (synthetic)
- confidence & quality
- position (latitude, longitude)
- altitude, distance
- uncertainty
- heading, speed
- timestamp
- sensor/source attribution

**Current Implementation vs Target Boundary:**
Currently, `scenarios.py` outputs a "Fused Track" directly. It skips the `Observation → Detection → Track` ML pipeline. This decision documents the target boundary—that tracks should ideally arise from fused raw observations—but explicitly accepts the current "Fused Track" implementation as sufficient for the prototype. We will not refactor it to include fake ML layers.

## Alternatives Considered
- *Building a fake ML detection API layer:* Rejected as unnecessary complexity for a hackathon prototype that focuses on the alert engine and UI.

## Consequences
### Positive
- Simple, reliable synthetic track generation.
### Negative
- Less realistic edge-processing topology.

## Implementation Impact
The `Observation` model in `models.py` serves as this fused track.

## Testing Impact
None. Use existing models.
