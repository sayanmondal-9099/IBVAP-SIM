# Skill Architecture

## Overview
This document maps the project-specific Antigravity AI agent skills created for IBVAP-SIM. These skills reside in `.agents/skills/` and enforce the project's constitutional governance and architectural boundaries.

## Installed Skills

### 1. `ibvap-simulation-safety`
- **Responsibility:** Enforces the strict, non-negotiable simulation-only boundaries. Prevents any real-world operational integration.
- **When to Invoke:** Before ANY architectural change, dependency addition, or API development.

### 2. `ibvap-architecture`
- **Responsibility:** Maintains the edge-to-central, offline-first, event-driven architectural flow.
- **When to Invoke:** When designing new components, defining data flows, or bridging the edge simulator to the central backend.

### 3. `ibvap-backend-fastapi`
- **Responsibility:** Governs FastAPI routing, Pydantic validation, idempotency, and audit logging.
- **When to Invoke:** When writing or modifying API routes and backend business logic.

### 4. `ibvap-frontend-ui`
- **Responsibility:** Governs the React/Vite operational dashboard, ensuring separation of concerns (Command Map vs Human Review).
- **When to Invoke:** When building or updating UI components, navigation, or visual states.

### 5. `ibvap-supabase-schema`
- **Responsibility:** Dictates how future database migrations and schemas must be handled.
- **When to Invoke:** Before making any schema change or moving from SQLite to PostgreSQL.

### 6. `ibvap-alert-engine`
- **Responsibility:** Strictly enforces the P1-P4 mathematical priority scoring formula and deduplication logic.
- **When to Invoke:** When altering alert heuristics, tripwires, or event thresholds.

### 7. `ibvap-testing`
- **Responsibility:** Enforces the strict `Inspect → Modify → Test` loop and tracks known test blockers (like the `AuditLog` bug).
- **When to Invoke:** Throughout the entire development lifecycle.

## Dependency / Relationship
The skills operate in a hierarchical funnel. Safety boundaries outrank architectural preferences, which in turn outrank domain-specific implementation details. 

## Conflict-Resolution Priority
If two instructions or guidelines conflict, the AI agent must resolve the conflict using the following strict priority chain:

1. `AGENTS.md` (Absolute Root Constitution)
2. `ibvap-simulation-safety` (Safety > Functionality)
3. `ibvap-architecture` (Structure > Feature)
4. Domain-specific skill (`ibvap-backend-fastapi`, `ibvap-frontend-ui`, etc.)
5. `ibvap-testing` (Verification)
