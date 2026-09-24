/**
 * Canonical Simulation Engine Types (IBVAP-SIM / KAAL)
 *
 * SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION.
 * Ported deterministically from src/simulation/models.py and src/simulation/scenarios.py.
 */

export type ObjectType =
  | "person"
  | "vehicle"
  | "truck"
  | "drone"
  | "helicopter"
  | "aircraft"
  | "bird"
  | "bird-like mechanical object"
  | "unknown aerial object";

export type EventType =
  | "network_failure"
  | "network_recovery"
  | "camera_degradation"
  | "radar_disagreement"
  | "radar_loss"
  | "camera_outage"
  | "storage_pressure"
  | "clock_drift"
  | "edge_restart"
  | "sensor_unavailable"
  | "sensor_recovery"
  | "zone_entry"
  | "zone_exit"
  | "correlation_lost"
  | "correlation_established"
  | "track_created";

export interface Waypoint {
  x: number;
  y: number;
  speed?: number;
}

export interface SyntheticZone {
  id: string;
  name: string;
  zone_type: "restricted" | "warning" | "virtual_fence";
  points?: [number, number][];
  radius?: number;
  center?: [number, number];
}

export interface SensorConfig {
  id: string;
  sensor_type: "camera" | "radar";
  x: number;
  y: number;
  range: number;
  fov: number;
  orientation: number;
  status: "online" | "degraded" | "offline";
}

export interface SimulationEvent {
  id: string;
  simulation_id: string;
  timestamp: number;
  tick_time: number;
  event_type: EventType;
  description: string;
  related_track_id?: string;
  related_zone_id?: string;
  related_sensor_id?: string;
}

export interface SyntheticObject {
  id: string;
  object_type: ObjectType;
  initial_x: number;
  initial_y: number;
  initial_altitude?: number;
  speed: number;
  heading?: number;
  waypoints?: Waypoint[];
  loop_waypoints?: boolean;
  behavior: "linear" | "waypoint" | "loiter";
}

export interface ScriptedEvent {
  timestamp: number;
  event_type: EventType;
  parameters?: Record<string, any>;
}

export interface ScenarioConfig {
  scenario_id: string;
  simulation_id?: string;
  name: string;
  seed: number;
  duration: number;
  tick_rate: number;
  objects: SyntheticObject[];
  zones: SyntheticZone[];
  sensors: SensorConfig[];
  scripted_events?: ScriptedEvent[];
}

export interface Observation {
  simulation_id: string;
  scenario_id: string;
  timestamp: number;
  tick_time: number;
  object_id: string;
  object_type: ObjectType;
  x: number;
  y: number;
  altitude: number;
  speed: number;
  heading: number;
  confidence: number;
  quality_score: number;
  sensor_id: string;
  site_id: string;
  distance: number;
  uncertainty: number;
  sensor_type: "camera" | "radar" | "fused";
  is_synthetic: boolean;
}

export interface SimulationState {
  simulation_id: string;
  scenario_id: string;
  is_running: boolean;
  is_paused: boolean;
  current_tick: number;
  network_status: "online" | "offline";
  active_events: string[];
  zones: SyntheticZone[];
  sensors: SensorConfig[];
  simulation_events: SimulationEvent[];
}

export interface GeneratedAlert {
  id: string;
  object_id: string;
  object_type: string;
  alert_type: string;
  reason_code: string;
  priority_score: number;
  priority_band: "P1" | "P2" | "P3" | "P4";
  confidence: number;
  quality: number;
  persistence_time: number;
  corroboration_count: number;
  simulated_time: number;
  is_synthetic: boolean;
  simulation_id: string;
  scenario_id: string;
  sensor_id: string;
  site_id: string;
  status: "new" | "unacknowledged" | "acknowledged" | "escalated";
  created_at: string;
}

export interface TelemetryBroadcastPayload {
  simulation_id: string;
  protocol: string;
  simulation_timestamp: number;
  tick: number;
  tracks: {
    id: string;
    object_type: string;
    x: number;
    y: number;
    altitude: number;
    speed: number;
    heading: number;
  }[];
  observations: Observation[];
  sensors: SensorConfig[];
  environment: {
    zones: SyntheticZone[];
    events: SimulationEvent[];
  };
  new_alerts: string[];
  owner_id: string;
}
