import pytest
import time
from fastapi.testclient import TestClient
from src.backend.main import app
from src.backend.database import get_db, Base, engine, SessionLocal
from src.backend.models import Alert
from src.backend.alert_engine import (
    process_observation,
    calculate_priority,
    should_suppress_alert,
    COOLDOWN_DICT
)
from src.simulation.engine import SimulationEngine
from src.simulation.scenarios import protocol_sensor_degraded, get_standard_sensors

@pytest.fixture(autouse=True)
def reset_cooldown():
    COOLDOWN_DICT.clear()

# ============================================================================
# 1. ALERT SCORE: Canonical 9-Factor Formula Tests
# ============================================================================

def test_canonical_scoring_factors():
    """
    Verifies the canonical 9-factor weighted formula (ADR-005):
    priority_score =
        0.25 * zone_risk +
        0.20 * object_risk +
        0.15 * proximity_score +
        0.15 * persistence_score +
        0.10 * corroboration_score +
        0.10 * confidence_score +
        0.05 * response_urgency
        - quality_penalty
        - duplicate_penalty
    """
    # 1. Test each factor's individual mathematical contribution
    # zone_risk: 100 * 0.25 = 25.0
    score, _ = calculate_priority(zone_risk=100.0, object_risk=0, proximity_score=0, persistence_score=0, corroboration_score=0, confidence_score=0, response_urgency=0)
    assert score == 25.0

    # object_risk: 100 * 0.20 = 20.0
    score, _ = calculate_priority(zone_risk=0, object_risk=100.0, proximity_score=0, persistence_score=0, corroboration_score=0, confidence_score=0, response_urgency=0)
    assert score == 20.0

    # proximity_score: 100 * 0.15 = 15.0
    score, _ = calculate_priority(zone_risk=0, object_risk=0, proximity_score=100.0, persistence_score=0, corroboration_score=0, confidence_score=0, response_urgency=0)
    assert score == 15.0

    # persistence_score: 100 * 0.15 = 15.0
    score, _ = calculate_priority(zone_risk=0, object_risk=0, proximity_score=0, persistence_score=100.0, corroboration_score=0, confidence_score=0, response_urgency=0)
    assert score == 15.0

    # corroboration_score: 100 * 0.10 = 10.0
    score, _ = calculate_priority(zone_risk=0, object_risk=0, proximity_score=0, persistence_score=0, corroboration_score=100.0, confidence_score=0, response_urgency=0)
    assert score == 10.0

    # confidence_score: 100 * 0.10 = 10.0
    score, _ = calculate_priority(zone_risk=0, object_risk=0, proximity_score=0, persistence_score=0, corroboration_score=0, confidence_score=100.0, response_urgency=0)
    assert score == 10.0

    # response_urgency: 100 * 0.05 = 5.0
    score, _ = calculate_priority(zone_risk=0, object_risk=0, proximity_score=0, persistence_score=0, corroboration_score=0, confidence_score=0, response_urgency=100.0)
    assert score == 5.0

    # Sum of all weights: 25 + 20 + 15 + 15 + 10 + 10 + 5 = 100.0 (P1)
    score, band = calculate_priority(
        zone_risk=100.0,
        object_risk=100.0,
        proximity_score=100.0,
        persistence_score=100.0,
        corroboration_score=100.0,
        confidence_score=100.0,
        response_urgency=100.0
    )
    assert score == 100.0
    assert band == "P1"

def test_penalties_and_score_bounds():
    """Verifies quality/duplicate penalties and clamping to [0.0, 100.0]."""
    # Quality penalty: 100 base - 15 quality penalty = 85.0
    score, band = calculate_priority(
        zone_risk=100.0, object_risk=100.0, proximity_score=100.0, persistence_score=100.0,
        corroboration_score=100.0, confidence_score=100.0, response_urgency=100.0,
        quality_penalty=15.0, duplicate_penalty=0.0
    )
    assert score == 85.0
    assert band == "P1"

    # Duplicate penalty: 85 - 5 duplicate penalty = 80.0
    score, band = calculate_priority(
        zone_risk=100.0, object_risk=100.0, proximity_score=100.0, persistence_score=100.0,
        corroboration_score=100.0, confidence_score=100.0, response_urgency=100.0,
        quality_penalty=15.0, duplicate_penalty=5.0
    )
    assert score == 80.0
    assert band == "P1"

    # Lower bound clamping: negative raw score clamped to 0.0
    score, band = calculate_priority(
        zone_risk=10.0, object_risk=10.0, proximity_score=0, persistence_score=0,
        corroboration_score=0, confidence_score=0, response_urgency=0,
        quality_penalty=20.0, duplicate_penalty=10.0
    )
    assert score == 0.0
    assert band == "P4"

    # Upper bound clamping: score > 100 clamped to 100.0
    score, band = calculate_priority(
        zone_risk=120.0, object_risk=120.0, proximity_score=100.0, persistence_score=100.0,
        corroboration_score=100.0, confidence_score=100.0, response_urgency=100.0
    )
    assert score == 100.0
    assert band == "P1"

# ============================================================================
# 2. PRIORITY BANDS: Boundary Value Verification
# ============================================================================

def test_priority_band_boundaries():
    """
    Tests exact boundary values:
    0, 25, 34 -> P4 (0–34)
    35, 59    -> P3 (35–59)
    60, 79    -> P2 (60–79)
    80, 99, 100 -> P1 (80–100)
    """
    test_cases = [
        (0.0, "P4"),
        (25.0, "P4"),
        (34.0, "P4"),
        (35.0, "P3"),
        (59.0, "P3"),
        (60.0, "P2"),
        (79.0, "P2"),
        (80.0, "P1"),
        (99.0, "P1"),
        (100.0, "P1"),
    ]

    for target_score, expected_band in test_cases:
        # Construct input factors that produce target_score
        score, band = calculate_priority(
            zone_risk=target_score,
            object_risk=target_score,
            proximity_score=target_score,
            persistence_score=target_score,
            corroboration_score=target_score,
            confidence_score=target_score,
            response_urgency=target_score
        )
        assert score == target_score, f"Expected score {target_score}, got {score}"
        assert band == expected_band, f"Score {target_score}: expected {expected_band}, got {band}"

# ============================================================================
# 3. DEDUPLICATION: 60-Second Cooldown Verification
# ============================================================================

def test_deduplication():
    """Verifies canonical 60-second cooldown window and bypass conditions."""
    # First occurrence is never suppressed
    assert not should_suppress_alert("obj-1", "ZONE_ENTRY", 10.0, "P3", "sensor_A")
    
    # Within 60 seconds for same object/severity/sensor: suppressed
    assert should_suppress_alert("obj-1", "ZONE_ENTRY", 20.0, "P3", "sensor_A")
    assert should_suppress_alert("obj-1", "ZONE_ENTRY", 69.9, "P3", "sensor_A")
    
    # Severity escalation (P3 -> P2): bypasses cooldown
    assert not should_suppress_alert("obj-1", "ZONE_ENTRY", 25.0, "P2", "sensor_A")
    
    # New corroborating sensor: bypasses cooldown
    assert not should_suppress_alert("obj-1", "ZONE_ENTRY", 30.0, "P2", "sensor_B")
    
    # Same severity and known sensors within 60s: suppressed
    assert should_suppress_alert("obj-1", "ZONE_ENTRY", 40.0, "P2", "sensor_B")
    
    # After 60 seconds (last update was at 30.0, so 90.1s is outside window): allowed
    assert not should_suppress_alert("obj-1", "ZONE_ENTRY", 90.1, "P2", "sensor_B")
    
    # Different object: not suppressed
    assert not should_suppress_alert("obj-2", "ZONE_ENTRY", 20.0, "P3", "sensor_A")
    
    # Different reason: not suppressed
    assert not should_suppress_alert("obj-1", "FENCE_CROSS", 20.0, "P3", "sensor_A")

# ============================================================================
# 4. SENSOR HEALTH: Lifecycle Verification
# ============================================================================

def test_sensor_health_degraded_recovery_lifecycle():
    """
    Verifies sensor health state transitions:
    HEALTHY -> DEGRADED -> RECOVERY -> HEALTHY
    And verifies reset cleanly restores sensors to online.
    """
    config = protocol_sensor_degraded()
    engine_inst = SimulationEngine(config, callback=lambda obs: None)
    
    # 1. Initial State: All sensors online (HEALTHY)
    assert all(s.status == "online" for s in engine_inst.state.sensors)
    
    # 2. Start simulation and tick 0.0 -> degradation event executes
    engine_inst.start()
    engine_inst.tick(delta_time=1.0) # Tick 0 -> 1.0, triggers camera_degradation (duration: 30.0s)
    
    # Cameras should now be DEGRADED
    cameras = [s for s in engine_inst.state.sensors if s.sensor_type == "camera"]
    assert len(cameras) == 5
    assert all(c.status == "degraded" for c in cameras), "Cameras should be degraded during degradation window"
    
    # 3. Advance past degradation duration (current_tick >= 30.0)
    # Advance to tick 31.0
    engine_inst.state.current_tick = 30.5
    engine_inst.tick(delta_time=1.0)
    
    # Cameras should now be RECOVERED to HEALTHY ("online")
    cameras_after = [s for s in engine_inst.state.sensors if s.sensor_type == "camera"]
    assert all(c.status == "online" for c in cameras_after), "Cameras should recover to online after degradation duration"
    
    # Check that a sensor_recovery event was recorded
    recovery_events = [e for e in engine_inst.state.simulation_events if e.event_type == "sensor_recovery"]
    assert len(recovery_events) > 0, "sensor_recovery event should be logged"
    
    # 4. Stop simulation -> resets state cleanly
    engine_inst.stop()
    assert all(s.status == "online" for s in engine_inst.state.sensors)
    assert engine_inst.active_degradation_end is None

# ============================================================================
# 5. CAMERAS: Standard Sensor Count Verification
# ============================================================================

def test_cameras_count_and_config():
    """Verifies that all 5 cameras (cam_01 to cam_05) exist in standard sensor config."""
    sensors = get_standard_sensors()
    cameras = [s for s in sensors if s.sensor_type == "camera"]
    assert len(cameras) == 5, f"Expected 5 cameras, found {len(cameras)}"
    
    cam_ids = [c.id for c in cameras]
    assert cam_ids == ["cam_01", "cam_02", "cam_03", "cam_04", "cam_05"]
    assert all(c.status == "online" for c in cameras)

# ============================================================================
# 6. API CONTRACT: PATCH /api/alerts/{id}/acknowledge
# ============================================================================

def test_acknowledge_api_patch_contract():
    """Verifies that PATCH /api/alerts/{id}/acknowledge operates as specified."""
    client = TestClient(app)
    
    # 1. Test 404 on nonexistent alert
    res_404 = client.patch("/api/alerts/nonexistent-uuid-999/acknowledge")
    assert res_404.status_code == 404
    
    # 2. Create a test alert in DB
    alert_id = "test-alert-patch-01"
    with SessionLocal() as db:
        # Clean up any existing alert with this id
        db.query(Alert).filter(Alert.id == alert_id).delete()
        db.commit()
        test_alert = Alert(
            id=alert_id,
            object_id="test-obj-1",
            object_type="drone",
            alert_type="Virtual Fence Crossing",
            reason_code="FENCE_CROSS",
            priority_score=85.0,
            priority_band="P1",
            status="new",
            simulated_time=100.0,
            is_synthetic=True
        )
        db.add(test_alert)
        db.commit()

    # 3. Successful PATCH acknowledge
    res_ack = client.patch(f"/api/alerts/{alert_id}/acknowledge")
    assert res_ack.status_code == 200
    data = res_ack.json()
    assert data["status"] == "acknowledged"
    assert data["id"] == alert_id

    # 4. Idempotent repeat call returns acknowledged
    res_repeat = client.patch(f"/api/alerts/{alert_id}/acknowledge")
    assert res_repeat.status_code == 200
    assert res_repeat.json()["status"] == "acknowledged"

# ============================================================================
# 7. INTEGRATION PIPELINE: Observation -> Alert
# ============================================================================

def test_pipeline_generates_alert():
    obs = {
        "id": "person-123",
        "type": "person",
        "x": 10.0,
        "y": 25.0,
        "timestamp": 100.0,
        "confidence": 0.9
    }
    prev_pos = {"x": -10.0, "y": 25.0}
    
    alert = process_observation(obs, prev_pos)
    
    assert alert is not None
    assert alert["object_id"] == "person-123"
    assert alert["alert_type"] == "Restricted Zone Entry"
    assert alert["reason_code"] == "ZONE_ENTRY"
    assert alert["priority_band"] in ["P1", "P2", "P3", "P4"]
    assert alert["is_synthetic"] is True

def test_alert_escalation_tripwire_breach_intercept():
    # 1. Approach crossing foreign tripwire at x = -150
    obs1 = {"id": "drone-404", "type": "drone", "x": -140.0, "y": 100.0, "timestamp": 10.0, "confidence": 0.85}
    prev1 = {"x": -165.0, "y": 100.0}
    alert1 = process_observation(obs1, prev1)
    assert alert1 is not None
    assert alert1["reason_code"] == "TRIPWIRE_CROSS"
    assert alert1["alert_type"] == "Border Warning Tripwire Triggered"

    # 2. Crossing international border line at x = 0 (Border Breach)
    obs2 = {"id": "drone-404", "type": "drone", "x": 10.0, "y": 100.0, "timestamp": 25.0, "confidence": 0.9}
    prev2 = {"x": -15.0, "y": 100.0}
    alert2 = process_observation(obs2, prev2)
    assert alert2 is not None
    assert alert2["reason_code"] == "FENCE_CROSS"
    assert alert2["alert_type"] == "Virtual Fence Crossing (Border Breach)"

    # 3. Penetrating into sovereign intercept corridor at x = 150
    obs3 = {"id": "drone-404", "type": "drone", "x": 160.0, "y": 100.0, "timestamp": 40.0, "confidence": 0.95}
    prev3 = {"x": 140.0, "y": 100.0}
    alert3 = process_observation(obs3, prev3)
    assert alert3 is not None
    assert alert3["reason_code"] == "INTERCEPT_ZONE"
    assert alert3["alert_type"] == "Sovereign Intercept Corridor Penetration"
    assert alert3["priority_band"] == "P1"
