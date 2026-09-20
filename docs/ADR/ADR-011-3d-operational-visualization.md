# ADR-011 — 3D Operational Visualization

## Status
PROPOSED

## Date
2026-09-13

## Context
Airspace restrictions (drones, aircraft) rely heavily on altitude. A 2D map cannot adequately demonstrate volumetric restriction zones or Z-axis track trajectories.

## Problem
What technology should the prototype use to implement the missing 3D Operational View?

## Decision
**Target Architecture:** The project requires an interactive 3D WebGL view. 
Based on existing repository constraints (React/Vite) and the need for spatial mapping of synthetic coordinates (latitude, longitude, altitude):

**Recommendation:** We propose using **CesiumJS** (via `resium` or native wrapper) OR **Three.js** (via `react-three-fiber`).
- *Cesium* is preferred for globe-scale geographic accuracy and native WGS84 coordinate handling.
- *Three.js* is preferred if the simulation is visualized as an abstract, localized "sandbox" rather than a real-world globe.

**Constraint:** The 3D scene must use generic synthetic markers (e.g., simple colored spheres or abstract low-poly shapes). It must NOT create realistic weapon/platform models.

*Requires dependency approval before implementation.*

## Alternatives Considered
- *Relying solely on MapLibre 2D:* Rejected. Cannot adequately demonstrate the Z-axis constraints defined in the PRD (e.g., Drone entering restricted airspace).

## Consequences
### Positive
- High visual impact for the hackathon demo.
- Effectively demonstrates altitude-based alert rules.
### Negative
- High browser performance cost.
- Steep learning curve for integration with React state.

## Implementation Impact
Will require installing new npm packages and creating a dedicated React route (`/3d`).

## Documentation Impact
Must update `TECHNOLOGY-STACK.md` once a specific library is approved.
