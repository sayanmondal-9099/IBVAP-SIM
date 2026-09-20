# Software Requirements Specification (SRS)

## 1. System Scope
IBVAP-SIM is a software demonstrator for edge-to-central sensor event processing. It generates synthetic data locally, processes it through a mock edge buffer, and visualizes it centrally.

## 2. System Actors
- **Simulation Engine:** Generates synthetic tracks.
- **Central API:** Receives, scores, and stores alerts.
- **Simulated Operator (Frontend):** Reviews alerts.
- **Mock Receiver:** A dummy endpoint accepting sanitized transfers.

## 3. Functional Requirements
- **FR-SIM-001 (IMPLEMENTED):** The system shall generate synthetic scenarios locally without external inputs.
- **FR-ALT-001 (IMPLEMENTED):** The system shall score alerts into bands P1 (80-100), P2 (60-79), P3 (35-59), and P4 (0-34).
- **FR-ALT-002 (IMPLEMENTED):** The system shall enforce a 60-second spatial deduplication cooldown.
- **FR-ALT-003 (MISSING):** The system shall allow operators to acknowledge and escalate alerts.
- **FR-INC-001 (MISSING):** The system shall allow operators to promote verified alerts into incidents.

## 4. Data Requirements
- **DR-DAT-001 (IMPLEMENTED):** All events must carry a `confidence` and `quality` score to represent uncertainty.
- **DR-DAT-002 (IMPLEMENTED):** Events must support `latitude`, `longitude`, `altitude`, and `speed`.

## 5. API Requirements
- **API-REQ-001 (IMPLEMENTED):** `/api/simulation/sync_events` shall accept bulk events idempotently.
- **API-REQ-002 (PARTIAL):** `/api/mock-receiver` shall accept sanitized transfers. *(Currently bugged with `entity_type` error).*

## 6. UI Requirements
- **UI-REQ-001 (IMPLEMENTED):** The dashboard shall display a 2D map of synthetic events.
- **UI-REQ-002 (IMPLEMENTED):** The UI shall display the banner: `SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION`.
- **UI-REQ-003 (MISSING):** The UI shall display a 3D Operational View.
- **UI-REQ-004 (MISSING):** The UI shall provide a Human Review workspace.

## 7. Simulation Requirements
- **SR-SIM-001 (IMPLEMENTED):** The system must generate objects including `person`, `vehicle`, `drone`, `helicopter`, `aircraft`, `bird`.

## 8. Alert Requirements
- **AR-ALT-001 (IMPLEMENTED):** Alerts must trace back to the inciting synthetic observation.

## 9. Audit Requirements
- **AUD-REQ-001 (IMPLEMENTED):** Every sensitive action must generate a SHA-256 chained audit record.

## 10. Offline/Recovery Requirements
- **OFF-REQ-001 (IMPLEMENTED):** The edge engine shall queue events during simulated network outages.
- **OFF-REQ-002 (IMPLEMENTED):** The edge engine shall flush the queue upon simulated network restoration.

## 11. Performance Requirements
- **NFR-PER-001 (PLANNED):** Alert priority generation should complete in < 50ms per batch.

## 12. Reliability Requirements
- **NFR-REL-001 (IMPLEMENTED):** Duplicate sync payloads must not result in duplicate alerts.

## 13. Security Requirements
- **NFR-SEC-001 (IMPLEMENTED):** The system shall not store real credentials or connect to external databases.

## 14. Usability Requirements
- **NFR-USE-001 (MISSING):** Operational areas must be visually separated (Command Map vs Human Review).

## 15. Maintainability Requirements
- **NFR-MNT-001 (IMPLEMENTED):** The system shall separate simulation logic from API logic.

## 16. Traceability Matrix

| Problem | Requirement | Architecture Component | API | UI | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Network Instability | OFF-REQ-001 | `SimulationEngine.edge_buffer` | N/A | N/A | IMPLEMENTED |
| Operator Overload | FR-ALT-001 | `AlertEngine.calculate_priority` | N/A | `Alerts.tsx` | IMPLEMENTED |
| Trust in actions | AUD-REQ-001 | `AuditService` | `alerts.py` | `Audit Trail` | PARTIAL (UI Missing) |
| Vertical context | UI-REQ-003 | N/A | N/A | `3D View` | MISSING |
