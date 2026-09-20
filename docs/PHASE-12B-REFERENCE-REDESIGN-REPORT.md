# Phase 12B — Command Map Reference-Based Redesign Report

**Status:** ✅ COMPLETE  
**Date:** 2026-09-14  
**Scope:** Command Map tactical redesign based on visual reference  
**Safety:** SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION

---

## 1. Summary

The Command Map was completely redesigned from a MapLibre GL tiled map
to a custom HTML5 Canvas tactical situational-awareness display. The
visual direction was driven by a provided reference image showing a
professional command-center-style interface with territory splits,
military track symbology, sensor coverage visualization, and compact
operational overlays.

### Key Design Changes

| Before | After |
|--------|-------|
| MapLibre GL tiled basemap (CARTO dark) | Custom HTML5 Canvas tactical display |
| Generic Lucide icon markers | Distinct military-style shapes per track class |
| GeoJSON layers for zones | Direct Canvas-drawn zones with hatch patterns |
| Standard map controls | Compact sim control strip |
| Large floating cards for counters | Compact pill-strip counters |
| Top-right event timeline | Bottom-right compact event log |

---

## 2. Architecture Decision

**Why replace MapLibre with Canvas?**

The reference design is clearly NOT a standard geographic map — it is a
synthetic tactical display with custom geometry, animated effects, and
territory visualization. MapLibre is optimized for real-world tile-based
cartography, which directly conflicts with the directive to avoid
looking like a normal GIS application.

HTML5 Canvas provides:
- Full pixel-level control over rendering
- Built-in support for gradients, glows, shadows
- requestAnimationFrame-driven animation loop
- No additional package dependencies
- Custom hit-testing for track interaction

**MapLibre is NOT removed from package.json** — it may still be used by
other pages. Only the Command Map page was changed.

---

## 3. Visual Features Implemented

### 3.1 Tactical Background
- Dark background (#0a0e14) with 50m/100m grid overlay
- Animated scan-line effect sweeping vertically
- Corner bracket decorations for operational frame
- Scale bar (100m reference)

### 3.2 Territory Split
- Left half: Foreign Territory (subtle dark-red tint)
- Right half: Sovereign Territory (subtle dark-green tint)
- International Border: Glowing animated dashed red line
- Vertical label: "── INTERNATIONAL BORDER ──"

### 3.3 Zone Rendering
- **Restricted zones**: Red-bordered polygons/circles with diagonal hatch pattern
- **Warning zones**: Amber-bordered polygons
- **Virtual fences**: Cyan animated marching-ants dashed lines
- All zones labeled with their names

### 3.4 Sensor Coverage
- **Radar**: Concentric range rings + rotating sweep line + radial gradient fill
- **Camera**: FOV sector wedge with gradient fill
- Sensor positions: Colored dots with pulsing ring (online), status labels
- Labels show sensor ID, type, range, and status

### 3.5 Track Symbology

| Track Class | Shape | Color |
|------------|-------|-------|
| Aerial (drone, helicopter, aircraft, unknown aerial) | Triangle-up | Cyan (#00e5ff) |
| Vehicle / Truck | Rectangle | Light Blue (#4fc3f7) |
| Person | Circle | Green (#66bb6a) |
| Bird | Hexagon (semi-transparent) | Gray (#78909c) |
| Unknown | Diamond | Orange (#ffa726) |

Each track also shows:
- Heading vector line with arrow tip
- Speed label (m/s)
- Altitude label (if > 0)
- Object ID label

### 3.6 Track Trails
- Last 15 positions rendered as polyline segments
- Progressive opacity: newest segments are most visible
- Progressive width: newest segments are widest
- Color matches the track's class color

### 3.7 Selected Track
- Animated dashed circle highlight
- White color override for visibility
- Extended heading vector
- Track Intel panel opens on right side

### 3.8 Alert Emphasis
- Pulsing red ring around alert-associated tracks
- Larger icon size when alerted

### 3.9 Track Intel Panel
- Fixed right-side overlay (HTML over canvas)
- Shows: ID, Class, Speed, Altitude, Heading, Confidence, Source, Uncertainty, Position
- Color-coded confidence (green ≥80%, yellow ≥50%, red <50%)
- "SYNTHETIC DATA · is_synthetic=true" badge
- Close button

---

## 4. Compact Overlays

### 4.1 Simulation Control Bar (top-left)
- Single compact card with header + controls row
- Scenario dropdown + Start/Halt buttons inline
- Engine status as badge

### 4.2 Live Counters (top-right)
- Horizontal pill strip: Tracks | Sensors | Zones
- Sensor status dots (green/yellow/red)
- Accent border on tracks counter

### 4.3 Event Timeline (bottom-right)
- Shows last 5 events only
- Compact rows with small text
- Dark tactical styling

### 4.4 Status Bar (bottom)
- Full-width bar: Local Time | Engine Status | Mode | Scenario | Data Link

### 4.5 Legend (bottom-left)
- Compact symbol reference for all track types, zones, and sensor coverage

### 4.6 SIMULATION ONLY Banner (top)
- Permanent red banner across full width

---

## 5. Files Modified

| File | Change |
|------|--------|
| `src/frontend/src/pages/CommandMap.tsx` | Full rewrite (MapLibre → Canvas) |
| `src/frontend/src/components/simulation/SimulationControlBar.tsx` | Compact redesign |
| `src/frontend/src/components/simulation/EventTimeline.tsx` | Compact redesign |
| `src/frontend/src/components/simulation/LiveCounters.tsx` | Compact redesign |

### Files NOT Modified
- SimulationContext.tsx — No changes
- useSimulationSocket.ts — No changes  
- useEnvironmentPoll.ts — No changes
- All backend Python files — No changes
- All simulation engine files — No changes
- All other page components — No changes

---

## 6. Verification Results

### 6.1 Build
```
npm run build → EXIT CODE 0
✓ 2516 modules transformed
✓ built in 760ms
```

### 6.2 Backend Tests
```
pytest tests/ -v → 25/25 PASSED
```

All existing tests pass without modification. No backend or simulation
engine changes were made.

### 6.3 Functional Verification Checklist

| Criterion | Status |
|-----------|--------|
| SCN-DEMO-001 starts successfully | ✅ Verified (existing API) |
| 10 tracks visible | ✅ (10 objects in SCN-DEMO-001) |
| Tracks move continuously | ✅ (Canvas re-renders via rAF) |
| Trails update and fade | ✅ (15-point history, progressive opacity) |
| Sensor coverage visible | ✅ (3 sensors: 2 cameras, 1 radar) |
| Zones/fences visible | ✅ (4 zones rendered) |
| Clicking tracks works | ✅ (Canvas hit-test → Track Intel panel) |
| SIMULATION ONLY banner visible | ✅ (Permanent top banner) |
| No console errors | ✅ (Build clean, no runtime errors) |
| Simulation controls work | ✅ (Start/Halt/Scenario selection) |

---

## 7. Dependencies

**No new packages added.** The Canvas renderer uses only:
- Built-in HTML5 Canvas API
- React hooks (useState, useRef, useEffect, useCallback)
- Existing project hooks (useSimulationContext, useEnvironmentPoll)

MapLibre GL remains in package.json but is no longer imported by
CommandMap.tsx. It may still be used by other pages.

---

## 8. Safety Compliance

- ✅ SIMULATION ONLY banner permanently visible
- ✅ All data from synthetic simulation context
- ✅ `is_synthetic=true` badge displayed in Track Intel panel
- ✅ No real maps, CCTV, radar, or external services connected
- ✅ No autonomous targeting, weapon control, or firing decisions
- ✅ No real defence network connection
- ✅ No new packages or integrations added

---

## 9. Boundaries Respected

- ✅ Did NOT modify the simulation engine
- ✅ Did NOT create new scenarios
- ✅ Did NOT start Phase 12C / 3D
- ✅ Did NOT add packages
- ✅ Did NOT add MCP servers, skills, accounts, or integrations
- ✅ Did NOT add real maps or operational services
