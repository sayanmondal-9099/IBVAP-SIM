import { useEffect, useState, useRef } from "react";
import { WS_BASE_URL } from "@/lib/config";

export type Observation = {
  simulation_id?: string;
  scenario_id?: string;
  timestamp?: number;
  tick_time: number;
  object_id: string;
  object_type: string;
  x: number;
  y: number;
  altitude: number;
  speed: number;
  heading: number;
  confidence: number;
  quality_score?: number;
  sensor_id?: string;
  site_id?: string;
  distance?: number;
  uncertainty?: number;
  sensor_type: string;
  is_synthetic?: boolean;
};

export type TelemetryMessage = {
  type: string;
  observations?: Observation[];
  new_alerts?: string[];
};

export function useSimulationSocket() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [newAlerts, setNewAlerts] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    let isMounted = true;
    // Connect to backend WebSocket
    const socket = new WebSocket(`${WS_BASE_URL}/api/simulation/telemetry`);
    ws.current = socket;

    socket.onopen = () => {
      if (!isMounted) {
        socket.close();
        return;
      }
      setIsConnected(true);
      console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
      if (!isMounted) return;
      try {
        const data: TelemetryMessage = JSON.parse(event.data);
        if (data.type === "telemetry") {
          if (data.observations) setObservations(data.observations);
          if (data.new_alerts && data.new_alerts.length > 0) {
            setNewAlerts(prev => {
              const incoming = data.new_alerts || [];
              const set = new Set([...prev, ...incoming]);
              return Array.from(set);
            });
          }
        }
      } catch (err) {
        console.error("Failed to parse websocket message", err);
      }
    };

    socket.onclose = () => {
      if (isMounted) {
        setIsConnected(false);
      }
      console.log("WebSocket disconnected");
    };

    return () => {
      isMounted = false;
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
      if (ws.current === socket) {
        ws.current = null;
      }
    };
  }, []);

  const clear = () => {
    setObservations([]);
    setNewAlerts([]);
  };

  return { observations, newAlerts, isConnected, clear };
}

