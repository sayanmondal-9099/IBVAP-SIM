# Phase 08C: 3D Technology Evaluation

## 1. Executive Summary
This document evaluates CesiumJS and Three.js for the 3D Operational View of the IBVAP-SIM prototype. The objective is to visualize simulated tracks (with altitude), uncertainty volumes, and synthetic zones. After analyzing the project constraints—specifically the abstract Cartesian coordinate system used by the simulation engine (`x`, `y`, `altitude`), the strict offline/no-account requirement, and the need for generic visualization—**Three.js** is recommended as the optimal choice.

## 2. Licensing and Dependency Analysis

### CesiumJS
- **License:** Core library is open source (Apache 2.0).
- **Dependency Considerations:** Out of the box, CesiumJS strongly depends on **Cesium ion** (a commercial SaaS platform) to stream terrain and satellite imagery. Operating CesiumJS entirely offline without a Cesium ion account requires hosting custom terrain/imagery tile servers, which adds immense architectural complexity and violates the project's goal of remaining a simple, locally runnable prototype without external integrations or accounts.
- **Suitability:** High friction due to account/token requirements for base maps.

### Three.js
- **License:** Open source (MIT License).
- **Dependency Considerations:** Completely self-contained. It requires zero external services, APIs, or accounts. 
- **Suitability:** Perfectly suited for a local, standalone simulation sandbox. The React ecosystem provides `react-three-fiber`, which maps Three.js objects directly to React components.

## 3. Decision Matrix

| Criterion | CesiumJS | Three.js | Winner | Reason |
|-----------|----------|----------|--------|--------|
| **React Integration** | Complex (wrapper libraries like `resium` often lag) | Excellent (`react-three-fiber`) | Three.js | React-Three-Fiber is mature, declarative, and heavily maintained. |
| **Coordinate System** | Real-world Geographic (WGS84) | Abstract Cartesian (X, Y, Z) | Three.js | The existing backend emits abstract `(x, y, altitude)`, which maps directly to Three.js Cartesian space. Cesium would require unnecessary conversion. |
| **Offline / Local Data**| Requires custom tile servers for terrain | Natively offline | Three.js | Three.js can instantly render abstract grid terrain or synthetic topology without external tile servers. |
| **Virtual Zones & Uncertainty**| Supported via primitives (can be clunky) | Native geometric primitives | Three.js | Three.js makes it trivial to render abstract wireframes, cones, and synthetic airspace boundaries. |
| **Bundle Size / Overhead**| Massive (>3MB baseline) | Lightweight (~600KB) | Three.js | Three.js is significantly lighter, better suited for a fast, responsive React dashboard. |
| **Visual Impact (Abstract)**| Hard to style away from realistic Earth | Highly customizable | Three.js | Three.js allows building a sleek, dark-themed, "tech-demo" abstract environment that emphasizes "Simulation Only". |

## 4. Evaluation Profiles

### CesiumJS
- **Strengths:** Unbeatable for global, real-world geospatial visualization. Built-in support for real-world terrain, camera frustums, and WGS84 mapping.
- **Weaknesses:** Forces a real-world globe paradigm on an abstract simulation. Requires a Cesium ion token for base maps. Massive bundle size. Overkill for visualizing generic `x, y` coordinate data on a flat synthetic plane.

### Three.js
- **Strengths:** Extremely lightweight. `react-three-fiber` offers seamless React state integration (critical for consuming `SimulationContext`). Allows rendering beautiful, abstract synthetic environments (e.g., Tron-style grid terrain) which reinforces the "SIMULATION ONLY" constraint. No API keys or accounts required.
- **Weaknesses:** Lacks built-in geographic mapping. We must manually build the "terrain", camera controls, and mapping logic from generic primitives.

## 5. Architectural Fit
The prototype's current data flow:
`Backend Engine -> API/Socket -> SimulationContext.tsx -> UI`

The `SimulationContext.tsx` defines a track as:
`{ id: string, x: number, y: number, altitude: number, speed: number, heading: number }`

These are generic Cartesian coordinates. Three.js perfectly maps to this architecture. `react-three-fiber` will allow us to map the `tracks` array directly to `<mesh>` or `<group>` components within the React render tree, cleanly responding to state updates from the edge buffer. 

## 6. Implementation Risks & Mitigation
- **Risk:** Building camera controls and 3D interactions from scratch can be time-consuming in raw WebGL.
- **Mitigation:** Use `@react-three/drei`, a robust ecosystem of helpers for Three.js, which provides drop-in components like `<OrbitControls>` for camera management and `<Line>` for track history.

## 7. Recommendation and Approval

RECOMMENDED TECHNOLOGY:
**Three.js** (specifically via `three`, `@react-three/fiber`, and `@react-three/drei`).

**Why it is the better choice for IBVAP-SIM:**
It perfectly aligns with the abstract simulation data (`x, y, altitude`), strictly enforces the offline/no-account safety rules, natively integrates with the existing React state architecture, and allows for the creation of a high-impact, abstract "synthetic" visual style that guarantees no one mistakes the prototype for a real operational defence network.

**APPROVAL REQUIRED**

Recommended technology:
Three.js

Installation required:
YES — only after explicit user approval

Packages to be installed:
`three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`

Packages NOT to be installed:
`cesium`, `resium`
