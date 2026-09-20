# ADR-015 — Open-Source Dependency Policy

## Status
ACCEPTED

## Date
2026-09-13

## Context
Hackathon prototypes frequently suffer from dependency bloat, leading to slow build times, security vulnerabilities, and brittle codebases.

## Problem
How do we control the introduction of new libraries, plugins, or SaaS tools into IBVAP-SIM?

## Decision
We mandate a strict open-source dependency policy. The project must prefer existing dependencies and native language features over external packages.

Before adopting *any* external repository, npm package, Python package, or AI skill, the developer (or AI agent) MUST:
- Inspect the license (Must be open source / MIT / Apache).
- Inspect maintenance activity (No abandoned packages).
- Inspect security concerns (CVEs).
- Inspect compatibility (e.g., React 19 compatibility).
- Inspect whether the current project already solves the problem (e.g., using `fetch` instead of installing `axios`).

No GitHub repository may be copied blindly. No dependency may be installed without explicit approval via the `CHANGE-CONTROL.md` process.

## Alternatives Considered
- *Unrestricted package installation:* Rejected. Leads to unstable prototypes.

## Consequences
### Positive
- Lean, secure, and easily buildable repository.
### Negative
- Slightly slower development speed for tasks that could be solved with a quick npm install.

## Implementation Impact
Affects `package.json` and `requirements.txt`.

## Testing Impact
Reduces the risk of untestable third-party side effects.
