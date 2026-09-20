# IBVAP-SIM Documentation Index

This index provides a structured directory of all project documentation for the Smart India Hackathon demonstrator.

## Governance & Rules
- [Project Constitution](PROJECT-CONSTITUTION.md) - Safety boundaries and project identity.
- [Repository Map](REPOSITORY-MAP.md) - Physical layout of the codebase.
- [Change Control Policy](CHANGE-CONTROL.md) - Strict guidelines for modifying the repository.
- [Current State](CURRENT-STATE.md) - Empirical matrix of implementation status.

## Product & Requirements
- [Product Requirements Document (PRD)](PRD.md) - Vision, personas, and workflows.
- [Software Requirements Specification (SRS)](SRS.md) - Functional and non-functional requirements.
- [Prototype Scope](PROTOTYPE-SCOPE.md) - Explicitly defined IN/OUT of scope features.

## Architecture
- [System Architecture](SYSTEM-ARCHITECTURE.md) - Conceptual vs. Implemented architecture models.
- [Technology Stack](TECHNOLOGY-STACK.md) - Current framework inventory.

## Data & Simulation
- [Data Model Specification](DATA-MODEL.md) - Entities and lifecycles.
- [Simulation Specification](SIMULATION-SPECIFICATION.md) - Deterministic generators and synthetic models.

## Backend & API
- [API Specification](07-API-SPECIFICATION.md) - REST endpoints and contracts.
- [Alert Engine Specification](ALERT-ENGINE-SPECIFICATION.md) - Priority scoring formulas and deduplication.
- [Security Specification](SECURITY-SPECIFICATION.md) - Audit hashing and isolation rules.

## Frontend & Demo
- [UI/UX Specification](UI-UX-SPECIFICATION.md) - Dashboard boundaries and states.
- [Testing Strategy](TESTING-STRATEGY.md) - Current coverage and future QA goals.
- [Demo Runbook](DEMO-RUNBOOK.md) - Step-by-step hackathon script.
- [Roadmap](ROADMAP.md) - Phased implementation plan.

---

### End-to-End Traceability (Example)
**Problem:** Operator Overload
↓
**Requirement:** FR-ALT-002 (Deduplication)
↓
**Architecture component:** `AlertEngine`
↓
**Data model:** `Alert`
↓
**API:** `/api/alerts`
↓
**UI:** `Alerts.tsx`
↓
**Simulation scenario:** Network disconnect/reconnect sync
↓
**Test:** `test_alert_pipeline.py`
↓
**Demo step:** Step 13 (Deduplication)
