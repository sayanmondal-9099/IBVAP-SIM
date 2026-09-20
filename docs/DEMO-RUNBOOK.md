# Demo Runbook (Smart India Hackathon)

This runbook defines the exact operational sequence for demonstrating the IBVAP-SIM / KAAL architecture to SIH evaluators.

## PRE-DEMO CHECKLIST
1. Stop any previously running backend or frontend instances: `kill $(lsof -ti:8000 -ti:5173) 2>/dev/null || true`
2. Optional clean reset: `rm -f ibvap.db edge_buffer.db`
3. Start FastAPI backend: `source .venv/bin/activate && uvicorn src.backend.main:app --host 127.0.0.1 --port 8000`
4. Start Vite frontend: `cd src/frontend && npm run dev -- --host 127.0.0.1 --port 5173`
5. Open browser at `http://127.0.0.1:5173/`
6. Verify permanent top banner displays: `SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION`
7. Ensure audio is unmuted in the top bar (sound icon active).

---

## THE GOLDEN DEMO SEQUENCE (8–12 MINUTES)

### Step 1: Baseline Surveillance (`NORMAL` Operations)
- **Action:** In the Command Map simulation bar, select `NORMAL` and click **START**.
- **Observables:**
  - Synthetic civilian car, herder, and birds move across the terrain.
  - 5 rotating cameras ($160^\circ$ outward sector scanning) actively sweep.
  - Zero false alerts generated; rules engine distinguishes benign movements.
- **Controls Demo:** Toggle speed `1X` -> `2X` -> `4X`.

### Step 2: Airspace Incursion (`DRONE`)
- **Action:** Switch scenario to `DRONE`.
- **Observables:**
  - 3 UAVs penetrate the warning zone from the West.
  - Rotating cameras detect drones entering FOV sectors.
  - Radar PPI sweep detects aerial bogies.
- **Controls Demo:** Click **PAUSE** (observe objects freeze), then **RESUME**.

### Step 3: Coordinated Multi-Threat Incursion (`MULTI-THREAT`)
- **Action:** Switch scenario to `MULTI-THREAT`.
- **Observables:**
  - Coordinated ground vehicles, heavy tanks, infantry squads, and aerial strikes approach.
  - Real-time alerts populate in `ActiveAlertsPanel` and `/alerts`.
  - Canonical alert scoring: distance, velocity vector, corroboration (Camera + Radar).
  - Audible alerts: Tone 1 on detection, Tone 2 warning loop.

### Step 4: Human-in-the-Loop Review (`HUMAN REVIEW`)
- **Action:** Click an active alert on the Command Map and navigate to `/human-review`.
- **Observables:**
  - Evidence dossier: inciting observation ID, sensor confidence (0.95), timestamp, coordinates.
  - Operator action: Click **Acknowledge** and **Promote to Incident**.
  - Navigate to `/incidents` to inspect the escalated incident dossier.

### Step 5: Critical Escalation (`EMERGENCY`)
- **Action:** Switch scenario to `EMERGENCY`.
- **Observables:**
  - Hostile objects breach the border line ($x \ge 0$).
  - Continuous WWII Air-Raid Siren (Tone 3) sounds.
  - Click **Acknowledge All** in the top bar to silence alarm.

### Step 6: Hardware Fault Resilience & Recovery (`SENSOR DEGRADED`)
- **Action:** Switch scenario to `SENSOR DEGRADED`.
- **Observables:**
  - Camera quality drops due to simulated weather/dust; camera health indicator drops.
  - Radar maintains continuous tracking, preventing tracking blind spots.
  - At 30 seconds, camera recovers back to normal green health.

### Step 7: Cryptographic Audit Verification (`AUDIT`)
- **Action:** Navigate to `/audit`.
- **Observables:**
  - Cryptographically chained SHA-256 ledger recording all alerts, acknowledgements, and incidents.
  - Click **Verify Audit Chain**: displays `CHAIN VALID`.
  - Reiterate: mock Army receiver is DISPLAY/AUDIT ONLY.

### Step 8: Clean Reset (`RESET`)
- **Action:** Click **RESET**.
- **Observables:**
  - All tracks and trails cleared.
  - Audio stopped immediately.
  - Counters reset to 0.
  - Cameras remain actively scanning and ready for immediate replay.

---

## AIR-GAPPED STARTUP REFERENCE

```bash
# Terminal 1: Backend
cd "/Users/sayanmondal/Documents/PROJECTS ✅/Border_security/New IBVAP"
source .venv/bin/activate
uvicorn src.backend.main:app --host 127.0.0.1 --port 8000

# Terminal 2: Frontend
cd "/Users/sayanmondal/Documents/PROJECTS ✅/Border_security/New IBVAP/src/frontend"
npm run dev -- --host 127.0.0.1 --port 5173
```

## EMERGENCY FAILURE RECOVERY
- **Backend dies:** Restart uvicorn; frontend auto-reconnects in 3 seconds.
- **WebSocket disconnects:** Status pill shows amber; reconnects automatically.
- **Accidental refresh:** Refreshing the page is 100% safe; frontend resyncs with backend state immediately.
- **Stale simulation:** Click **RESET** in the UI or execute `curl -X POST http://127.0.0.1:8000/api/simulation/stop`.
