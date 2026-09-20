# ADR-007: Audit Strategy

## Context
The system must prove chain of custody and accountability via an audit log.

## Decision
We will use an **Append-Only Database Table** with PostgreSQL Row Level Security (RLS) constraints.

## Alternatives
- Text-based log files.
- Cryptographic blockchain ledger.

## Reasoning
A blockchain is overkill for this prototype. Simple text files are too easy to tamper with. An append-only relational table enforced by PostgreSQL RLS represents enterprise-grade auditing mechanics effectively.

## Consequences
- Backend ORM must strictly map inserts; updates/deletes to this table will throw SQL errors.

## Status
Accepted
