# ADR-016 — Evidence and Provenance

## Status
ACCEPTED

## Date
2026-09-13

## Context
When a Human Review operator examines an alert, they must trust that the data presented actually caused the alert, and wasn't accidentally swapped or corrupted.

## Problem
How do we maintain a strict chain of evidence from a synthetic sensor observation to a final alert?

## Decision
Synthetic evidence must strictly preserve its provenance.

The system must track:
- Simulation ID & Scenario ID
- Source sensor ID
- Event generation time
- Model/version information (simulated)
- Confidence & Quality scores
- Cryptographic evidence hash (where applicable)

**Provenance vs. Correctness:**
- *Provenance* means we can mathematically prove that Observation X resulted in Alert Y.
- *Correctness* means Observation X was actually a drone and not a bird.
The system guarantees provenance (via `object_id` linking and `AuditLog`), but relies on the human operator to determine correctness.

## Alternatives Considered
- *Stripping metadata to save space:* Rejected. Destroys the auditability of the prototype.

## Consequences
### Positive
- High credibility in the SIH demonstration.
### Negative
- Larger database rows and more complex JSON payloads.

## Implementation Impact
The `Alert` and `Observation` models must retain these foreign keys / metadata fields.
