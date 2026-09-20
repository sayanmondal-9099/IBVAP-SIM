# PHASE 13 — END-TO-END DEMO READINESS & HACKATHON PACKAGING

## 1. System Prerequisites

- **Host Operating System:** macOS / Linux / Windows (WSL2)
- **Python Runtime:** Python 3.11+ (Python 3.13 tested) with virtual environment (`.venv`)
- **Node Runtime:** Node.js 18+ (tested with v20+) and `npm`
- **Network Requirements:** Fully offline / air-gapped capable. Zero external cloud dependencies, zero external AI APIs, zero external databases required.
- **Local Ports:**
  - `8000`: FastAPI Backend + WebSocket telemetry broadcast (`ws://127.0.0.1:8000/ws`)
  - `5173`: Vite Frontend Dev Server (`http://127.0.0.1:5173`)

---

## 2. Startup Commands

### Terminal 1: Backend Startup
```bash
# Navigate to repository root
cd "/Users/sayanmondal/Documents/PROJECTS ✅/Border_security/New IBVAP"

# Activate Python virtual environment
source .venv/bin/activate

# Launch FastAPI backend with uvicorn
uvicorn src.backend.main:app --host 127.0.0.1 --port 8000
```

### Terminal 2: Frontend Startup
```bash
# Navigate to frontend directory
cd "/Users/sayanmondal/Documents/PROJECTS ✅/Border_security/New IBVAP/src/frontend"

# Launch Vite development server
npm run dev -- --host 127.0.0.1 --port 5173
```

### Clean Initial State (Optional / Fresh Reset)
To clear previous runs and reset to a clean database:
```bash
cd "/Users/sayanmondal/Documents/PROJECTS ✅/Border_security/New IBVAP"
rm -f ibvap.db edge_buffer.db
```
*Note: SQLAlchemy will automatically create fresh SQLite tables and the cryptographic audit genesis block on startup.*

---

## 3. Health Check

Execute the following commands to confirm full system readiness before demonstrating:

```bash
# 1. Verify backend simulation engine state endpoint
curl -s http://127.0.0.1:8000/api/simulation/state
# Expected: {"is_running":false,"is_paused":false,"simulation_id":null,"network_status":"online",...}

# 2. Verify cryptographic audit chain integrity
curl -s http://127.0.0.1:8000/api/audit/verify
# Expected: {"verified":true,"chain_length":...,"message":"Audit chain verified successfully"}

# 3. Verify frontend HTTP availability
curl -s -I http://127.0.0.1:5173/
# Expected: HTTP/1.1 200 OK
```

---

## 4. Golden Demo Sequence (8–12 Minutes)

| Timeline | Phase / Action | Protocol / View | Operator Talking Points & Key Visuals |
|:---|:---|:---|:---|
| **0:00 - 1:00** | **Introduction & Safety Boundary** | `Command Map` (`/`) | Point out the permanent top banner: `SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION`. Explain that IBVAP-SIM / KAAL is an edge-first simulation prototype proving autonomous multi-sensor video analytics, canonical alert scoring, human-in-the-loop review, and SHA-256 auditability. Point out the Operator Profile (`S. Rao, Level 3 TAC-OPS`) and 5 rotating cameras with $160^\circ$ outward sector scanning. |
| **1:00 - 2:30** | **Routine Surveillance Baseline** | `NORMAL` (`SCN-001`) | Select `NORMAL` protocol and click `START`. Observe civilian traffic, local herders, and birds. Show that the rules engine generates **zero false alerts** for routine civilian movements. Demonstrate speed multiplier toggle: `1X` -> `2X` -> `4X`. |
| **2:30 - 4:00** | **Airspace Intrusion & 160° Camera FOV** | `DRONE` (`SCN-002`) | Switch protocol to `DRONE`. Show 3 synthetic UAVs penetrating the warning zone from the West. Point out the rotating camera frustums ($160^\circ$ outward FOV) detecting the drones as they enter range. Observe the Radar PPI sweep detecting aerial targets. Demonstrate `PAUSE` and `RESUME` controls. |
| **4:00 - 6:00** | **Coordinated Multi-Domain Incursion** | `MULTI-THREAT` (`SCN-004`) | Switch protocol to `MULTI-THREAT`. Observe simultaneous threats: aerial drone strikes, heavy tanks, military convoy trucks, and infiltrator squads. Watch canonical alerts populate in `ActiveAlertsPanel` (P1 Critical, P2 High, P3 Warning). Listen for Tone 1 (initial detection) and Tone 2 (tripwire alert loop). |
| **6:00 - 7:30** | **Track Inspection & Human Review** | `HUMAN REVIEW` (`/human-review`) | Click an active alert on the Command Map. Open `/human-review`. Inspect the evidence dossier: inciting observation ID, sensor confidence score (0.95), world coordinates, timestamp. Adjudicate: click "Acknowledge" and "Promote to Incident". Navigate to `/incidents` to show the escalated incident ledger. |
| **7:30 - 9:00** | **Emergency Escalation & Breach Siren** | `EMERGENCY` (`SCN-005`) | Switch protocol to `EMERGENCY`. High-speed hostile bogeys breach the border line ($x \ge 0$). Hear Tone 3 (WWII Air-Raid Siren). Demonstrate "Acknowledge All" in the top bar to silence the audible alarm. |
| **9:00 - 10:30** | **Hardware Fault Resilience & Recovery** | `SENSOR DEGRADED` (`SCN-006`) | Switch protocol to `SENSOR DEGRADED`. Adverse weather/obstruction degrades camera quality (health indicator drops). Show that Radar maintains continuous tracking despite camera degradation, avoiding tracking blind spots. At 30s, observe camera recovery back to green health. |
| **10:30 - 11:30** | **Cryptographic Audit Verification** | `AUDIT` (`/audit`) | Navigate to `/audit`. Show append-only cryptographic ledger tracking all alerts, operator acknowledgements, and incident escalations. Click "Verify Audit Chain" to display `CHAIN VALID: All cryptographic blocks intact`. Reiterate that mock Army receiver is DISPLAY/AUDIT ONLY. |
| **11:30 - 12:00** | **Clean State Reset** | `RESET` | Click `RESET`. Confirm tracks cleared, trails cleared, alerts cleared, audio stopped, counters reset, and cameras remain actively scanning. |

---

## 5. Expected Visual Behavior & Alerts

### Visual Indicators
- **Border Fence Line:** Solid red vertical axis at $x = 0$.
- **Warning Tripwire Zone:** Cyan dashed zone at $-150 \le x < 0$.
- **Rotating Cameras:** 5 EO/IR camera towers positioned along the border at $y \in \{+400, +200, 0, -200, -400\}$, scanning outward toward hostile territory ($160^\circ$ sweep).
- **Radar PPI Sweep:** Rotating sweep line with radial phosphorescent persistence displaying detected blips.
- **Track Trails:** Bounded 15-tick history trails showing direction, speed vectors, and altitude callouts.

### Alert Classification Thresholds
- **P1 (Critical):** Hostile breach across border line ($x \ge 0$) or high-speed emergency attack. Triggers continuous Tone 3 siren.
- **P2 (High):** Approaching threat within warning tripwire zone ($-150 \le x < 0$) with corroborating sensors (Camera + Radar). Triggers Tone 2 alert loop.
- **P3 (Warning):** Uncorroborated target approaching outer perimeter ($-300 \le x < -150$).
- **P4 (Advisory):** Distant activity, avian wildlife, or civilian movements beyond $-300$.

---

## 6. Demo Reset Procedure

1. In the UI (Command Map or floating drawer), click the red **`RESET`** button.
2. The application executes:
   - Backend `POST /api/simulation/stop`: stops active engine, cancels asyncio loop, clears object positions.
   - Frontend `clearState()`: clears socket observations, active alerts, tracks, track history, selected tracks, acknowledged threat set.
   - Audio manager: terminates sirens, alert loops, and proximity tones.
   - UI counters: resets to 0.
   - Camera layer: preserves 5 camera viewports and continuous sweep rotation.
3. System is immediately ready to start another scenario without reloading the browser.

---

## 7. Demo Failure Recovery

| Scenario | Symptom | Immediate Recovery Action |
|:---|:---|:---|
| **Backend Process Dies** | Status pill shows `OFFLINE`; console shows connection refused. | Run `.venv/bin/uvicorn src.backend.main:app --port 8000` in terminal. Frontend automatically reconnects within 3 seconds. |
| **Frontend Dev Server Dies** | Browser shows "Site can't be reached". | Run `cd src/frontend && npm run dev -- --host 127.0.0.1 --port 5173`. |
| **Stale Simulation State** | Objects stop moving or state appears stuck. | Click `RESET` on the Command Map. If unresponsive, run `curl -X POST http://127.0.0.1:8000/api/simulation/stop`. |
| **WebSocket Disconnects** | Top pill turns amber `CONNECTING...`. | Built-in exponential backoff reconnects automatically. If needed, refresh the browser (`Cmd+R` / `F5`). |
| **Accidental Browser Refresh** | Page reloads during live demo. | State is preserved on backend. Frontend automatically pulls latest state and resumes live telemetry without interruption. |
| **Database Corruption / Old State** | Audit chain verification fails or unexpected past alerts linger. | Stop backend (`Ctrl+C`), run `rm -f ibvap.db edge_buffer.db`, restart backend. Tables and audit chain are recreated cleanly. |

---

## 8. Simulation Safety Boundary Checklist

- [x] Permanent top banner rendered across all pages: `SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION`.
- [x] Zero network calls to external military, police, government, or public surveillance networks.
- [x] All observations, sensor tracks, coordinates, and alerts are 100% synthetic.
- [x] Zero autonomous weapon, targeting, firing, or physical interception logic exists in the codebase.
- [x] Base / Army receiver is strictly **DISPLAY / AUDIT ONLY** (simulated payload transmission without triggering external actions).
- [x] Edge-to-cloud offline buffering and deduplication operate purely within local SQLite databases (`ibvap.db` / `edge_buffer.db`).

---

## 9. Final Hackathon Presentation Checklist

- [ ] Backend running on `http://127.0.0.1:8000`
- [ ] Frontend running on `http://127.0.0.1:5173`
- [ ] UI displays `SIMULATION ONLY` banner
- [ ] Master audio toggle is enabled (unmuted)
- [ ] Operator profile set to `S. Rao (Level 3 TAC-OPS)`
- [ ] Full pytest test suite passing (43 tests)
- [ ] Frontend build passing with 0 errors
- [ ] Evaluator demonstration follows the 8–12 minute Golden Demo sequence
