# 02 - Prototype Scope

## Purpose
Define the strict boundaries, inclusions, and exclusions of the IBVAP-SIM prototype.

## Scope
**Includes**: Synthetic camera/radar feeds, simulated detection/tracking, simulated correlation, offline queue simulation, edge recovery simulation, central dashboard, mock receiver.
**Excludes**: Real CCTV ingestion, real operational network integration, real personal data, autonomous interception, weapon integration.

## Terminology
- **Mock Transfer**: Simulated transfer of alerts to a mock external system (e.g., mock army-base receiver).

## Requirements
- **FR-SCP-001**: All sensor feeds must be 100% synthetically generated.
- **FR-SCP-002**: The system must simulate edge processing and explicitly demonstrate network failures and recovery.
- **FR-SCP-003**: The system must explicitly reject or lack endpoints for live RTSP stream ingestion.

## Dependencies
- Synthetic scenario configurations.

## Assumptions
- Reviewers understand that accuracy metrics are based on synthetic data and do not reflect real-world model performance.

## Open Decisions
- OPEN ARCHITECTURAL DECISION: The exact number of synthetic cameras and radar units to simulate concurrently during the demo.

## Acceptance Criteria
- The prototype demonstrably lacks real RTSP stream ingestion capabilities and operates entirely on internal synthetic logic.
