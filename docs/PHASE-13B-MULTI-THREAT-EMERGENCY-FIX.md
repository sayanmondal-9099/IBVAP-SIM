# PHASE 13B: Multi-Threat and Emergency Simulation Fix

## Root Cause
The `MULTI-THREAT` and `EMERGENCY` simulation scenarios were failing with HTTP 500 responses upon initialization. This occurred because the scenario configuration directly instantiated `SyntheticObject` using `object_type` values like `"tank"` and `"convoy"`. However, the Pydantic schema for `SyntheticObject.object_type` is strictly defined as a `Literal` containing canonical types (e.g., `"person"`, `"vehicle"`, `"truck"`, `"drone"`). Using non-canonical strings caused Pydantic validation failures that crashed the endpoint.

## Affected Files
1. `src/simulation/scenarios.py`
2. `tests/simulation/test_engine.py` (Fixed unrelated, pre-existing broken tests caused by previous scenario name refactoring)
3. `tests/backend/test_api.py` (Added tests and fixed scenario names)

## Fix Applied
In `src/simulation/scenarios.py`, the `object_type` values of `"tank"` and `"convoy"` were converted to the canonical `"vehicle"` type for the relevant `SyntheticObject` instantiations. 

We preserved the visual distinctiveness of these objects on the frontend by retaining their semantic Object IDs (`id="tank_assault"`, `id="tank_1"`, etc.). The frontend maps `"vehicle"`, `"truck"`, and `"tank"` (historically) to the same ground vehicle SVG icon, and the specific label (`TANK_ASSAULT`) acts as the distinguishing visual marker for the operator. 

No schemas were weakened, and no arbitrary strings are permitted.

## Canonical Object Types Used
- `"vehicle"` (Replaced `"tank"` and `"convoy"`)
- `"drone"`
- `"person"`
- `"unknown aerial object"`

## MULTI-THREAT Behavior
The `MULTI-THREAT` protocol initializes and moves a combination of:
- `drone_fast` (Object Type: `"drone"`)
- `tank_assault` (Object Type: `"vehicle"`)
- `person_infiltrator` (Object Type: `"person"`)
These objects follow distinct trajectories, heading toward the simulated border simultaneously at varied speeds.

## EMERGENCY Behavior
The `EMERGENCY` protocol simulates a massive incursion involving:
- Multiple `"unknown aerial object"` tracks.
- Multiple `"vehicle"` tracks (`tank_1`, `tank_2`).
- A swarm (`"drone"` track).
These objects rapidly approach the border, triggering the alert engine logic.

## Focused Test Result
Added `test_multi_threat_protocol` and `test_emergency_protocol` in `tests/backend/test_api.py`.
- **MULTI-THREAT:** Starting the simulation returns `200 OK`. After `0.5s`, fetching tracks returns >1 distinct track with >1 distinct classes, confirming generation and movement.
- **EMERGENCY:** Similarly confirmed `200 OK` and active track generation.

## Full Pytest Result
`PYTHONPATH=. .venv/bin/pytest tests` returned:
`28 passed, 2 warnings in 1.77s`

## Frontend Build Result
`npm run build` returned:
`✓ built in 857ms` with no TypeScript errors.

## Verifications
- No new packages, dependencies, accounts, or integrations were added.
- Existing simulation architecture and alert engine logic were preserved.
- `NORMAL`, `DRONE`, `VEHICLE`, and `SENSOR-DEGRADED` still start flawlessly and the precise 6 protocol titles are preserved.
