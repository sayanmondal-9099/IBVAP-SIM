# ADR-014 — Supabase Adoption Strategy

## Status
PROPOSED

## Date
2026-09-13

## Context
IBVAP-SIM currently uses a local SQLite database (`ibvap.db`) via SQLAlchemy. As the prototype scales for the hackathon demonstration (e.g., adding realtime WebSockets, multiple operators, and incident resolution), a more robust database may be considered.

## Problem
Should the prototype migrate from local SQLite to Supabase (PostgreSQL)?

## Decision
We propose an evaluation strategy for Supabase, but **we explicitly decline to adopt it at this phase.**

**Supabase Evaluation Strategy:**
Before adopting Supabase, the following criteria must be met:
1. **Simulation-Only Integrity:** Can we guarantee that no operational data will ever leak into the cloud?
2. **Offline Operation:** The SIH demo requires demonstrating edge resilience (network disconnects). Supabase relies heavily on cloud connectivity. We must ensure the `edge_buffer` can gracefully queue and sync to Supabase without breaking.
3. **Audit Records:** PostgreSQL offers better concurrency for cryptographic hash chaining, but introduces network latency for the `AuditService`.
4. **Realtime Updates:** Supabase Realtime (WebSockets over PostgreSQL) could replace a custom FastAPI WebSocket implementation, offering significant development speed improvements for the React dashboard.

**Current Stance:** The local SQLite implementation is sufficient for current SIH demo reliability. Supabase is PROPOSED for future consideration but is NOT currently part of the runtime. 

*No Supabase projects, schemas, or migrations are authorized at this time.*

## Alternatives Considered
- *Immediate Migration to Supabase:* Rejected. Risk of breaking the currently functioning offline sync and hash-chain logic too close to the demo.

## Consequences
### Positive
- Prevents architectural thrashing.
- Keeps the system 100% local and air-gapped for now.
### Negative
- Prevents leveraging Supabase's out-of-the-box realtime WebSocket capabilities.

## Implementation Impact
None. The system remains on SQLite.

## Testing Impact
None.
