# Alert Engine Specification

## Alert Pipeline
1. **Rule Evaluation:** Evaluates object coordinates against synthetic boundaries.
2. **Event Generation:** Emits a raw event.
3. **Priority Scoring:** Calculates severity.
4. **Deduplication:** Enforces a 60-second cooldown window.
5. **Alert Creation:** Writes the deduplicated alert to SQLite.

## Priority Scoring Model (IMPLEMENTED)

The priority score (0-100) is calculated exactly as follows:

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
*Note: This is the specified scoring model used for the simulation prototype. It does not represent a production ML heuristic.*

## Priority Bands (IMPLEMENTED)
- **P1 (Critical):** 80–100
- **P2 (High):** 60–79
- **P3 (Medium):** 35–59
- **P4 (Low):** 0–34

## Deduplication and Audit (IMPLEMENTED)
The engine maintains a 60-second cooldown dictionary per `object_id`. 
Events occurring within this window are silently suppressed to prevent alert storms. 
Critical threshold crossings always generate an AuditLog entry.
