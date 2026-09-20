# PHASE 12C — ALERT SCORING & SENSOR HEALTH PARITY

## 1. Baseline
- **Backend Tests:** 38 passing.
- **Frontend Build:** Passing (`tsc -b && vite build` 0 errors).
- **Lint:** 0 errors.
- **Protocols & Controls:** All 6 simulation protocols validated; START / PAUSE / RESUME / RESET and 1X / 2X / 4X / 8X validated.
- **Stability:** Concurrency stabilized, duplicate WebSockets/polling eliminated in Phase 12B.

## 2. Authoritative Alert Specification
- **Specification Source:** `docs/ALERT-ENGINE-SPECIFICATION.md` and `docs/ADR/ADR-005-alert-prioritization.md`.
- **Canonical Formula:**
  $$\text{priority\_score} = 0.25 \times \text{zone\_risk} + 0.20 \times \text{object\_risk} + 0.15 \times \text{proximity\_score} + 0.15 \times \text{persistence\_score} + 0.10 \times \text{corroboration\_score} + 0.10 \times \text{confidence\_score} + 0.05 \times \text{response\_urgency} - \text{quality\_penalty} - \text{duplicate\_penalty}$$
- **Score Normalization & Bounds:** Input factors normalized to $[0.0, 100.0]$. Final score clamped to $[0.0, 100.0]$ and rounded to 1 decimal place.
- **Canonical Priority Thresholds:**
  - **P1 (Critical):** 80–100
  - **P2 (High):** 60–79
  - **P3 (Medium):** 35–59
  - **P4 (Low):** 0–34
- **Deduplication:** 60.0-second cooldown window per `object_id` and `reason_code`. Bypassed on severity escalation or new sensor corroboration.

## 3. BUG-05 Resolution
- **Issue:** Alert engine implemented a 5-factor additive formula (`base_score + confidence*10 + quality*5 + persistence + corroboration*5`) instead of the 9-factor weighted formula.
- **Resolution:** Updated `calculate_priority` and `process_observation` in `src/backend/alert_engine.py` to evaluate all 9 factors:
  1. `zone_risk`: Spatial threat weight (INTERCEPT_ZONE: 95, ZONE_ENTRY: 85, FENCE_CROSS: 75, ANOMALY: 70, TRIPWIRE_CROSS: 50, BIOLOGICAL: 15).
  2. `object_risk`: Target threat classification (drone: 90, vehicle/truck: 75, person: 60, unknown: 70, bird: 20).
  3. `proximity_score`: Proximity to sovereign border fence at $x=0$ ($100.0$ if $x \ge 0$, else $100.0 \times \max(0.0, 1.0 - |x|/500.0)$).
  4. `persistence_score`: Tracking duration ($\min(100.0, \text{persistence} \times 10.0)$).
  5. `corroboration_score`: Multi-sensor confirmation ($\ge 2$ sensors: 100.0, 1 sensor: 60.0, 0: 20.0).
  6. `confidence_score`: Detection confidence ($\text{confidence} \times 100.0$).
  7. `response_urgency`: Speed / velocity dynamic urgency ($>20\text{ m/s} \rightarrow 90.0$, $>10\text{ m/s} \rightarrow 70.0$, $\le 10\text{ m/s} \rightarrow 40.0$).
  8. `quality_penalty`: Sensor degradation penalty ($(1.0 - \text{quality}) \times 20.0$).
  9. `duplicate_penalty`: Re-trigger penalty ($0.0$ default).
- Backward compatibility preserved for legacy callers.

## 4. BUG-06 Resolution
- **Issue:** Code enforced legacy thresholds (P1 $\ge 90$, P2 $\ge 70$, P3 $\ge 40$, P4 $< 40$) differing from specification.
- **Resolution:** Aligned priority thresholds in `calculate_priority` to:
  - P1: 80–100
  - P2: 60–79
  - P3: 35–59
  - P4: 0–34
- Clamped score to $[0.0, 100.0]$.
- Added unit tests covering all exact boundaries: 0, 25, 34, 35, 59, 60, 79, 80, 99, 100.

## 5. BUG-07 Resolution
- **Issue:** `src/frontend/src/pages/Cameras.tsx` hardcoded `.slice(0, 4)`, omitting `cam_05`.
- **Resolution:**
  - Removed `.slice(0, 4)` and mapped all available camera sensors.
  - Added `cam_05` (`OPTICAL-05`, `SECTOR ECHO (SOUTH)`) to `DEFAULT_CAMERAS`.
  - Added `cam_05` to `zoomLevels` (`1.0`) and `thermalModes` (`false`).
  - Added `cam_05` coordinate bore-sight mapping (`sy: -400`) in `isObsInCoverage` and `getObsFeedPos`.
  - Added `"degraded"` status support to `CameraConfig` and rendered amber indicators when degraded.

## 6. BUG-08 Resolution
- **Issue:** `PROTOCOL-SENSOR-DEGRADED` reduced observation quality but did not propagate `s.status = "degraded"` to central sensor health or recover cleanly.
- **Resolution:**
  - In `src/simulation/scenarios.py`: set `camera_degradation` scripted event `timestamp=0.0` with `duration=30.0` so degradation starts immediately upon protocol activation.
  - In `src/simulation/engine.py`:
    - Updated `_execute_event` to set `s.status = "degraded"` on all cameras.
    - Added recovery logic in `tick()`: when `current_tick >= active_degradation_end`, resets `active_degradation_end = None`, restores camera `s.status = "online"`, and logs a `sensor_recovery` event.
    - In `stop()`: resets all sensors to `status = "online"` and clears degradation timers.
  - Added `"sensor_recovery"` to `EventType` literal in `src/simulation/models.py`.
  - In `Cameras.tsx`: added amber status dot and `DEGRADED` status pill for degraded cameras.

## 7. BUG-09 Resolution
- **Issue:** Documentation specified `POST /api/alerts/{id}/acknowledge` while backend implemented `PATCH /api/alerts/{id}/acknowledge`.
- **Resolution:**
  - Confirmed `PATCH` is canonical and RESTful for resource state mutation (`alert.status = "acknowledged"`).
  - Preserved working `PATCH` implementation in `src/backend/routers/alerts.py` and frontend `src/frontend/src/pages/Alerts.tsx`.
  - Updated `docs/07-API-SPECIFICATION.md` to document `PATCH /api/alerts/{alert_id}/acknowledge`.

## 8. Tests Added/Updated
Updated `tests/test_alert_pipeline.py` with 9 comprehensive test cases:
1. `test_canonical_scoring_factors`: Verifies individual weights (0.25, 0.20, 0.15, 0.15, 0.10, 0.10, 0.05).
2. `test_penalties_and_score_bounds`: Verifies quality penalty, duplicate penalty, and clamping to $[0.0, 100.0]$.
3. `test_priority_band_boundaries`: Tests exact boundary values (0, 25, 34, 35, 59, 60, 79, 80, 99, 100).
4. `test_deduplication`: Verifies 60-second cooldown window and bypass conditions.
5. `test_sensor_health_degraded_recovery_lifecycle`: Verifies `HEALTHY` $\rightarrow$ `DEGRADED` $\rightarrow$ `RECOVERY` $\rightarrow$ `HEALTHY` and reset behavior.
6. `test_cameras_count_and_config`: Verifies standard sensor configuration contains 5 cameras (`cam_01`–`cam_05`).
7. `test_acknowledge_api_patch_contract`: Tests `PATCH /api/alerts/{id}/acknowledge` 200 response, 404 for invalid ID, and idempotent repeat calls.
8. `test_pipeline_generates_alert`: Verifies end-to-end observation to alert creation.
9. `test_alert_escalation_tripwire_breach_intercept`: Verifies escalation from tripwire to breach to intercept corridor.

## 9. Backend Test Results
```text
======================== 43 passed, 2 warnings in 2.19s ========================
```
- Total tests: 43 (all passing, 0 failures).

## 10. Frontend Build Results
```text
> tsc -b && vite build
✓ built in 980ms
```
- Build succeeded with 0 errors.

## 11. Lint Results
```text
Found 15 warnings and 0 errors.
Finished in 68ms on 52 files with 116 rules using 8 threads.
```
- 0 errors.

## 12. Browser Verification
- **Cameras Page (`/cameras`):**
  - All 5 cameras (`cam_01` to `cam_05`) rendered in tactical grid.
  - Optical nodes counter displayed `5 / 5 ONLINE`.
  - Individual zoom controls (1.0X–4.0X) and FLIR/EO mode toggles functional.
- **Sensor Degraded State:**
  - On `PROTOCOL-SENSOR-DEGRADED`, cameras transitioned to `DEGRADED` with amber status indicators.
  - Sensor recovery verified after duration.
- **Alert Queue (`/alerts`):**
  - Priority scores and bands adhered to P1 ($\ge 80$), P2 ($\ge 60$), P3 ($\ge 35$), P4 ($< 35$).
  - `PATCH /api/alerts/{id}/acknowledge` successfully transitioned alerts to `ACKNOWLEDGED`.
- **Audit Trail (`/audit`):**
  - SHA-256 blocks generated for `acknowledge_alert` with valid hash chains.
  - Chain verification returned `status: "VERIFIED"`.
- **Console Logs:**
  - 0 console errors.
  - 0 React update-depth errors.
  - 0 duplicate WebSockets / polling calls.

## 13. Documentation Consistency
- Updated `docs/07-API-SPECIFICATION.md` to document `PATCH /api/alerts/{alert_id}/acknowledge`.
- Verified `docs/ALERT-ENGINE-SPECIFICATION.md` and `docs/ADR/ADR-005-alert-prioritization.md` align with implemented formulas and thresholds.

## 14. Regression Results
- All 6 protocols (`NORMAL`, `DRONE`, `VEHICLE`, `MULTI-THREAT`, `EMERGENCY`, `SENSOR-DEGRADED`) functional.
- Simulation controls (`START`, `PAUSE`, `RESUME`, `RESET`) and speed multipliers (`1X`, `2X`, `4X`, `8X`) functional.
- Object movement, camera scanning, and FOV ($160^\circ$) preserved.

## 15. Remaining Issues
1. **Frontend Compiler Warnings:** 15 ESLint / React Compiler warnings in `Radar.tsx` and `ProfileModal.tsx` (`Date.now()` during render, ref access in `useMemo`).
2. **SQLite Concurrency:** SQLite single-writer lock under rapid parallel writes (satisfactory for prototype; production will use PostgreSQL).

## 16. Recommended Next Phase
- **Phase 12D — Frontend Compiler Warning Remediation & UI Polish:** Clean up the 15 React Compiler/ESLint warnings in `Radar.tsx` and `ProfileModal.tsx`, and optimize bundle code-splitting.
