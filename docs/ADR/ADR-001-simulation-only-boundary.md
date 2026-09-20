# ADR-001 — Simulation-Only System Boundary

## Status
ACCEPTED

## Date
2026-09-13

## Context
IBVAP-SIM is a software demonstrator for the Smart India Hackathon. It models edge-to-central surveillance architectures. Demonstrating such systems typically requires classified or restricted defense infrastructure.

## Problem
How do we legally and safely demonstrate complex defense software architectures without interacting with operational systems or real-world PII?

## Decision
IBVAP-SIM remains permanently simulation-only. 

We explicitly prohibit:
- Real CCTV and real radar integration
- Real military networks and defence infrastructure
- Weapons, firing, targeting, and autonomous interception/engagement
- Operational biometric systems and real personal data

The Mock Base Receiver is for **DISPLAY + ACKNOWLEDGEMENT + AUDIT ONLY**. It must not initiate external action.

## Alternatives Considered
- *Using public live traffic cameras:* Rejected due to uncontrollable variables and lack of reliable "threats" to demonstrate the alert engine.
- *Integrating a real drone telemetry API:* Rejected due to legal/safety risks.

## Consequences
### Positive
- 100% safe to demo on a laptop.
- No legal or privacy liabilities.
### Negative
- Requires robust, convincing synthetic data generators.
### Risks
- Evaluators may misinterpret the lack of live video as a lack of capability. (Mitigated by the UI banner).

## Implementation Impact
All sensor input must come from `src/simulation/scenarios.py`.

## Testing Impact
Tests only verify deterministic synthetic events.

## Security/Safety Impact
Guarantees the system cannot accidentally trigger a real-world response.

## Documentation Impact
Enforced globally via `AGENTS.md`.
