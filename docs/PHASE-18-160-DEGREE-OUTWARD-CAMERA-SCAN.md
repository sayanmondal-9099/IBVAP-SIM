# PHASE 18: 160-Degree Outward Camera Scan

## Objective
Correct the Command Map camera visualization to ensure each vertical array camera provides an accurate 160-degree outward field-of-view (FOV) pointed primarily into the foreign/opposite territory, oscillating smoothly while remaining anchored on the border.

## Implementation Details

### 1. Border Orientation & Foreign Territory Identification
- **Coordinate System**: Inspected `CommandMap.tsx` and the `worldToSvg` transform mapping. World coordinate `X=0` corresponds to SVG `x=500`.
- **Border Location**: The vertical dashed line labeled "INTERNATIONAL BORDER" is drawn exactly at SVG `x=500` (World `X=0`).
- **Territory Sides**: The background `rect` elements and zone coordinates in `scenarios.py` confirm that the **Foreign Territory is to the LEFT** (World `X < 0`, SVG `x < 500`) and the Sovereign Territory is to the RIGHT.
- **Current Issue**: In the previous phase, cameras were mistakenly given an `orientation=180`. Mathematically, this points them downward (South) along the border, failing the requirement to scan outward.

### 2. 160° Geometry & Base Direction
To correct the FOV, we needed to point the cameras precisely LEFT into the foreign territory.
- According to standard mathematical angles (where `0=North/Up`, `90=East/Right`, `180=South/Down`, `270=West/Left`), the base direction must be `270°`.
- The field-of-view was widened from `60°` to `160°`.
- The SVG drawing math in `SensorLayer` automatically interprets this:
  - `cAngle = (90 - 270) = -180°` (pointing Left).
  - The arc starts at `-80°` from the center and ends at `+80°` from the center, generating a perfect 160-degree sector centered facing West/Left.

### 3. Sweep Angle Implementation
- The CSS animation `@keyframes cameraSweep` in `index.css` was updated.
- Previously it swept by `+/- 45°`. With a 160-degree FOV, that would cause the scan to rotate too far into sovereign territory.
- Updated the sweep to `+/- 30°`:
  - `0% { transform: rotate(-30deg); }`
  - `50% { transform: rotate(30deg); }`
  - `100% { transform: rotate(-30deg); }`
- This ensures the FOV's centerline sweeps back and forth while the majority of the translucent wedge remains securely covering the foreign territory. A tiny slice correctly overlaps the sovereign side near the extremes, as allowed.

### 4. Vertical Camera Arrangement
- The 5 cameras (`cam_01` through `cam_05`) remain positioned securely on the border at World `X=0`, with distributed Y-coordinates (`400, 200, 0, -200, -400`) creating a continuous vertical surveillance chain.
- The camera labels (e.g., `CAM_01`) remain static and perfectly legible since only the `<path>` rotates.

### 5. Interaction Behaviors Maintained
- **Pause Behavior**: Toggling "PAUSE" in the Simulation Control stops the `cameraSweep` animation immediately on all sensors by binding `animationPlayState` to `simulationState.is_running`.
- **Reset Behavior**: Clicking "RESET" clears the simulation state and resets the CSS animation to its `0%` rotation frame deterministic starting angle.
- **Speed Behavior**: The CSS animation duration remains inversely proportional to `simulationState.tick_rate` (1X, 2X, 4X, 8X), speeding up natively as the engine speed increases.
- **Sensor Degradation**: `DEGRADED` sensors still render with dashed FOV outlines and sweep at half-speed, visually signaling reduced reliability.

### 6. Validation
- **Dependencies Added**: **ZERO**. (No external libraries used; all functionality implemented via standard SVG arcs and CSS keyframes).
- **Build Result**: `npm run build` completed successfully.
- **Pytest Result**: `pytest tests` completed successfully (28 passed).
- **Browser Verification**: A browser subagent navigated to the application, enabled the simulation, and confirmed:
  - Cameras are on the border.
  - FOV is wide (160°) and centered LEFT (outward).
  - Sweeping motion is smooth, oscillating around the camera's local origin.
  - No improper rotation around the map center.
  - Alert rendering and track movements remain visible above the scanning layers.

## Conclusion
The Command Map camera array now accurately represents a 160° outward-facing border surveillance sweep, strictly satisfying all visual and mathematical requirements of Phase 18.
