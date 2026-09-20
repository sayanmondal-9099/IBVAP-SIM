# IBVAP-SIM Project Constitution and AI Agent Rules

## 1. Project Identity
**Project Name:** IBVAP-SIM (Intelligent Border Video Analytics Platform — Simulation-Only Prototype)
**Role:** Principal Software Architect and Senior Product Engineer
**Context:** Smart India Hackathon software prototype.

## 2. Simulation-Only Safety Boundary (NON-NEGOTIABLE)
**IBVAP-SIM is SIMULATION ONLY.**

The system **MUST NOT** connect to:
- real military networks
- real army infrastructure
- real border surveillance infrastructure
- real police infrastructure
- real operational CCTV
- real radar hardware
- real biometric databases
- real government personal data
- real weapon systems
- real targeting systems
- real firing systems
- real interception systems
- real autonomous engagement systems

The prototype **MUST NOT** implement:
- autonomous targeting
- weapon control
- firing decisions
- autonomous interception
- engagement workflows
- real military command integration
- operational enemy-force classification
- autonomous threat response

The mock Army/Base receiver is **DISPLAY/AUDIT ONLY**. It may acknowledge a simulated package but **MUST NEVER** trigger an external operational action.

**Simulation Data Rule:** All prototype observations, tracks, alerts, sensor measurements, locations, classifications, and identities must be synthetic or derived from public/test material. The UI must permanently communicate: `SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION`

## 3. Architecture Principles
1. **Edge-first simulation architecture:** The simulation adapter processes local tracks before sending to the central dashboard.
2. **Event-driven processing:** Observation → Detection → Track → Event → Alert → Incident.
3. **Human-in-the-loop decisions:** Critical alerts require human review before resolution.
4. **Honest uncertainty:** Sensors report confidence and quality explicitly.
5. **Evidence provenance:** Every alert is tied to simulated source evidence.
6. **Append-only auditability:** All critical actions are cryptographically chained and cannot be altered.
7. **Offline-first resilience:** The edge simulator queues events when disconnected.
8. **Idempotent synchronization:** Offline events are deduplicated upon network restoration.
9. **Explicit failure simulation:** Network failures and sensor disagreements are first-class scenarios.
10. **Separation of detection from decision:** Sensors only detect; rules engines and operators decide.
11. **No autonomous operational action:** Never automate a defense response.
12. **Synthetic data by default:** No real operational data allowed.

## 4. Repository Structure
- `docs/` for project documentation, governance, and architecture decisions.
- `src/frontend/` for the React/Vite/Tailwind frontend.
- `src/backend/` for the FastAPI/SQLAlchemy backend.
- `src/simulation/` for the core simulation logic and scenario generators.
- `tests/` for backend, simulation, and pipeline testing.

## 5. Frontend Conventions
- **Framework:** React 19, Vite, TypeScript, Tailwind CSS (v3).
- Keep operational areas separated (e.g. Command Map vs Alerts). Do NOT turn the Command Map into a giant all-in-one dashboard.
- Every page must define: loading, empty, error, offline, and realtime updating states.

## 6. Backend Conventions
- **Framework:** FastAPI, Python, SQLAlchemy, SQLite (for prototype).
- Use typed request/response models with Pydantic.
- Maintain clear boundaries between domain logic, persistence, and API routing.

## 7. Simulation Conventions
- Scenarios must be deterministic (support seeding).
- Must emit observations matching the `Observation` schema with explicit `confidence`, `quality`, and `is_synthetic` flags.
- Edge queueing must buffer events when `network_status` is `offline`.

## 8. API Conventions
- Validate all incoming data.
- Use explicit REST resource paths.
- Enforce idempotency on sync endpoints.
- Return structured error handling.

## 9. Database Conventions
- Schema modifications require version-controlled creation scripts or `Base.metadata` updates.
- No real data insertion. Only synthetic data.
- Enforce foreign key constraints between Alerts and Incidents.

## 10. Testing Conventions
- `pytest` for backend/simulation logic.
- Verify exact priority scoring outputs, deduplication windows, and hash chain integrity.

## 11. Security Conventions
- **No Hardcoded Secrets:** Never hardcode secrets in source code.
- Prevent unintended exposure of mock operational coordinates.
- Assume all simulated endpoints require mock validation.

## 12. Auditability Requirements
- Every sensitive action must generate an audit record.
- Audit records must support `actor`, `action`, `resource`, `timestamp`, and `outcome`.
- Implement SHA-256 chained hashing (`previous_hash` validation).

## 13. Evidence/Provenance Requirements
- Alerts must carry the `object_id` and timestamp of the inciting simulated observation.

## 14. Error Handling Requirements
- Fast failure for invalid payload types.
- Idempotent suppression of duplicate sync events rather than server errors.

## 15. Offline/Reconnect Behavior
- Frontend must gracefully display `OFFLINE` status.
- Backend edge buffer must continuously accumulate `observations` during offline mode and bulk POST upon restoration.

## 16. Dependency Policy
DO NOT add a package merely because it is convenient. Before adding any dependency:
1. Explain why it is required.
2. Check whether existing dependencies already solve the problem.
3. Identify license, maintenance status, and security implications.
4. Obtain explicit authorization before installation.

## 17. MCP/Integration Policy
- Only use approved MCP plugins/tools.
- Never integrate real databases or real real-time defense networks via MCP.

## 18. Documentation Policy
- Documentation must be professional, engineering-oriented, evidence-based, explicit about limitations, and explicit about its simulation status.
- **AVOID** marketing claims such as: "battle ready", "military grade", "combat ready", "100% accurate", "autonomous defence", "real-time battlefield intelligence" unless explicitly describing them as prohibited.

## 19. AI Coding-Agent Behavior
Future AI agents MUST:
- Inspect before modifying.
- Reuse before rebuilding.
- Verify before assuming.
- Test before declaring success.
- Never fabricate implementation.
- Never claim a feature exists without repository evidence.
- Never silently introduce dependencies.
- Never bypass safety boundaries.
- Never convert simulation functionality into operational functionality.
- Never hide failures.
- Never weaken auditability or remove human review where required.

## 20. Definition of Done
A feature is NOT complete merely because the UI renders, an API returns 200, or a demo animation works.
Where applicable, Done requires:
- Implementation + Error handling.
- Passing tests.
- Simulation compatibility.
- Auditability and provenance.
- Uncertainty representation.
- Offline and recovery behavior.
- Documentation updates.
- Safety compliance.

## 21. Change-Management Rules
- Feature branches for all new development.
- Require verification before modification.
- Existing functionality must be preserved unless explicitly authorized to change.
