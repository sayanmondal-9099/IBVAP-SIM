# ADR-012 — Frontend State and Data Flow

## Status
ACCEPTED

## Date
2026-09-13

## Context
With the decision to split the UI into multiple operational pages (ADR-010), the React application needs a reliable way to share data (alerts, tracks, audit status) across routes.

## Problem
How should the frontend manage global state without installing unnecessary monolithic state management libraries (like Redux)?

## Decision
If current native React mechanisms are sufficient, prefer them. We will rely on standard React Context API and custom hooks for global data (e.g., `AlertContext`, `SimulationContext`).

Local state (UI toggles, specific map viewport) will remain local to the component. API state will be fetched and cached natively (or via lightweight hooks if approved later, but currently via standard `useEffect`/`fetch`).

Do not install state-management libraries (Zustand, Redux) unless the native Context API proves a measurable performance bottleneck during the 3D implementation.

## Alternatives Considered
- *Redux/Zustand:* Rejected as premature optimization for a hackathon prototype.

## Consequences
### Positive
- Keeps the `package.json` lightweight.
- Lowers complexity.
### Negative
- Potential for unnecessary re-renders if Context is not memoized properly.

## Implementation Impact
React Context providers will wrap the main router in `App.tsx`.

## Testing Impact
Components must be wrapped in Mock Providers during Vitest runs.
