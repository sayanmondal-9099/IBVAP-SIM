# PHASE 12A GOLDEN SCENARIO REPORT

## Scenario Setup
**Scenario ID:** `SCN-DEMO-001`
**Name:** MULTI-SENSOR AIRSPACE & GROUND ACTIVITY
**Duration:** 150.0 seconds

## Synthetic Population
**Object Count:** 10
**Classes:**
- Drone (2)
- Unknown Aerial Object (1)
- Bird (2)
- Truck (1)
- Vehicle (2)
- Person (2)

**Trajectory Types:**
- `waypoint`: Complex paths through multiple locations (e.g. drones, patrol vehicles, supply truck)
- `linear`: Constant heading movement (e.g. unknown aerial object, solo bird)
- `loiter`: Stationary/small random local movement (e.g. guard, bird flock)

## Synthetic Environment
**Zones:**
- `Base Perimeter` (restricted)
- `Restricted Airspace` (restricted)
- `Virtual Fence East` (virtual_fence)
- `Staging Area` (warning)

**Sensors:**
- `cam_main` (camera, 200m range, 90° FOV)
- `cam_north` (camera, 150m range, 120° FOV)
- `radar_base` (radar, 350m range, 360° FOV)

## Scripted Events
1. **T+30s**: `camera_degradation` (Duration: 40.0s)
2. **T+90s**: `network_failure`
3. **T+115s**: `network_recovery`

## Testing and Verification
**Determinism Result:** PASS. Two independent test runs of the simulation engine with identical seeds produced identical trajectories and the exact same number of synthetic events.
**Backend Tests:** 7 total tests passing (including deterministic checks for SCN-DEMO-001).
**Known Limitations:** Altitude checks for zones aren't strictly bounded in Z-space by the simplified zone shapes (they act as infinite columns). This is acceptable for Phase 12A.
