/**
 * IBVAP-SIM Canonical Scenario Protocols (Phase V6D)
 *
 * Exact port of src/simulation/scenarios.py.
 * Preserves deterministic seeds:
 *   1001: NORMAL
 *   1002: DRONE
 *   1003: VEHICLE
 *   1004: MULTI-THREAT
 *   1005: EMERGENCY
 *   1006: SENSOR DEGRADED
 */

import type { ScenarioConfig, SyntheticZone, SensorConfig } from "./types";

export function getStandardZones(): SyntheticZone[] {
  return [
    {
      id: "zone_base",
      name: "Base Perimeter",
      zone_type: "restricted",
      points: [
        [-150, -150],
        [150, -150],
        [150, 150],
        [-150, 150],
      ],
    },
    {
      id: "fence_border",
      name: "Virtual Border Fence",
      zone_type: "virtual_fence",
      points: [
        [0, -500],
        [0, 500],
      ],
    },
    {
      id: "zone_intercept",
      name: "Sovereign Intercept Corridor",
      zone_type: "restricted",
      points: [
        [200, -350],
        [360, -350],
        [360, 350],
        [200, 350],
      ],
    },
  ];
}

export function getStandardSensors(): SensorConfig[] {
  return [
    {
      id: "cam_01",
      sensor_type: "camera",
      x: 0,
      y: 400,
      range: 250,
      fov: 160,
      orientation: 270,
      status: "online",
    },
    {
      id: "cam_02",
      sensor_type: "camera",
      x: 0,
      y: 200,
      range: 250,
      fov: 160,
      orientation: 270,
      status: "online",
    },
    {
      id: "cam_03",
      sensor_type: "camera",
      x: 0,
      y: 0,
      range: 250,
      fov: 160,
      orientation: 270,
      status: "online",
    },
    {
      id: "cam_04",
      sensor_type: "camera",
      x: 0,
      y: -200,
      range: 250,
      fov: 160,
      orientation: 270,
      status: "online",
    },
    {
      id: "cam_05",
      sensor_type: "camera",
      x: 0,
      y: -400,
      range: 250,
      fov: 160,
      orientation: 270,
      status: "online",
    },
    {
      id: "radar_base",
      sensor_type: "radar",
      x: 0,
      y: 0,
      range: 700,
      fov: 360,
      orientation: 0,
      status: "online",
    },
  ];
}

export function protocolNormal(): ScenarioConfig {
  return {
    scenario_id: "PROTOCOL-NORMAL",
    name: "Protocol: Normal Operations",
    seed: 1001,
    duration: 300.0,
    tick_rate: 0.25,
    objects: [
      {
        id: "bird_1",
        object_type: "bird",
        initial_x: -160,
        initial_y: 140,
        initial_altitude: 45,
        behavior: "loiter",
        speed: 5.5,
      },
      {
        id: "bird_2",
        object_type: "bird",
        initial_x: -220,
        initial_y: -160,
        initial_altitude: 55,
        behavior: "loiter",
        speed: 4.8,
      },
      {
        id: "person_local",
        object_type: "person",
        initial_x: 30,
        initial_y: 60,
        behavior: "waypoint",
        speed: 1.6,
        waypoints: [
          { x: 120, y: 80 },
          { x: 30, y: 60 },
        ],
        loop_waypoints: true,
      },
      {
        id: "person_herder",
        object_type: "person",
        initial_x: -90,
        initial_y: -70,
        behavior: "waypoint",
        speed: 1.4,
        waypoints: [
          { x: -40, y: -50 },
          { x: -90, y: -70 },
        ],
        loop_waypoints: true,
      },
      {
        id: "civilian_car",
        object_type: "vehicle",
        initial_x: -380,
        initial_y: 240,
        behavior: "waypoint",
        speed: 13,
        waypoints: [
          { x: -120, y: 240 },
          { x: 100, y: 240 },
          { x: 320, y: 240 },
        ],
      },
    ],
    zones: getStandardZones(),
    sensors: getStandardSensors(),
  };
}

export function protocolDrone(): ScenarioConfig {
  return {
    scenario_id: "PROTOCOL-DRONE",
    name: "Protocol: Drone Incursion",
    seed: 1002,
    duration: 300.0,
    tick_rate: 0.25,
    objects: [
      {
        id: "drone_lead",
        object_type: "drone",
        initial_x: -620,
        initial_y: -80,
        initial_altitude: 150,
        behavior: "waypoint",
        speed: 18,
        waypoints: [
          { x: -350, y: -50 },
          { x: -120, y: -20 },
          { x: 80, y: 0 },
          { x: 280, y: 20 },
          { x: 480, y: 40 },
        ],
      },
      {
        id: "drone_wing_1",
        object_type: "drone",
        initial_x: -600,
        initial_y: 140,
        initial_altitude: 130,
        behavior: "waypoint",
        speed: 17,
        waypoints: [
          { x: -320, y: 110 },
          { x: -100, y: 80 },
          { x: 100, y: 50 },
          { x: 300, y: 20 },
          { x: 460, y: 0 },
        ],
      },
      {
        id: "drone_wing_2",
        object_type: "drone",
        initial_x: -640,
        initial_y: -220,
        initial_altitude: 165,
        behavior: "waypoint",
        speed: 19,
        waypoints: [
          { x: -360, y: -170 },
          { x: -80, y: -110 },
          { x: 120, y: -60 },
          { x: 320, y: -20 },
          { x: 480, y: 10 },
        ],
      },
    ],
    zones: getStandardZones(),
    sensors: getStandardSensors(),
  };
}

export function protocolVehicle(): ScenarioConfig {
  return {
    scenario_id: "PROTOCOL-VEHICLE",
    name: "Protocol: Vehicle Approach",
    seed: 1003,
    duration: 300.0,
    tick_rate: 0.25,
    objects: [
      {
        id: "convoy_lead",
        object_type: "truck",
        initial_x: -620,
        initial_y: 80,
        behavior: "waypoint",
        speed: 13,
        waypoints: [
          { x: -360, y: 80 },
          { x: -120, y: 80 },
          { x: 100, y: 80 },
          { x: 300, y: 80 },
          { x: 480, y: 80 },
        ],
      },
      {
        id: "convoy_rear",
        object_type: "truck",
        initial_x: -670,
        initial_y: 80,
        behavior: "waypoint",
        speed: 13,
        waypoints: [
          { x: -410, y: 80 },
          { x: -170, y: 80 },
          { x: 50, y: 80 },
          { x: 250, y: 80 },
          { x: 430, y: 80 },
        ],
      },
      {
        id: "patrol_pickup",
        object_type: "vehicle",
        initial_x: -580,
        initial_y: -150,
        behavior: "waypoint",
        speed: 15,
        waypoints: [
          { x: -320, y: -150 },
          { x: -80, y: -150 },
          { x: 120, y: -150 },
          { x: 310, y: -150 },
          { x: 480, y: -150 },
        ],
      },
    ],
    zones: getStandardZones(),
    sensors: getStandardSensors(),
  };
}

export function protocolMultiThreat(): ScenarioConfig {
  return {
    scenario_id: "PROTOCOL-MULTI-THREAT",
    name: "Protocol: Multi-Threat Assault",
    seed: 1004,
    duration: 300.0,
    tick_rate: 0.25,
    objects: [
      {
        id: "drone_strike",
        object_type: "drone",
        initial_x: -640,
        initial_y: 230,
        initial_altitude: 140,
        behavior: "waypoint",
        speed: 24,
        waypoints: [
          { x: -350, y: 200 },
          { x: -60, y: 170 },
          { x: 120, y: 140 },
          { x: 320, y: 110 },
          { x: 500, y: 80 },
        ],
      },
      {
        id: "tank_assault",
        object_type: "vehicle",
        initial_x: -620,
        initial_y: -110,
        behavior: "waypoint",
        speed: 12,
        waypoints: [
          { x: -340, y: -110 },
          { x: -100, y: -110 },
          { x: 90, y: -110 },
          { x: 290, y: -110 },
          { x: 480, y: -110 },
        ],
      },
      {
        id: "troop_squad_1",
        object_type: "person",
        initial_x: -460,
        initial_y: 30,
        behavior: "waypoint",
        speed: 4.5,
        waypoints: [
          { x: -240, y: 30 },
          { x: -40, y: 30 },
          { x: 100, y: 30 },
          { x: 260, y: 30 },
          { x: 420, y: 30 },
        ],
      },
      {
        id: "troop_squad_2",
        object_type: "person",
        initial_x: -490,
        initial_y: -20,
        behavior: "waypoint",
        speed: 4.2,
        waypoints: [
          { x: -260, y: -20 },
          { x: -50, y: -20 },
          { x: 80, y: -20 },
          { x: 240, y: -20 },
          { x: 400, y: -20 },
        ],
      },
      {
        id: "unknown_bogey",
        object_type: "unknown aerial object",
        initial_x: -660,
        initial_y: -260,
        initial_altitude: 190,
        behavior: "waypoint",
        speed: 26,
        waypoints: [
          { x: -360, y: -190 },
          { x: -80, y: -120 },
          { x: 120, y: -60 },
          { x: 320, y: -10 },
          { x: 500, y: 30 },
        ],
      },
    ],
    zones: getStandardZones(),
    sensors: getStandardSensors(),
  };
}

export function protocolEmergency(): ScenarioConfig {
  return {
    scenario_id: "PROTOCOL-EMERGENCY",
    name: "Protocol: Emergency Escalation",
    seed: 1005,
    duration: 300.0,
    tick_rate: 0.25,
    objects: [
      {
        id: "unknown_1",
        object_type: "unknown aerial object",
        initial_x: -650,
        initial_y: 220,
        initial_altitude: 200,
        behavior: "waypoint",
        speed: 28,
        waypoints: [
          { x: -350, y: 140 },
          { x: -80, y: 80 },
          { x: 100, y: 30 },
          { x: 300, y: 0 },
          { x: 480, y: -20 },
        ],
      },
      {
        id: "unknown_2",
        object_type: "unknown aerial object",
        initial_x: -650,
        initial_y: -220,
        initial_altitude: 200,
        behavior: "waypoint",
        speed: 28,
        waypoints: [
          { x: -350, y: -140 },
          { x: -80, y: -80 },
          { x: 100, y: -30 },
          { x: 300, y: 0 },
          { x: 480, y: 20 },
        ],
      },
      {
        id: "tank_1",
        object_type: "vehicle",
        initial_x: -600,
        initial_y: 110,
        behavior: "waypoint",
        speed: 14,
        waypoints: [
          { x: -320, y: 110 },
          { x: -70, y: 110 },
          { x: 110, y: 110 },
          { x: 300, y: 110 },
          { x: 480, y: 110 },
        ],
      },
      {
        id: "tank_2",
        object_type: "vehicle",
        initial_x: -600,
        initial_y: -110,
        behavior: "waypoint",
        speed: 14,
        waypoints: [
          { x: -320, y: -110 },
          { x: -70, y: -110 },
          { x: 110, y: -110 },
          { x: 300, y: -110 },
          { x: 480, y: -110 },
        ],
      },
      {
        id: "drone_swarm_1",
        object_type: "drone",
        initial_x: -620,
        initial_y: 0,
        initial_altitude: 60,
        behavior: "waypoint",
        speed: 22,
        waypoints: [
          { x: -320, y: 0 },
          { x: -40, y: 0 },
          { x: 140, y: 0 },
          { x: 320, y: 0 },
          { x: 500, y: 0 },
        ],
      },
    ],
    zones: getStandardZones(),
    sensors: getStandardSensors(),
  };
}

export function protocolSensorDegraded(): ScenarioConfig {
  return {
    scenario_id: "PROTOCOL-SENSOR-DEGRADED",
    name: "Protocol: Sensor Degraded",
    seed: 1006,
    duration: 300.0,
    tick_rate: 0.25,
    objects: [
      {
        id: "drone_test",
        object_type: "drone",
        initial_x: -600,
        initial_y: -30,
        initial_altitude: 100,
        behavior: "waypoint",
        speed: 15,
        waypoints: [
          { x: -320, y: -20 },
          { x: -90, y: -10 },
          { x: 110, y: 10 },
          { x: 300, y: 30 },
          { x: 480, y: 40 },
        ],
      },
      {
        id: "truck_test",
        object_type: "truck",
        initial_x: -580,
        initial_y: 120,
        behavior: "waypoint",
        speed: 12,
        waypoints: [
          { x: -300, y: 120 },
          { x: -80, y: 120 },
          { x: 100, y: 120 },
          { x: 290, y: 120 },
          { x: 480, y: 120 },
        ],
      },
    ],
    zones: getStandardZones(),
    sensors: getStandardSensors(),
    scripted_events: [
      {
        timestamp: 0.0,
        event_type: "camera_degradation",
        parameters: { duration: 30.0 },
      },
      {
        timestamp: 35.0,
        event_type: "radar_loss",
        parameters: { duration: 20.0 },
      },
    ],
  };
}

export function getScenarioConfig(nameOrId: string): ScenarioConfig {
  const norm = nameOrId.toUpperCase();
  if (norm.includes("DRONE")) return protocolDrone();
  if (norm.includes("VEHICLE")) return protocolVehicle();
  if (norm.includes("MULTI")) return protocolMultiThreat();
  if (norm.includes("EMERGENCY")) return protocolEmergency();
  if (norm.includes("DEGRADED")) return protocolSensorDegraded();
  return protocolNormal();
}
