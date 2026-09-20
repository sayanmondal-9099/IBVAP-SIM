# IBVAP-SIM OPERATIONAL DEMO RUNBOOK
*(Smart India Hackathon Demonstration Flow)*

This document serves as the official operator runbook for demonstrating the IBVAP-SIM (Intelligent Border Video Analytics Platform) prototype. 

**IMPORTANT: This is a Simulation-Only prototype. NO REAL DEFENCE NETWORK CONNECTION IS ESTABLISHED.**

---

## 1. SYSTEM START
**Operator Action:** 
1. Boot Backend: `.venv/bin/uvicorn src.backend.main:app --port 8000`
2. Boot Frontend: `npm run dev`
3. Navigate to `http://localhost:5173`
**Expected Visual Result:** The Command Map loads as the dominant visual element. The `SIMULATION ONLY` warning is permanently visible. The protocol selector defaults to `NORMAL`.
**Expected Alert/Event Result:** Telemetry panels read `0`, system state is `ONLINE`.
**Demonstration Duration:** ~10 seconds.

## 2. NORMAL DEMO
**Operator Action:** Ensure `NORMAL` is selected. Click `START`. Wait ~15 seconds.
**Expected Visual Result:** A few ordinary mixed-activity tracks (e.g., people, occasional vehicles) spawn and move along predefined trajectories near the border.
**Expected Alert/Event Result:** Event Log records Zone Entries. Threat level is low.
**Demonstration Duration:** ~15-20 seconds.

## 3. DRONE DEMO
**Operator Action:** Click `RESET`. Select `DRONE`. Click `START`.
**Expected Visual Result:** Aerial tracks appear and move rapidly across the map.
**Expected Alert/Event Result:** Radar sensors log high-altitude detection.
**Demonstration Duration:** ~15 seconds.

## 4. VEHICLE DEMO
**Operator Action:** Click `RESET`. Select `VEHICLE`. Click `START`.
**Expected Visual Result:** Ground vehicle tracks (represented canonically) visibly traverse the mapped terrain.
**Expected Alert/Event Result:** Camera and seismic sensors (simulated) pick up heavy movement.
**Demonstration Duration:** ~15 seconds.

## 5. MULTI-THREAT DEMO
**Operator Action:** Click `RESET`. Select `MULTI-THREAT`. Click `START`.
**Expected Visual Result:** Multiple distinct classes (person, vehicle, drone) simultaneously spawn and move toward the border on different vectors.
**Expected Alert/Event Result:** Events escalate. Approaching the border triggers active warning alerts which persist in the `ACTIVE THREATS` panel as long as the objects are engaged.
**Demonstration Duration:** ~30 seconds.

## 6. EMERGENCY DEMO
**Operator Action:** Click `RESET`. Select `EMERGENCY`. Click `START`.
**Expected Visual Result:** A massive, rapid incursion of multiple vehicles, drones, and unknown aerial objects floods the map heading directly for the border.
**Expected Alert/Event Result:** The alert engine triggers severe, continuous alerts. The system processes the load seamlessly without freezing.
**Demonstration Duration:** ~30 seconds.

## 7. SENSOR DEGRADED DEMO
**Operator Action:** Click `RESET`. Select `SENSOR DEGRADED`. Click `START`. Wait ~15 seconds.
**Expected Visual Result:** Objects spawn and move normally. At the scripted time, a sensor degrades.
**Expected Alert/Event Result:** The global/sensor status bar explicitly logs a degraded or offline sensor. However, the simulation continues and object movement remains visible (with increased uncertainty simulated). The application does not crash.
**Demonstration Duration:** ~20-30 seconds.

## 8. AI ANOMALY DEMO
**Operator Action:** While any scenario is running, toggle the `AI ANOMALY` switch in the Simulation Control Bar.
**Expected Visual Result:** The switch engages (`ENABLED`). An unusual synthetic object or movement pattern is injected into the map.
**Expected Alert/Event Result:** Anomaly events are logged. *Note: Operator script must clarify: "An unusual synthetic movement pattern has been detected. This does not use real-world surveillance data."*
**Demonstration Duration:** ~15 seconds.

## 9. ALERT DEMO & SPEED/PAUSE
**Operator Action:** 
1. Select a moving track on the map. Verify the right-side detail panel updates with identity and live range.
2. Click `4X` speed, observe movement acceleration.
3. Click `PAUSE`, verify the map freezes perfectly.
4. Click `RESUME/START`, verify movement resumes.
**Expected Visual Result:** The map interaction is seamless. Alerts remain tied accurately to the track objects.
**Demonstration Duration:** ~20 seconds.

## 10. RESET / CLEAN STATE
**Operator Action:** Click `RESET`.
**Expected Visual Result:** Active simulation immediately terminates. All active tracks disappear. All event/alert histories clear. All counters revert to zero.
**Expected Alert/Event Result:** The system returns to a perfectly clean deterministic state ready for the next demonstration sequence.
**Demonstration Duration:** Instant.
