---
name: ibvap-alert-engine
description: Rules for implementing the IBVAP-SIM alert rule engine (tripwires, loitering).
---

# IBVAP-SIM: Alert Engine Guidelines

## Purpose
Guide the modification and testing of the central Alert Engine (`alert_engine.py`), which handles priority scoring, deduplication, and alert escalation.

## When to use
Use when modifying priority formulas, adding new rule evaluators (e.g., loitering), or adjusting the deduplication cooldown mechanisms.

## Core Rules
1. **Event Pipeline:** `Observation → Detection → Track → Event → Alert → Acknowledgement → Incident → Resolution → Audit`
2. **Specified Priority Formula:** You MUST use the following formula. Do not invent a replacement.
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
3. **Priority Bands:**
   - **P1:** 80–100
   - **P2:** 60–79
   - **P3:** 35–59
   - **P4:** 0–34
4. **Deduplication Cooldown:** The engine must enforce a 60-second spatial/object cooldown to prevent alert storms. Suppressed duplicates must be handled cleanly.
5. **No Autonomous Responses:** The engine strictly generates alerts. It MUST NOT trigger operational responses (e.g., dispatching physical assets or targeting).
6. **Audit Trail:** Severity increases, zone transitions, and alert escalations must generate an `AuditLog`.

## Workflow
1. Identify the rule being modified (e.g., `zone_risk`).
2. Adjust the logic in `src/backend/alert_engine.py`.
3. Run deterministic tests (`tests/test_alert_pipeline.py`) to verify the score output matches expectations perfectly.

## Repository-Specific Constraints
- The `AlertEngine` expects observations directly from the `SimulationEngine` edge buffer sync.

## Common Mistakes
- **Mistake:** Assuming the alert engine actually runs complex machine learning to score events. (It runs the deterministic formula above).
- **Mistake:** Triggering a webhook to an external defense system when a P1 alert fires.

## Verification Checklist
- [ ] Did you use the approved priority formula?
- [ ] Is the deduplication cooldown respected?
- [ ] Are P1-P4 bands accurately mapped?
