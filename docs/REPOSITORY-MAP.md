# IBVAP-SIM Repository Map

This document explains the physical layout of the repository as it currently exists. It bridges the gap between the conceptual architecture and the actual codebase.

## Directory Structure

### `/src/frontend/`
*React/Vite/Tailwind Single Page Application providing the central dashboard.*
- **Status:** Simulation UI Scaffold.
- **`src/frontend/src/pages/CommandMap.tsx`:** Primary view. Implements MapLibre 2D map, scenario selector, and synthetic markers.
- **`src/frontend/src/pages/Alerts.tsx`:** Implements the Alerts table displaying P1-P4 alerts.
- **`src/frontend/src/App.tsx`:** Routing configuration. Defines placeholders for missing pages (Audit Trail, System Health, Settings).

### `/src/backend/`
*FastAPI server acting as the central processing logic and API gateway.*
- **Status:** Production-like prototype code.
- **`src/backend/models.py`:** SQLAlchemy ORM definitions for `Alert`, `AuditLog`, `Incident`, and `MockTransfer`.
- **`src/backend/schemas.py`:** Pydantic models for API request/response validation.
- **`src/backend/alert_engine.py`:** Core rules engine implementing P1-P4 priority scoring and the 60-second deduplication cooldown dictionary.
- **`src/backend/audit_service.py`:** Cryptographic chaining (SHA-256) logic for append-only audit rows.
- **`src/backend/routers/simulation.py`:** Exposes the `sync_events` endpoint and manages bridging between the API and the internal simulation engine.
- **`src/backend/routers/alerts.py`:** Endpoints for querying, acknowledging, and escalating alerts.
- **`src/backend/routers/mock_receiver.py`:** Simulates the external handoff point for sanitized transfers.

### `/src/simulation/`
*Synthetic data generators and edge simulators.*
- **Status:** Simulation-only code.
- **`src/simulation/engine.py`:** The `SimulationEngine` class. Maintains the `edge_buffer` for network failure/offline queues. Emits events to a callback.
- **`src/simulation/scenarios.py`:** Defines the synthetic trajectories and scenario metadata (e.g., restricted zone entry, network failure).
- **`src/simulation/models.py`:** Pydantic observation models simulating the outputs of fused sensors.

### `/tests/`
*Automated verification suites.*
- **Status:** Test-only code.
- **`tests/test_alert_pipeline.py`:** Validates priority score bands and spatial deduplication.
- **`tests/test_audit_chain.py`:** Validates cryptographic integrity of `AuditLog` chains.
- **`tests/test_offline_recovery.py`:** Validates HTTP syncing of the `edge_buffer`.
- **`tests/backend/test_api.py`:** Validates FastAPI routing (currently failing due to `entity_type` bug).

### `/docs/`
*Project Documentation and Governance.*
- **Status:** Documentation.
- **`AGENTS.md` / `PROJECT-CONSTITUTION.md`:** Binding rules for AI development and safety boundaries.
- **`FINAL-VALIDATION-REPORT.md`:** The latest architectural audit.
- **`STRUCTURAL-VERIFICATION.md`:** Empirical analysis of actual codebase vs requirements.

### Root Files
- **`ibvap.db`:** The SQLite database holding synthetic operational data.
- **`requirements.txt`:** Python dependencies.
- **`package.json`** (in `src/frontend/`): Node dependencies. No global package.json exists.
