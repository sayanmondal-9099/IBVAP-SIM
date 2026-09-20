# ADR-005 — Alert Prioritization

## Status
ACCEPTED

## Date
2026-09-13

## Context
When multiple sensor events occur, operators suffer from alert fatigue. A heuristic scoring model is required to rank severity.

## Problem
How do we deterministically score and rank synthetic alerts?

## Decision
We enforce the specified, explainable scoring model:

```text
priority_score = 
  0.25 * zone_risk + 
  0.20 * object_risk + 
  0.15 * proximity_score + 
  0.15 * persistence_score + 
  0.10 * corroboration_score + 
  0.10 * confidence_score + 
  0.05 * response_urgency 
  - quality_penalty 
  - duplicate_penalty
```

**Priority Bands:**
- P1 = 80–100
- P2 = 60–79
- P3 = 35–59
- P4 = 0–34

Priority is a decision-support mechanism. It does NOT trigger autonomous operational action (ADR-001).

## Alternatives Considered
- *Using an AI/ML model for risk scoring:* Rejected. A mathematical heuristic is deterministic, easier to test, and perfectly explainable to auditors.

## Consequences
### Positive
- Fast, transparent calculation (< 50ms).
- Easy to tune weights for demos.
### Negative
- Static rules cannot learn complex, novel threat patterns.

## Implementation Impact
Implemented in `src/backend/alert_engine.py`.

## Testing Impact
`test_alert_pipeline.py` must verify these exact calculations.
