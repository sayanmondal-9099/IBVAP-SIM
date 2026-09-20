# Phase 12 — Simulation Selector Redesign Report

**Status:** ✅ COMPLETE  
**Date:** 2026-09-14  
**Scope:** Simulation Selector UX redesign  
**Safety:** SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION

---

## 1. Summary

The `Simulation` page UX was completely redesigned to simplify the operator workflow. The previous technical configuration interface was replaced with a clear, 5-choice selection grid that abstracts away scenario IDs and engine parameters.

### Key UX Changes

| Before | After |
|--------|-------|
| Technical configuration UI | Simple 5-choice operator selector |
| Standard dropdown menu | Large selectable cards |
| Internal scenario IDs exposed | Simple names (PERSON, VEHICLE, TANK, MULTI, EMERGENCY) |
| Verbose engine state shown | Only "Start Simulation" and "Halt Simulation" buttons |
| No prominent icon context | Neutral `lucide-react` icons (User, Truck, Shield, Layers, AlertTriangle) |

---

## 2. Mapping to Existing Scenarios

The five operator choices were mapped to the following synthetic scenarios:

| Option | Scenario ID | Description |
|--------|------------|-------------|
| 1 PERSON | `SCN-001` | Person movement and restricted-zone entry |
| 2 VEHICLE | `SCN-002` | Vehicle approach and virtual-fence crossing |
| 3 TANK | `SCN-018` | Synthetic armored-vehicle tracking demonstration (NEW) |
| 4 MULTI | `SCN-DEMO-001` | Multiple synthetic objects and sensors |
| 5 EMERGENCY | `SCN-MULTI-006` | Multiple events, sensor degradation and network recovery |

*Note: A minimal scenario `SCN-018` (`scn_018_tank_demo`) was created to fulfill the TANK requirement since no existing scenario fit. No other new scenarios were created.*

---

## 3. Files Modified

| File | Change |
|------|--------|
| `src/frontend/src/pages/Simulation.tsx` | Full UX rewrite using Tailwind CSS and Lucide icons |
| `src/simulation/scenarios.py` | Added `scn_018_tank_demo` minimum scenario |
| `src/backend/routers/simulation.py` | Mapped `SCN-018` to the newly added scenario |

---

## 4. Verification Results

### 4.1 Build
```
npm run build → EXIT CODE 0
✓ 2516 modules transformed
```

### 4.2 Backend Tests
```
pytest tests/ -v → 25/25 PASSED
```

### 4.3 Functional Verification
- ✅ All five choices can be selected visually (exclusive selection).
- ✅ Start button launches the correct `SCN-*` scenario under the hood.
- ✅ The existing Command Map receives the simulation data (as the backend engine correctly interprets the mapped IDs).
- ✅ The permanent `SIMULATION ONLY` banner remains visible via the root layout.

---

## 5. Safety Compliance

- ✅ No real CCTV/radar connected.
- ✅ No real defence data used.
- ✅ No weapon, targeting, or engagement behaviour added.
- ✅ No new packages, MCP, or external integrations added.
- ✅ Did not modify Command Map or View3D pages.
