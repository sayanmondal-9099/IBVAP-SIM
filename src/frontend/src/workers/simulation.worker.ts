/**
 * IBVAP-SIM Dedicated Cloud Simulation Web Worker (Phase V6D)
 *
 * SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION.
 * Runs the deterministic simulation engine at 4 Hz off the main React UI thread.
 */

import { SimulationEngine } from "../lib/simulation/engine";
import { getScenarioConfig } from "../lib/simulation/scenarios";
import type { TelemetryBroadcastPayload } from "../lib/simulation/types";

let engine: SimulationEngine | null = null;
let tickTimer: ReturnType<typeof setInterval> | null = null;
let currentScenario = "PROTOCOL-NORMAL";
let ownerId = "owner-client-default";
let tickSequence = 0;

const TICK_INTERVAL_MS = 250; // Strict 4 Hz loop

function sendToMain(msg: any) {
  self.postMessage(msg);
}

function stopTimer() {
  if (tickTimer !== null) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
}

function startTimer() {
  stopTimer();
  tickTimer = setInterval(() => {
    runTick();
  }, TICK_INTERVAL_MS);
}

function runTick() {
  if (!engine || !engine.state.is_running || engine.state.is_paused) {
    return;
  }

  const result = engine.tick(0.25 * engine.speedMultiplier);
  if (!result) return;

  tickSequence++;

  // Collect newly generated alert IDs for the broadcast payload
  const newAlertIds = result.generatedAlerts.map((a) => a.id);

  // Emit any generated alerts for durable cloud persistence
  for (const alert of result.generatedAlerts) {
    sendToMain({
      type: "ALERT_GENERATED",
      alert,
    });
  }

  // Format compact telemetry broadcast payload
  const payload: TelemetryBroadcastPayload = {
    simulation_id: engine.simulationId,
    protocol: currentScenario,
    simulation_timestamp: Math.round(result.state.current_tick * 100) / 100,
    tick: tickSequence,
    tracks: result.tracks,
    observations: result.observations,
    sensors: result.sensors,
    environment: {
      zones: result.state.zones,
      events: result.events,
    },
    new_alerts: newAlertIds,
    owner_id: ownerId,
  };

  sendToMain({
    type: "TELEMETRY",
    payload,
    state: result.state,
  });
}

// Worker message listener
self.onmessage = (event: MessageEvent) => {
  const data = event.data;
  if (!data || !data.type) return;

  switch (data.type) {
    case "INIT": {
      if (data.ownerId) ownerId = data.ownerId;
      if (data.scenario) currentScenario = data.scenario;
      const config = getScenarioConfig(currentScenario);
      engine = new SimulationEngine(config);
      sendToMain({
        type: "INITIALIZED",
        simulationId: engine.simulationId,
        ownerId,
        state: engine.state,
      });
      break;
    }

    case "START": {
      if (data.scenario && data.scenario !== currentScenario) {
        currentScenario = data.scenario;
      }
      const config = getScenarioConfig(currentScenario);
      if (!engine || engine.config.scenario_id !== config.scenario_id) {
        engine = new SimulationEngine(config);
      }
      if (data.speed !== undefined) {
        engine.speedMultiplier = data.speed;
      }
      if (data.anomalyEnabled !== undefined) {
        engine.anomalyDetectionEnabled = data.anomalyEnabled;
      }
      tickSequence = 0;
      engine.start();
      startTimer();

      sendToMain({
        type: "STATE_CHANGE",
        state: engine.state,
        action: "START",
      });
      break;
    }

    case "PAUSE": {
      if (engine) {
        engine.pause();
        sendToMain({
          type: "STATE_CHANGE",
          state: engine.state,
          action: "PAUSE",
        });
      }
      break;
    }

    case "RESUME": {
      if (engine) {
        engine.resume();
        startTimer();
        sendToMain({
          type: "STATE_CHANGE",
          state: engine.state,
          action: "RESUME",
        });
      }
      break;
    }

    case "RESET": {
      stopTimer();
      tickSequence = 0;
      if (data.scenario) currentScenario = data.scenario;
      const config = getScenarioConfig(currentScenario);
      if (engine) {
        engine.reset(config);
      } else {
        engine = new SimulationEngine(config);
      }
      sendToMain({
        type: "STATE_CHANGE",
        state: engine.state,
        action: "RESET",
      });
      break;
    }

    case "SET_SPEED": {
      if (engine && data.speed) {
        engine.speedMultiplier = Number(data.speed) || 1.0;
        sendToMain({
          type: "STATE_CHANGE",
          state: engine.state,
          speed: engine.speedMultiplier,
          action: "SPEED_CHANGED",
        });
      }
      break;
    }

    case "TOGGLE_ANOMALY": {
      if (engine && data.enabled !== undefined) {
        engine.anomalyDetectionEnabled = !!data.enabled;
        sendToMain({
          type: "STATE_CHANGE",
          state: engine.state,
          anomalyEnabled: engine.anomalyDetectionEnabled,
          action: "ANOMALY_TOGGLED",
        });
      }
      break;
    }

    case "GET_STATE": {
      if (engine) {
        sendToMain({
          type: "STATE_INFO",
          state: engine.state,
          speed: engine.speedMultiplier,
          simulationId: engine.simulationId,
        });
      }
      break;
    }

    case "STOP": {
      stopTimer();
      if (engine) {
        engine.stop();
        sendToMain({
          type: "STATE_CHANGE",
          state: engine.state,
          action: "STOP",
        });
      }
      break;
    }
  }
};
