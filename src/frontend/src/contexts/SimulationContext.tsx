import { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import { api } from "@/lib/api";
import { useSimulationSocket } from "../hooks/useSimulationSocket";
import type { Observation } from "../hooks/useSimulationSocket";
import type { Sensor, Zone, SimulationEvent } from "../hooks/useEnvironmentPoll";
import { soundManager } from "../hooks/useAudioAlarm";
import {
  getSimulationMode,
  setSimulationMode as setRuntimeMode,
  onSimulationModeChange,
  type SimulationRuntimeMode,
} from "@/lib/runtime";
import { telemetryTransport, type TransportState } from "@/lib/supabase/telemetryTransport";
import {
  persistCloudAlert,
  recordCloudAudit,
  acknowledgeCloudAlert,
  acknowledgeAllCloudAlerts,
} from "@/lib/supabase/persistence";
import { getScenarioConfig } from "@/lib/simulation/scenarios";
import type { TelemetryBroadcastPayload, GeneratedAlert } from "@/lib/simulation/types";

export type SimulationState = {
  is_running: boolean;
  is_paused: boolean;
  simulation_id: string | null;
  network_status: string;
  scenario: string;
  tick_rate: number;
  tick_count: number;
  speed_multiplier?: number;
};

export type Track = {
  id: string;
  object_type: string;
  x: number;
  y: number;
  altitude: number;
  speed: number;
  heading: number;
};

interface SimulationContextType {
  simulationState: SimulationState | null;
  tracks: Track[];
  observations: Observation[];
  trackHistory: Record<string, { x: number; y: number; altitude: number; tick_time: number }[]>;
  selectedTrackId: string | null;
  setSelectedTrackId: (id: string | null) => void;
  speedMultiplier: number;
  newAlerts: string[];
  isConnected: boolean;
  environment: { sensors: Sensor[]; zones: Zone[]; events: SimulationEvent[] };

  isTransitioning: boolean;
  isSoundEnabled: boolean;
  toggleSound: () => void;
  anomalyEnabled: boolean;
  toggleAnomaly: () => void;
  acknowledgedThreatIds: string[];
  isAlarmPlaying: boolean;
  acknowledgeThreat: (objectId: string) => void;
  acknowledgeAllThreats: () => void;

  // Runtime Mode
  simulationMode: SimulationRuntimeMode;
  setSimulationMode: (mode: SimulationRuntimeMode) => void;
  cloudTransportState: TransportState;

  // Action methods
  startSimulation: (scenario: string, enableAnomaly?: boolean) => Promise<void>;
  pauseSimulation: () => Promise<void>;
  resumeSimulation: () => Promise<void>;
  resetSimulation: () => Promise<void>;
  setSpeedMultiplier: (speed: number) => Promise<void>;
  clearState: () => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

const CLIENT_SESSION_OWNER_ID = `owner-${Math.random().toString(36).substring(2, 10)}`;

export function SimulationProvider({ children }: { children: ReactNode }) {
  // Runtime Mode State
  const [simulationMode, setSimulationModeState] = useState<SimulationRuntimeMode>(getSimulationMode());
  const [cloudTransportState, setCloudTransportState] = useState<TransportState>("disconnected");

  // Local Mode WebSocket
  const localSocket = useSimulationSocket();

  // Cloud Mode States
  const [cloudObservations, setCloudObservations] = useState<Observation[]>([]);
  const [cloudTracks, setCloudTracks] = useState<Track[]>([]);
  const [cloudNewAlerts, setCloudNewAlerts] = useState<string[]>([]);
  const [cloudSimulationState, setCloudSimulationState] = useState<SimulationState | null>(null);
  const [cloudEnvironment, setCloudEnvironment] = useState<{ sensors: Sensor[]; zones: Zone[]; events: SimulationEvent[] }>({
    sensors: [],
    zones: [],
    events: [],
  });

  // Common UI State
  const [localSimulationState, setLocalSimulationState] = useState<SimulationState | null>(null);
  const [localTracks, setLocalTracks] = useState<Track[]>([]);
  const [localEnvironment, setLocalEnvironment] = useState<{ sensors: Sensor[]; zones: Zone[]; events: SimulationEvent[] }>({
    sensors: [],
    zones: [],
    events: [],
  });

  const [trackHistory, setTrackHistory] = useState<Record<string, { x: number; y: number; altitude: number; tick_time: number }[]>>({});
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [speedMultiplier, setSpeedMultiplierState] = useState<number>(1);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [anomalyEnabled, setAnomalyEnabled] = useState<boolean>(false);
  const [acknowledgedThreatIds, setAcknowledgedThreatIds] = useState<string[]>([]);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState<boolean>(false);

  // Worker and Ownership Management (Step 8: Single Broadcast Owner)
  const workerRef = useRef<Worker | null>(null);
  const simulationOwnerIdRef = useRef<string>(CLIENT_SESSION_OWNER_ID);
  const sessionEpochRef = useRef<number>(1);

  // Sync mode changes
  useEffect(() => {
    return onSimulationModeChange((mode) => {
      setSimulationModeState(mode);
    });
  }, []);

  const setSimulationMode = useCallback((mode: SimulationRuntimeMode) => {
    setRuntimeMode(mode);
    setSimulationModeState(mode);
  }, []);

  // --- Initialize or Cleanup Web Worker for Cloud Mode ---
  const terminateWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  const getOrCreateWorker = useCallback(() => {
    if (!workerRef.current) {
      const worker = new Worker(new URL("../workers/simulation.worker.ts", import.meta.url), {
        type: "module",
      });

      const currentEpoch = sessionEpochRef.current;

      worker.onmessage = (event: MessageEvent) => {
        // Discard messages from previous sessions
        if (sessionEpochRef.current !== currentEpoch) {
          return;
        }

        const msg = event.data;
        if (!msg || !msg.type) return;

        switch (msg.type) {
          case "INITIALIZED":
          case "STATE_INFO": {
            if (msg.state) {
              setCloudSimulationState({
                is_running: msg.state.is_running,
                is_paused: msg.state.is_paused,
                simulation_id: msg.state.simulation_id,
                network_status: msg.state.network_status,
                scenario: msg.state.scenario_id,
                tick_rate: 0.25,
                tick_count: Math.round(msg.state.current_tick * 4),
                speed_multiplier: msg.speed || 1,
              });
              setCloudEnvironment({
                sensors: msg.state.sensors || [],
                zones: msg.state.zones || [],
                events: msg.state.simulation_events || [],
              });
            }
            break;
          }

          case "STATE_CHANGE": {
            if (msg.state) {
              setCloudSimulationState({
                is_running: msg.state.is_running,
                is_paused: msg.state.is_paused,
                simulation_id: msg.state.simulation_id,
                network_status: msg.state.network_status,
                scenario: msg.state.scenario_id,
                tick_rate: 0.25,
                tick_count: Math.round(msg.state.current_tick * 4),
                speed_multiplier: msg.speed || speedMultiplier,
              });
            }
            break;
          }

          case "TELEMETRY": {
            const payload: TelemetryBroadcastPayload = msg.payload;
            // Broadcast over Supabase Realtime channel
            telemetryTransport.broadcastTelemetry(payload);

            // Update local cloud view
            setCloudObservations(payload.observations || []);
            setCloudTracks(payload.tracks || []);
            if (payload.new_alerts && payload.new_alerts.length > 0) {
              setCloudNewAlerts((prev) => Array.from(new Set([...prev, ...payload.new_alerts])));
            }
            if (payload.sensors) {
              setCloudEnvironment((prev) => ({
                ...prev,
                sensors: payload.sensors as any,
                events: (payload.environment?.events || []) as any,
              }));
            }
            if (msg.state) {
              setCloudSimulationState({
                is_running: msg.state.is_running,
                is_paused: msg.state.is_paused,
                simulation_id: msg.state.simulation_id,
                network_status: msg.state.network_status,
                scenario: msg.state.scenario_id,
                tick_rate: 0.25,
                tick_count: Math.round(msg.state.current_tick * 4),
                speed_multiplier: speedMultiplier,
              });
            }
            break;
          }

          case "ALERT_GENERATED": {
            const alert: GeneratedAlert = msg.alert;
            // Step 11: Persist durable alert directly to Supabase PostgreSQL
            persistCloudAlert(alert).catch((err) => {
              console.warn("Could not persist alert to Supabase:", err);
            });
            break;
          }
        }
      };

      worker.postMessage({
        type: "INIT",
        ownerId: simulationOwnerIdRef.current,
        scenario: "PROTOCOL-NORMAL",
      });

      workerRef.current = worker;
    }
    return workerRef.current;
  }, [speedMultiplier]);

  // Connect / Listen to Supabase Realtime Broadcast when in cloud mode
  useEffect(() => {
    if (simulationMode !== "cloud") {
      terminateWorker();
      telemetryTransport.disconnect();
      return;
    }

    // Connect to Supabase Realtime Broadcast channel
    telemetryTransport.setOwnerId(simulationOwnerIdRef.current);
    telemetryTransport.connect();

    const unsubscribe = telemetryTransport.addListener({
      onTelemetry: (payload) => {
        // Discard if not current simulation session
        setCloudObservations(payload.observations || []);
        setCloudTracks(payload.tracks || []);
        if (payload.new_alerts && payload.new_alerts.length > 0) {
          setCloudNewAlerts((prev) => Array.from(new Set([...prev, ...payload.new_alerts])));
        }
      },
      onStateChange: (state) => {
        setCloudTransportState(state);
      },
    });

    // Initialize environment from standard protocol config
    const initialConfig = getScenarioConfig("PROTOCOL-NORMAL");
    setCloudEnvironment({
      sensors: initialConfig.sensors as any,
      zones: initialConfig.zones as any,
      events: [],
    });

    return () => {
      unsubscribe();
    };
  }, [simulationMode, terminateWorker]);

  // Clean up worker on full unmount
  useEffect(() => {
    return () => {
      terminateWorker();
    };
  }, [terminateWorker]);

  // Unified getters based on active runtime mode
  const observations = useMemo(
    () => (simulationMode === "cloud" ? cloudObservations : localSocket.observations),
    [simulationMode, cloudObservations, localSocket.observations]
  );

  const tracks = useMemo(
    () => (simulationMode === "cloud" ? cloudTracks : localTracks),
    [simulationMode, cloudTracks, localTracks]
  );

  const newAlerts = useMemo(
    () => (simulationMode === "cloud" ? cloudNewAlerts : localSocket.newAlerts),
    [simulationMode, cloudNewAlerts, localSocket.newAlerts]
  );

  const isConnected = useMemo(
    () => (simulationMode === "cloud" ? cloudTransportState === "connected" || !!cloudSimulationState?.is_running : localSocket.isConnected),
    [simulationMode, cloudTransportState, cloudSimulationState?.is_running, localSocket.isConnected]
  );

  const simulationState = useMemo(
    () => (simulationMode === "cloud" ? cloudSimulationState : localSimulationState),
    [simulationMode, cloudSimulationState, localSimulationState]
  );

  const environment = useMemo(
    () => (simulationMode === "cloud" ? cloudEnvironment : localEnvironment),
    [simulationMode, cloudEnvironment, localEnvironment]
  );

  const toggleAnomaly = () => {
    setAnomalyEnabled((prev) => {
      const next = !prev;
      if (simulationMode === "cloud" && workerRef.current) {
        workerRef.current.postMessage({ type: "TOGGLE_ANOMALY", enabled: next });
      }
      return next;
    });
  };

  const acknowledgeThreat = (objectId: string) => {
    setAcknowledgedThreatIds((prev) => (prev.includes(objectId) ? prev : [...prev, objectId]));

    if (simulationMode === "cloud") {
      api
        .get("/api/alerts")
        .then((res) => {
          if (Array.isArray(res.data)) {
            const matching = res.data.filter(
              (a: any) => a.object_id === objectId && (a.status === "new" || a.status === "unacknowledged")
            );
            return Promise.allSettled(matching.map((a: any) => acknowledgeCloudAlert(a.id)));
          }
        })
        .catch((err) => {
          console.warn("Could not sync cloud threat acknowledgment", err);
        });
    } else {
      api
        .get("/api/alerts")
        .then((res) => {
          if (Array.isArray(res.data)) {
            const matching = res.data.filter(
              (a: any) => a.object_id === objectId && (a.status === "new" || a.status === "unacknowledged")
            );
            return Promise.allSettled(matching.map((a: any) => api.patch(`/api/alerts/${a.id}/acknowledge`)));
          }
        })
        .catch((err) => {
          console.warn("Could not sync threat acknowledgment to backend", err);
        });
    }
  };

  const acknowledgeAllThreats = () => {
    const currentFused = observations.filter((o) => o.sensor_type === "fused").map((o) => o.object_id);
    setAcknowledgedThreatIds((prev) => Array.from(new Set([...prev, ...currentFused, ...newAlerts])));

    if (simulationMode === "cloud") {
      acknowledgeAllCloudAlerts().catch(() => {});
    } else {
      api.post("/api/alerts/acknowledge-all").catch(() => {
        api.get("/api/alerts").then((res) => {
          if (Array.isArray(res.data)) {
            const active = res.data.filter((a: any) => a.status === "new" || a.status === "unacknowledged");
            Promise.allSettled(active.map((a: any) => api.patch(`/api/alerts/${a.id}/acknowledge`)));
          }
        }).catch(() => {});
      });
    }
  };

  // Master audio state with localStorage persistence
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("ibvap_sound_enabled");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });

  const toggleSound = () => {
    setIsSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("ibvap_sound_enabled", String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    soundManager.setMuted(!isSoundEnabled);
  }, [isSoundEnabled]);

  // Audio tone detection
  const knownTrackIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const isRunning = simulationState?.is_running && !simulationState?.is_paused;
    if (!isRunning) {
      knownTrackIdsRef.current.clear();
      return;
    }

    const currentFused = observations.filter((o) => o.sensor_type === "fused");
    if (currentFused.length === 0) return;

    let hasNewDetection = false;
    currentFused.forEach((o) => {
      if (!knownTrackIdsRef.current.has(o.object_id)) {
        hasNewDetection = true;
      }
    });

    if (hasNewDetection && knownTrackIdsRef.current.size > 0 && isSoundEnabled) {
      soundManager.playDetection();
    }

    currentFused.forEach((o) => knownTrackIdsRef.current.add(o.object_id));
  }, [observations, simulationState?.is_running, simulationState?.is_paused, isSoundEnabled]);

  // Audio alert loops and emergency sirens
  useEffect(() => {
    const isRunning = simulationState?.is_running && !simulationState?.is_paused;
    if (!isRunning) {
      soundManager.stopEmergencySiren();
      soundManager.stopAlertLoop();
      soundManager.stopProximity();
      setIsAlarmPlaying(false);
      return;
    }

    const currentFused = observations.filter((o) => o.sensor_type === "fused");
    const unackBreachThreats = currentFused.filter(
      (o) => o.x >= 0 && !acknowledgedThreatIds.includes(o.object_id)
    );
    const unackApproachThreats = currentFused.filter(
      (o) => o.x >= -150 && o.x < 0 && !acknowledgedThreatIds.includes(o.object_id)
    );

    const scenario = (simulationState?.scenario || "").toUpperCase();
    const isEmergencyScenario = scenario.includes("EMERGENCY") && unackBreachThreats.length > 0;

    if (unackBreachThreats.length > 0 || isEmergencyScenario) {
      soundManager.startEmergencySiren();
      soundManager.stopAlertLoop();
      soundManager.stopProximity();
      setIsAlarmPlaying(true);
    } else if (unackApproachThreats.length > 0) {
      soundManager.stopEmergencySiren();
      soundManager.startAlertLoop();
      soundManager.stopProximity();
      setIsAlarmPlaying(true);
    } else {
      soundManager.stopEmergencySiren();
      soundManager.stopAlertLoop();
      soundManager.stopProximity();
      setIsAlarmPlaying(false);
    }
  }, [
    simulationState?.is_running,
    simulationState?.is_paused,
    simulationState?.scenario,
    observations,
    newAlerts,
    acknowledgedThreatIds,
  ]);

  // Maintain bounded track history
  useEffect(() => {
    if (!simulationState?.is_running || simulationState?.is_paused || !observations.length) return;

    const currentSimId = simulationState?.simulation_id;
    const validObs = currentSimId
      ? observations.filter((o) => o.simulation_id === currentSimId)
      : observations;

    if (validObs.length === 0) return;

    setTrackHistory((prev) => {
      let changed = false;
      const next = { ...prev };
      validObs.forEach((obs) => {
        if (!next[obs.object_id]) {
          next[obs.object_id] = [];
          changed = true;
        }

        const history = next[obs.object_id];
        if (history.length === 0 || history[history.length - 1].tick_time !== obs.tick_time) {
          history.push({ x: obs.x, y: obs.y, altitude: obs.altitude, tick_time: obs.tick_time });
          changed = true;
        }

        if (history.length > 15) {
          history.shift();
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [observations, simulationState?.simulation_id, simulationState?.is_running, simulationState?.is_paused]);

  // Local Mode state polling
  const fetchLocalState = async () => {
    try {
      const res = await api.get("/api/simulation/state");
      setLocalSimulationState((prev) => {
        if (prev && JSON.stringify(prev) === JSON.stringify(res.data)) return prev;
        return res.data;
      });
      if (res.data.speed_multiplier) {
        setSpeedMultiplierState((prev) => (prev === res.data.speed_multiplier ? prev : res.data.speed_multiplier));
      }
      if (res.data.anomaly_detection_enabled !== undefined) {
        setAnomalyEnabled((prev) => (prev === res.data.anomaly_detection_enabled ? prev : res.data.anomaly_detection_enabled));
      }
    } catch {
      setLocalSimulationState(null);
    }
  };

  const fetchLocalEnvironment = async () => {
    try {
      const res = await api.get("/api/simulation/environment");
      setLocalEnvironment((prev) => {
        if (prev && JSON.stringify(prev) === JSON.stringify(res.data)) return prev;
        return res.data;
      });
    } catch {}
  };

  const fetchLocalTracks = async () => {
    try {
      const res = await api.get("/api/simulation/tracks");
      setLocalTracks((prev) => {
        if (prev && JSON.stringify(prev) === JSON.stringify(res.data)) return prev;
        return res.data;
      });
    } catch {}
  };

  useEffect(() => {
    if (simulationMode !== "local") return;

    fetchLocalState();
    fetchLocalTracks();
    fetchLocalEnvironment();

    const interval = setInterval(() => {
      fetchLocalState();
      fetchLocalTracks();
      fetchLocalEnvironment();
    }, 2000);

    return () => clearInterval(interval);
  }, [simulationMode]);

  const clearState = () => {
    if (simulationMode === "local") {
      localSocket.clear();
      setLocalTracks([]);
    } else {
      setCloudObservations([]);
      setCloudTracks([]);
      setCloudNewAlerts([]);
    }
    setTrackHistory({});
    setSelectedTrackId(null);
    knownTrackIdsRef.current.clear();
    setAcknowledgedThreatIds([]);
    setIsAlarmPlaying(false);
    soundManager.stopEmergencySiren();
    soundManager.stopAlertLoop();
    soundManager.stopProximity();
  };

  // --- ACTION METHODS ---
  const startSimulation = async (scenario: string, enableAnomaly?: boolean) => {
    try {
      setIsTransitioning(true);
      clearState();
      const anomalyFlag = enableAnomaly !== undefined ? enableAnomaly : anomalyEnabled;

      if (simulationMode === "cloud") {
        sessionEpochRef.current += 1;
        const worker = getOrCreateWorker();
        const config = getScenarioConfig(scenario);

        setCloudSimulationState({
          is_running: true,
          is_paused: false,
          simulation_id: config.simulation_id || `sim-seed-${config.seed}`,
          network_status: "online",
          scenario: config.scenario_id,
          tick_rate: 0.25,
          tick_count: 0,
          speed_multiplier: speedMultiplier,
        });

        setCloudEnvironment({
          sensors: config.sensors as any,
          zones: config.zones as any,
          events: [],
        });

        worker.postMessage({
          type: "START",
          scenario: config.scenario_id,
          speed: speedMultiplier,
          anomalyEnabled: anomalyFlag,
        });

        // Audit log in Supabase
        recordCloudAudit({
          actor: "Operator",
          action: "SIMULATION_START",
          resource: `scenario:${scenario}`,
          details: { scenario, speed: speedMultiplier, anomaly: anomalyFlag },
          outcome: "SUCCESS",
        }).catch(() => {});
      } else {
        await api.post("/api/simulation/start", {
          scenario,
          speed_multiplier: speedMultiplier,
          anomaly_detection_enabled: anomalyFlag,
        });
        await fetchLocalState();
      }

      setTimeout(() => {
        setIsTransitioning(false);
      }, 350);
    } catch (err) {
      console.error("Failed to start simulation", err);
      setIsTransitioning(false);
    }
  };

  const pauseSimulation = async () => {
    try {
      if (simulationMode === "cloud") {
        if (workerRef.current) {
          workerRef.current.postMessage({ type: "PAUSE" });
        }
        setCloudSimulationState((prev) => (prev ? { ...prev, is_paused: true } : null));

        recordCloudAudit({
          actor: "Operator",
          action: "SIMULATION_PAUSE",
          resource: "simulation",
          details: { state: "paused" },
          outcome: "SUCCESS",
        }).catch(() => {});
      } else {
        await api.post("/api/simulation/pause");
        await fetchLocalState();
      }
    } catch (err) {
      console.error("Failed to pause simulation", err);
    }
  };

  const resumeSimulation = async () => {
    try {
      if (simulationMode === "cloud") {
        if (workerRef.current) {
          workerRef.current.postMessage({ type: "RESUME" });
        }
        setCloudSimulationState((prev) => (prev ? { ...prev, is_paused: false } : null));

        recordCloudAudit({
          actor: "Operator",
          action: "SIMULATION_RESUME",
          resource: "simulation",
          details: { state: "resumed" },
          outcome: "SUCCESS",
        }).catch(() => {});
      } else {
        await api.post("/api/simulation/resume");
        await fetchLocalState();
      }
    } catch (err) {
      console.error("Failed to resume simulation", err);
    }
  };

  const resetSimulation = async () => {
    try {
      if (simulationMode === "cloud") {
        sessionEpochRef.current += 1; // Invalidate all prior worker messages
        if (workerRef.current) {
          workerRef.current.postMessage({ type: "RESET", scenario: "PROTOCOL-NORMAL" });
        }
        clearState();
        const initialConfig = getScenarioConfig("PROTOCOL-NORMAL");
        setCloudSimulationState({
          is_running: false,
          is_paused: false,
          simulation_id: initialConfig.simulation_id || `sim-seed-${initialConfig.seed}`,
          network_status: "online",
          scenario: initialConfig.scenario_id,
          tick_rate: 0.25,
          tick_count: 0,
          speed_multiplier: 1,
        });

        recordCloudAudit({
          actor: "Operator",
          action: "SIMULATION_RESET",
          resource: "simulation",
          details: { state: "reset" },
          outcome: "SUCCESS",
        }).catch(() => {});
      } else {
        await api.post("/api/simulation/stop");
        clearState();
        await fetchLocalState();
      }
    } catch (err) {
      console.error("Failed to reset simulation", err);
    }
  };

  const handleSetSpeedMultiplier = async (speed: number) => {
    setSpeedMultiplierState(speed);
    try {
      if (simulationMode === "cloud") {
        if (workerRef.current) {
          workerRef.current.postMessage({ type: "SET_SPEED", speed });
        }
        setCloudSimulationState((prev) => (prev ? { ...prev, speed_multiplier: speed } : null));
      } else {
        await api.post("/api/simulation/speed", { speed_multiplier: speed });
        await fetchLocalState();
      }
    } catch (err) {
      console.error("Failed to set speed", err);
    }
  };

  return (
    <SimulationContext.Provider
      value={{
        simulationState,
        tracks,
        observations,
        trackHistory,
        selectedTrackId,
        setSelectedTrackId,
        speedMultiplier,
        setSpeedMultiplier: handleSetSpeedMultiplier,
        newAlerts,
        isConnected,
        environment,
        isTransitioning,
        isSoundEnabled,
        toggleSound,
        anomalyEnabled,
        toggleAnomaly,
        acknowledgedThreatIds,
        isAlarmPlaying,
        acknowledgeThreat,
        acknowledgeAllThreats,
        simulationMode,
        setSimulationMode,
        cloudTransportState,
        startSimulation,
        pauseSimulation,
        resumeSimulation,
        resetSimulation,
        clearState,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulationContext() {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error("useSimulationContext must be used within a SimulationProvider");
  }
  return context;
}
