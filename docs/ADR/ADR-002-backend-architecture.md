# ADR-002: Backend Architecture

## Context
The system requires an API to ingest simulation data, serve the frontend, and act as a mock receiver. We must choose between a microservices topology or a monolith, and select a language.

## Decision
We will build a **Modular Monolith** using **Python FastAPI**.

## Alternatives
- Node.js (Express/NestJS)
- Go
- Distributed Microservices (separate containers for API, alerts, receiver)

## Reasoning
To avoid unnecessary distributed-system complexity for a prototype, a modular monolith is preferred. FastAPI provides high-performance async capabilities (ideal for WebSockets and I/O), native Pydantic schema validation (critical for payload integrity), and excellent documentation generation.

## Consequences
- Single deployable backend unit.
- Clear internal module boundaries required to prevent spaghetti code.

## Status
Accepted
