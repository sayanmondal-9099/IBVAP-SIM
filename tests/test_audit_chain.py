import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.backend.database import Base
from src.backend.audit_service import create_audit_log, verify_chain_integrity
from src.backend.models import AuditLog

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()

def test_audit_chain_validity(db_session):
    # Create 3 logs
    log1 = create_audit_log(db_session, "user1", "login", "auth", "success")
    log2 = create_audit_log(db_session, "system", "generate_alert", "Alert_1", "success")
    log3 = create_audit_log(db_session, "user1", "escalate_alert", "Alert_1", "success")
    
    # Verify chain
    is_valid = verify_chain_integrity(db_session)
    assert is_valid is True
    
    # Verify pointers
    assert log1.previous_hash is None
    assert log2.previous_hash == log1.current_hash
    assert log3.previous_hash == log2.current_hash

def test_audit_chain_tampering(db_session):
    # Create logs
    log1 = create_audit_log(db_session, "user1", "login", "auth", "success")
    log2 = create_audit_log(db_session, "system", "generate_alert", "Alert_1", "success")
    
    # Tamper with the action of the first log
    tampered_log = db_session.query(AuditLog).filter_by(id=log1.id).first()
    tampered_log.action = "malicious_action"
    db_session.commit()
    
    # Verification should now fail because current_hash won't match calculated hash
    is_valid = verify_chain_integrity(db_session)
    assert is_valid is False
