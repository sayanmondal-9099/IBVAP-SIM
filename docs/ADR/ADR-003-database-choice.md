# ADR-003: Database Choice

## Context
The system needs to persist configurations, alerts, incidents, and an immutable audit log. We must ensure the database handles relational integrity and enforces strict simulation-only security boundaries.

## Decision
We will use **Supabase (PostgreSQL)**.

## Alternatives
- SQLite (local file)
- MongoDB (Document)
- Firebase / Firestore

## Reasoning
Supabase provides a powerful managed PostgreSQL instance with built-in Row Level Security (RLS) for the `audit_logs` (enforcing append-only semantics). It aligns with modern prototyping by offering auto-generated APIs if needed, though we will primarily interface via standard SQL/ORM through FastAPI for strict control. PostgreSQL provides native enums, UUIDs, and Timestamptz which perfectly suit the tracking of simulated time versus real insertion time.

## Consequences
- Provides a scalable, relational schema ensuring data integrity.
- Requires Dockerized local Supabase stack or a connected remote project for fully offline demo capabilities.
- We must maintain rigorous `.sql` migration files to version-control the schema.

## Status
Accepted
