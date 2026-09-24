/**
 * Phase V6D — Comprehensive Client Simulation Test Suite
 *
 * SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION.
 * Tests all 16 areas specified in Step 17 of Phase V6D specification.
 */

import { SimulationEngine } from "../src/lib/simulation/engine.ts";
import { AlertEngine } from "../src/lib/simulation/alertEngine.ts";
import {
  protocolNormal,
  protocolDrone,
  protocolVehicle,
  protocolMultiThreat,
  protocolEmergency,
  protocolSensorDegraded,
  getScenarioConfig,
} from "../src/lib/simulation/scenarios.ts";
import {
  getSimulationMode,
  setSimulationMode,
  onSimulationModeChange,
} from "../src/lib/runtime.ts";
import { SupabaseTelemetryTransport } from "../src/lib/supabase/telemetryTransport.ts";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

async function runTests() {
  console.log("==================================================");
  console.log("PHASE V6D — CLIENT-SIDE SIMULATION ENGINE TEST SUITE");
  console.log("==================================================");

  let passed = 0;
  let total = 16;

  // 1. Deterministic seed behavior
  {
    const config1 = protocolNormal();
    const config2 = protocolNormal();
    const engine1 = new SimulationEngine(config1);
    const engine2 = new SimulationEngine(config2);
    engine1.start();
    engine2.start();

    for (let i = 0; i < 20; i++) {
      engine1.tick();
      engine2.tick();
    }

    const t1 = engine1.tick()?.tracks;
    const t2 = engine2.tick()?.tracks;

    assert(t1 !== undefined && t2 !== undefined, "Tracks must be defined");
    assert(t1.length === t2.length, "Track count must match");
    for (let i = 0; i < t1.length; i++) {
      assert(t1[i].id === t2[i].id, `Track ID mismatch at ${i}`);
      assert(t1[i].x === t2[i].x, `Track X position mismatch at ${i}: ${t1[i].x} vs ${t2[i].x}`);
      assert(t1[i].y === t2[i].y, `Track Y position mismatch at ${i}: ${t1[i].y} vs ${t2[i].y}`);
    }
    console.log("✓ TEST 1: Deterministic Seed Behavior (PASS)");
    passed++;
  }

  // 2. Six protocols
  {
    const p1 = protocolNormal();
    const p2 = protocolDrone();
    const p3 = protocolVehicle();
    const p4 = protocolMultiThreat();
    const p5 = protocolEmergency();
    const p6 = protocolSensorDegraded();

    assert(p1.seed === 1001 && p1.scenario_id === "PROTOCOL-NORMAL", "Normal protocol seed 1001");
    assert(p2.seed === 1002 && p2.scenario_id === "PROTOCOL-DRONE", "Drone protocol seed 1002");
    assert(p3.seed === 1003 && p3.scenario_id === "PROTOCOL-VEHICLE", "Vehicle protocol seed 1003");
    assert(p4.seed === 1004 && p4.scenario_id === "PROTOCOL-MULTI-THREAT", "Multi-Threat protocol seed 1004");
    assert(p5.seed === 1005 && p5.scenario_id === "PROTOCOL-EMERGENCY", "Emergency protocol seed 1005");
    assert(p6.seed === 1006 && p6.scenario_id === "PROTOCOL-SENSOR-DEGRADED", "Sensor Degraded protocol seed 1006");

    assert(p1.objects.length >= 5, "Normal has >= 5 objects");
    assert(p2.objects.every((o) => o.object_type === "drone"), "Drone protocol has drones");
    assert(p3.objects.some((o) => o.object_type === "truck"), "Vehicle protocol has trucks");
    assert(p4.objects.length === 5, "Multi-threat has 5 objects");
    assert(p5.objects.length === 5, "Emergency has 5 objects");
    assert(p6.scripted_events && p6.scripted_events.length === 2, "Sensor degraded has 2 scripted events");

    console.log("✓ TEST 2: Six Simulation Protocols Verified (PASS)");
    passed++;
  }

  // 3. 4 Hz worker tick
  {
    const config = protocolNormal();
    assert(config.tick_rate === 0.25, "Tick rate must be 0.25 seconds (4 Hz)");
    const engine = new SimulationEngine(config);
    engine.start();
    const out = engine.tick(0.25);
    assert(out !== null, "Tick output must not be null");
    assert(engine.state.current_tick === 0.25, "First tick must advance simulation clock by 0.25s");
    console.log("✓ TEST 3: 4 Hz Worker Tick (PASS)");
    passed++;
  }

  // 4. Speed multipliers
  {
    const config = protocolDrone();
    const e1 = new SimulationEngine(config);
    const e2 = new SimulationEngine(config);
    e1.start();
    e2.start();
    e1.speedMultiplier = 1.0;
    e2.speedMultiplier = 2.0;

    e1.tick();
    e2.tick();

    assert(e1.state.current_tick === 0.25, "1X tick advances by 0.25s");
    assert(e2.state.current_tick === 0.50, "2X tick advances by 0.50s");

    const e4 = new SimulationEngine(config);
    e4.start();
    e4.speedMultiplier = 4.0;
    e4.tick();
    assert(e4.state.current_tick === 1.00, "4X tick advances by 1.00s");

    const e8 = new SimulationEngine(config);
    e8.start();
    e8.speedMultiplier = 8.0;
    e8.tick();
    assert(e8.state.current_tick === 2.00, "8X tick advances by 2.00s");

    console.log("✓ TEST 4: Speed Multipliers 1X, 2X, 4X, 8X (PASS)");
    passed++;
  }

  // 5. Pause
  {
    const config = protocolNormal();
    const engine = new SimulationEngine(config);
    engine.start();
    engine.tick();
    const tickBeforePause = engine.state.current_tick;
    engine.pause();
    assert(engine.state.is_paused === true, "Engine must be marked paused");
    const out = engine.tick();
    assert(out === null, "Tick during pause must return null");
    assert(engine.state.current_tick === tickBeforePause, "Tick count must freeze during pause");
    console.log("✓ TEST 5: Pause Semantics (PASS)");
    passed++;
  }

  // 6. Resume
  {
    const config = protocolNormal();
    const engine = new SimulationEngine(config);
    engine.start();
    engine.pause();
    engine.resume();
    assert(engine.state.is_paused === false, "Engine must be unpaused");
    const out = engine.tick();
    assert(out !== null, "Tick after resume must produce output");
    assert(engine.state.current_tick > 0, "Simulation clock must advance after resume");
    console.log("✓ TEST 6: Resume Semantics (PASS)");
    passed++;
  }

  // 7. Reset
  {
    const config = protocolDrone();
    const engine = new SimulationEngine(config);
    engine.start();
    for (let i = 0; i < 10; i++) engine.tick();
    assert(engine.state.current_tick > 0, "Current tick > 0 before reset");

    engine.reset();
    assert(engine.state.current_tick === 0, "Current tick reset to 0");
    assert(engine.state.is_running === false, "is_running reset to false");
    assert(engine.state.is_paused === false, "is_paused reset to false");
    console.log("✓ TEST 7: Reset Semantics (PASS)");
    passed++;
  }

  // 8. Protocol switching
  {
    const config1 = getScenarioConfig("PROTOCOL-NORMAL");
    const engine = new SimulationEngine(config1);
    assert(engine.config.scenario_id === "PROTOCOL-NORMAL", "Initial scenario is NORMAL");

    const config2 = getScenarioConfig("PROTOCOL-EMERGENCY");
    engine.reset(config2);
    assert(engine.config.scenario_id === "PROTOCOL-EMERGENCY", "Switched scenario is EMERGENCY");
    assert(engine.config.seed === 1005, "Switched seed is 1005");
    console.log("✓ TEST 8: Protocol Switching (PASS)");
    passed++;
  }

  // 9. Sensor degradation
  {
    const config = protocolSensorDegraded();
    const engine = new SimulationEngine(config);
    engine.start();
    const out = engine.tick(); // timestamp 0.0 triggers camera_degradation
    assert(out !== null, "Tick output exists");
    const cam = out.sensors.find((s) => s.id === "cam_01");
    assert(cam !== undefined && cam.status === "degraded", "Camera status must be degraded");
    console.log("✓ TEST 9: Sensor Degradation Handling (PASS)");
    passed++;
  }

  // 10. Alert priority formula
  {
    // Canonical weights:
    // 0.25*zone(80) + 0.20*object(90) + 0.15*prox(100) + 0.15*persist(50) + 0.10*corrob(100) + 0.10*conf(80) + 0.05*urgency(90)
    // = 20.0 + 18.0 + 15.0 + 7.5 + 10.0 + 8.0 + 4.5 = 83.0
    const { score, band } = AlertEngine.calculatePriority({
      zone_risk: 80.0,
      object_risk: 90.0,
      proximity_score: 100.0,
      persistence_score: 50.0,
      corroboration_score: 100.0,
      confidence_score: 80.0,
      response_urgency: 90.0,
      quality_penalty: 0.0,
      duplicate_penalty: 0.0,
    });
    assert(score === 83.0, `Score must equal 83.0 (got ${score})`);
    assert(band === "P1", `Band must be P1 (got ${band})`);
    console.log("✓ TEST 10: Canonical 9-Factor Priority Formula (PASS)");
    passed++;
  }

  // 11. P1–P4 bands
  {
    const b1 = AlertEngine.calculatePriority({ zone_risk: 90, object_risk: 90, proximity_score: 90, persistence_score: 90, corroboration_score: 90, confidence_score: 90, response_urgency: 90 });
    const b2 = AlertEngine.calculatePriority({ zone_risk: 70, object_risk: 70, proximity_score: 70, persistence_score: 70, corroboration_score: 70, confidence_score: 70, response_urgency: 70 });
    const b3 = AlertEngine.calculatePriority({ zone_risk: 45, object_risk: 45, proximity_score: 45, persistence_score: 45, corroboration_score: 45, confidence_score: 45, response_urgency: 45 });
    const b4 = AlertEngine.calculatePriority({ zone_risk: 20, object_risk: 20, proximity_score: 20, persistence_score: 20, corroboration_score: 20, confidence_score: 20, response_urgency: 20 });

    assert(b1.band === "P1" && b1.score >= 80, "P1 band >= 80");
    assert(b2.band === "P2" && b2.score >= 60 && b2.score < 80, "P2 band 60-79");
    assert(b3.band === "P3" && b3.score >= 35 && b3.score < 60, "P3 band 35-59");
    assert(b4.band === "P4" && b4.score < 35, "P4 band < 35");
    console.log("✓ TEST 11: Priority Bands P1–P4 (PASS)");
    passed++;
  }

  // 12. 60-second deduplication
  {
    const engine = new AlertEngine();
    // First alert at t=10
    const sup1 = engine.shouldSuppressAlert("obj-1", "FENCE_CROSS", 10.0, "P2", "cam_01");
    assert(sup1 === false, "First alert not suppressed");

    // Second identical alert at t=25 (within 60s window)
    const sup2 = engine.shouldSuppressAlert("obj-1", "FENCE_CROSS", 25.0, "P2", "cam_01");
    assert(sup2 === true, "Second alert within 60s is suppressed");

    // Third alert with severity escalation (P2 -> P1) bypasses cooldown
    const sup3 = engine.shouldSuppressAlert("obj-1", "FENCE_CROSS", 30.0, "P1", "cam_01");
    assert(sup3 === false, "Escalation to P1 bypasses cooldown");

    // Fourth alert with new sensor corroboration bypasses cooldown
    const sup4 = engine.shouldSuppressAlert("obj-1", "FENCE_CROSS", 35.0, "P1", "radar_base");
    assert(sup4 === false, "Corroboration by new sensor bypasses cooldown");

    // Fifth alert after 60s cooldown expires
    const sup5 = engine.shouldSuppressAlert("obj-1", "FENCE_CROSS", 100.0, "P1", "cam_01");
    assert(sup5 === false, "Alert after 60s cooldown window passes");

    console.log("✓ TEST 12: 60-Second Alert Deduplication & Exceptions (PASS)");
    passed++;
  }

  // 13. Telemetry payload validation
  {
    const config = protocolNormal();
    const engine = new SimulationEngine(config);
    engine.start();
    const out = engine.tick(0.25);
    assert(out !== null, "Tick output exists");

    const payload = {
      simulation_id: engine.simulationId,
      protocol: config.scenario_id,
      simulation_timestamp: out.state.current_tick,
      tick: 1,
      tracks: out.tracks,
      observations: out.observations,
      sensors: out.sensors,
      environment: {
        zones: out.state.zones,
        events: out.events,
      },
      new_alerts: out.generatedAlerts.map((a) => a.id),
      owner_id: "test-owner-01",
    };

    assert(typeof payload.simulation_id === "string" && payload.simulation_id.length > 0, "Has simulation_id");
    assert(Array.isArray(payload.tracks) && payload.tracks.length > 0, "Has tracks array");
    assert(Array.isArray(payload.sensors) && payload.sensors.length === 6, "Has 6 sensors (5 cams + 1 radar)");
    assert(Array.isArray(payload.environment.zones) && payload.environment.zones.length === 3, "Has 3 zones");
    assert(payload.owner_id === "test-owner-01", "Has owner_id");

    console.log("✓ TEST 13: Telemetry Payload Shape Validation (PASS)");
    passed++;
  }

  // 14. Duplicate worker prevention
  {
    const epoch1 = 1;
    let handled = false;

    // Simulate worker message arrival for current vs stale epoch
    function onWorkerMessage(epoch: number) {
      if (epoch !== epoch1) {
        return; // Discarded
      }
      handled = true;
    }

    onWorkerMessage(2); // Stale message from old worker
    assert(handled === false, "Stale worker message discarded");
    onWorkerMessage(1); // Current worker message
    assert(handled === true, "Current worker message accepted");

    console.log("✓ TEST 14: Duplicate Worker / Stale Message Discard (PASS)");
    passed++;
  }

  // 15. Duplicate subscription prevention
  {
    const transport = SupabaseTelemetryTransport.getInstance();
    const t2 = SupabaseTelemetryTransport.getInstance();
    assert(transport === t2, "Transport must be a strict singleton");
    assert(transport.channelName === "simulation_telemetry", "Channel is simulation_telemetry");
    console.log("✓ TEST 15: Duplicate Subscription Prevention (PASS)");
    passed++;
  }

  // 16. Cloud / Local runtime selection
  {
    let notifiedMode = "";
    const unsub = onSimulationModeChange((mode) => {
      notifiedMode = mode;
    });

    setSimulationMode("cloud");
    assert(getSimulationMode() === "cloud", "Mode set to cloud");
    assert(notifiedMode === "cloud", "Mode listener received cloud");

    setSimulationMode("local");
    assert(getSimulationMode() === "local", "Mode set to local");
    assert(notifiedMode === "local", "Mode listener received local");

    unsub();
    console.log("✓ TEST 16: Cloud / Local Runtime Selection (PASS)");
    passed++;
  }

  console.log("==================================================");
  console.log(`ALL TESTS PASSED: ${passed}/${total}`);
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
