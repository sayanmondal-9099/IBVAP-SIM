# Phase 18, Part 3: Synchronized Simulation + Camera Control

## Overview
This phase implements the final interaction behaviors for the IBVAP-SIM Command Map sensor network, focusing on dynamic speed synchronization, pause independence, and a unified floating control panel.

## Key Behaviors Implemented

### 1. Synchronized Simulation Speed
The global simulation speed (`1X`, `2X`, `4X`, `8X`) now synchronously governs both:
- **Backend Object Ticks:** The movement rate of simulated tracks.
- **Frontend Camera FOV:** The CSS animation duration of the 160° outward-facing camera scans.

This ensures a coherent timeline where sensors visibly poll faster when the simulation runs faster, utilizing the CSS custom property `--simulation-speed`.

### 2. Independent Camera 24x7 Operation
Cameras act as persistent infrastructure:
- When the simulation is **PAUSED** (`isRunning === false`), the simulated objects stop moving, but the cameras continue their FOV scanning animation seamlessly.
- When the simulation is **RESET**, the object tracks are cleared from the map, but the cameras remain online and scanning.

### 3. Floating Simulation Control Panel
The tactical control bar was refactored into a floating, collapsible panel integrated directly into the `CommandMap`:
- A single `◉ SIMULATION` toggle button expands/collapses the panel.
- Speed and Protocol controls were moved into this unified menu.
- State overrides (e.g., changing Protocol or Speed) issue dynamic `/api/simulation/start` and `/api/simulation/speed` requests to instantly update the backend engine state without page reloads.

## Technical Implementation Details
- **CSS Animation:** Added `@keyframes scan-oscillation` utilizing `from/to` properties with an `ease-in-out alternate` loop for smooth panning.
- **Context Updates:** Added `speedMultiplier` to `SimulationContext` to globally distribute the user's selected speed.
- **Component Refactoring:** `RotatingCameraLayer` now accepts `speedMultiplier` as a prop and injects it directly into the `<g>` element's inline style object.
