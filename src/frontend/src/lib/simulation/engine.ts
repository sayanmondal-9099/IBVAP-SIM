/**
 * Core Deterministic Simulation Engine (IBVAP-SIM / KAAL — Phase V6D)
 *
 * SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION.
 * Ported from src/simulation/engine.py.
 */

import type {
  ScenarioConfig,
  SimulationState,
  Observation,
  SimulationEvent,
  SensorConfig,
  GeneratedAlert,
  ObjectType,
} from "./types";
import { SeededRNG, generateDeterministicUuid, generateRandomUuid } from "./prng";
import {
  moveObject,
  navigateToWaypoint,
  calculateDegradedConfidence,
  generatePositionNoise,
  pointInPolygon,
  isInSensorCoverage,
} from "./math";
import { AlertEngine } from "./alertEngine";

export interface EngineTickOutput {
  observations: Observation[];
  tracks: {
    id: string;
    object_type: string;
    x: number;
    y: number;
    altitude: number;
    speed: number;
    heading: number;
  }[];
  sensors: SensorConfig[];
  events: SimulationEvent[];
  generatedAlerts: GeneratedAlert[];
  state: SimulationState;
}

export class SimulationEngine {
  public config: ScenarioConfig;
  public simulationId: string;
  public rng: SeededRNG;
  public state: SimulationState;
  public alertEngine: AlertEngine;
  public speedMultiplier: number = 1.0;
  public anomalyDetectionEnabled: boolean = true;

  private objectsState: Map<
    string,
    {
      x: number;
      y: number;
      altitude: number;
      speed: number;
      heading: number;
      type: ObjectType;
      waypoints: { x: number; y: number; speed?: number }[];
      currentWaypointIdx: number;
      behavior: "linear" | "waypoint" | "loiter";
      loopWaypoints: boolean;
      activeZones: Set<string>;
    }
  > = new Map();

  private prevPositions: Map<string, { x: number; y: number }> = new Map();

  private activeDegradationEnd: number | null = null;
  private activeOutageEnd: number | null = null;
  private clockDriftOffset: number = 0.0;
  private storagePressure: boolean = false;

  constructor(config: ScenarioConfig) {
    this.config = config;
    this.simulationId = config.simulation_id || generateDeterministicUuid(config.seed);
    this.rng = new SeededRNG(config.seed);
    this.alertEngine = new AlertEngine();

    this.state = {
      simulation_id: this.simulationId,
      scenario_id: config.scenario_id,
      is_running: false,
      is_paused: false,
      current_tick: 0.0,
      network_status: "online",
      active_events: [],
      zones: JSON.parse(JSON.stringify(config.zones)),
      sensors: JSON.parse(JSON.stringify(config.sensors)),
      simulation_events: [],
    };

    this.initObjects();
  }

  private initObjects(): void {
    this.objectsState.clear();
    this.prevPositions.clear();
    for (const obj of this.config.objects) {
      this.objectsState.set(obj.id, {
        x: obj.initial_x,
        y: obj.initial_y,
        altitude: obj.initial_altitude ?? 0.0,
        speed: obj.speed,
        heading: obj.heading ?? 0.0,
        type: obj.object_type,
        waypoints: obj.waypoints ? [...obj.waypoints] : [],
        currentWaypointIdx: 0,
        behavior: obj.behavior,
        loopWaypoints: !!obj.loop_waypoints,
        activeZones: new Set<string>(),
      });
      this.prevPositions.set(obj.id, { x: obj.initial_x, y: obj.initial_y });
    }
  }

  public start(): void {
    this.state.is_running = true;
    this.state.is_paused = false;
  }

  public pause(): void {
    if (this.state.is_running) {
      this.state.is_paused = true;
    }
  }

  public resume(): void {
    if (this.state.is_running) {
      this.state.is_paused = false;
    }
  }

  public stop(): void {
    this.state.is_running = false;
    this.state.is_paused = false;
    this.activeDegradationEnd = null;
    this.activeOutageEnd = null;
    for (const s of this.state.sensors) {
      s.status = "online";
    }
  }

  public reset(newConfig?: ScenarioConfig): void {
    if (newConfig) {
      this.config = newConfig;
      this.simulationId = newConfig.simulation_id || generateDeterministicUuid(newConfig.seed);
      this.rng = new SeededRNG(newConfig.seed);
    } else {
      this.rng = new SeededRNG(this.config.seed);
    }

    this.state = {
      simulation_id: this.simulationId,
      scenario_id: this.config.scenario_id,
      is_running: false,
      is_paused: false,
      current_tick: 0.0,
      network_status: "online",
      active_events: [],
      zones: JSON.parse(JSON.stringify(this.config.zones)),
      sensors: JSON.parse(JSON.stringify(this.config.sensors)),
      simulation_events: [],
    };

    this.alertEngine.clearCooldowns();
    this.activeDegradationEnd = null;
    this.activeOutageEnd = null;
    this.clockDriftOffset = 0.0;
    this.storagePressure = false;
    this.initObjects();
  }

  public tick(deltaTime?: number): EngineTickOutput | null {
    if (!this.state.is_running || this.state.is_paused) {
      return null;
    }

    const dt =
      deltaTime !== undefined
        ? deltaTime
        : this.config.tick_rate * this.speedMultiplier;

    if (this.state.current_tick >= this.config.duration) {
      this.stop();
      return null;
    }

    this.processEvents(dt);

    // Sensor recovery checks
    if (this.activeDegradationEnd !== null && this.state.current_tick >= this.activeDegradationEnd) {
      this.activeDegradationEnd = null;
      for (const s of this.state.sensors) {
        if (s.sensor_type === "camera" && s.status === "degraded") {
          s.status = "online";
        }
      }
      this.state.simulation_events.push({
        id: generateRandomUuid(),
        simulation_id: this.simulationId,
        timestamp: this.state.current_tick + this.clockDriftOffset,
        tick_time: this.state.current_tick,
        event_type: "sensor_recovery",
        description: "Camera sensors recovered to healthy state",
      });
    }

    if (this.activeOutageEnd !== null && this.state.current_tick >= this.activeOutageEnd) {
      this.activeOutageEnd = null;
      for (const s of this.state.sensors) {
        if (s.status === "offline") {
          s.status = "online";
        }
      }
      this.state.simulation_events.push({
        id: generateRandomUuid(),
        simulation_id: this.simulationId,
        timestamp: this.state.current_tick + this.clockDriftOffset,
        tick_time: this.state.current_tick,
        event_type: "sensor_recovery",
        description: "Sensors recovered to healthy state from outage",
      });
    }

    const observations: Observation[] = [];
    const generatedAlerts: GeneratedAlert[] = [];
    const tracks: {
      id: string;
      object_type: string;
      x: number;
      y: number;
      altitude: number;
      speed: number;
      heading: number;
    }[] = [];

    const isDegraded =
      (this.activeDegradationEnd !== null &&
        this.state.current_tick < this.activeDegradationEnd) ||
      this.storagePressure;

    const isOutage =
      this.activeOutageEnd !== null &&
      this.state.current_tick < this.activeOutageEnd;

    for (const [objId, objData] of this.objectsState.entries()) {
      const prevPos = this.prevPositions.get(objId) || { x: objData.x, y: objData.y };

      // Update Position
      if (objData.behavior === "waypoint" && objData.waypoints.length > 0) {
        const wpIdx = objData.currentWaypointIdx;
        if (wpIdx < objData.waypoints.length) {
          const wp = objData.waypoints[wpIdx];
          const speed = wp.speed !== undefined ? wp.speed : objData.speed;
          const [newX, newY, newHeading, reached] = navigateToWaypoint(
            objData.x,
            objData.y,
            speed,
            wp.x,
            wp.y,
            dt
          );
          objData.x = newX;
          objData.y = newY;
          objData.heading = newHeading;
          if (reached) {
            objData.currentWaypointIdx += 1;
            if (objData.currentWaypointIdx >= objData.waypoints.length && objData.loopWaypoints) {
              objData.currentWaypointIdx = 0;
            }
          }
        } else {
          const [newX, newY] = moveObject(objData.x, objData.y, objData.speed, objData.heading, dt);
          objData.x = newX;
          objData.y = newY;
        }
      } else if (objData.behavior === "loiter") {
        objData.heading += this.rng.uniform(-30, 30);
        const [newX, newY] = moveObject(objData.x, objData.y, objData.speed * 0.2, objData.heading, dt);
        objData.x = newX;
        objData.y = newY;
      } else {
        const [newX, newY] = moveObject(objData.x, objData.y, objData.speed, objData.heading, dt);
        objData.x = newX;
        objData.y = newY;
      }

      tracks.push({
        id: objId,
        object_type: objData.type,
        x: Math.round(objData.x * 10) / 10,
        y: Math.round(objData.y * 10) / 10,
        altitude: Math.round(objData.altitude * 10) / 10,
        speed: Math.round(objData.speed * 10) / 10,
        heading: Math.round(objData.heading * 10) / 10,
      });

      // Zone checks
      const currentZones = new Set<string>();
      for (const zone of this.state.zones) {
        if (zone.points && zone.points.length >= 3 && pointInPolygon(objData.x, objData.y, zone.points)) {
          currentZones.add(zone.id);
        } else if (zone.center && zone.radius) {
          const dist = Math.sqrt((objData.x - zone.center[0]) ** 2 + (objData.y - zone.center[1]) ** 2);
          if (dist <= zone.radius) {
            currentZones.add(zone.id);
          }
        }
      }

      for (const zId of currentZones) {
        if (!objData.activeZones.has(zId)) {
          this.state.simulation_events.push({
            id: generateRandomUuid(),
            simulation_id: this.simulationId,
            timestamp: this.state.current_tick + this.clockDriftOffset,
            tick_time: this.state.current_tick,
            event_type: "zone_entry",
            description: `${objData.type.toUpperCase()} ${objId} entered zone ${zId}`,
            related_track_id: objId,
            related_zone_id: zId,
          });
        }
      }

      for (const zId of objData.activeZones) {
        if (!currentZones.has(zId)) {
          this.state.simulation_events.push({
            id: generateRandomUuid(),
            simulation_id: this.simulationId,
            timestamp: this.state.current_tick + this.clockDriftOffset,
            tick_time: this.state.current_tick,
            event_type: "zone_exit",
            description: `${objData.type.toUpperCase()} ${objId} exited zone ${zId}`,
            related_track_id: objId,
            related_zone_id: zId,
          });
        }
      }

      objData.activeZones = currentZones;

      if (isOutage) {
        this.prevPositions.set(objId, { x: objData.x, y: objData.y });
        continue;
      }

      // Sensor coverage and observations
      let seenByCamera = false;
      let seenByRadar = false;
      let cameraConf = 0.0;

      for (const sensor of this.state.sensors) {
        if (isInSensorCoverage(objData.x, objData.y, sensor)) {
          if (sensor.sensor_type === "camera") {
            seenByCamera = true;
            const conf = calculateDegradedConfidence(
              0.9,
              isDegraded || sensor.status === "degraded",
              this.rng
            );
            cameraConf = Math.max(cameraConf, conf);
            const [obsX, obsY] = generatePositionNoise(
              objData.x,
              objData.y,
              isDegraded || sensor.status === "degraded",
              this.rng
            );
            observations.push({
              simulation_id: this.simulationId,
              scenario_id: this.config.scenario_id,
              timestamp: this.state.current_tick + this.clockDriftOffset,
              tick_time: this.state.current_tick,
              object_id: objId,
              object_type: objData.type,
              x: Math.round(obsX * 10) / 10,
              y: Math.round(obsY * 10) / 10,
              altitude: objData.altitude,
              speed: objData.speed,
              heading: objData.heading,
              confidence: conf,
              quality_score: isDegraded ? 0.5 : 1.0,
              distance: Math.round(Math.sqrt(obsX * obsX + obsY * obsY) * 10) / 10,
              uncertainty: isDegraded ? 10.0 : 2.0,
              sensor_id: sensor.id,
              site_id: "site_alpha",
              sensor_type: "camera",
              is_synthetic: true,
            });
          } else if (sensor.sensor_type === "radar") {
            seenByRadar = true;
            const [obsX, obsY] = generatePositionNoise(objData.x, objData.y, false, this.rng);
            observations.push({
              simulation_id: this.simulationId,
              scenario_id: this.config.scenario_id,
              timestamp: this.state.current_tick + this.clockDriftOffset,
              tick_time: this.state.current_tick,
              object_id: objId,
              object_type: objData.type,
              x: Math.round(obsX * 10) / 10,
              y: Math.round(obsY * 10) / 10,
              altitude: objData.altitude,
              speed: objData.speed,
              heading: objData.heading,
              confidence: 0.8,
              quality_score: 1.0,
              distance: Math.round(Math.sqrt(obsX * obsX + obsY * obsY) * 10) / 10,
              uncertainty: 5.0,
              sensor_id: sensor.id,
              site_id: "site_alpha",
              sensor_type: "radar",
              is_synthetic: true,
            });
          }
        }
      }

      // Emit fused observation if observed
      if (seenByCamera || seenByRadar) {
        let finalConf = 1.0;
        if (seenByRadar && seenByCamera) {
          finalConf = (cameraConf + 0.8) / 2 + 0.1;
        } else if (seenByRadar) {
          finalConf = 0.7;
        } else if (seenByCamera) {
          finalConf = cameraConf;
        }
        finalConf = Math.min(1.0, Math.round(finalConf * 100) / 100);

        const fusedObs: Observation = {
          simulation_id: this.simulationId,
          scenario_id: this.config.scenario_id,
          timestamp: this.state.current_tick + this.clockDriftOffset,
          tick_time: this.state.current_tick,
          object_id: objId,
          object_type: objData.type,
          x: Math.round(objData.x * 10) / 10,
          y: Math.round(objData.y * 10) / 10,
          altitude: objData.altitude,
          speed: objData.speed,
          heading: objData.heading,
          confidence: finalConf,
          quality_score: isDegraded ? 0.5 : 1.0,
          distance: Math.round(Math.sqrt(objData.x * objData.x + objData.y * objData.y) * 10) / 10,
          uncertainty: seenByCamera && !isDegraded ? 2.0 : 10.0,
          sensor_id: "sim_fused_01",
          site_id: "site_alpha",
          sensor_type: "fused",
          is_synthetic: true,
        };
        observations.push(fusedObs);

        // Alert rule processing on fused observation
        const alert = this.alertEngine.processObservation(fusedObs, prevPos);
        if (alert) {
          // If anomaly detection is disabled and this alert is purely an anomaly, suppress it
          if (!this.anomalyDetectionEnabled && alert.reason_code === "ANOMALY") {
            // suppressed
          } else {
            generatedAlerts.push(alert);
          }
        }
      }

      this.prevPositions.set(objId, { x: objData.x, y: objData.y });
    }

    this.state.current_tick += dt;

    return {
      observations,
      tracks,
      sensors: this.state.sensors,
      events: this.state.simulation_events,
      generatedAlerts,
      state: this.state,
    };
  }

  private processEvents(dt: number): void {
    if (!this.config.scripted_events) return;
    for (const event of this.config.scripted_events) {
      if (this.state.current_tick <= event.timestamp && event.timestamp < this.state.current_tick + dt) {
        this.executeEvent(event);
        this.state.simulation_events.push({
          id: generateRandomUuid(),
          simulation_id: this.simulationId,
          timestamp: this.state.current_tick,
          tick_time: this.state.current_tick,
          event_type: event.event_type,
          description: `Scripted event: ${event.event_type.toUpperCase()}`,
        });
      }
    }
  }

  private executeEvent(event: { event_type: string; parameters?: Record<string, any> }): void {
    if (event.event_type === "network_failure") {
      this.state.network_status = "offline";
    } else if (event.event_type === "network_recovery") {
      this.state.network_status = "online";
    } else if (event.event_type === "camera_degradation") {
      const duration = event.parameters?.duration ?? 10.0;
      this.activeDegradationEnd = this.state.current_tick + duration;
      for (const s of this.state.sensors) {
        if (s.sensor_type === "camera") {
          s.status = "degraded";
        }
      }
    } else if (["camera_outage", "radar_loss", "sensor_unavailable"].includes(event.event_type)) {
      const duration = event.parameters?.duration ?? 10.0;
      this.activeOutageEnd = this.state.current_tick + duration;
      const targetType = event.event_type.split("_")[0];
      for (const s of this.state.sensors) {
        if (s.sensor_type === targetType) {
          s.status = "offline";
        }
      }
    } else if (event.event_type === "clock_drift") {
      this.clockDriftOffset = event.parameters?.offset ?? 5.0;
    } else if (event.event_type === "storage_pressure") {
      this.storagePressure = event.parameters?.active ?? true;
    }
  }
}
