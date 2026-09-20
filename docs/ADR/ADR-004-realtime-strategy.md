# ADR-004: Realtime Strategy

## Context
The dashboard must display live synthetic tracks and instantaneous alerts (NFR-PERF-001).

## Decision
We will implement **WebSockets** via FastAPI, managed by the backend modular monolith.

## Alternatives
- HTTP Polling (REST)
- Server-Sent Events (SSE)
- External Broker (Pusher / Socket.io)

## Reasoning
WebSockets provide bi-directional, low-latency communication. Polling is inefficient for track visualization, and adding an external broker violates the standalone prototype constraint. FastAPI handles WebSockets natively with standard async loops.

## Consequences
- Requires persistent connection management in the frontend and backend.

## Status
Accepted
