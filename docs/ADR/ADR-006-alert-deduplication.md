# ADR-006 — Alert Deduplication and Idempotency

## Status
ACCEPTED

## Date
2026-09-13

## Context
A single tracked object (e.g., a drone) generates continuous ticks. We must not generate an alert for every single tick. 

## Problem
How do we suppress duplicate alerts while allowing legitimate severity escalations?

## Decision
We use a deterministic deduplication key with a cooldown window.

**Specified Design Concept:**
`site_id + zone_id + event_type + track_id + 60-second-window`

*(Note: The repository implementation in `alert_engine.py` now uses a standardized 60-second spatial cooldown dictionary based on `object_id`).*

Deduplication logic must account for and allow bypasses during the 60-second window when:
- **Independent Corroboration**: A new observation arrives from a sensor that has NOT previously seen the object.
- **Severity Escalation**: A new observation triggers a higher severity band (e.g., P3 upgrades to P2).
- **Synchronization Idempotency**: Offline sync payloads must not bypass deduplication.

## Alternatives Considered
- *Relying on frontend UI to group alerts:* Rejected. The backend DB would still be flooded with spam.

## Consequences
### Positive
- Protects the DB and Operator from alert storms.
### Negative
- Requires maintaining state (cooldown dicts) in memory or Redis.

## Implementation Impact
Implemented inside `src/backend/alert_engine.py`.

## Testing Impact
`test_alert_pipeline.py` verifies the cooldown logic.
