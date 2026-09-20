# IBVAP-SIM Project Constitution

**Project Name:** IBVAP-SIM (Intelligent Border Video Analytics Platform — Simulation-Only Prototype)
**Context:** Smart India Hackathon software prototype.

## 1. Non-Negotiable Safety Boundary
**IBVAP-SIM is SIMULATION ONLY.**

The repository is a simulation-only demonstration platform for intelligent border-surveillance-style video/sensor analytics. It **MUST NOT** be represented as a real operational military, police, border, weapons, targeting, or command-and-control system.

The system must **never** connect to:
- Real military/police networks
- Operational CCTV or radar hardware
- Biometric or government databases
- Weapon, targeting, firing, or engagement systems

The prototype must **never** implement:
- Autonomous targeting or weapon control
- Operational enemy-force classification
- Autonomous threat response

The mock Army/Base receiver is for **DISPLAY/AUDIT ONLY**. It acknowledges a simulated package but triggers zero operational actions.

## 2. Simulation Data Rule
All prototype observations, tracks, alerts, sensor measurements, distances, classifications, evidence, and identities must be synthetic or derived from public/test/synthetic material.

The system must clearly distinguish simulation data from real-world operational data. The UI must permanently display:
`SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION`

## 3. Architectural Principles
1. **Edge-first simulation architecture:** Emulates edge detection and central aggregation.
2. **Event-driven processing:** Strict pipeline: `Observation → Detection → Track → Event → Alert → Incident`.
3. **Human-in-the-loop decisions:** Requires human operators to review and classify events.
4. **Honest uncertainty:** Models must broadcast confidence and quality metrics explicitly.
5. **Evidence provenance:** Every alert retains the trail back to the synthetic observation.
6. **Append-only auditability:** Core actions are hashed in an unbreakable chain.
7. **Offline-first resilience:** Network outages are survived via local queueing.
8. **Idempotent synchronization:** Offline events sent upon reconnect are safely deduplicated.
9. **Explicit failure simulation:** Hardware and network failures are features, not edge cases.
10. **Separation of detection from decision:** Analytics identify; humans act.
11. **No autonomous operational action:** Absolutely zero automated defense loops.
12. **Synthetic data by default:** Simulated generators handle all object creation.

## 4. Current Architecture

### Conceptual Architecture
```text
Synthetic Scenario Generator
        ↓
Simulated Camera / Radar / Sensor Events
        ↓
Simulation Adapter Layer
        ↓
Edge Processing Simulator
        ↓
Normalization
        ↓
Detection
        ↓
Tracking
        ↓
Rules
        ↓
Alerts
        ↓
Local Event Store
        ↓
Offline Queue
        ↓
Central Simulation Dashboard
        ↓
Mock Base Receiver
```

### Currently Implemented Architecture
- **Simulator (`src/simulation/`):** Generates scenarios, observations (fusion), and maintains the `edge_buffer` offline queue.
- **API/Core (`src/backend/`):** FastAPI endpoints handle sync, Alert generation via `alert_engine.py` (which scores and deduplicates), and logs audits in SQLite (`audit_service.py`).
- **Dashboard (`src/frontend/`):** React/Vite UI provides the Command Map and Alerts table.
- **Mock Base (`mock_receiver.py`):** Accepts sanitized transfers via REST.

**Note:** The conceptual architecture includes explicit "Normalization" and "Detection" adapter layers, whereas the *currently implemented architecture* generates "Detection/Tracking" natively inside the Simulation Generators (`scenarios.py`) directly as `observations`, bypassing the need for a separate ML detection service.
