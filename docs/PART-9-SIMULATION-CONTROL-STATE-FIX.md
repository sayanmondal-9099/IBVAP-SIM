# Part 9: Simulation Control State & Reset Fix

## Objective
Fix bugs related to the Command Map's simulation controls, primarily caused by asynchronous race conditions during rapid protocol switching and undefined pause/reset logic. The application needed a deterministic state machine without altering the core simulation backend architecture or adding dependencies.

## Changes Made

### 1. Unified Single Source of Truth (`SimulationContext.tsx`)
Previously, `CommandMap.tsx` and `SimulationControlBar.tsx` maintained local copies of `scenario` and `isRunning`, which conflicted with backend polling updates and WebSocket observations.
- All local states were removed from components.
- `SimulationContext` is now the absolute single source of truth, deriving its base state directly from the backend via `/api/simulation/state`.
- Added protected action methods inside the context: `startSimulation`, `pauseSimulation`, `resumeSimulation`, and `resetSimulation`.
- When switching protocols, the context now actively filters out incoming WebSocket observations whose `simulation_id` does not match the active `simulationState.simulation_id`, effectively preventing "ghost tracks" from prior scenarios from rendering.

### 2. Explicit Pause vs Stop (Reset)
Previously, the backend `stop` route both paused and discarded the current simulation engine, preventing a true resume.
- Added `/api/simulation/pause` which delegates to `SimulationEngine.pause()`.
- Added `/api/simulation/resume` which delegates to `SimulationEngine.resume()`.
- The `/api/simulation/stop` route was fixed to strictly act as a true **RESET** (shutting down the engine completely).
- Updated `/api/simulation/state` to correctly expose the `is_paused` and `simulation_id` fields.

### 3. Simulation Control Bar (`SimulationControlBar.tsx`)
Refactored the Control Bar to consume the unified context methods and clearly distinguish between 3 UI states:
- **RUNNING** (`isRunning && !isPaused`): Displays [ PAUSE ] and [ RESET ]
- **PAUSED** (`isRunning && isPaused`): Displays [ RESUME ] and [ RESET ]
- **IDLE/RESET** (`!isRunning`): Displays [ START ] and [ RESET ]

Speed changes (`handleSpeedChange`) now update the local multiplier and, if the simulation is currently active, push the new multiplier to the backend without inadvertently resuming a paused simulation.

### 4. Continuous Camera Scanning
Verified that the `RotatingCameraLayer.tsx` CSS animations run independently of the `isRunning` state, strictly obeying the "OBJECT PAUSED ≠ CAMERA PAUSED" rule. The speed multiplier is dynamically passed to the CSS `--simulation-speed` variable to keep scanning rates consistent with user input.

## Constraints Respected
- No packages or dependencies were added.
- Backend architecture (event loops, database schemas) remained intact; only standard route endpoints were added.
- No modifications were made outside the simulation UI scope.
