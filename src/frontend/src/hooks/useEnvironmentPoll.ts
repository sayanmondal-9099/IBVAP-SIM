import { useState, useEffect } from "react";
import axios from "axios";

export type Sensor = {
  id: string;
  sensor_type: string;
  status: string;
  x: number;
  y: number;
  range: number;
  fov: number;
  orientation: number;
};

export type Zone = {
  id: string;
  name: string;
  zone_type: string;
  points: [number, number][];
  radius?: number;
  center?: [number, number];
};

export type SimulationEvent = {
  id: string;
  simulation_id: string;
  timestamp: number;
  tick_time: number;
  event_type: string;
  description: string;
  related_track_id?: string;
  related_zone_id?: string;
  related_sensor_id?: string;
};

export function useEnvironmentPoll(intervalMs = 1000) {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [events, setEvents] = useState<SimulationEvent[]>([]);

  useEffect(() => {
    let active = true;
    
    const fetchData = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/simulation/environment");
        if (active) {
          setSensors(res.data.sensors || []);
          setZones(res.data.zones || []);
          setEvents(res.data.events || []);
        }
      } catch (err) {
        console.error("Failed to fetch environment", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, intervalMs);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [intervalMs]);

  return { sensors, zones, events };
}
