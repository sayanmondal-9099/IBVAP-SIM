# 06 - Data Model

## Purpose
Define the schemas for synthetic observations, tracks, events, alerts, and incidents for the IBVAP-SIM PostgreSQL database.

## Scope
Relational models and JSON payload structures for persistence in Supabase.

## Terminology
- **Observation**: A single point-in-time synthetic sensor reading (transient, not persisted).
- **Track**: A correlated series of observations over time representing an entity's movement.

## Requirements
- **FR-DAT-001**: All operational tables must explicitly flag data with an `is_synthetic` boolean column defaulting to `true`.
- **FR-DAT-002**: Entities must share UUIDs to allow correlation across the pipeline.
- **FR-DAT-003**: `audit_logs` must be strictly append-only via RLS.

## Selected Entities
Based on the simulation-only boundary and the domain model, the following tables are required:

1. **`scenarios`**: Defines the synthetic scenarios available for simulation.
2. **`simulation_runs`**: Tracks active or historical executions of scenarios.
3. **`sensors`**: Configuration for synthetic cameras and radars.
4. **`sensor_health`**: Tracks the simulated online/offline status of sensors for fault injection.
5. **`tracks`**: Persistent records of synthetic object trajectories.
6. **`events`**: Raw spatial/temporal rule violations (e.g., line crossed).
7. **`alerts`**: Triageable items raised to the dashboard for human review.
8. **`incidents`**: Escalated alerts confirmed by an operator.
9. **`evidence_packages`**: Mock URLs linking to synthetic evidence for incidents.
10. **`mock_transfers`**: Audit records of incidents handed off to the mock army-base receiver.
11. **`audit_logs`**: Immutable ledger of all system and operator actions.

*Note: `camera_observations`, `radar_observations`, and `objects` were evaluated but omitted from persistence to avoid unnecessary bloat. Observations remain transient in the edge simulator memory until correlated into `tracks`.*

## Core Enums
- **`sensor_type`**: `camera`, `radar`
- **`alert_status`**: `new`, `acknowledged`, `escalated`, `dismissed`
- **`incident_status`**: `open`, `transferred`, `closed`

## General Columns
All tables (except lookup/static tables) must include:
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `created_at` (Timestamptz, default `now()`)
- `updated_at` (Timestamptz)

Operational tables (`tracks`, `events`, `alerts`, `incidents`, `evidence_packages`, `mock_transfers`) must include:
- `is_synthetic` (Boolean, default `true`, NOT NULL)
- `simulated_time` (Timestamptz) - To track the time within the simulation engine.

## Security & Access Control
- **Frontend (Anon/Authenticated via JWT)**: `SELECT` only for dashboards. `UPDATE` permitted solely for changing `alert_status` (with trigger enforcing audit logging).
- **Service Role (Backend Monolith)**: Full `INSERT` / `UPDATE` access.
- **`audit_logs`**: `INSERT` only for both. No `UPDATE` or `DELETE` permitted.

## Acceptance Criteria
- API and DB schemas strictly validate payload structures before ingestion.
- RLS policies prevent accidental data modification by the frontend.
