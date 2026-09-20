# 01 - Product Requirements Document (PRD)

## Purpose
Define the product requirements for IBVAP-SIM, a simulation-only intelligent border video analytics platform prototype.

## Scope
The scope is strictly limited to a synthetic, simulated environment demonstrating border video analytics capabilities for a technical demonstration. Real data ingestion, real tracking, and operational integrations are entirely out of scope.

## Terminology
- **IBVAP**: Intelligent Border Video Analytics Platform.
- **SIH**: Smart India Hackathon.
- **Synthetic Data**: Artificially generated data mimicking real-world sensors (cameras, radar).

## Requirements
- **FR-PRD-001**: The system must simulate an end-to-end surveillance pipeline from observation to alert generation.
- **FR-PRD-002**: The system must provide a central dashboard for human review of simulated alerts.
- **FR-PRD-003**: The system must maintain an audit chain of all actions.

## Dependencies
- Pre-defined scenario scripts.
- Synthetic data generator engine.

## Assumptions
- The demonstration environment has sufficient compute for local simulation without requiring external cloud resources.

## Open Decisions
- OPEN ARCHITECTURAL DECISION: Specific user personas and roles for the dashboard user management (e.g., Operator vs Supervisor).

## Acceptance Criteria
- The platform successfully runs a predefined simulated scenario without any external internet dependencies for sensor data.
