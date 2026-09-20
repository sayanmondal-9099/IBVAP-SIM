---
name: ibvap-frontend-ui
description: UI/UX implementation rules specific to the IBVAP-SIM central dashboard.
---

# IBVAP-SIM: Frontend UI Guidelines

## Purpose
Guide the development of the React 19/Vite dashboard, enforcing modularity, separate workspaces, and strict accessibility.

## When to use
Use whenever creating or modifying React components, updating Tailwind styles, or fetching data from the backend.

## Core Rules
1. **Modular Workspaces:** Do NOT create a giant dashboard containing every feature. Implement separate operational pages:
   - Command Map
   - Simulation
   - Camera Intelligence
   - Radar/Sensor View
   - Tracks
   - Alerts
   - Incidents
   - Audit Trail
   - System Health
   - 3D Operational View
   - Human Review
2. **Permanent UI Banner:** The application MUST always display: `SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION`.
3. **Component Architecture:** Use React functional components, hooks, and clean state management.
4. **Routing:** Use declarative routing (e.g., `react-router-dom`).
5. **State Requirements:** Every page MUST explicitly define and handle:
   - Loading states
   - Error states
   - Empty states
   - Offline / Degraded states
6. **Accessibility & Responsiveness:** Ensure keyboard navigability, hover/selected states, and responsive behavior for varied screen sizes.
7. **Information Hierarchy:** Visually separate alert severity (P1-P4). Highlight P1.
8. **Visualizing Uncertainty:** Ensure confidence scores (e.g., 85%) and quality metrics are visibly represented to operators.
9. **Evidence Presentation:** The Human Review workflow must clearly present synthetic evidence (image links, tracks) before allowing resolution.

## Workflow
- Inspect `src/frontend/src/App.tsx` for routing structure.
- Build isolated components in `pages/` or `components/`.
- Ensure the offline state visually triggers when the API drops.

## Repository-Specific Constraints
- The UI uses Tailwind CSS v3.
- MapLibre handles the 2D Command Map.

## Common Mistakes
- **Mistake:** Overloading the `CommandMap.tsx` with Human Review panels instead of routing to a dedicated view.
- **Mistake:** Failing to display the `SIMULATION ONLY` banner.
- **Mistake:** Assuming the API is always online without handling fetch errors.

## Verification Checklist
- [ ] Is the `SIMULATION ONLY` banner visible?
- [ ] Are empty and loading states defined?
- [ ] Is the operator's workspace isolated from the main map?
- [ ] Is uncertainty (confidence scores) explicitly shown?
