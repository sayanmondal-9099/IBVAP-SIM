---
name: ibvap-simulation
description: Rules for developing synthetic data generators and mock sensors for IBVAP-SIM.
---

## Activation Conditions
- When writing Python/Node scripts to generate synthetic observations.
- When scripting edge processing logic.
- When modeling scenarios or camera/radar metadata.

## Responsibilities
- Generate realistic but 100% synthetic tracking and telemetry data.
- Ensure generators are deterministic based on seed or scenario files.

## Constraints
- **NEVER** use real media files (MP4, RTSP streams) as inputs.
- Only simulate metadata (bounding boxes, trajectories, timestamps).

## Implementation Conventions
- Append `is_synthetic: true` to all generated observation payloads.
- Reference `docs/08-SIMULATION-SPECIFICATION.md`.

## Examples
- *Good*: Generator calculates `(x, y)` over time based on a JSON scenario script.

## Anti-Patterns
- *Bad*: Generator scrapes real coordinates or uses live APIs.

## References
- `docs/08-SIMULATION-SPECIFICATION.md`
- `docs/06-DATA-MODEL.md`
