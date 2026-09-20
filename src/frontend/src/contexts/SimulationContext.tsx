import { createContext, useContext, useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import { useSimulationSocket } from "../hooks/useSimulationSocket";
import type { Observation } from "../hooks/useSimulationSocket";
import type { Sensor, Zone, SimulationEvent } from "../hooks/useEnvironmentPoll";
import { soundManager } from "../hooks/useAudioAlarm";

export type SimulationState = {
  is_running: boolean;
  is_paused: boolean;
  simulation_id: string | null;
  network_status: string;
  scenario: string;
  tick_rate: number;
  tick_count: number;
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
  trackHistory: Record<string, { x: number, y: number, altitude: number, tick_time: number }[]>;
  selectedTrackId: string | null;
  setSelectedTrackId: (id: string | null) => void;
  speedMultiplier: number;
  newAlerts: string[];
  isConnected: boolean;
  environment: { sensors: Sensor[], zones: Zone[], events: SimulationEvent[] };
  
  isTransitioning: boolean;
  isSoundEnabled: boolean;
  toggleSound: () => void;
  anomalyEnabled: boolean;
  toggleAnomaly: () => void;
  acknowledgedThreatIds: string[];
  isAlarmPlaying: boolean;
  acknowledgeThreat: (objectId: string) => void;
  acknowledgeAllThreats: () => void;
  
  // Action methods
  startSimulation: (scenario: string, enableAnomaly?: boolean) => Promise<void>;
  pauseSimulation: () => Promise<void>;
  resumeSimulation: () => Promise<void>;
  resetSimulation: () => Promise<void>;
  setSpeedMultiplier: (speed: number) => Promise<void>;
  clearState: () => void;
}


const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const { observations, newAlerts, isConnected, clear } = useSimulationSocket();
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [environment, setEnvironment] = useState<{ sensors: Sensor[], zones: Zone[], events: SimulationEvent[] }>({ sensors: [], zones: [], events: [] });
  const [trackHistory, setTrackHistory] = useState<Record<string, { x: number, y: number, altitude: number, tick_time: number }[]>>({});
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [anomalyEnabled, setAnomalyEnabled] = useState<boolean>(false);
  const [acknowledgedThreatIds, setAcknowledgedThreatIds] = useState<string[]>([]);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState<boolean>(false);

  const toggleAnomaly = () => {
    setAnomalyEnabled((prev) => !prev);
  };

  const acknowledgeThreat = (objectId: string) => {
    setAcknowledgedThreatIds((prev) => (prev.includes(objectId) ? prev : [...prev, objectId]));
    // Asynchronously persist to backend alerts so route switches to /alerts or DB queries reflect the acknowledgment
    axios.get("http://127.0.0.1:8000/api/alerts")
      .then((res) => {
        if (Array.isArray(res.data)) {
          const matching = res.data.filter(
            (a: any) => a.object_id === objectId && (a.status === "new" || a.status === "unacknowledged")
          );
          return Promise.allSettled(
            matching.map((a: any) => axios.patch(`http://127.0.0.1:8000/api/alerts/${a.id}/acknowledge`))
          );
        }
      })
      .catch((err) => {
        console.warn("Could not sync threat acknowledgment to backend", err);
      });
  };

  const acknowledgeAllThreats = () => {
    const currentFused = observations.filter((o) => o.sensor_type === "fused").map((o) => o.object_id);
    setAcknowledgedThreatIds((prev) => Array.from(new Set([...prev, ...currentFused, ...newAlerts])));
    // Asynchronously persist bulk acknowledge to backend
    axios.post("http://127.0.0.1:8000/api/alerts/acknowledge-all")
      .catch(() => {
        // Fallback to fetch and patch
        axios.get("http://127.0.0.1:8000/api/alerts").then((res) => {
          if (Array.isArray(res.data)) {
            const active = res.data.filter((a: any) => a.status === "new" || a.status === "unacknowledged");
            Promise.allSettled(active.map((a: any) => axios.patch(`http://127.0.0.1:8000/api/alerts/${a.id}/acknowledge`)));
          }
        }).catch(() => {});
      });
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

  // Keep soundManager updated with master mute state
  useEffect(() => {
    soundManager.setMuted(!isSoundEnabled);
  }, [isSoundEnabled]);

  // Tone 1: Detection sound when any object/threat is first detected
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

    // Add current objects to known set
    currentFused.forEach((o) => knownTrackIdsRef.current.add(o.object_id));
  }, [observations, simulationState?.is_running, simulationState?.is_paused, isSoundEnabled]);

  // Tone 2 (Tactical Alert Loop) and Tone 3 (WWII Air-Raid Siren wail)
  // Continuous repeating audio while unacknowledged threats persist; stops when acknowledged or threats exit.
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

    // Threats at or past border line (x >= 0) that have not been acknowledged
    const unackBreachThreats = currentFused.filter(
      (o) => o.x >= 0 && !acknowledgedThreatIds.includes(o.object_id)
    );

    // Threats approaching border in warning tripwire zone (-150 <= x < 0) that have not been acknowledged
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
  }, [simulationState?.is_running, simulationState?.is_paused, simulationState?.scenario, observations, newAlerts, acknowledgedThreatIds]);


  // Maintain bounded track history, discarding stale telemetry
  useEffect(() => {
    if (!simulationState?.is_running || simulationState?.is_paused || !observations.length) return;
    
    // Discard telemetry that doesn't match our current active simulation if we have one
    const currentSimId = simulationState?.simulation_id;
    const validObs = currentSimId 
      ? observations.filter(o => o.simulation_id === currentSimId)
      : observations;
      
    if (validObs.length === 0) return;
    
    setTrackHistory(prev => {
      let changed = false;
      const next = { ...prev };
      // Only record fused or radar/camera tracks (prefer fused)
      validObs.forEach(obs => {
        if (!next[obs.object_id]) {
          next[obs.object_id] = [];
          changed = true;
        }
        
        // Don't add duplicate ticks
        const history = next[obs.object_id];
        if (history.length === 0 || history[history.length - 1].tick_time !== obs.tick_time) {
          history.push({ x: obs.x, y: obs.y, altitude: obs.altitude, tick_time: obs.tick_time });
          changed = true;
        }
        
        // Keep max 15 points for visual trail
        if (history.length > 15) {
          history.shift();
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [observations, simulationState?.simulation_id, simulationState?.is_running, simulationState?.is_paused]);

  const fetchState = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/simulation/state");
      setSimulationState(prev => {
        if (prev && JSON.stringify(prev) === JSON.stringify(res.data)) return prev;
        return res.data;
      });
      if (res.data.speed_multiplier) {
        setSpeedMultiplier(prev => prev === res.data.speed_multiplier ? prev : res.data.speed_multiplier);
      }
      if (res.data.anomaly_detection_enabled !== undefined) {
        setAnomalyEnabled(prev => prev === res.data.anomaly_detection_enabled ? prev : res.data.anomaly_detection_enabled);
      }
    } catch (err) {
      console.error("Failed to fetch simulation state", err);
      setSimulationState(null);
    }
  };

  const fetchEnvironment = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/simulation/environment");
      setEnvironment(prev => {
        if (prev && JSON.stringify(prev) === JSON.stringify(res.data)) return prev;
        return res.data;
      });
    } catch (err) {
      console.error("Failed to fetch environment", err);
    }
  };

  const fetchTracks = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/simulation/tracks");
      setTracks(prev => {
        if (prev && JSON.stringify(prev) === JSON.stringify(res.data)) return prev;
        return res.data;
      });
    } catch (err) {
      console.error("Failed to fetch simulation tracks", err);
    }
  };

  useEffect(() => {
    fetchState();
    fetchTracks();
    fetchEnvironment();
    
    // Poll state every 2 seconds to keep UI updated
    const interval = setInterval(() => {
      fetchState();
      fetchTracks();
      fetchEnvironment();
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const clearState = () => {
    clear(); // clears socket observations & alerts
    setTracks([]);
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
      await axios.post("http://127.0.0.1:8000/api/simulation/start", { 
        scenario, 
        speed_multiplier: speedMultiplier,
        anomaly_detection_enabled: anomalyFlag
      });
      await fetchState();
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
      await axios.post("http://127.0.0.1:8000/api/simulation/pause");
      await fetchState();
    } catch (err) {
      console.error("Failed to pause simulation", err);
    }
  };

  const resumeSimulation = async () => {
    try {
      await axios.post("http://127.0.0.1:8000/api/simulation/resume");
      await fetchState();
    } catch (err) {
      console.error("Failed to resume simulation", err);
    }
  };

  const resetSimulation = async () => {
    try {
      await axios.post("http://127.0.0.1:8000/api/simulation/stop");
      clearState();
      soundManager.stopEmergencySiren();
      soundManager.stopAlertLoop();
      soundManager.stopProximity();
      setIsAlarmPlaying(false);
      await fetchState();
    } catch (err) {
      console.error("Failed to reset simulation", err);
    }
  };

  const handleSetSpeedMultiplier = async (speed: number) => {
    setSpeedMultiplier(speed);
    try {
      await axios.post("http://127.0.0.1:8000/api/simulation/speed", { speed_multiplier: speed });
      await fetchState();
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
