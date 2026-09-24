/**
 * Kinematic, Geometry, and Sensor Math for IBVAP-SIM
 *
 * Exact port of src/simulation/generators.py and src/simulation/engine.py.
 */

import type { SensorConfig } from "./types";
import { SeededRNG } from "./prng";

export function moveObject(
  x: number,
  y: number,
  speed: number,
  headingDegrees: number,
  deltaTime: number
): [number, number] {
  const headingRadians = (headingDegrees * Math.PI) / 180;
  const dx = speed * Math.sin(headingRadians) * deltaTime;
  const dy = speed * Math.cos(headingRadians) * deltaTime;
  return [x + dx, y + dy];
}

export function navigateToWaypoint(
  x: number,
  y: number,
  speed: number,
  targetX: number,
  targetY: number,
  deltaTime: number
): [number, number, number, boolean] {
  const dx = targetX - x;
  const dy = targetY - y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  let headingRadians = Math.atan2(dx, dy);
  let headingDegrees = (headingRadians * 180) / Math.PI;
  if (headingDegrees < 0) {
    headingDegrees += 360;
  }

  const stepDistance = speed * deltaTime;

  if (distance <= stepDistance) {
    return [targetX, targetY, headingDegrees, true];
  }

  const newX = x + (dx / distance) * stepDistance;
  const newY = y + (dy / distance) * stepDistance;

  return [newX, newY, headingDegrees, false];
}

export function calculateDegradedConfidence(
  baseConfidence: number,
  isDegraded: boolean,
  rng: SeededRNG
): number {
  if (!isDegraded) {
    return baseConfidence;
  }
  const noise = rng.uniform(0.2, 0.6);
  const newConfidence = Math.max(0.1, baseConfidence - noise);
  return Math.round(newConfidence * 100) / 100;
}

export function generatePositionNoise(
  x: number,
  y: number,
  isDegraded: boolean,
  rng: SeededRNG
): [number, number] {
  if (!isDegraded) {
    return [x, y];
  }
  const noiseX = rng.uniform(-10.0, 10.0);
  const noiseY = rng.uniform(-10.0, 10.0);
  return [x + noiseX, y + noiseY];
}

export function pointInPolygon(x: number, y: number, polygon: [number, number][]): boolean {
  const n = polygon.length;
  let inside = false;
  let [p1x, p1y] = polygon[0];

  for (let i = 1; i <= n; i++) {
    const [p2x, p2y] = polygon[i % n];
    if (Math.min(p1y, p2y) < y && y <= Math.max(p1y, p2y) && x <= Math.max(p1x, p2x)) {
      let xinters = x;
      if (p1y !== p2y) {
        xinters = ((y - p1y) * (p2x - p1x)) / (p2y - p1y) + p1x;
      }
      if (p1x === p2x || x <= xinters) {
        inside = !inside;
      }
    }
    p1x = p2x;
    p1y = p2y;
  }

  return inside;
}

export function isInSensorCoverage(objX: number, objY: number, sensor: SensorConfig): boolean {
  if (sensor.status === "offline") {
    return false;
  }
  const dx = objX - sensor.x;
  const dy = objY - sensor.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > sensor.range) {
    return false;
  }

  if (sensor.sensor_type === "camera" && sensor.fov < 360) {
    let angleToObj = (Math.atan2(dx, dy) * 180) / Math.PI;
    if (angleToObj < 0) {
      angleToObj += 360;
    }
    let diff = Math.abs(angleToObj - sensor.orientation);
    if (diff > 180) {
      diff = 360 - diff;
    }
    if (diff > sensor.fov / 2) {
      return false;
    }
  }

  return true;
}
