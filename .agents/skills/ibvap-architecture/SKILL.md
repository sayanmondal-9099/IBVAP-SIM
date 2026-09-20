---
name: ibvap-architecture
description: High-level architectural rules and boundaries for the IBVAP-SIM prototype.
---

# IBVAP-SIM: Architecture Guidelines

## Purpose
Ensure all implementations align with the edge-to-central, event-driven architectural specification of the IBVAP-SIM prototype.

## When to use
Consult this skill when planning new components, defining data flows, integrating backend routes, or when the distinction between the edge simulation and central API is relevant.

## Core Rules
1. **Reuse > Extend > Refactor > Replace.** Always inspect existing code before proposing replacement components.
2. **Current Architecture:** FastAPI Backend (API, SQLite, Alert Engine) + React/Vite Frontend (Dashboard) + Python Edge Simulator (Generates synthetic events and buffers them).
3. **Target Architecture:** Adds Cesium/Three.js 3D views and Human Review UI.
4. **Component Boundaries:** Do not blend edge simulator code (`src/simulation`) into the central API routing code (`src/backend`).
5. **Event Lifecycle:** `Observation → Detection → Track → Event → Alert → Incident`.
6. **Edge-First Principles:** The edge handles tracking; the central system handles priority scoring and alerts.
7. **Offline-First Principles:** The simulation must queue events locally if disconnected, and sync idempotently on restore.
8. **Auditability:** Every critical action must be cryptographically hashed (SHA-256 chained) in the `AuditLog`.
9. **Provenance:** Alerts must maintain a trace back to their synthetic source observation (`object_id`).
10. **Separation of Concerns:** Keep detection logic isolated from decision logic.
11. **Frontend/Backend Separation:** The React app must communicate strictly via REST or WebSockets.
12. **Simulation Isolation:** Synthetic generators must not leak operational assumptions into the generic API layer.

## Workflow
1. Inspect `docs/SYSTEM-ARCHITECTURE.md` and `docs/CURRENT-STATE.md`.
2. Propose architectural changes adhering to the edge-to-central flow.
3. Validate that offline queuing is respected.

## Repository-Specific Constraints
- The `SimulationEngine` explicitly generates fused tracks via `scenarios.py` to bypass complex ML detection for this prototype.

## Common Mistakes
- **Mistake:** Building UI rendering logic inside the FastAPI backend.
- **Mistake:** Triggering database inserts directly from the Simulation Engine instead of sending events via the API.
- **Mistake:** Replacing the deduplication engine without understanding the 60s cooldown loop.

## Verification Checklist
- [ ] Does the change respect the offline buffer?
- [ ] Are sensitive actions logged to the `AuditLog`?
- [ ] Have you verified the current codebase before proposing a new service?
