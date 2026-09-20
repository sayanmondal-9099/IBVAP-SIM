# 04 - Technical Architecture

## 1. System Context
IBVAP-SIM is an isolated, simulation-only platform that generates synthetic border surveillance data (observations, tracks) and evaluates it against an alert engine. The system operates entirely independently of real-world networks or sensors. It presents actionable intelligence to human operators via a central dashboard, who can review, escalate, or resolve alerts. Validated incidents are then forwarded to a simulated external military webhook ("Mock Receiver").

## 2. Container Architecture
To avoid unnecessary distributed-system complexity, the prototype employs a **Modular Monolith** architecture containerized via Docker.
- **Frontend Container**: React-based dashboard served via Vite/Nginx.
- **Backend Container**: Python FastAPI modular monolith housing the API, Alert Engine, and Mock Receiver.
- **Simulation Container**: Python engine generating synthetic data and simulating edge logic (including offline queueing).
- **Database Container**: Supabase / PostgreSQL handling persistence and audit logs.

## 3. Component Architecture
- **Simulation Engine**: Generates scenario-driven deterministic entities, observations, and telemetry.
- **Edge Simulator**: Processes observations into tracks and evaluates spatial/temporal alert rules.
- **Queue Manager**: Buffers events locally when a network fault is simulated.
- **Central API**: Ingests edge data, provides CRUD operations for incidents/audit logs, and routes real-time telemetry.
- **Mock Receiver**: Dedicated isolated endpoint simulating a sanitized handoff to external systems.

## 4. Frontend Architecture
Built as a Single Page Application (SPA).
- **Presentation**: React components heavily utilizing Shadcn UI and Tailwind CSS for rapid, professional styling.
- **State Management**: Zustand for global state; TanStack Query for async server state.
- **Real-time Map**: 2D Cartesian rendering (Canvas or Leaflet with a blank CRS) for tracking synthetic object trajectories.

## 5. Backend Architecture
Built with Python FastAPI emphasizing modular service layers.
- **Routing Layer**: Exposes REST endpoints and WebSocket endpoints.
- **Service Layer**: Contains business logic (alert triage, audit logging).
- **Data Access Layer**: Handles SQLAlchemy/Supabase Python client interactions.

## 6. Simulation Architecture
- **Scenario Parser**: Reads YAML/JSON scenario files describing synthetic object paths, velocities, and edge-failure timestamps.
- **Data Generator**: Evaluates kinematic equations to produce deterministic `(x, y)` metadata every tick (e.g., 100ms).
- **Telemetry Emitter**: Sends generated JSON payloads over HTTP/WS, artificially introducing latency or failure based on the scenario state.

## 7. Data Architecture
- **Relational Integrity**: Supabase (PostgreSQL) is the source of truth.
- **Tables**: `audit_logs` (append-only), `alerts`, `incidents`, `scenarios`.
- **Payloads**: All incoming/outgoing JSON payloads must include `is_synthetic: true`.

## 8. Realtime Architecture
- **Protocol**: WebSockets driven by FastAPI.
- **Flow**: Simulation Engine -> Backend (memory broker) -> Connected Dashboard Clients.
- **Scope**: Used for high-frequency map telemetry (tracks) and instant alert popups.

## 9. Audit Architecture
- **Immutability**: The `audit_logs` table utilizes PostgreSQL Row Level Security (RLS) and backend constraints to prevent UPDATE or DELETE operations.
- **Chain of Custody**: Every operator action (acknowledging an alert, escalating) and system action (simulated network recovery) is hashed and appended to the ledger.

## 10. Offline/Recovery Architecture
- **Edge Buffer**: The Edge Simulator implements a local SQLite or in-memory queue.
- **Fault Injection**: When the scenario triggers an "offline" state, telemetry to the Central API is suspended and buffered.
- **Recovery & Flush**: Upon "online" recovery, the Edge Simulator executes a bulk HTTP POST of all buffered events to ensure zero data loss, simulating real-world edge recovery.

## 11. Mock Receiver Architecture
- **Sanitization**: Before an incident is exported, the backend strips internal tracking IDs, synthetic flags, and formats the data to a standardized generic XML/JSON payload.
- **Endpoint**: A dedicated `POST /mock-receiver` route acting as a dead-end sink. It logs the receipt of the payload and returns `202 Accepted` to simulate a successful handover.

## 12. Testing Architecture
- **Simulation Validation**: Pytest unit tests seed the data generator and assert exact trajectory outputs.
- **Integration**: API tests mock the database layer to ensure route validation.
- **E2E**: Playwright tests drive the frontend, asserting that a generated synthetic alert successfully renders and can be triaged by a simulated click workflow.
