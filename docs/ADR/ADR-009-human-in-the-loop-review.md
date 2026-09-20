# ADR-009 — Human-in-the-Loop Review

## Status
ACCEPTED

## Date
2026-09-13

## Context
To prevent catastrophic automated errors and enforce the non-negotiable safety boundaries of the simulation (ADR-001), AI/ML logic must only advise operators, not act on their behalf.

## Problem
How do we ensure consequential decisions (like escalating an alert to an incident) remain strictly human-controlled?

## Decision
Consequential classification and resolution must remain human-reviewed.
The target Human Review workflow (currently missing from the UI) will allow an operator to inspect:
- The alert and track data
- Source sensor evidence (synthetic images)
- Confidence, quality, and uncertainty metrics
- Corroborating sensors
- The specific rule triggered

The operator may then apply a decision, restricted to simulation-oriented labels:
- `confirmed simulation class`
- `unresolved`
- `ordinary/benign simulation`
- `false alert`

Every human decision must produce an audit event. No automated system may convert this workflow into autonomous engagement.

## Alternatives Considered
- *Auto-escalating P1 alerts to the Mock Receiver:* Rejected. Violates the core safety boundary that requires human validation of threats.

## Consequences
### Positive
- Prevents runaway simulation bugs from spamming external interfaces.
- Demonstrates responsible AI usage.
### Negative
- Requires building a complex UI for evidence presentation.

## Implementation Impact
The `Incident` creation API and the frontend Human Review workspace must be explicitly built.

## Testing Impact
E2E tests must verify that alerts do not escalate without the required `/acknowledge` and `/escalate` API calls.
