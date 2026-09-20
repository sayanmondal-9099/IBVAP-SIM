import pytest
from src.backend.models import Alert, Incident, MockTransfer, AuditLog

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["is_synthetic_environment"] is True

def test_simulation_start_stop(client):
    response = client.post("/api/simulation/start", json={"scenario": "PROTOCOL-NORMAL"})
    assert response.status_code == 200
    assert response.json()["status"] == "started"
    
    response = client.post("/api/simulation/stop")
    assert response.status_code == 200
    assert response.json()["status"] == "stopped"

def test_simulation_state_and_tracks(client):
    # Test state when stopped
    response = client.get("/api/simulation/state")
    assert response.status_code == 200
    assert response.json()["is_running"] is False
    
    # Test tracks when stopped
    response = client.get("/api/simulation/tracks")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    
    # Start simulation to get tracks
    client.post("/api/simulation/start", json={"scenario": "PROTOCOL-NORMAL"})
    
    # Check state
    response = client.get("/api/simulation/state")
    assert response.status_code == 200
    assert response.json()["is_running"] is True
    
    # Check tracks
    response = client.get("/api/simulation/tracks")
    assert response.status_code == 200
    tracks = response.json()
    assert len(tracks) > 0
    assert "x" in tracks[0]
    
    # Clean up
    client.post("/api/simulation/stop")

def test_alert_flow(client, db_session):
    # Setup test alert
    alert = Alert(object_id="obj_1", object_type="person", alert_type="test", is_synthetic=True, simulated_time=1.0)
    db_session.add(alert)
    db_session.commit()
    
    # 1. GET alerts
    response = client.get("/api/alerts")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["status"] == "new"
    
    # 2. Acknowledge alert
    response = client.patch(f"/api/alerts/{alert.id}/acknowledge")
    assert response.status_code == 200
    assert response.json()["status"] == "acknowledged"
    
    # Verify audit log created
    audit = db_session.query(AuditLog).filter_by(action="acknowledge_alert").first()
    assert audit is not None
    assert audit.resource == f"alert:{alert.id}"
    
    # 3. Escalate alert
    response = client.post(f"/api/alerts/{alert.id}/escalate")
    assert response.status_code == 200
    incident_id = response.json()["incident_id"]
    
    # Verify incident created
    incident = db_session.query(Incident).filter_by(id=incident_id).first()
    assert incident is not None
    assert incident.status == "open"

def test_mock_receiver_success(client, db_session):
    incident = Incident(alert_id="fake_alert", status="open", is_synthetic=True)
    db_session.add(incident)
    db_session.commit()
    
    payload = {
        "incident_id": incident.id,
        "alert_data": {"test": "data"},
        "is_synthetic": True
    }
    
    response = client.post(
        "/api/mock-receiver", 
        json=payload,
        headers={"X-Simulation-ID": "sim_123"}
    )
    assert response.status_code == 202
    
    db_session.refresh(incident)
    assert incident.status == "transferred"
    
    transfer = db_session.query(MockTransfer).filter_by(incident_id=incident.id).first()
    assert transfer is not None

def test_mock_receiver_missing_header(client):
    payload = {
        "incident_id": "some_id",
        "alert_data": {},
        "is_synthetic": True
    }
    response = client.post("/api/mock-receiver", json=payload)
    assert response.status_code == 400
    assert "X-Simulation-ID" in response.json()["detail"]

def test_mock_receiver_invalid_payload(client):
    payload = {
        "incident_id": "some_id",
        "alert_data": {},
        "is_synthetic": False  # ILLEGAL
    }
    response = client.post("/api/mock-receiver", json=payload, headers={"X-Simulation-ID": "sim_1"})
    assert response.status_code == 400
    
def test_mock_receiver_duplicate_transfer(client, db_session):
    incident = Incident(alert_id="fake_alert", status="open", is_synthetic=True)
    db_session.add(incident)
    db_session.commit()
    
    payload = {
        "incident_id": incident.id,
        "alert_data": {},
        "is_synthetic": True
    }
    
    # First request
    client.post("/api/mock-receiver", json=payload, headers={"X-Simulation-ID": "sim_1"})
    
    # Second request
    response = client.post("/api/mock-receiver", json=payload, headers={"X-Simulation-ID": "sim_1"})
    assert response.status_code == 409
    assert "already transferred" in response.json()["detail"]

def test_protocol_starts(client):
    protocols = [
        "PROTOCOL-NORMAL",
        "PROTOCOL-DRONE",
        "PROTOCOL-VEHICLE",
        "PROTOCOL-SENSOR-DEGRADED"
    ]
    for p in protocols:
        response = client.post("/api/simulation/start", json={"scenario": p})
        assert response.status_code == 200, f"Failed to start {p}"
        client.post("/api/simulation/stop")

def test_multi_threat_protocol(client):
    response = client.post("/api/simulation/start", json={"scenario": "PROTOCOL-MULTI-THREAT"})
    assert response.status_code == 200
    
    # Assert tracks
    import time
    time.sleep(0.5) # Allow some ticks
    
    response = client.get("/api/simulation/tracks")
    assert response.status_code == 200
    tracks = response.json()
    assert len(tracks) > 1, "Should have multiple objects"
    
    types = {t["object_type"] for t in tracks}
    assert len(types) > 1, "Should have multiple object classes"
    
    client.post("/api/simulation/stop")

def test_emergency_protocol(client):
    response = client.post("/api/simulation/start", json={"scenario": "PROTOCOL-EMERGENCY"})
    assert response.status_code == 200
    
    import time
    time.sleep(0.5)
    
    response = client.get("/api/simulation/tracks")
    assert response.status_code == 200
    tracks = response.json()
    assert len(tracks) > 1
    
    types = {t["object_type"] for t in tracks}
    assert len(types) > 1
    
    client.post("/api/simulation/stop")

def test_protocol_transition(client):
    # Start one protocol
    response = client.post("/api/simulation/start", json={"scenario": "PROTOCOL-NORMAL"})
    assert response.status_code == 200
    
    # Wait a bit
    import time
    time.sleep(0.2)
    
    # Switch to another protocol instantly without stopping first
    response = client.post("/api/simulation/start", json={"scenario": "PROTOCOL-MULTI-THREAT"})
    assert response.status_code == 200
    
    # Verify we can fetch state and tracks without 500s
    time.sleep(0.2)
    state = client.get("/api/simulation/state")
    assert state.status_code == 200
    assert state.json()["scenario"] == "PROTOCOL-MULTI-THREAT"
    
    client.post("/api/simulation/stop")

def test_idempotent_and_bulk_acknowledge(client, db_session):
    alert1 = Alert(
        object_id="TEST-BULK-1",
        object_type="drone",
        alert_type="Airspace Breach",
        simulated_time=12.0,
        is_synthetic=True,
        status="new"
    )
    alert2 = Alert(
        object_id="TEST-BULK-2",
        object_type="vehicle",
        alert_type="Zone Breach",
        simulated_time=13.0,
        is_synthetic=True,
        status="new"
    )
    db_session.add(alert1)
    db_session.add(alert2)
    db_session.commit()

    # Test single idempotent acknowledge
    res1 = client.patch(f"/api/alerts/{alert1.id}/acknowledge")
    assert res1.status_code == 200
    assert res1.json()["status"] == "acknowledged"

    # Repeat call: must return 200 idempotently
    res1_repeat = client.patch(f"/api/alerts/{alert1.id}/acknowledge")
    assert res1_repeat.status_code == 200
    assert res1_repeat.json()["status"] == "acknowledged"

    # Test bulk acknowledge-all
    res_bulk = client.post("/api/alerts/acknowledge-all")
    assert res_bulk.status_code == 200
    statuses = {a["id"]: a["status"] for a in res_bulk.json()}
    assert statuses[alert1.id] == "acknowledged"
    assert statuses[alert2.id] == "acknowledged"

