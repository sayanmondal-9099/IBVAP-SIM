# 05 - Tech Stack Specification

## Purpose
Define the approved technologies, languages, and frameworks for the prototype.

## Scope
Backend services, frontend applications, databases, and deployment tooling.

## Terminology
- **Monorepo**: A single version control repository containing all prototype components.

## Requirements
- **FR-STK-001**: Use modern, actively maintained open-source technologies suitable for a professional prototype.
- **FR-STK-002**: Ensure all dependencies can run entirely offline if needed for the demo.

## Dependencies
- Node.js / Python environment.
- Docker for containerization.

## Assumptions
- The development team is familiar with the chosen stack and standard tooling.

## Open Decisions
- OPEN ARCHITECTURAL DECISION: Frontend framework choice (React vs. Vue vs. Angular vs. Svelte).
- OPEN ARCHITECTURAL DECISION: Backend framework choice (FastAPI vs. Node/Express vs. Go).
- OPEN ARCHITECTURAL DECISION: Primary database technology (PostgreSQL vs. SQLite vs. MongoDB).

## Acceptance Criteria
- Tech stack decisions are finalized, recorded here, and adhered to during implementation.
