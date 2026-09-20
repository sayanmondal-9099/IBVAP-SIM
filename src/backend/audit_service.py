import hashlib
from typing import List, Optional
from sqlalchemy.orm import Session
from .models import AuditLog

def calculate_hash(action: str, resource: str, outcome: str, timestamp_str: str, previous_hash: Optional[str]) -> str:
    """
    Calculates the SHA-256 hash for an audit log entry to ensure integrity.
    """
    data = f"{action}|{resource}|{outcome}|{timestamp_str}|{previous_hash or 'GENESIS'}"
    return hashlib.sha256(data.encode('utf-8')).hexdigest()

def create_audit_log(db: Session, actor: str, action: str, resource: str, outcome: str, reason: str = None, request_id: str = None, simulation_id: str = None) -> AuditLog:
    """
    Creates an append-only audit log entry and calculates its chain hash.
    """
    # Fetch the last audit log to get the previous hash
    last_log = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).first()
    previous_hash = last_log.current_hash if last_log else None
    
    new_log = AuditLog(
        actor=actor,
        action=action,
        resource=resource,
        outcome=outcome,
        reason=reason,
        request_id=request_id,
        previous_hash=previous_hash,
        is_synthetic=True,
        simulation_id=simulation_id
    )
    
    # We need the timestamp to be generated before hashing.
    # To keep things deterministic for the hash, we'll assign it here.
    from datetime import datetime, timezone
    new_log.timestamp = datetime.now(timezone.utc).replace(tzinfo=None)
    
    new_log.current_hash = calculate_hash(
        action=new_log.action,
        resource=new_log.resource,
        outcome=new_log.outcome,
        timestamp_str=new_log.timestamp.isoformat(),
        previous_hash=new_log.previous_hash
    )
    
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

def verify_chain_integrity(db: Session) -> bool:
    """
    Iterates over all audit logs chronologically to verify the chain of hashes.
    Returns True if valid, False if tampered.
    """
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.asc()).all()
    
    expected_previous_hash = None
    for log in logs:
        # Check chain link
        if log.previous_hash != expected_previous_hash:
            return False
            
        # Verify the current hash hasn't been tampered with
        calculated_hash = calculate_hash(
            action=log.action,
            resource=log.resource,
            outcome=log.outcome,
            timestamp_str=log.timestamp.isoformat(),
            previous_hash=log.previous_hash
        )
        
        if log.current_hash != calculated_hash:
            return False
            
        expected_previous_hash = log.current_hash
        
    return True
