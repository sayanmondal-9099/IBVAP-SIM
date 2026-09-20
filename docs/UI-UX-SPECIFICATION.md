# UI/UX Specification

## Design Philosophy
The UI must be operationally clear rather than visually overloaded. Functional separation of concerns is required. **Do not merge all functionality into one giant dashboard.**

## Permanent UI Requirement
The following label MUST remain visible across all screens to ensure compliance with the non-negotiable safety boundary:
**`SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION`**

### Routes & Hierarchy

The application utilizes React Router with a persistent `RootLayout` enforcing the safety banner and global HUD.

- `/` (Command Map): Central multi-sensor spatial view.
- `/simulation`: Deterministic scenario and engine controls.
- `/cameras`: Synthetic optical and thermal feeds.
- `/radar`: Simulated ground radar tracking view.
- `/tracks`: Real-time fused track metrics.
- `/alerts`: Triage view for anomalies.
- `/incidents`: Resolution workflows (escalated alerts).
- `/human-review`: Manual adjudication pipeline.
- `/audit`: Cryptographic event validation.
- `/health`: System and connectivity metrics.
- `/3d-view`: Immersive geospatial visualization.

### State Management
- `SimulationContext`: Singleton context wrapping `useSimulationSocket` for WebSocket telemetry, and polling `/api/simulation/state` and `/api/simulation/tracks`.
- Local UI state via standard React `useState`.lization.

### 2. Alerts (IMPLEMENTED)
- Tabular view of P1-P4 alerts.
- Visual severity indicators.

### 3. 3D Operational View (MISSING)
- Interactive Cesium/Three.js view.
- Altitude and volumetric restriction zones.
- Z-axis track history.

### 4. Human Review & Incidents (MISSING)
- Dedicated workspace for an operator to review an alert.
- Evidence panel (synthetic images, radar cross-sections).
- Acknowledge, Escalate, and Resolve workflow buttons.

### 5. Audit Trail & System Health (MISSING)
- Read-only table of the cryptographically chained actions.
- Offline/degraded network state indicators.

## State Requirements
Every page must define:
- Empty states
- Loading states
- Error states
- Degraded/Offline states
