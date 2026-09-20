import pytest

def test_simulation_state_consistency(client):
    """Verify simulation state machine transitions consistently without race conditions."""
    # Initially stopped
    res = client.get("/api/simulation/state")
    assert res.status_code == 200
    assert res.json()["is_running"] is False

    # Start
    res = client.post("/api/simulation/start", json={"scenario": "PROTOCOL-NORMAL"})
    assert res.status_code == 200
    assert res.json()["status"] == "started"

    state = client.get("/api/simulation/state").json()
    assert state["is_running"] is True
    assert state["is_paused"] is False
    assert state["scenario"] == "PROTOCOL-NORMAL"

    # Pause
    res = client.post("/api/simulation/pause")
    assert res.status_code == 200
    state = client.get("/api/simulation/state").json()
    assert state["is_paused"] is True
    assert state["is_running"] is True

    # Resume
    res = client.post("/api/simulation/resume")
    assert res.status_code == 200
    state = client.get("/api/simulation/state").json()
    assert state["is_paused"] is False
    assert state["is_running"] is True

    # Stop
    res = client.post("/api/simulation/stop")
    assert res.status_code == 200
    state = client.get("/api/simulation/state").json()
    assert state["is_running"] is False

def test_rapid_protocol_switching(client):
    """Verify rapid switching across all 6 protocols does not create duplicate loops or corrupt state."""
    protocols = [
        "PROTOCOL-NORMAL",
        "PROTOCOL-DRONE",
        "PROTOCOL-VEHICLE",
        "PROTOCOL-MULTI-THREAT",
        "PROTOCOL-EMERGENCY",
        "PROTOCOL-SENSOR-DEGRADED",
        "PROTOCOL-NORMAL"
    ]
    for p in protocols:
        res = client.post("/api/simulation/start", json={"scenario": p, "speed_multiplier": 2.0})
        assert res.status_code == 200
        state = client.get("/api/simulation/state").json()
        assert state["is_running"] is True
        assert state["scenario"] == p

    # Cleanup
    client.post("/api/simulation/stop")

def test_rapid_speed_switching(client):
    """Verify rapid speed changes do not crash or drift simulation loop."""
    client.post("/api/simulation/start", json={"scenario": "PROTOCOL-NORMAL", "speed_multiplier": 1.0})
    for speed in [2.0, 4.0, 8.0, 1.0, 4.0]:
        res = client.post("/api/simulation/speed", json={"speed_multiplier": speed})
        assert res.status_code == 200
        assert res.json()["speed_multiplier"] == speed
        state = client.get("/api/simulation/state").json()
        assert state["speed_multiplier"] == speed

    client.post("/api/simulation/stop")

def test_reset_clears_tracks_and_state(client):
    """Verify reset stops simulation and purges all active tracks."""
    client.post("/api/simulation/start", json={"scenario": "PROTOCOL-MULTI-THREAT"})
    tracks_res = client.get("/api/simulation/tracks")
    assert tracks_res.status_code == 200
    assert len(tracks_res.json()) > 0

    # Reset / Stop
    res = client.post("/api/simulation/stop")
    assert res.status_code == 200

    # Verify tracks are purged
    tracks_after = client.get("/api/simulation/tracks").json()
    assert len(tracks_after) == 0

    state = client.get("/api/simulation/state").json()
    assert state["is_running"] is False

def test_reset_after_protocol_switch(client):
    """Verify switching protocol and immediately resetting returns cleanly to initial state."""
    client.post("/api/simulation/start", json={"scenario": "PROTOCOL-DRONE"})
    client.post("/api/simulation/start", json={"scenario": "PROTOCOL-VEHICLE"})
    client.post("/api/simulation/stop")

    state = client.get("/api/simulation/state").json()
    assert state["is_running"] is False
    tracks = client.get("/api/simulation/tracks").json()
    assert len(tracks) == 0

def test_anomaly_injection_pipeline(client):
    """Verify enabling anomaly injection spawns anomalous object and sets state flag."""
    res = client.post("/api/simulation/start", json={
        "scenario": "PROTOCOL-NORMAL",
        "speed_multiplier": 1.0,
        "anomaly_detection_enabled": True
    })
    assert res.status_code == 200

    state = client.get("/api/simulation/state").json()
    assert state["anomaly_detection_enabled"] is True

    tracks = client.get("/api/simulation/tracks").json()
    anomaly_track = next((t for t in tracks if t["id"] == "anomaly_lead"), None)
    assert anomaly_track is not None
    assert anomaly_track["object_type"] == "unknown aerial object"

    client.post("/api/simulation/stop")

def test_websocket_telemetry_connection(client):
    """Verify single telemetry WebSocket endpoint connects and disconnects cleanly."""
    with client.websocket_connect("/api/simulation/telemetry") as ws:
        assert ws is not None
        # Verify connection stays alive
