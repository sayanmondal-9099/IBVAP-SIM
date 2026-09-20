from fastapi import APIRouter, Depends, HTTPException, Header, Response, status
from sqlalchemy.orm import Session
from src.backend.database import get_db
from src.backend.models import MockTransfer, Incident, AuditLog
from src.backend.schemas import MockTransferRequest, MockTransferResponse
from src.backend.audit_service import create_audit_log

router = APIRouter(prefix="/api/mock-receiver", tags=["Mock Base"])

@router.post("", response_model=MockTransferResponse, responses={
    400: {"description": "Missing required header X-Simulation-ID or non-synthetic payload"},
    404: {"description": "Incident not found"},
    409: {"description": "Incident already transferred"}
})
def receive_mock_transfer(
    payload: MockTransferRequest, 
    response: Response,
    x_simulation_id: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Mock endpoint simulating a sanitized handoff to an external system.
    """
    # 1. Validate Simulation Headers
    if not x_simulation_id:
        raise HTTPException(status_code=400, detail="Missing required header X-Simulation-ID")
        
    # 2. Validate Payload constraints
    if not payload.is_synthetic:
        raise HTTPException(status_code=400, detail="Cannot transfer non-synthetic payloads to mock receiver")
        
    # 3. Check Incident
    incident = db.query(Incident).filter(Incident.id == payload.incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    # Check for duplicate transfer
    existing_transfer = db.query(MockTransfer).filter(MockTransfer.incident_id == payload.incident_id).first()
    if existing_transfer:
        raise HTTPException(status_code=409, detail="Incident already transferred")

    # 4. Acknowledge and Persist
    transfer = MockTransfer(
        incident_id=payload.incident_id,
        is_synthetic=True
    )
    db.add(transfer)
    
    incident.status = "transferred"
    
    create_audit_log(
        db=db,
        actor="system",
        action="mock_transfer",
        resource=f"incident:{payload.incident_id}",
        outcome="success"
    )
    
    # Return 202 Accepted as specified
    response.status_code = status.HTTP_202_ACCEPTED
    return {"status": "accepted"}
