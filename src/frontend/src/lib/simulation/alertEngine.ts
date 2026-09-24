/**
 * Canonical 9-Factor Alert Engine for IBVAP-SIM (Phase V6D)
 *
 * Exact port of src/backend/alert_engine.py.
 * Preserves ADR-005 formula, P1-P4 bands, and 60-second deduplication rules.
 */

import type { Observation, GeneratedAlert } from "./types";
import { generateRandomUuid } from "./prng";

export const COOLDOWN_SECONDS = 60.0;

export interface CooldownEntry {
  time: number;
  band: "P1" | "P2" | "P3" | "P4";
  sensors: Set<string>;
}

export class AlertEngine {
  private cooldownStore: Map<string, CooldownEntry> = new Map();

  clearCooldowns(): void {
    this.cooldownStore.clear();
  }

  static getBandSeverity(band: "P1" | "P2" | "P3" | "P4"): number {
    switch (band) {
      case "P1":
        return 4;
      case "P2":
        return 3;
      case "P3":
        return 2;
      case "P4":
        return 1;
      default:
        return 0;
    }
  }

  static calculatePriority(params: {
    zone_risk?: number;
    object_risk?: number;
    proximity_score?: number;
    persistence_score?: number;
    corroboration_score?: number;
    confidence_score?: number;
    response_urgency?: number;
    quality_penalty?: number;
    duplicate_penalty?: number;
  }): { score: number; band: "P1" | "P2" | "P3" | "P4" } {
    const zone_risk = params.zone_risk ?? 50.0;
    const object_risk = params.object_risk ?? 50.0;
    const proximity_score = params.proximity_score ?? 50.0;
    const persistence_score = params.persistence_score ?? 50.0;
    const corroboration_score = params.corroboration_score ?? 50.0;
    const confidence_score = params.confidence_score ?? 50.0;
    const response_urgency = params.response_urgency ?? 50.0;
    const quality_penalty = params.quality_penalty ?? 0.0;
    const duplicate_penalty = params.duplicate_penalty ?? 0.0;

    const raw_score =
      0.25 * zone_risk +
      0.20 * object_risk +
      0.15 * proximity_score +
      0.15 * persistence_score +
      0.10 * corroboration_score +
      0.10 * confidence_score +
      0.05 * response_urgency -
      quality_penalty -
      duplicate_penalty;

    const score = Math.max(0.0, Math.min(100.0, Math.round(raw_score * 10) / 10));

    let band: "P1" | "P2" | "P3" | "P4";
    if (score >= 80.0) {
      band = "P1";
    } else if (score >= 60.0) {
      band = "P2";
    } else if (score >= 35.0) {
      band = "P3";
    } else {
      band = "P4";
    }

    return { score, band };
  }

  shouldSuppressAlert(
    objectId: string,
    reasonCode: string,
    currentSimTime: number,
    currentBand: "P1" | "P2" | "P3" | "P4",
    sensorId: string
  ): boolean {
    const key = `${objectId}_${reasonCode}`;
    const lastState = this.cooldownStore.get(key);

    if (lastState) {
      const timeElapsed = currentSimTime - lastState.time;

      // Bypass if higher severity
      if (AlertEngine.getBandSeverity(currentBand) > AlertEngine.getBandSeverity(lastState.band)) {
        const nextSensors = new Set(lastState.sensors);
        if (sensorId) nextSensors.add(sensorId);
        this.cooldownStore.set(key, {
          time: currentSimTime,
          band: currentBand,
          sensors: nextSensors,
        });
        return false;
      }

      // Bypass if new sensor corroborates
      if (sensorId && !lastState.sensors.has(sensorId)) {
        const nextSensors = new Set(lastState.sensors);
        nextSensors.add(sensorId);
        this.cooldownStore.set(key, {
          time: currentSimTime,
          band: currentBand,
          sensors: nextSensors,
        });
        return false;
      }

      // Standard 60s cooldown check
      if (timeElapsed < COOLDOWN_SECONDS) {
        return true;
      }
    }

    this.cooldownStore.set(key, {
      time: currentSimTime,
      band: currentBand,
      sensors: new Set(sensorId ? [sensorId] : []),
    });
    return false;
  }

  processObservation(
    obs: Observation,
    prevObs?: { x: number; y: number }
  ): GeneratedAlert | null {
    const x = obs.x;
    const y = obs.y;
    const prevX = prevObs ? prevObs.x : x;
    const objType = obs.object_type;
    const simTime = obs.timestamp ?? obs.tick_time;

    let alertType = "";
    let reasonCode = "";
    let baseZoneRisk = 50.0;

    // 1. Evaluate Spatial/Temporal Rules
    if (y > 0 && y < 50 && x > -50 && x < 50) {
      // Restricted zone entry
      baseZoneRisk = ["person", "vehicle", "truck"].includes(objType) ? 85.0 : 40.0;
      alertType = "Restricted Zone Entry";
      reasonCode = "ZONE_ENTRY";
    } else if (prevX < 150 && x >= 150) {
      // Sovereign Intercept Corridor Penetration
      alertType = "Sovereign Intercept Corridor Penetration";
      reasonCode = "INTERCEPT_ZONE";
      baseZoneRisk = 95.0;
    } else if (prevX < 0 && x >= 0) {
      // Virtual Fence Crossing (Border Breach)
      alertType = "Virtual Fence Crossing (Border Breach)";
      reasonCode = "FENCE_CROSS";
      baseZoneRisk = 75.0;
    } else if (prevX < -150 && x >= -150) {
      // Warning Tripwire
      alertType = "Border Warning Tripwire Triggered";
      reasonCode = "TRIPWIRE_CROSS";
      baseZoneRisk = 50.0;
    } else if (["unknown", "unknown aerial object", "bird-like mechanical object"].includes(objType)) {
      alertType = "Anomalous Object Detected";
      reasonCode = "ANOMALY";
      baseZoneRisk = 70.0;
    } else if (objType === "bird") {
      alertType = "Biological Track";
      reasonCode = "BIOLOGICAL";
      baseZoneRisk = 15.0;
    }

    if (!alertType) {
      return null;
    }

    // 2. Canonical 9-Factor Priority Score Calculation
    const zone_risk = baseZoneRisk;

    const objectRiskMap: Record<string, number> = {
      drone: 90.0,
      "unknown aerial object": 90.0,
      "bird-like mechanical object": 90.0,
      truck: 75.0,
      vehicle: 75.0,
      person: 60.0,
      unknown: 70.0,
      bird: 20.0,
    };
    const object_risk = objectRiskMap[objType] ?? 50.0;

    let proximity_score = 100.0;
    if (x < 0) {
      proximity_score = 100.0 * Math.max(0.0, 1.0 - Math.abs(x) / 500.0);
    }

    const persistence = 5.0; // standard persistence baseline
    const persistence_score = Math.min(100.0, persistence * 10.0);

    const corroboration = obs.sensor_type === "fused" ? 2 : 1;
    let corroboration_score = 60.0;
    if (corroboration >= 2) {
      corroboration_score = 100.0;
    } else if (corroboration === 1) {
      corroboration_score = 60.0;
    } else {
      corroboration_score = 20.0;
    }

    const rawConf = obs.confidence ?? 0.8;
    const confidence_score = rawConf <= 1.0 ? rawConf * 100.0 : rawConf;

    const speed = obs.speed ?? 0.0;
    let response_urgency = 40.0;
    if (speed > 20.0 || ["drone", "unknown aerial object"].includes(objType)) {
      response_urgency = 90.0;
    } else if (speed > 10.0 || ["vehicle", "truck"].includes(objType)) {
      response_urgency = 70.0;
    }

    const quality = obs.quality_score ?? 1.0;
    const quality_penalty = quality <= 1.0 ? Math.max(0.0, (1.0 - quality) * 20.0) : 0.0;
    const duplicate_penalty = 0.0;

    const { score, band } = AlertEngine.calculatePriority({
      zone_risk,
      object_risk,
      proximity_score,
      persistence_score,
      corroboration_score,
      confidence_score,
      response_urgency,
      quality_penalty,
      duplicate_penalty,
    });

    const sensorId = obs.sensor_id || "unknown_sensor";

    // 3. Deduplication check (60-second cooldown window)
    if (this.shouldSuppressAlert(obs.object_id, reasonCode, simTime, band, sensorId)) {
      return null;
    }

    return {
      id: generateRandomUuid(),
      object_id: obs.object_id,
      object_type: objType,
      alert_type: alertType,
      reason_code: reasonCode,
      priority_score: score,
      priority_band: band,
      confidence: rawConf,
      quality,
      persistence_time: persistence,
      corroboration_count: corroboration,
      simulated_time: simTime,
      is_synthetic: true,
      simulation_id: obs.simulation_id || "",
      scenario_id: obs.scenario_id || "",
      sensor_id: sensorId,
      site_id: obs.site_id || "site_alpha",
      status: "new",
      created_at: new Date().toISOString(),
    };
  }
}
