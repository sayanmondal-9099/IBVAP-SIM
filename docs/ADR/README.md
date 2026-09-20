# Architecture Decision Records (ADRs)

## What is an ADR?
An Architecture Decision Record (ADR) is a short text file that captures a single, significant architectural decision made for the project, along with its context and consequences.

## Why IBVAP-SIM uses ADRs
Because IBVAP-SIM strictly requires a simulation-only boundary and complex edge-to-central offline recovery, ADRs serve as the immutable record preventing architectural drift. They ensure future AI agents or developers do not accidentally introduce operational connections, weapon systems, or monolithic UI patterns that violate the prototype's core constitution.

## ADR Lifecycle
- **PROPOSED:** The decision is drafted and pending evaluation.
- **ACCEPTED:** The decision is approved and binding for all future development.
- **SUPERSEDED:** The decision was replaced by a newer ADR.
- **REJECTED:** The decision was evaluated and explicitly declined.

## Creating Future ADRs
AI agents and developers MUST create an ADR using `ADR-TEMPLATE.md` before making significant technical choices (e.g., adding a new dependency, changing database schemas, or modifying the alert engine).

## Relationship to AGENTS.md and CHANGE-CONTROL.md
ADRs document the *technical implementation decisions* that satisfy the non-negotiable safety rules in `AGENTS.md`. `CHANGE-CONTROL.md` dictates the workflow required to propose a new ADR. If an ADR conflicts with `AGENTS.md`, `AGENTS.md` wins.
