# ADR-006: Map and 3D Strategy

## Context
The central dashboard must visualize the synthetic tracks and geofences.

## Decision
We will use a **2D Cartesian Cartesian grid / Blank Canvas Mapping (e.g., Leaflet in Simple CRS)**.

## Alternatives
- 3D WebGL / CesiumJS globe.
- Integration with real-world Google Maps / Mapbox.

## Reasoning
Integrating real-world map tiles introduces external internet dependencies and potential operational boundary violations. A localized 2D Cartesian grid perfectly represents a simulated sector without distraction, making testing and synthetic coordinate generation much simpler.

## Consequences
- Simplified frontend rendering.
- Mathematical purity in the simulation engine.

## Status
Accepted
