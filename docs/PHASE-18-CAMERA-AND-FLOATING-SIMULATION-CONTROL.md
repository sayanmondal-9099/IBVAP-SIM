# Phase 18 Final - Vertical Rotating Camera Array & Floating Simulation Control

## Objective
Finalize the Command Map implementation by creating a decoupled 24x7 scanning camera layer and a compact floating simulation control panel.

## Key Changes

### 1. Backend Updates (`src/backend/routers/simulation.py`)
- **Map Blanking Fix**: Updated `get_simulation_environment` to return the default sensors and zones when the simulation engine is paused. This ensures that the environment (including cameras and radar) remains visible when the simulation is not actively running.
- **Dynamic Speed API**: Introduced `POST /api/simulation/speed` endpoint (`SpeedRequest(speed_multiplier)`). This adjusts the simulation engine's `tick_rate` natively without requiring a complete start/stop/reset of the scenario.

### 2. Frontend Updates
- **`RotatingCameraLayer.tsx` (New Component)**: 
  - Extracted the SVG rendering of the sensor network into a distinct layer.
  - The base orientation is computed to project a ~160° outward FOV pointing into foreign territory.
  - Bound to a `cameraSweep` CSS keyframe that oscillates `±30°`, establishing a continuous surveillance cone sweep.
  - Integrated custom SVG markers that vary by sensor type (Camera vs. Radar), reflecting real-world UI design elements.
  - **24x7 Animation**: CSS animations use decoupled play-state logic relying on the sensor `status` (`online` or `degraded`), totally independent of the simulation engine's active/paused state.

- **`CommandMap.tsx`**: 
  - Added `RotatingCameraLayer` back into the SVG stacking context.
  - Implemented specific multi-threat visual representations (e.g. distinct, complex SVG groupings for `tank` observations).

- **`SimulationControlBar.tsx`**:
  - Re-implemented the simulation controls as an absolute-positioned floating widget (`z-40` at `top-5 left-4`).
  - Added a collapsible expand/collapse toggle state so it does not permanently dominate map real estate.
  - Connected the speed control buttons (`1X`, `2X`, `4X`, `8X`) to dynamically invoke the new backend `/speed` endpoint.

## Usage Guide
1. Launch the backend: `fastapi dev src/backend/main.py`
2. Launch the frontend: `npm run dev`
3. Click the crosshair **"◉ SIMULATION"** toggle at the top left of the Command Map to expand the control panel.
4. Alter simulation speed dynamically; observe that tracks speed up but the 24x7 camera sweeps remain unaffected.
