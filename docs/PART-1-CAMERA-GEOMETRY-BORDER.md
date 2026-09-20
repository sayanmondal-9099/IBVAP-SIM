# Part 1: Command Map Camera Geometry & Border

## Overview
This document outlines the changes made to the Command Map specifically addressing camera placement, FOV geometry, and border visualization.

## 1. Border Visualization
- **Orientation & Territory**: The border is located along the vertical axis at world coordinate `x = 0` (SVG `x = 500`). Territory to the left (`x < 0`) is **Foreign Territory**, while territory to the right (`x > 0`) is **Sovereign Territory**.
- **Styling**: The border line was updated from a dashed red line to a continuous bright yellow/gold line (`#fde047`) with a subtle glow filter. It clearly separates the territories without obstructing track trails or moving objects.
- **Layering**: The border renders underneath the camera FOVs, but over the base map grid, maintaining clarity.

## 2. Camera Geometry
- **Placement**: Existing camera data places them strictly along the border at world coordinate `x = 0`. No backend modifications were needed.
- **Camera Body**: Replaced the small markers with a distinct, tactical visual body consisting of a dark background panel, a camera/radar icon, a pulsing status indicator, and clear typography (e.g., `[ CAMERA ] / CAM_01 / ONLINE`).
- **FOV Calculation**:
  - The requirement was a strict **160° FOV** pointing towards the foreign territory.
  - In SVG coordinates, the leftward direction is `180°` (`Math.PI` radians).
  - The sector originates perfectly at the camera's center and arcs from `100°` to `260°` (i.e., `180° ± 80°`), mathematically calculated using `sin`/`cos` projections rather than CSS approximations.
- **Animation**: The rotating scan animation was successfully disabled for Part 1, resulting in static sectors to confirm correct directional alignment.

## 3. Verification
- **Code Check**: Zero new dependencies were introduced.
- **Build Result**: `npm run build` completed successfully.
- **Test Result**: `PYTHONPATH=. .venv/bin/pytest tests` passed all 28 backend tests.
- **Browser Validation**: The UI was visually verified via browser rendering. The border is explicitly yellow and correctly delineates territories, and the camera geometries project accurately to the left (foreign) side.
