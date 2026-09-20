import pytest
from fastapi.testclient import TestClient
from src.backend.main import app
from src.backend.database import Base, engine, get_db
from sqlalchemy.orm import sessionmaker
from src.backend.models import Alert
from src.backend.alert_engine import COOLDOWN_DICT

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    COOLDOWN_DICT.clear()
    yield
    Base.metadata.drop_all(bind=engine)

def test_offline_sync_events():
    # Simulate Edge buffer with 2 observations causing 2 distinct alerts
    observations = [
        {
            "simulation_id": "sim-123",
            "scenario_id": "network_failure",
            "timestamp": 1000.0,
            "tick_time": 1000.0,
            "object_id": "person-1",
            "object_type": "person",
            "x": 10.0,
            "y": 25.0, # Zone Entry
            "altitude": 0.0,
            "speed": 2.0,
            "heading": 0.0,
            "confidence": 0.9,
            "sensor_type": "fused",
            "is_synthetic": True
        },
        {
            "simulation_id": "sim-123",
            "scenario_id": "network_failure",
            "timestamp": 1005.0,
            "tick_time": 1005.0,
            "object_id": "vehicle-1",
            "object_type": "vehicle",
            "x": 1.0, # Virtual fence crossing (assume prev_x < 0, but since prev_pos is tracked in memory, we need to send two to cross)
            "y": 0.0,
            "altitude": 0.0,
            "speed": 10.0,
            "heading": 0.0,
            "confidence": 0.9,
            "sensor_type": "fused",
            "is_synthetic": True
        }
    ]
    
    # We will just test that the sync_events endpoint accepts it and processes it.
    response = client.post("/api/simulation/sync_events", json=observations)
    assert response.status_code == 200
    assert response.json()["status"] == "synced"
    
    # Check DB for created alerts
    db = TestingSessionLocal()
    alerts = db.query(Alert).all()
    
    # Expect 1 alert (person-1 Zone Entry). vehicle-1 won't cross fence unless it had a prev_pos < 0.
    assert len(alerts) >= 1
    
    # Re-syncing the exact same observations at the same simulated time should NOT generate duplicates
    # because the deduplication logic (cooldown dictionary) will suppress them.
    # Wait, the deduplication suppresses based on sim_time. If sim_time is exactly the same, 
    # current_sim_time - last_time = 0 < 60, so it WILL suppress.
    response2 = client.post("/api/simulation/sync_events", json=observations)
    assert response2.status_code == 200
    
    alerts_after_second_sync = db.query(Alert).all()
    assert len(alerts_after_second_sync) == len(alerts)
    
    db.close()
