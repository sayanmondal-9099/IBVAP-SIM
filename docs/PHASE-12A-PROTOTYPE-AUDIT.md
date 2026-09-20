# PHASE 12A — IBVAP-SIM COMPLETE PROTOTYPE AUDIT

**Author:** Principal Software Architect & Senior Product Engineer  
**Date:** September 20, 2026  
**Status:** DIAGNOSTIC & GAP ANALYSIS ONLY (Phase 12A)  
**Safety Boundary:** SIMULATION ONLY — STRICTLY AIR-GAPPED — NO REAL DEFENCE NETWORK CONNECTION  

---

## 1. Executive Summary

A comprehensive engineering inspection and audit of the **IBVAP-SIM** (Intelligent Border Video Analytics Platform — Simulation-Only Prototype) codebase was conducted. The repository represents an advanced, high-fidelity software prototype developed for the Smart India Hackathon (SIH), demonstrating an end-to-end multi-sensor surveillance and alerting pipeline:

$$\text{Sensor Source} \longrightarrow \text{Observation} \longrightarrow \text{Detection} \longrightarrow \text{Tracking} \longrightarrow \text{Rule Evaluation} \longrightarrow \text{Event} \longrightarrow \text{Alert} \longrightarrow \text{Human Review} \longrightarrow \text{Incident} \longrightarrow \text{Audit}$$

### Key Findings:
1. **Simulation Integrity:** The system is strictly simulation-only. All observations, tracks, alerts, sensor measurements, and locations are synthetic, deterministic, and tagged with `is_synthetic = True`. There are zero connections to real operational, military, radar, or weapon systems.
2. **Backend Test Suite:** Pytest collected 32 items: **31 passed**, **1 error**, **2 warnings**. The single error was caused by a misplaced integration script (`test_simulation.py`) in the workspace root whose function name `test_protocol(scenario_name, ...)` was mistakenly collected by pytest without a fixture. The core test suite in `tests/` passed 100%.
3. **Frontend Build & Lint:** `npm run build` (`tsc -b && vite build`) passed with **0 errors** in 1.74s. Oxlint reported **0 errors** and **14 warnings** (primarily `set-state-in-effect` in `SimulationContext.tsx` and non-component exports in component files).
4. **Interactive Verification:** All 6 simulation protocols (`PROTOCOL-NORMAL`, `PROTOCOL-DRONE`, `PROTOCOL-VEHICLE`, `PROTOCOL-MULTI-THREAT`, `PROTOCOL-EMERGENCY`, `PROTOCOL-SENSOR-DEGRADED`) were verified to execute with continuous kinematics, multi-class simultaneous presence, and active alerting.
5. **State Management & Concurrency:** Start, pause, resume, reset, and speed multiplier (1X–8X) controls operate with verified mathematical accuracy. However, two architectural concurrency issues were identified: duplicate WebSocket subscriptions from `Navigation.tsx` and `SimulationContext.tsx`, and an unwired "AI ANOMALY INJECTION" UI button.
6. **Documentation Discrepancies:** Documentation / Implementation mismatches were uncovered in alert priority scoring formulas, priority band thresholds, API method verbs (`PATCH` vs `POST` for alert acknowledgement), and camera feed count in the Cameras page.

---

## 2. Repository Structure

The repository adheres to a clean, modular structure:

```
New IBVAP/
├── AGENTS.md                          # Project constitution, safety boundaries & agent rules
├── README.md                          # High-level prototype overview
├── requirements.txt                   # Python dependencies (FastAPI, SQLAlchemy, Pydantic, etc.)
├── ibvap.db / ibvap_sim.db            # SQLite persistent database files
├── test_simulation.py                 # Standalone manual integration test script (causes pytest discovery error)
├── docs/                              # Architecture, PRD, SRS, ADRs, Phase reports (76 markdown files)
│   ├── 01-PRD.md ... 14-ROADMAP.md    # Core numbered documentation sequence
│   ├── ALERT-ENGINE-SPECIFICATION.md  # Detailed alert engine specification
│   ├── SYSTEM-ARCHITECTURE.md         # System architecture specification
│   └── PHASE-18-*.md                  # Phase 18 camera geometry & layout reports
├── src/
│   ├── backend/                       # FastAPI application layer
│   │   ├── main.py                    # App entrypoint, CORS, DB table initialization
│   │   ├── database.py                # SQLAlchemy engine & session factory
│   │   ├── models.py                  # SQLAlchemy ORM models (Alert, Incident, AuditLog, EdgeObservation)
│   │   ├── schemas.py                 # Pydantic request/response schemas
│   │   ├── alert_engine.py            # Rule evaluation, priority scoring, deduplication
│   │   ├── audit_service.py           # SHA-256 hash chaining & integrity validation
│   │   └── routers/                   # Modular API routers
│   │       ├── simulation.py          # /api/simulation (start, stop, pause, resume, speed, state, tracks, ws)
│   │       ├── alerts.py              # /api/alerts (list, acknowledge, review, escalate)
│   │       ├── incidents.py           # /api/incidents (list, get, resolve)
│   │       ├── mock_receiver.py       # /api/mock-receiver (mock military base transfer)
│   │       └── audit.py               # /api/audit (list, verify hash chain)
│   ├── frontend/                      # React 19 + TypeScript + Vite + Tailwind CSS
│   │   ├── package.json               # Frontend dependencies
│   │   ├── vite.config.ts             # Vite build configuration
│   │   ├── tailwind.config.js         # Tailwind v3 design token configuration
│   │   └── src/
│   │       ├── App.tsx                # Client routing (React Router v7)
│   │       ├── index.css              # Global styles & keyframe animations
│   │       ├── contexts/
│   │       │   └── SimulationContext.tsx  # Centralized simulation state, audio & socket bridge
│   │       ├── hooks/
│   │       │   ├── useSimulationSocket.ts # WebSocket telemetry receiver
│   │       │   ├── useEnvironmentPoll.ts  # Sensor, zone & event polling hook
│   │       │   └── useAudioAlarm.ts       # Web Audio API tactical sound manager (3 tones)
│   │       ├── components/
│   │       │   ├── TopHeader.tsx          # Top bar with simulated clock & standby toggle
│   │       │   ├── Navigation.tsx         # Sidebar navigation with active alert badges
│   │       │   ├── ProfileModal.tsx       # Operator profile modal
│   │       │   ├── simulation/            # Tactical Command Map overlay components
│   │       │   │   ├── SimulationControlBar.tsx # Floating protocol & playback control bar
│   │       │   │   ├── RotatingCameraLayer.tsx  # 160° outward camera SVG layer
│   │       │   │   ├── TrackMarkerBadge.tsx     # Symbology markers with priority rings
│   │       │   │   ├── TacticalGlyph.tsx        # MIL-STD-2525 inspired tactical symbols
│   │       │   │   ├── ActiveAlertsPanel.tsx    # Live alert HUD drawer
│   │       │   │   ├── LiveCounters.tsx         # Target/sensor counter chips
│   │       │   │   └── EventTimeline.tsx        # Event timeline drawer
│   │       │   └── View3D/                # Three.js / React Three Fiber 3D components
│   │       │       ├── Scene.tsx                # 3D canvas, orbit controls, camera telemetry
│   │       │       ├── TrackLayer.tsx           # 3D target models, drop lines, reticles
│   │       │       ├── Target3DModel.tsx        # Procedural 3D meshes (UAV, tank, convoy, etc.)
│   │       │       ├── SensorLayer.tsx          # 3D camera FOV cones & radar volumes
│   │       │       ├── ZoneLayer.tsx            # 3D polygon zone barriers
│   │       │       └── CompassTape.tsx          # HUD military compass tape
│   │       └── pages/
│   │           ├── CommandMap.tsx     # Primary 2D tactical command map (SVG based)
│   │           ├── Cameras.tsx        # Multi-camera intelligence grid with thermal & zoom
│   │           ├── Radar.tsx          # 360° PPI radar sweep & target telemetry deck
│   │           ├── Tracks.tsx         # Multi-sensor track matrix & metrics
│   │           ├── Alerts.tsx         # Alert queue, filtering, batch acknowledgement
│   │           ├── HumanReview.tsx    # HITL alert dossier adjudication & escalation
│   │           ├── Incidents.tsx      # Incident dossier & mock base transfer
│   │           ├── Audit.tsx          # Append-only cryptographic ledger verification
│   │           ├── Health.tsx         # IPC latency, socket status & system diagnostics
│   │           └── View3D.tsx         # 3D operational perspective
│   └── simulation/                    # Core simulation engine
│       ├── engine.py                  # SimulationEngine, tick loop, kinematics, sensor checks
│       ├── generators.py              # Waypoint navigation, position noise, confidence degradation
│       ├── models.py                  # Pydantic schemas (Observation, ScenarioConfig, SensorConfig)
│       └── scenarios.py               # 6 standard protocols, standard sensors & zones
├── tests/                             # Test suite
│   ├── backend/
│   │   ├── conftest.py                # Pytest SQLite fixtures & API client setup
│   │   ├── test_api.py                # REST API endpoints & protocol start/stop tests
│   │   └── test_workflows.py          # End-to-end human review & transfer workflow
│   ├── simulation/
│   │   ├── test_engine.py             # Determinism, offline queueing, failure injection
│   │   └── test_models.py             # Synthetic object validation & safety enforcement
│   ├── test_alert_pipeline.py         # Priority scoring, tripwire breaches, deduplication
│   ├── test_audit_chain.py            # SHA-256 hash chaining & anti-tamper tests
│   └── test_offline_recovery.py       # Offline buffer sync & deduplication tests
└── supabase/                          # Supabase migration scripts (reference schema)
```

---

## 3. Current Architecture

IBVAP-SIM employs an **Edge-First Simulation Architecture** decoupled from a **Central Analytics Dashboard**:

```mermaid
graph TD
    subgraph "Simulation Layer (Edge Simulator)"
        SC[Scenario Config\nscenarios.py] --> SE[SimulationEngine\nengine.py]
        SE --> |Kinematics / Waypoints| OBJ[Synthetic Objects]
        OBJ --> |Sensor Range / FOV Check| SENS[Sensors: 5 Cameras + 1 Radar]
        SENS --> |Camera / Radar / Fused| OBS[Observation Stream]
        SE -.-> |Offline Buffer| EO[(EdgeObservation\nSQLite)]
    end

    subgraph "Backend API Layer (FastAPI)"
        OBS --> CB[process_observations\nrouters/simulation.py]
        CB --> AE[Alert Engine\nalert_engine.py]
        AE --> |Tripwire / Breach / Anomaly| PR[Priority Scoring P1-P4]
        PR --> DEDUP[Deduplication Cooldown\n60 Seconds]
        DEDUP --> |New Alert| AL[(Alerts Table)]
        AL --> AUD[Audit Service\naudit_service.py]
        AUD --> ALOG[(Audit Logs Table\nSHA-256 Chained)]
        CB --> |WebSocket /api/simulation/telemetry| WSB[Broadcast Telemetry]
    end

    subgraph "Frontend Layer (React 19 + Vite)"
        WSB --> SCX[SimulationContext.tsx]
        SCX --> CM[Command Map\nCommandMap.tsx]
        SCX --> CAM[Cameras\nCameras.tsx]
        SCX --> RDR[Radar\nRadar.tsx]
        SCX --> TRK[Tracks\nTracks.tsx]
        SCX --> V3D[3D View\nView3D.tsx]
        SCX --> ALT[Alert Queue\nAlerts.tsx]
        ALT --> HR[Human Review\nHumanReview.tsx]
        HR --> INC[Incidents\nIncidents.tsx]
        INC --> MR[Mock Base Receiver\nmock_receiver.py]
        SCX --> AUD_UI[Audit Ledger\nAudit.tsx]
    end
```

### Architectural Principles Verified:
1. **Separation of Detection from Decision:** Sensors only emit observations with uncertainty; the rule engine evaluates alerts; operators make adjudications.
2. **Deterministic Simulation:** Scenarios utilize seeded pseudorandom number generators (`random.Random(seed)`).
3. **Evidence Provenance:** Every alert references the inciting `object_id`, `simulated_time`, `sensor_id`, `scenario_id`, and `simulation_id`.
4. **Append-Only Cryptographic Audit:** Sensitive events (alert generation, acknowledgement, review, escalation, incident resolution, mock transfer) generate SHA-256 hashed blocks referencing the `previous_hash`.
5. **Display/Audit-Only External Receiver:** The Mock Base Receiver (`/api/mock-receiver`) requires an explicit `X-Simulation-ID` header and `is_synthetic: true` payload, returning `202 Accepted` without triggering external side effects.

---

## 4. Implemented Capabilities

| Capability | Module / File | Status | Notes |
|---|---|---|---|
| **2D Command Map** | `src/frontend/src/pages/CommandMap.tsx` | Fully Working | High-contrast gold border, pan/zoom SVG, breadcrumb trails, HUD legend |
| **Outward Camera FOV** | `src/frontend/src/components/simulation/RotatingCameraLayer.tsx` | Fully Working | 5 cameras along x=0, 160° outward FOV pointing to -X (foreign territory), CSS oscillation |
| **Multi-Sensor PPI Radar** | `src/frontend/src/pages/Radar.tsx` | Fully Working | 360° sweeping beam, range scaling (250/500/1000m), isolated azimuth ticker, Doppler blips |
| **Camera Intelligence** | `src/frontend/src/pages/Cameras.tsx` | Working with Gap | Optical & thermal feeds, zoom (1x-4x); displays only 4 of 5 cameras (`slice(0, 4)`) |
| **Tactical 3D View** | `src/frontend/src/pages/View3D.tsx` | Fully Working | Procedural 3D target models, uncertainty envelopes, altitude drop lines, compass tape |
| **Protocol Selector** | `src/frontend/src/components/simulation/SimulationControlBar.tsx` | Fully Working | 6 protocols, speed multipliers (1x, 2x, 4x, 8x), play/pause/reset controls |
| **Alert Engine** | `src/backend/alert_engine.py` | Fully Working | Tripwires (x=-150), Border breach (x=0), Intercept (x=150), 60s cooldown deduplication |
| **Human-in-the-Loop Review** | `src/frontend/src/pages/HumanReview.tsx` | Fully Working | Alert dossier adjudication (Confirm/Reject/Escalate), notes entry, operator logging |
| **Incident Management** | `src/frontend/src/pages/Incidents.tsx` | Fully Working | Incident dossier, resolution workflows, sanitized mock base transfer |
| **Cryptographic Audit Ledger** | `src/backend/audit_service.py` & `Audit.tsx` | Fully Working | SHA-256 hash chaining, dynamic chain integrity verification endpoint (`/api/audit/verify`) |
| **Offline Resilience** | `src/simulation/engine.py` & `models.py` | Fully Working | SQLite-backed `EdgeObservation` durable queue, automatic flush upon recovery |
| **System Health & IPC** | `src/frontend/src/pages/Health.tsx` | Fully Working | IPC round-trip latency ping, service health status, air-gapped compliance badge |
| **Tactical Audio Alarms** | `src/frontend/src/hooks/useAudioAlarm.ts` | Fully Working | 3 distinct Web Audio synthesized tones (detection chirp, proximity warning, air-raid siren) |

---

## 5. Simulation Audit

Each of the 6 standard protocols was tested independently via the backend simulation engine and API:

```
+--------------------------+--------+---------+--------------------+----------------+-------------------+
| Protocol                 | Status | Tracks  | Active Classes     | Movement (1s)  | Alerts Generated  |
+--------------------------+--------+---------+--------------------+----------------+-------------------+
| PROTOCOL-NORMAL          | PASSED | 5       | bird, person, veh  | Confirmed      | 5 alerts          |
| PROTOCOL-DRONE           | PASSED | 3       | drone              | Confirmed      | 8 alerts          |
| PROTOCOL-VEHICLE         | PASSED | 3       | truck, vehicle     | Confirmed      | 11 alerts         |
| PROTOCOL-MULTI-THREAT    | PASSED | 5       | drone, veh, person | Confirmed      | 16 alerts         |
|                          |        |         | unknown aerial obj |                |                   |
| PROTOCOL-EMERGENCY       | PASSED | 5       | drone, veh, unk    | Confirmed      | 21 alerts         |
| PROTOCOL-SENSOR-DEGRADED | PASSED | 2       | drone, truck       | Confirmed      | 23 alerts         |
+--------------------------+--------+---------+--------------------+----------------+-------------------+
```

### Detailed Protocol Observations:

#### 1. PROTOCOL-NORMAL
- **Objects:** 5 objects (`bird_1`, `bird_2`, `person_local`, `person_herder`, `civilian_car`).
- **Behavior:** Birds loiter with slight angular wander; civilian car navigates waypoints across foreign territory; herder and local person cycle loop waypoints.
- **Alerts:** Biological alerts (P4, low priority) for birds; civilian car triggers warning tripwire at x=-150.

#### 2. PROTOCOL-DRONE
- **Objects:** 3 drones (`drone_lead`, `drone_wing_1`, `drone_wing_2`).
- **Behavior:** High-speed ingress (17–19 m/s) at 130–165m altitude originating at x=-600 to x=-640, crossing foreign buffer territory toward sovereign border.
- **Camera/Radar Interactivity:** Drones enter radar coverage immediately (range 700m), then enter camera FOVs at x=-250m. Fused observations emit with high confidence (>0.90).
- **Alerts:** Triggers `TRIPWIRE_CROSS` at x=-150, `FENCE_CROSS` at x=0, and `INTERCEPT_ZONE` at x=150.

#### 3. PROTOCOL-VEHICLE
- **Objects:** 3 ground vehicles (`convoy_lead`, `convoy_rear`, `patrol_pickup`).
- **Behavior:** Steady ground-level navigation (13–15 m/s) along distinct longitudinal corridors (y=80 and y=-150).
- **Alerts:** Sequential tripwire crossing alerts; deduplication suppresses redundant alerts within the 60s cooldown window unless priority band escalates.

#### 4. PROTOCOL-MULTI-THREAT
- **Simultaneous Multi-Class Presence:** **CONFIRMED.** Immediately upon activation, 5 distinct objects appear simultaneously:
  - `drone_strike` (Class: `drone`, Speed: 24 m/s, Altitude: 140m)
  - `tank_assault` (Class: `vehicle`, Speed: 12 m/s, Altitude: 0m)
  - `troop_squad_1` (Class: `person`, Speed: 4.5 m/s, Altitude: 0m)
  - `troop_squad_2` (Class: `person`, Speed: 4.2 m/s, Altitude: 0m)
  - `unknown_bogey` (Class: `unknown aerial object`, Speed: 26 m/s, Altitude: 190m)
- Objects do **NOT** appear sequentially; all 5 move concurrently along independent trajectories.

#### 5. PROTOCOL-EMERGENCY
- **Objects:** 5 simultaneous high-speed threats (`unknown_1`, `unknown_2`, `tank_1`, `tank_2`, `drone_swarm_1`).
- **Behavior:** Rapid trajectory penetration (speeds up to 28 m/s). Rapid escalation through warning tripwire, border fence, and sovereign intercept corridor.
- **Audio/Alarm:** Audio siren triggers automatically in frontend upon unacknowledged breach threats.

#### 6. PROTOCOL-SENSOR-DEGRADED
- **Scripted Events:**
  - $t = 15.0\text{s}$: `camera_degradation` (duration 30.0s) -> camera sensor status becomes `degraded`, positional noise added ($\pm 10\text{m}$), confidence drops to 0.3–0.7, quality drops to 0.5.
  - $t = 35.0\text{s}$: `radar_loss` (duration 20.0s) -> radar status becomes `offline`.
- **System Behavior:** Simulation does not freeze or crash; objects continue moving; uncertainty envelopes expand dynamically in 2D and 3D views.

---

## 6. State Management Audit

### Authoritative State Flow:
The simulation state is managed on the backend by `SimulationEngine` and exposed via `/api/simulation/state` and `/api/simulation/telemetry` (WebSocket). On the frontend, `SimulationContext.tsx` wraps the application, holding authoritative client state.

```
Backend SimulationEngine (Singleton active_engine)
  │
  ├── 4 Hz Async Tick Loop (run_simulation_loop, tick_interval=0.25s)
  │     ├── engine.tick(delta_time = 0.25 * speed_multiplier)
  │     └── process_observations() -> Database Alerts & Audit Logs
  │
  └── Telemetry Broadcast -> WebSocket Clients
        │
        ├── Client 1: SimulationContext.tsx (Authoritative client state)
        └── Client 2: Navigation.tsx (DUPLICATE SUBSCRIPTION)
```

### Concurrency & Loop Investigation:

| Check Item | Result | Finding / Evidence |
|---|---|---|
| **Multiple Simulation Loops** | Pass | `start_simulation()` in `routers/simulation.py` cancels existing `engine_task` before creating a new one. No loop duplication. |
| **Duplicate WebSockets** | **FAIL (P2)** | `Navigation.tsx` (line 33) invokes `useSimulationSocket()`, opening a second concurrent WebSocket connection alongside `SimulationContext.tsx` (line 61). |
| **Duplicate Polling Intervals** | **FAIL (P3)** | `SimulationContext.tsx` polls `/api/simulation/environment` every 2000ms; `CommandMap.tsx` simultaneously polls it every 1000ms via `useEnvironmentPoll(1000)`. |
| **Stale Closures on Reset** | Pass | `clearState()` in `SimulationContext.tsx` synchronously purges `observations`, `tracks`, `trackHistory`, `selectedTrackId`, and `acknowledgedThreatIds`. |
| **Uncontrolled requestAnimationFrame** | Pass | Radar azimuth ticker (`AzimuthTicker` in `Radar.tsx`) throttles state updates to 15 Hz (~66ms) and cleans up `cancelAnimationFrame` on unmount. |
| **State Updates After Reset** | Minor | Backend `_flush_buffer()` commits any remaining offline edge observations when stopped. `object_positions.clear()` prevents stale coordinate tracking. |

---

## 7. Camera Audit

### Geometry & Verification:
- **Number of Cameras:** 5 physical camera stations (`cam_01` to `cam_05`).
- **Sensor Coordinates:**
  - `cam_01`: $(0, 400)$
  - `cam_02`: $(0, 200)$
  - `cam_03`: $(0, 0)$
  - `cam_04`: $(0, -200)$
  - `cam_05`: $(0, -400)$
- **Alignment:** Strictly positioned along $x = 0$ (the International Border).
- **Field of View (FOV):** Exactly **160°** outward sector geometry.
- **Orientation:** $270^\circ$ (pointing due West in mathematical space, which maps to $-X$ / leftward into foreign buffer territory).
- **Geometry Formula:**
  $$\theta_{\text{center}} = 180^\circ \quad (\text{pointing left into foreign territory})$$
  $$\theta_{\text{start}} = 180^\circ - 80^\circ = 100^\circ, \quad \theta_{\text{end}} = 180^\circ + 80^\circ = 260^\circ$$
  $$\text{Path: } M(s_x, s_y) \to L(s_x + R\cos 100^\circ, s_y + R\sin 100^\circ) \to A(R, R) \to (s_x + R\cos 260^\circ, s_y + R\sin 260^\circ) \to Z$$
- **Camera Scanning:** Pure CSS animation (`@keyframes scan-oscillation`, oscillating $\pm 30^\circ$) running on individual camera FOV sector elements. Operates independently of simulation pause (cameras continue visual scanning even when targets pause).
- **Three-State Color System:**
  1. *Idle / Scanning:* Cyan (`#48D3D2`)
  2. *Target Detected in FOV:* Amber (`#F4B65A`)
  3. *Critical Proximity ($x > -90$):* Red (`#F07576`)
- **Discrepancy:** On the Cameras page (`src/frontend/src/pages/Cameras.tsx`), the feed grid only renders 4 cameras because line 62 executes `envCameras.slice(0, 4)`. `cam_05` is missing from that page.

---

## 8. Sensor Audit

### Sensors Implemented:
1. **5 Border Optical/Thermal Cameras:** Range: 250m, FOV: 160°, Orientation: 270°, Site: `site_alpha`.
2. **1 Long-Range Central Radar:** Stationed at $(0, 0)$, Range: 700m, FOV: 360°, Site: `site_alpha`.
3. **1 Synthetic Fusion Engine (`sim_fused_01`):** Blends observations when an object is detected by camera, radar, or both.

### Sensor Provenance & Fusion Formula:
In `src/simulation/engine.py` (lines 300–310):
- If detected by both Camera and Radar:
  $$\text{confidence} = \min\left(1.0, \frac{\text{camera\_conf} + 0.8}{2} + 0.1\right)$$
- If detected by Radar only:
  $$\text{confidence} = 0.7$$
- If detected by Camera only:
  $$\text{confidence} = \text{camera\_conf}$$
- Positional uncertainty: 2.0m for fused/camera; 5.0m for radar; 10.0m when degraded.

---

## 9. Track Audit

### Canonical Object Types:
Supported types in `src/simulation/models.py`:
- `person`
- `vehicle`
- `truck`
- `drone`
- `helicopter`
- `aircraft`
- `bird`
- `bird-like mechanical object`
- `unknown aerial object`

### Track Attributes:
Every track object carries:
- `id`: Unique string identifier (e.g., `drone_lead`, `convoy_lead`, `bird_1`)
- `object_type`: Canonical type from above list
- `x`, `y`: Position in meters (World coordinate space)
- `altitude`: Height in meters ($0$ for ground, $45\text{--}200\text{m}$ for aerial)
- `speed`: Ground speed in m/s
- `heading`: Direction of travel in degrees ($0^\circ = \text{North}, 90^\circ = \text{East}$)
- `confidence`: $[0.0, 1.0]$
- `quality_score`: $[0.0, 1.0]$
- `uncertainty`: Radius in meters
- `sensor_id`: Sensor source ID (`cam_01`, `radar_base`, `sim_fused_01`)
- `is_synthetic`: Strictly `True`

### Semantic Consistency Check:
- "Tank" entities (`tank_assault`, `tank_1`, `tank_2`) use canonical `object_type = "vehicle"` with descriptive IDs.
- "Convoy" entities (`convoy_lead`, `convoy_rear`) use canonical `object_type = "truck"`.
- "Unknown bogeys" use canonical `object_type = "unknown aerial object"`.
- This ensures schema validity while enabling rich tactical glyph rendering in the UI.

---

## 10. Alert Audit

### Rules Implemented in `alert_engine.py`:
1. **Border Warning Tripwire:** Triggered when an approaching object crosses $x = -150$ moving eastward ($\text{prev\_x} < -150 \land x \ge -150$). Reason: `TRIPWIRE_CROSS`, Base Score: 40.0.
2. **Virtual Fence Crossing (Border Breach):** Triggered when an object crosses the international boundary at $x = 0$ ($\text{prev\_x} < 0 \land x \ge 0$). Reason: `FENCE_CROSS`, Base Score: 55.0.
3. **Sovereign Intercept Corridor Penetration:** Triggered when an incursion object penetrates past sovereign depth into $x \ge 150$ ($\text{prev\_x} < 150 \land x \ge 150$). Reason: `INTERCEPT_ZONE`, Base Score: 75.0.
4. **Restricted Zone Entry:** Triggered when an object enters the Base Perimeter ($0 < y < 50 \land -50 < x < 50$). Reason: `ZONE_ENTRY`, Base Score: 65.0 (for person/vehicle) or 30.0 (others).
5. **Anomalous Object Detection:** Triggered for `unknown`, `unknown aerial object`, `bird-like mechanical object`. Reason: `ANOMALY`, Base Score: 60.0.
6. **Biological Track:** Triggered for `bird`. Reason: `BIOLOGICAL`, Base Score: 10.0.

### Priority Calculation in Code (`alert_engine.py`):
$$\text{score} = \text{base\_score} + (\text{confidence} \times 10) + (\text{quality} \times 5) + \min(\text{persistence}, 10.0) + (\text{corroboration} \times 5)$$

### Priority Bands in Code:
- **P1 (Critical):** $\text{score} \ge 90$
- **P2 (High):** $70 \le \text{score} < 90$
- **P3 (Medium):** $40 \le \text{score} < 70$
- **P4 (Low):** $\text{score} < 40$

### Deduplication Logic:
- **Cooldown Window:** Exactly **60.0 seconds** (`COOLDOWN_SECONDS = 60.0`).
- Keyed by `f"{object_id}_{reason_code}"`.
- **Bypass Conditions:**
  1. *Severity Escalation:* If current band severity exceeds previous band severity ($P4 < P3 < P2 < P1$), the cooldown is bypassed.
  2. *Sensor Corroboration:* If a new sensor ID observes the event, the cooldown is bypassed.
- **Fusion Safeguard:** Alert evaluation is executed primarily on `fused` observations (`sensor_type == "fused"`). Raw multi-sensor observations only evaluate if no fused observation exists, successfully preventing duplicate alert flurries.

---

## 11. Human Review Audit

### Complete Workflow Verification:
The human-in-the-loop workflow was verified via live test scripts and browser automation:

$$\text{Alert (NEW)} \xrightarrow{\text{PATCH /acknowledge}} \text{ACKNOWLEDGED} \xrightarrow{\text{POST /review}} \text{REVIEWED} \xrightarrow{\text{POST /escalate}} \text{Incident (OPEN)} \xrightarrow{\text{POST /resolve}} \text{RESOLVED} \xrightarrow{\text{POST /mock-receiver}} \text{TRANSFERRED}$$

### Verified Workflow Attributes:
- **Acknowledge Endpoint:** `PATCH /api/alerts/{alert_id}/acknowledge` transitions alert from `new` to `acknowledged`.
- **Batch Acknowledge:** `POST /api/alerts/acknowledge-all` bulk acknowledges all unacknowledged alerts and records an audit log.
- **Human Review:** `POST /api/alerts/{alert_id}/review` accepts `decision`, `notes`, and `reviewer_id`. Rejects unacknowledged alerts with `400 Bad Request`.
- **Escalation:** `POST /api/alerts/{alert_id}/escalate` creates a linked `Incident` record with foreign key `alert_id`.
- **Incident Resolution:** `POST /api/incidents/{incident_id}/resolve` records `resolution` and `resolution_notes`.
- **Audit Logging:** Every stage generates an append-only audit log entry with `actor`, `action`, `resource`, `outcome`, `reason`, and `simulation_id`.

---

## 12. Offline / Resilience Audit

### Edge Queue Architecture:
- **Durable Persistence Table:** `EdgeObservation` in SQLite (`ibvap.db`).
- **Offline Detection:** When `state.network_status == "offline"`, observations are saved directly to `EdgeObservation` instead of being emitted to the callback.
- **Recovery & Resynchronization:** When network status returns to `online`, `_flush_buffer()` queries all buffered `EdgeObservation` records ordered by timestamp, emits them to the callback, and deletes them from the edge queue within a database transaction.
- **Endpoint:** `POST /api/simulation/sync_events` supports bulk ingestion of offline-accumulated observations.
- **Current Limitation:** The offline buffer in the current prototype runs in the same SQLite database as the central server. In a distributed deployment, this would reside in a local edge SQLite instance.

---

## 13. Audit / Provenance Audit

### Cryptographic Hash Chaining:
Audit logs are chained using SHA-256:
$$\text{hash}_n = \text{SHA-256}\left(\text{action} \parallel \text{resource} \parallel \text{outcome} \parallel \text{timestamp\_iso} \parallel \text{hash}_{n-1}\right)$$
For the genesis block, $\text{previous\_hash} = \text{"GENESIS"}$.

### Verification Check:
- Endpoint: `GET /api/audit/verify`
- Function: `verify_chain_integrity(db)`
- Iterates chronologically from the first block to the last, recomputing each block's SHA-256 hash and verifying that `previous_hash` strictly equals the prior block's `current_hash`.
- **Test Result:** Verified on live database with 23+ chained blocks -> Returns `{"status": "VERIFIED", "message": "Audit chain integrity verified."}`.

---

## 14. AI Analytics Audit

### Honest Classification:
**RULE-BASED / HEURISTIC SIMULATION ONLY.**

There is **NO** active Machine Learning (ML), Deep Neural Network (DNN), or statistical anomaly detection model running in the backend.

### Detailed Evidence:
1. **Anomaly Trigger:** In `src/backend/alert_engine.py` (lines 139–145):
   ```python
   elif obj_type in ["unknown", "unknown aerial object", "bird-like mechanical object"]:
       alert_payload = {
           "alert_type": "Anomalous Object Detected",
           "reason_code": "ANOMALY",
           "base_score": 60.0
       }
   ```
   Anomalies are triggered purely by string matching on the synthetic `object_type` field.
2. **UI Anomaly Toggle Disconnect:** In `src/frontend/src/components/simulation/SimulationControlBar.tsx`:
   - Line 26: `const [anomalyEnabled, setAnomalyEnabled] = useState(false);`
   - Line 166: Button toggles `anomalyEnabled` locally.
   - It is never passed to `startSimulation()` and never sent to `/api/simulation/start`.
   - The backend `StartRequest` model includes `anomaly_detection_enabled: bool = False`, and `get_simulation_state()` hardcodes `"anomaly_detection_enabled": False`.
   - **Conclusion:** The AI Anomaly Injection button in the UI is currently a cosmetic toggle that does not affect simulation execution.

---

## 15. 3D Audit

### Implementation Details:
- **Engine:** Three.js + React Three Fiber (`@react-three/fiber`) + Drei (`@react-three/drei`).
- **Components:**
  - `Scene.tsx`: Configures `OrbitControls`, lighting, camera telemetry tracking, viewport presets (Top-Down, Isometric, Perimeter, North).
  - `TrackLayer.tsx`: Maps over consolidated targets; renders procedural 3D meshes based on object type (`Target3DModel.tsx`), velocity vectors, targeting brackets, camera detection reticles, radar echo rings, and altitude drop lines with ground shadow pulses.
  - `SensorLayer.tsx`: 3D visual representation of 5 camera FOVs and central radar dome.
  - `ZoneLayer.tsx`: 3D extruded boundary walls for Base Perimeter and Intercept Corridor.
  - `SyntheticEnvironment.tsx`: Grid floor, international border line, skybox/fog.
- **Fault Tolerance:** Wrapped in `WebGLErrorBoundary` (`View3D.tsx`). If WebGL context is lost or hardware acceleration is absent, it renders a tactical fault screen while keeping 2D operations functional.
- **Performance:** `TrackLayer.tsx` contains an effect with `setCachedTargets` that oxlint flagged for triggering re-renders during state synchronization.

---

## 16. Frontend Audit

### Route Inspection:
1. **`/` (Command Map):** Fully operational. Displays gold border, border marker posts, 5 rotating cameras, real-time track markers with priority rings, floating simulation controls, HUD telemetry strip, and audio alarm controls.
2. **`/cameras` (Camera Intelligence):** Operational with gap. Renders 4 camera feeds with optical/thermal toggles, digital zoom (1x–4x), and coverage indicators. Missing `cam_05`.
3. **`/radar` (Radar / Sensor View):** Fully operational. 360° PPI sweep beam, Doppler velocity blips, range scale buttons (250/500/1000m), isolated azimuth ticker (~15 Hz), anti-stealth/PCL mode toggle.
4. **`/tracks` (Live Tracks):** Fully operational. Metrics summary grid and real-time multi-sensor tracks table with classification pills and provenance tags.
5. **`/alerts` (Alert Queue):** Fully operational. Grouped alerts, status pills, category filters (breach, tripwire, anomaly, biological), priority filters (P1–P4), individual and bulk acknowledge buttons.
6. **`/human-review` (Human Review):** Fully operational. Displays alert dossier, sensor provenance, timeline, and adjudication buttons (Confirm, Reject, Escalate).
7. **`/incidents` (Incidents):** Fully operational. Lists open and resolved incidents, resolution notes input, and Mock Base Transfer button.
8. **`/audit` (Audit Trail):** Fully operational. Displays chronological SHA-256 audit ledger, chain length, hash algorithm, and working "VERIFY HASH CHAIN" button.
9. **`/health` (System Health):** Fully operational. Pings `/health` every 5s, displays round-trip IPC latency in ms, telemetry socket status (60 Hz streaming), and air-gapped safety badge.
10. **`/3d-view` (3D Operational View):** Fully operational. Interactive 3D tactical environment with OrbitControls, compass tape, and camera viewport presets.

---

## 17. Documentation Audit

A forensic comparison between `docs/` and the actual codebase revealed several notable mismatches:

| Document | Stated in Documentation | Actual Implementation in Code | Classification |
|---|---|---|---|
| `docs/ALERT-ENGINE-SPECIFICATION.md` | 9-factor priority formula: `0.25*zone_risk + 0.20*object_risk + ...` | 5-factor additive formula: `base + conf*10 + qual*5 + pers + corr*5` | DOCUMENTATION / IMPLEMENTATION MISMATCH |
| `docs/ALERT-ENGINE-SPECIFICATION.md` | Priority bands: P1 (80-100), P2 (60-79), P3 (35-59), P4 (0-34) | Priority bands: P1 (>=90), P2 (>=70), P3 (>=40), P4 (<40) | DOCUMENTATION / IMPLEMENTATION MISMATCH |
| `docs/07-API-SPECIFICATION.md` | `POST /api/alerts/{alert_id}/acknowledge` | `PATCH /api/alerts/{alert_id}/acknowledge` | DOCUMENTATION / IMPLEMENTATION MISMATCH |
| `docs/07-API-SPECIFICATION.md` | `sync_events` returns `{"status": "success", "processed": int}` | Returns `{"status": "synced", "count": int}` | DOCUMENTATION / IMPLEMENTATION MISMATCH |
| `docs/07-API-SPECIFICATION.md` | Simulation control endpoints omitted | `POST /start`, `/stop`, `/pause`, `/resume`, `/speed`, `GET /state`, `/tracks`, `WS /telemetry` implemented | UNDOCUMENTED IMPLEMENTATION |
| `docs/10-UI-UX-SPECIFICATION.md` | Mentions 4 cameras | Backend implements 5 cameras (`cam_01` to `cam_05`) | DOCUMENTATION / IMPLEMENTATION MISMATCH |
| `docs/ALERT-ENGINE-SPECIFICATION.md` | Deduplication window: 60 seconds | Code implements 60.0 seconds (`COOLDOWN_SECONDS = 60.0`) | Verified Match |

---

## 18. Dependency / Integration Audit

### Python Dependencies (`requirements.txt`):
- `fastapi` (0.115.11)
- `uvicorn` (0.34.0)
- `sqlalchemy` (2.0.38)
- `pydantic` (2.10.6)
- `pytest` (9.1.1)
- `httpx` (0.28.1)
- `pytest-asyncio` (1.4.0)

### Frontend Dependencies (`package.json`):
- `react`, `react-dom` (19.2.8)
- `react-router-dom` (7.18.3)
- `three` (0.186.0), `@react-three/fiber` (9.7.0), `@react-three/drei` (10.7.8)
- `lucide-react` (1.45.0)
- `axios` (1.20.0)
- `recharts` (3.10.1)
- `maplibre-gl` (6.9.0), `react-map-gl` (8.1.3)
- `tailwindcss` (3.4.19), `clsx`, `tailwind-merge`, `class-variance-authority`
- Dev: `vite` (8.3.0), `oxlint` (1.81.0), `typescript` (6.0.2)

### Integrations & Services:
- **Database:** Local SQLite (`ibvap.db`, `ibvap_sim.db`).
- **External Services / Cloud APIs:** **ZERO.** No external APIs, military networks, or cloud database connections are active.
- **MCP Servers:** None active for runtime operational data.

---

## 19. Security / Safety Audit

### Safety Boundary Compliance:
- **Air-Gapped Status:** **100% COMPLIANT.** The codebase contains zero connections to real defence, army, police, CCTV, radar, or weapon systems.
- **Autonomous Action:** **100% COMPLIANT.** There is no automated firing, targeting, interception, or weapon control logic. The system is display and human review only.
- **Hardcoded Secrets:** Scanned codebase with regex for API keys, tokens, and credentials. **ZERO secrets found.**
- **Synthetic Flags:** All database models (`Alert`, `Incident`, `AuditLog`, `MockTransfer`, `EdgeObservation`) enforce `is_synthetic = True` by default.
- **Mock Transfer Protection:** `/api/mock-receiver` rejects any payload where `is_synthetic` is not True and requires `X-Simulation-ID`.

---

## 20. Performance Audit

### Metrics Recorded During Live Execution:
- **Backend Tick Rate:** 4 Hz (250ms tick interval). Tick processing time averages **< 4ms** per tick.
- **WebSocket Broadcast:** Fire-and-forget asynchronous broadcast. Telemetry latency averages **< 5ms**.
- **Frontend Frame Rate:** 60 FPS sustained on Command Map and Radar views.
- **Memory Footprint:**
  - `trackHistory` in `SimulationContext.tsx` is strictly bounded to a maximum of **15 points per track**, preventing memory leaks.
  - Event timeline is bounded to the **last 50 events**.
  - `cachedTargets` in `Radar.tsx` evicts targets after 3 seconds of inactivity.
- **CPU Optimization:** Radar azimuth ticker (`AzimuthTicker`) is isolated in a separate sub-component and throttled to 15 Hz, preventing parent re-render churn.
- **Runtime Warning Identified:** During browser verification, Vite client logged `Maximum update depth exceeded` errors caused by cascading `setState` calls inside `useEffect` (`SimulationContext.tsx` and `Radar.tsx`).

---

## 21. Test Results

### Backend Test Suite (`pytest`):
- **Total Tests Collected:** 32
- **Passed:** 31
- **Failed:** 0
- **Errors:** 1 (`test_simulation.py::test_protocol`)
- **Skipped:** 0
- **Warnings:** 2 (Starlette/Anyio deprecation warnings in test client)

#### Test Breakdown:
- `tests/backend/test_api.py`: 12/12 passed (Health, Start/Stop, Tracks, Alerts, Mock Receiver, Protocols, Transitions, Bulk Ack).
- `tests/backend/test_workflows.py`: 1/1 passed (Full human review workflow).
- `tests/simulation/test_engine.py`: 7/7 passed (Determinism, Network failure, Camera degradation, Clock drift, Edge restart, Scenarios).
- `tests/simulation/test_models.py`: 3/3 passed (Synthetic validation, Safety flag enforcement, Config defaults).
- `tests/test_alert_pipeline.py`: 4/4 passed (Priority bands, Deduplication, Pipeline alerts, Escalation).
- `tests/test_audit_chain.py`: 2/2 passed (Hash chain validity, Anti-tampering detection).
- `tests/test_offline_recovery.py`: 1/1 passed (Offline sync & event deduplication).
- `test_simulation.py`: 1 error (Misplaced integration script with bare test function).

### Frontend Build & Lint:
- **TypeScript & Vite Build:** `tsc -b && vite build` -> **0 errors**, built in 1.74s.
- **Linter (`oxlint`):** 52 files scanned, **0 errors**, **14 warnings**.

---

## 22. Browser Verification Results

Read-only browser verification was executed via the browser subagent (`browser_subagent`) on `http://localhost:5173/`.

### Verified Visual & Interactive Elements:
1. **Command Map:**
   - Gold border line and tactical border marker posts with `◄ FOREIGN | SOVEREIGN ►` callouts render with high contrast.
   - All 5 cameras display outward-facing 160° FOV cones and actively scan foreign territory.
   - Starting `PROTOCOL-DRONE` produced 3 moving drone markers leaving cyan trails.
   - Drones intersecting camera FOVs transitioned camera status indicators from cyan to amber/red with tracking reticles.
   - Audio status HUD rendered correctly; alarm silence button appeared upon breach.
2. **Simulation Controls:**
   - Floating "SIMULATION MODE" button opened the semi-transparent tactical control panel.
   - Protocol switching, Pause, Resume, and Reset executed cleanly.
3. **Camera Intelligence (`/cameras`):**
   - Renders 4 camera feeds with optical and thermal modes, zoom controls, and telemetry overlays.
4. **Radar View (`/radar`):**
   - 360° radar sweep animation and azimuth ticker operated smoothly. Target returns rendered with Doppler speed tags.
5. **Live Tracks (`/tracks`):**
   - Metrics cards and tracks table updated synchronously with simulation ticks.
6. **Alert Queue (`/alerts`):**
   - Grouped alerts displayed with priority pills (P1/P2/P3/P4).
7. **Human Review (`/human-review`):**
   - Full alert dossier displayed with adjudication action buttons.
8. **Incidents (`/incidents`):**
   - Incident list rendered with resolution details and mock transfer status.
9. **Audit Trail (`/audit`):**
   - "VERIFY HASH CHAIN" button clicked; ledger status transitioned to `CHAIN VALID`.

---

## 23. Bugs Found

| Bug ID | Severity | Component | Description |
|---|---|---|---|
| **BUG-01** | P1 | Test Suite | `test_simulation.py` in workspace root is discovered by pytest as a test module, causing 1 error (`fixture 'scenario_name' not found`). |
| **BUG-02** | P2 | Frontend Architecture | `Navigation.tsx` instantiates `useSimulationSocket()`, opening a duplicate WebSocket connection alongside `SimulationContext.tsx`. |
| **BUG-03** | P2 | Frontend Controls | "AI ANOMALY INJECTION" button in `SimulationControlBar.tsx` toggles local React state only; disconnected from backend simulation engine. |
| **BUG-04** | P2 | Frontend Page | `Cameras.tsx` slices camera array to 4 (`envCameras.slice(0, 4)`), omitting `cam_05` from the Camera Intelligence grid. |
| **BUG-05** | P2 | Frontend Runtime | React error: `Maximum update depth exceeded` logged during rapid telemetry updates due to cascading `setState` calls inside `useEffect` (`SimulationContext.tsx` and `Radar.tsx`). |
| **BUG-06** | P3 | Performance | Dual polling of `/api/simulation/environment`: `SimulationContext.tsx` polls every 2s, while `CommandMap.tsx` polls every 1s. |
| **BUG-07** | P3 | UI Redundancy | Simulation playback controls (Pause/Resume/Reset) are duplicated across both `TopHeader.tsx` and `SimulationControlBar.tsx`. |
| **BUG-08** | P3 | Frontend Code Quality | Oxlint reports 4 `set-state-in-effect` warnings in `SimulationContext.tsx` and `TrackLayer.tsx` that can cause cascading re-renders. |
| **BUG-09** | P4 | Build Warning | `vite.config.ts` uses `__dirname` which produces a native config loader deprecation warning in Vite v8. |

---

## 24. Technical Debt

1. **Test Discovery Configuration:** Absence of a `pytest.ini` or `pyproject.toml` configuration defining explicit test directories (`testpaths = ["tests"]`), causing non-test scripts in root to trigger test collection failures.
2. **REST API Documentation Sync:** `docs/07-API-SPECIFICATION.md` documents `POST` for alert acknowledgement while code implements `PATCH`, and omits 11 active simulation and alert endpoints.
3. **Alert Formula Documentation Sync:** `docs/ALERT-ENGINE-SPECIFICATION.md` documents an outdated 9-factor priority formula that differs from the active 5-factor implementation in `alert_engine.py`.
4. **Offline Persistence Segregation:** `EdgeObservation` queue is located in the primary `ibvap.db` SQLite database rather than a distinct edge-isolated database file.
5. **Audio Context Autoplay Handling:** While `TacticalSoundManager` includes user interaction unlocking, initial page load before user interaction logs benign Web Audio context warnings in browser console.

---

## 25. Missing Capabilities

The following capabilities are missing from the current prototype (to be addressed in future phases, NOT in Phase 12A):
1. **Dynamic Anomaly Injection Control:** Ability to dynamically trigger synthetic anomalies from the frontend during an active simulation run via API.
2. **Configurable Alert Rules UI:** UI for operators to adjust tripwire coordinates or priority weights dynamically without restarting backend.
3. **Multi-Camera 5th Feed Card:** 5-camera responsive grid on the `/cameras` page to include `cam_05`.
4. **Unified WebSocket Dispatcher:** A single centralized WebSocket listener in `SimulationContext` feeding all navigation badges and child components.

---

## 26. P0/P1/P2/P3/P4 Classification

| Priority | Count | Issues Included | Justification |
|---|---|---|---|
| **P0 (Demo-Breaking)** | **0** | None | System runs smoothly end-to-end; no crashes or fatal blockers. |
| **P1 (Major Functionality)** | **1** | BUG-01 (Pytest test discovery failure in `test_simulation.py`) | Breaks clean CI/CD test runs (`pytest` exits with code 1). |
| **P2 (Important Quality)** | **4** | BUG-02 (Duplicate WebSocket in Navigation), BUG-03 (Disconnected AI Anomaly toggle), BUG-04 (Missing 5th camera in Cameras.tsx), BUG-05 (React Maximum update depth exceeded) | Impacts architecture cleanliness, runtime stability, feature completeness, and sensor representation. |
| **P3 (Minor Issue)** | **3** | BUG-06 (Duplicate environment polling), BUG-07 (Redundant header controls), BUG-08 (Oxlint setState in effect warnings) | Sub-optimal resource utilization and component lifecycle warnings. |
| **P4 (Cosmetic / Optional)** | **1** | BUG-09 (Vite `__dirname` config warning) | Harmless build warning with no runtime impact. |

---

## 27. Recommended Next Steps

1. **Phase 12B (Bug Fixes & Stabilization):**
   - Move or rename `test_simulation.py` to `scripts/manual_test_simulation.py` or configure `pytest.ini` with `testpaths = ["tests"]`.
   - Remove `useSimulationSocket()` call from `Navigation.tsx` and consume alert counts directly from `SimulationContext`.
   - Wire the "AI ANOMALY INJECTION" button in `SimulationControlBar.tsx` to pass `anomaly_detection_enabled` to `/api/simulation/start`.
   - Update `Cameras.tsx` grid to accommodate all 5 cameras.
   - Refactor `useEffect` in `SimulationContext.tsx` and `Radar.tsx` to eliminate cascading `setState` calls causing "Maximum update depth exceeded".
2. **Phase 12C (Documentation Reconciliation):**
   - Update `docs/07-API-SPECIFICATION.md` with current endpoints and HTTP verbs (`PATCH` for acknowledgement).
   - Update `docs/ALERT-ENGINE-SPECIFICATION.md` to document the active priority scoring formula and bands.
3. **Phase 13 (Demo Readiness & Script Polish):**
   - Rehearse the SIH presentation flow using the verified protocols (`DRONE` -> `MULTI-THREAT` -> `EMERGENCY`).

---

## 28. Proposed Phase 12 Implementation Order

```
[Phase 12A: Diagnostic / Gap Analysis (Current - Complete)]
                         │
                         ▼
[Phase 12B: Test & Concurrency Hardening]
  1. Add pytest.ini (testpaths = ["tests"]) -> Restores 100% clean test suite
  2. Unify WebSocket in SimulationContext -> Eliminates duplicate socket connection
  3. Deduplicate /api/simulation/environment polling -> Eliminates redundant HTTP traffic
  4. Fix React cascading setState in effects -> Resolves Maximum update depth exceeded
                         │
                         ▼
[Phase 12C: Feature & UI Alignment]
  5. Wire AI Anomaly Injection toggle to backend StartRequest
  6. Expand Cameras.tsx to display all 5 cameras (CAM_01 to CAM_05)
  7. Clean up redundant simulation controls in TopHeader.tsx
                         │
                         ▼
[Phase 12D: Documentation Reconciliation]
  8. Align 07-API-SPECIFICATION.md and ALERT-ENGINE-SPECIFICATION.md with code
```

---
*End of Phase 12A Audit Report.*
