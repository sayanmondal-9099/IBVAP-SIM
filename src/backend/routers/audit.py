from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.backend.database import get_db
from src.backend.models import AuditLog
from src.backend.schemas import AuditLogResponse, AuditVerifyResponse
from src.backend.audit_service import verify_chain_integrity

router = APIRouter(prefix="/api/audit", tags=["Audit"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()

@router.get("/verify", response_model=AuditVerifyResponse)
def verify_audit_chain(db: Session = Depends(get_db)):
    is_valid = verify_chain_integrity(db)
    if is_valid:
        return {"status": "VERIFIED", "message": "Audit chain integrity verified."}
    else:
        return {"status": "INVALID", "message": "Audit chain integrity check failed."}
