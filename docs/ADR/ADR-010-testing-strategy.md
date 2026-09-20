# ADR-010: Testing Strategy

## Context
The prototype requires high confidence in its simulated outputs and API contracts.

## Decision
We will use **Pytest** for backend/simulation, and **Vitest + Playwright** for the frontend.

## Alternatives
- Unittest / Cypress.
- Manual testing only.

## Reasoning
Pytest is the industry standard for FastAPI and math-heavy Python simulations. Vitest is native to the Vite ecosystem for React unit tests, and Playwright offers robust, modern E2E automation for verifying UI workflows.

## Consequences
- High-quality automated safety net, ensuring simulation determinism across refactors.

## Status
Accepted
