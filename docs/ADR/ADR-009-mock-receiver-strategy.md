# ADR-009: Mock Receiver Strategy

## Context
Validated incidents must be sent to an external military system for action.

## Decision
Implement a dedicated `POST /mock-receiver` route within the **same FastAPI monolith** to act as a simulated external webhook.

## Alternatives
- Deploying a separate Node.js server to act as the receiver.
- Actually connecting to an external API.

## Reasoning
Connecting to real APIs violates the safety boundary. Spinning up a completely separate container just for a mock receiver adds unnecessary overhead. A dedicated route in the monolith cleanly simulates an outbound webhook while keeping the architecture modular and consolidated.

## Consequences
- Minimal infrastructure overhead.

## Status
Accepted
