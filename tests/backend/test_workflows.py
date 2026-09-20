import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from src.backend.models import Alert, Incident, AuditLog

def test_full_human_review_workflow(client: TestClient, db_session: Session):
    # 1. Create a synthetic alert
    alert = Alert(
        object_id="trk_999", 
        object_type="vehicle", 
        alert_type="loitering", 
        status="new",
        is_synthetic=True, 
        simulated_time=1.0
    )
    db_session.add(alert)
    db_session.commit()
    
    # 2. Get alerts
    alerts_response = client.get("/api/alerts")
    alerts = alerts_response.json()
    assert len(alerts) > 0
    alert_id = alert.id
    
    # 3. Acknowledge alert
    ack_response = client.patch(f"/api/alerts/{alert_id}/acknowledge")
    assert ack_response.status_code == 200
    assert ack_response.json()["status"] == "acknowledged"
    
    # 4. Human Review
    review_response = client.post(f"/api/alerts/{alert_id}/review", json={
        "decision": "CONFIRMED SIMULATION CLASS",
        "notes": "Looks like a vehicle in the simulation.",
        "reviewer_id": "operator_42"
    })
    assert review_response.status_code == 200
    assert review_response.json()["review_decision"] == "CONFIRMED SIMULATION CLASS"
    
    # 5. Escalate to Incident
    esc_response = client.post(f"/api/alerts/{alert_id}/escalate")
    assert esc_response.status_code == 200
    incident_id = esc_response.json()["incident_id"]
    
    # 6. Fetch Incident
    inc_response = client.get(f"/api/incidents/{incident_id}")
    assert inc_response.status_code == 200
    assert inc_response.json()["status"] == "open"
    
    # 7. Resolve Incident
    res_response = client.post(f"/api/incidents/{incident_id}/resolve", json={
        "resolution": "RESOLVED — CONFIRMED SIMULATION CLASS",
        "notes": "Resolved successfully."
    })
    assert res_response.status_code == 200
    assert res_response.json()["status"] == "resolved"
    assert res_response.json()["resolution"] == "RESOLVED — CONFIRMED SIMULATION CLASS"
    
    # 8. Verify Audit Chain
    audit_response = client.get("/api/audit/verify")
    assert audit_response.status_code == 200
    assert audit_response.json()["status"] == "VERIFIED"


