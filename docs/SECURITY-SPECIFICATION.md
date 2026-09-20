# Security Specification

## 1. Simulation Isolation (IMPLEMENTED)
The most critical security feature of IBVAP-SIM is its **air-gapped isolation from operational networks**. The system simulates defense scenarios entirely in memory and SQLite. It has zero capability to contact actual command-and-control APIs.

## 2. Evidence Integrity & Audit Logging (IMPLEMENTED)
Every sensitive action (alert generation, escalation, configuration change) generates an `AuditLog` entry.
- Uses SHA-256 cryptographic hashing.
- Features `previous_hash` chaining to detect tampering.
- Ensures an append-only ledger that auditors can mathematically verify.

## 3. Secret Handling (IMPLEMENTED)
- The prototype does not connect to real databases or SaaS providers, eliminating the need for real `.env` secrets. 
- Dummy configuration defaults are safe to commit.

## 4. API Security (PARTIAL)
- Implements strict Pydantic payload validation on all incoming mock observations.
- Rejects malformed or out-of-bounds coordinates.
- **Missing:** Formal JWT Authentication (Currently omitted for prototype simplicity).

## 5. Offline Storage & Synchronization (IMPLEMENTED)
- The edge buffer correctly queues payloads locally during network failures.
- It uses idempotent `/api/simulation/sync_events` syncing to prevent replay-attack scenarios (duplicate alerts).

## 6. Dependency Security (PLANNED)
- Dependencies must remain minimal.
- Packages with known CVEs or poor maintenance must be avoided.

## 7. Privacy (IMPLEMENTED)
- All tracked objects are strictly synthetic (e.g., `sim_person_01`).
- No actual PII, facial recognition data, or civilian MAC addresses are captured or stored.
