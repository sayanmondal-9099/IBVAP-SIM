# Architecture Decision Matrix

| Decision | Current State | Target State | Chosen Direction | Reason | Implementation Phase | Dependency Required | Risk | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ADR-001 (Simulation Boundary)** | Enforced | Enforced | Strict Air-gap | SIH Legal/Safety rules | Phase 0 | No | Low | ACCEPTED |
| **ADR-002 (Edge-First)** | Partial | Full Isolation | Maintain logic split | Demonstrates resilience | Phase 1 | No | Low | ACCEPTED |
| **ADR-003 (Simulation Engine)** | Generating tracks | Generating tracks | Retain deterministic generators | Replayability | Phase 3 | No | Low | ACCEPTED |
| **ADR-004 (Track Model)** | Fused Tracks | Fused Tracks | Accept current shortcut | Prototype speed | Phase 1 | No | Low | ACCEPTED |
| **ADR-005 (Alert Prioritization)** | Formula active | Formula active | Enforce deterministic formula | Explainability | Phase 1 | No | Low | ACCEPTED |
| **ADR-006 (Deduplication)** | 60s cooldown | 60s cooldown | Idempotency | Prevents alert storms | Phase 1 | No | Low | ACCEPTED |
| **ADR-007 (Offline Recovery)** | Edge buffer active | Edge buffer active | Continue simulating locally | Core demo feature | Phase 1 | No | Low | ACCEPTED |
| **ADR-008 (Auditable Chain)** | SHA-256 active | UI Integration | Append-only ledger | Provable security | Phase 7 | No | High (Bug) | ACCEPTED |
| **ADR-009 (Human-in-the-Loop)** | Missing UI | Full UI | Build operator workspace | Prevents autonomous risk | Phase 6 | No | Med | ACCEPTED |
| **ADR-010 (UI Pages)** | Scaffolds | Distinct routes | Separate map from workflows | Cognitive load | Phase 4 | No | Low | ACCEPTED |
| **ADR-011 (3D View)** | Missing | Cesium/Three.js | Propose Cesium/Three.js | Visualizes altitude rules | Phase 5 | **YES** | High | PROPOSED |
| **ADR-012 (Frontend State)** | Local | Context API | Avoid Redux/Zustand | Prevents bloat | Phase 4 | No | Low | ACCEPTED |
| **ADR-013 (Backend Stabilization)**| Bugged | Fixed | Fix `entity_type` bug first | Unblocks tests | Phase 2 | No | Low | ACCEPTED |
| **ADR-014 (Supabase Adoption)** | SQLite | Evaluated | Stay on SQLite for now | Protects offline sync | Phase N/A | **YES** | Med | PROPOSED |
| **ADR-015 (Dependency Policy)** | Clean | Clean | Explicit approval required | Security & simplicity | Phase 1 | No | Low | ACCEPTED |
| **ADR-016 (Evidence Provenance)** | Linked IDs | Visual Evidence | Trace alerts to source | Trust | Phase 6 | No | Low | ACCEPTED |
| **ADR-017 (Failure Injection)** | Network drop | Extended failures | Expose failures in UI | Demo impact | Phase 3 | No | Med | ACCEPTED |
