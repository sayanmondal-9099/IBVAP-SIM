# Simulation Engine Hardening Report

## Initial State
The existing simulation engine was functional but lacked explicit determinism tracking, failure modeling, and a comprehensive scenario suite. Random numbers were seeded, but simulation identity was generated randomly each run, preventing reproducible offline replays. The prototype only produced basic "fused" tracks without explicitly defining the observation's provenance (e.g. sensor distance, uncertainty).

## Architecture
The engine uses a discrete `tick()` loop. Scenarios are injected with a deterministic config. In this phase, we enhanced the existing architectural components without introducing a complex pseudo-ML layer or adding external libraries. We hardened the `Observation` payload to structurally represent deterministic failure outputs.

## Changes
- **Models:** Updated `ScenarioConfig` to optionally accept an explicit `simulation_id`. Modified `Observation` to include `sensor_id`, `site_id`, `quality_score`, `distance`, and `uncertainty`. Added new event literals (`radar_loss`, `camera_outage`, `clock_drift`, `edge_restart`, `storage_pressure`, `sensor_unavailable`).
- **Engine:** `SimulationEngine` now generates `simulation_id` deterministically using `uuid5` on the seed if an explicit ID is omitted. Replaced random noise drops with deterministic degradation logic across confidence, quality, distance, and positional uncertainty.
- **Scenarios:** Expanded `scenarios.py` from 5 internal scenarios to the full 17 SIH demo requirements.
- **API Router:** Exported the 17 deterministic scenario configs to the `/api/simulation/start` endpoint for frontend integration.

## Deterministic Replay
Simulation IDs are now generated deterministically using `uuid.uuid5` keyed against the scenario seed (or explicitly supplied via config). `SimulationEngine` replay generates byte-for-byte identical streams over 5 ticks (verified in `test_engine_deterministic_output`).

## Simulation Clock
Supported natively via `tick()` loop, driven by `tick_rate` and `current_tick`.

## Sensor Model
The synthetic sensor model now formally emits `sensor_id`, `site_id`, `distance`, `uncertainty`, and `quality_score`.

## Track Model
Trajectories explicitly derive from deterministic trigonometry per tick (`move_object` in `generators.py`).

## Failure Injection
Implemented:
- `camera_outage` / `radar_loss`: Silent observation omission.
- `camera_degradation`: Positional noise injection, confidence drops, quality drops, and uncertainty inflation.
- `storage_pressure`: Global degradation representing overloaded frame buffers.
- `clock_drift`: Additive time drift to emitted observations while maintaining the actual simulation progression.

## Network Recovery
Simulated `edge_restart` event successfully flushes the in-memory buffer, sets the network to `offline`, and autonomously triggers a `network_recovery` event via delayed config injection (verified in `test_engine_edge_restart`).

## Radar Simulation
Strictly simulated. Emits tracks where `is_synthetic = True` natively.

## Camera Simulation
Strictly simulated. Degradation logic inflates coordinate variance instead of replacing real feeds.

## Scenario Inventory
Available endpoints mapped in the `start_simulation` API:
- `SCN-001`: Person enters restricted zone
- `SCN-002`: Vehicle crosses virtual fence
- `SCN-003`: Drone enters restricted airspace
- `SCN-004`: Ordinary bird
- `SCN-005`: Bird-like mechanical unusual behavior
- `SCN-006`: Unknown aerial object
- `SCN-007`: Helicopter/aircraft safe-distance simulation
- `SCN-008`: Multiple people/vehicles
- `SCN-009`: Camera/radar corroboration
- `SCN-010`: Camera/radar disagreement
- `SCN-011`: Network disconnect while tracking
- `SCN-012`: Edge restart and recovery
- `SCN-013`: Camera degraded/obstructed
- `SCN-014`: Radar loss
- `SCN-015`: Storage pressure
- `SCN-016`: Clock drift
- `SCN-017`: High-priority simulated alert

## Expected Outcomes
Defined implicitly within the assertions of the testing suite. `test_engine.py` asserts expected offsets during `clock_drift`, metric bounds during `camera_degradation`, and identical object output during deterministic replays.

## Tests
- `test_engine_deterministic_output`: Confirmed identical paths and UUIDs.
- `test_engine_network_failure_queueing`: Confirmed buffer queueing and flush.
- `test_engine_camera_degradation`: Confirmed confidence and quality drops.
- `test_engine_clock_drift`: Confirmed observation timestamp drift.
- `test_engine_edge_restart`: Confirmed buffer wipe and autonomous recovery.

## Regression Results
All backend components, audit chains, deduplication systems, and the alert rule engine continue to pass with the updated simulated properties.

## Safety Verification
Verified. No external network request library, physical API wrapper, real biometric database, or weapons/targeting interfaces exist in this repository. `is_synthetic = True` remains unalterable.

## Remaining Limitations
- Sensor modeling relies on basic trigonometry and random uniform distributions rather than pseudo-ML inference logic, which is acceptable under ADR-001.
- Offline queuing does not actually write to SQLite; it utilizes an in-memory `List` to simulate the Edge buffer.
