# Change Control Policy

**Date:** 2026-09-12
**Scope:** IBVAP-SIM Repository Governance

To maintain the architectural integrity, safety boundaries, and strict simulation isolation of the IBVAP-SIM prototype, all future changes must adhere to the following strict change control process.

## 1. Change Proposal Requirements
Before writing any code or modifying dependencies, the developer (or AI agent) must formulate a plan identifying:

1. **Problem:** What is broken or missing?
2. **User/Operator Value:** How does this aid the SIH demonstration?
3. **Affected Architecture Layer:** Is this Frontend, Backend, or Simulation Engine?
4. **Files Likely Affected:** Exact paths of target files.
5. **Data Model Impact:** Does this change require database updates?
6. **API Impact:** Does this change API contracts?
7. **UI Impact:** Are new visual states required?
8. **Simulation Impact:** Does this affect deterministic replay or the edge buffer?
9. **Testing Impact:** What tests must be written or updated?
10. **Security/Safety Impact:** Does this risk bypassing the simulation boundary?
11. **Documentation Impact:** Which docs become outdated?
12. **Rollback Strategy:** How do we revert if it breaks the demo?

## 2. Rule of Preservation
**Require existing functionality to be preserved unless explicitly changed.**
- Do not blindly rewrite files if appending or surgical edits will suffice.
- If an existing function works (e.g. `process_observations`), do not modify its API unless required by the approved change plan.

## 3. Rule of Verification
**Require verification before modification.**
- You must read the target source code before changing it. Do not assume its contents match your training weights or memory.
- You must run tests before declaring success.

## 4. Dependency Policy
DO NOT add a package merely because it is convenient. The project must remain lightweight.

Before adding any dependency (npm, Python, MCP, external API, SaaS, plugin, skill):
1. Explain why it is required.
2. Check whether existing dependencies already solve the problem (e.g., do not add `moment.js` if native `Date` works).
3. Identify license (Must be open source).
4. Identify maintenance status.
5. Identify bundle/runtime impact.
6. Identify security implications.
7. **Obtain explicit authorization from the user before installation.**

## 5. Non-Negotiable Boundary Enforcement
Any change request that introduces operational targeting, firing logic, or external defense integrations must be rejected instantly with a blocking error. The system is SIMULATION ONLY.
