# PHASE 18: Vertical Rotating Camera Array

## Objective
Implement a 5-camera vertical array along the simulated international border on the existing Command Map. The cameras must feature a scanning field-of-view (FOV) animation that rotates locally around each camera's origin, accurately representing active surveillance sweeps.

## Changes Implemented

### 1. Backend: Scenario Updates
Modified `src/simulation/scenarios.py` to replace the old horizontal camera layout with a vertical array:
- Defined 5 new cameras (`cam_01` through `cam_05`).
- Positioned them at fixed intervals along the central vertical border (X = 0 in world coordinates).
- Assigned base facing angles perpendicular to the border (facing left into the 'enemy' zone).

### 2. Frontend: CSS Animations
Updated `src/frontend/src/index.css` to add the `@keyframes cameraSweep` animation.
- Uses pure CSS transforms (`rotate`) to ensure smooth, hardware-accelerated rendering without triggering React re-renders.
- Sweeps from `-30deg` to `30deg` relative to the base facing angle, creating a realistic back-and-forth scanning motion.

### 3. Frontend: Command Map Rendering
Updated `src/frontend/src/pages/CommandMap.tsx`:
- Integrated `simulationState` via `SimulationContext` to tie the animation state to the simulation timeline.
- Added `animation` inline styles to the `<path>` element representing the sensor's FOV.
- Dynamically calculated the `transform-origin` using the same `worldToSvg` logic used to position the camera markers, ensuring the FOV wedge rotates around the exact coordinates of the individual camera, rather than the map center.
- Bound `animationPlayState` to the simulation status (`RUNNING` vs `PAUSED`), so the cameras stop scanning when the user pauses the simulation.
- Configured sensor status degradation (e.g., `DEGRADED` status) to visually affect the scan speed and styling (dashed lines).

## Constraints Met
- **Zero New Dependencies**: Used native CSS keyframes and SVG transforms. No heavy animation libraries (e.g., Framer Motion) were introduced.
- **Maintained Existing Map**: The map's projection, background, track logic, and pan/zoom behaviors were untouched.
- **Safety Boundaries**: The implementation remains strictly visual and simulation-only, preserving the `is_synthetic` nature of all generated data.

## Verification
A browser subagent was used to perform an end-to-end visual inspection:
- Confirmed the 5 cameras are aligned vertically on the international border.
- Confirmed the FOV wedges rotate correctly around their respective local origins.
- Confirmed that toggling the simulation state (START/PAUSE) correctly resumes and pauses the CSS animations.
- Verified that all other Command Map features (tracks, radar, alerts) continue to function correctly alongside the new animations.
