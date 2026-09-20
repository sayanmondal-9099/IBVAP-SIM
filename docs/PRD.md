# Product Requirements Document (PRD)

## 1. Product Overview
**IBVAP-SIM** (Intelligent Border Video Analytics Platform — Simulation-Only Prototype) is a synthetic software demonstrator designed for the Smart India Hackathon. It models an edge-to-central event processing pipeline for sensor-driven border surveillance, completely isolated from real-world hardware, operational systems, and classified networks. 

## 2. Problem Statement
Border security operations require processing immense volumes of sensor data across diverse modalities to identify and track potential threats. Demonstrating modern distributed event architectures (edge processing, central aggregation, priority scoring) usually requires access to sensitive defense environments, which is impossible and illegal for a hackathon.

## 3. Why the Problem Matters
Without a robust simulation environment, developers cannot safely design, test, or demonstrate the fault tolerance, event-deduplication, or human-in-the-loop review workflows necessary for critical defense infrastructure.

## 4. Product Vision
To provide a strictly isolated, simulation-only prototype that accurately demonstrates the *software architecture* of edge-to-central event processing, offline resilience, and cryptographic auditability without ever touching real operational data or hardware.

## 5. Target Users
- **Hackathon Judges / Evaluators:** Assessing the software architecture, offline recovery, and cryptographic auditability.
- **Review Operators (Simulated Role):** Users interacting with the Human Review dashboard to classify synthetic events.

## 6. Operator Personas
- **Command Center Operator:** Monitors the 2D/3D map for incoming alerts and verifies synthetic evidence.
- **Auditor:** Reviews the cryptographically chained logs to ensure no operational rules were bypassed.

## 7. Primary Workflows
1. **Scenario Generation:** Spawning synthetic objects (e.g., a drone) into the simulation engine. (STATUS: IMPLEMENTED)
2. **Edge Processing & Queuing:** Fusing synthetic observations and buffering them during simulated network failures. (STATUS: IMPLEMENTED)
3. **Alert Generation:** Scoring the synthetic event and generating a deduplicated alert. (STATUS: IMPLEMENTED)
4. **Human Review & Incident Resolution:** An operator inspecting evidence and resolving the alert. (STATUS: MISSING)
5. **Sanitized Mock Transfer:** Forwarding a resolved incident to a dummy receiver. (STATUS: PARTIAL)

## 8. User Stories
- As an evaluator, I want to see the system survive a network disconnect without losing synthetic events. (STATUS: IMPLEMENTED)
- As a simulated operator, I want to see P1-P4 priority scores so I know which synthetic alert to address first. (STATUS: IMPLEMENTED)
- As an auditor, I want a cryptographically chained ledger so I can prove the sequence of simulated decisions. (STATUS: IMPLEMENTED)
- As an operator, I want a 3D visualization of the airspace to understand synthetic altitude constraints. (STATUS: MISSING)

## 9. Functional Requirements
- Synthetic Scenario Generation
- Priority Scoring (0-100)
- Edge-first Offline Buffering
- Cryptographic Audit Chaining
- Human Review Workflows (STATUS: MISSING)

## 10. Non-Functional Requirements
- **Resilience:** Idempotent event synchronization.
- **Isolation:** Must run 100% locally with zero external defense connections.
- **Performance:** Alerts must be scored and deduplicated within memory instantly.

## 11. Success Criteria
- The prototype successfully demonstrates a multi-stage synthetic event pipeline (Observation -> Detection -> Track -> Event -> Alert) entirely driven by software models.

## 12. Constraints
- Must be built with open-source tools (React, FastAPI, SQLite).
- Must run on standard developer hardware.

## 13. Explicit Exclusions
- Machine learning models for live video inference.
- Hardware integrations (cameras, radar).

## 14. Simulation-Only Boundary
The system MUST NOT connect to real military networks, police infrastructure, real radar, or weapon systems. The UI must permanently communicate: `SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION`.

## 15. Current Implementation Status
- **Backend / Engine:** IMPLEMENTED (Offline buffer, Deduplication, Audit chains).
- **API:** PARTIAL (Mock receiver transfer blocked by `AuditLog` bug).
- **Frontend Core:** IMPLEMENTED (Command Map, Alert Tables).
- **Frontend Operational UI:** MISSING (3D View, Human Review, Audit Trail).

## 16. Future Capabilities
- Implementation of the 3D Operational View (PROPOSED).
- Implementation of the Human Review and Incident Resolution UI (PROPOSED).
