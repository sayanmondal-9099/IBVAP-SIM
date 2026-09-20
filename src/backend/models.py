import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Float, ForeignKey, Integer
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class EdgeObservation(Base):
    """Durable offline queue table for the edge simulation."""
    __tablename__ = "edge_observations"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    simulation_id = Column(String, index=True)
    scenario_id = Column(String)
    timestamp = Column(Float)
    tick_time = Column(Float)
    object_id = Column(String)
    object_type = Column(String)
    x = Column(Float)
    y = Column(Float)
    altitude = Column(Float, nullable=True)
    speed = Column(Float)
    heading = Column(Float)
    confidence = Column(Float)
    quality_score = Column(Float)
    distance = Column(Float)
    uncertainty = Column(Float)
    sensor_id = Column(String)
    site_id = Column(String)
    sensor_type = Column(String)
    is_synthetic = Column(Boolean, default=True)

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    simulation_id = Column(String, index=True, nullable=True)
    scenario_id = Column(String, nullable=True)
    sensor_id = Column(String, nullable=True)
    site_id = Column(String, nullable=True)
    
    object_id = Column(String, index=True)
    object_type = Column(String)
    alert_type = Column(String)
    status = Column(String, default="new")  # new, acknowledged, escalated, dismissed
    
    priority_score = Column(Float, default=0.0)
    priority_band = Column(String, default="P4")
    reason_code = Column(String, nullable=True)
    confidence = Column(Float, default=1.0)
    quality = Column(Float, default=1.0)
    persistence_time = Column(Float, default=0.0)
    corroboration_count = Column(Integer, default=0)
    
    # Human Review Fields
    review_decision = Column(String, nullable=True)
    review_notes = Column(String, nullable=True)
    reviewer_id = Column(String, nullable=True)
    
    # Strictly enforced simulation fields
    is_synthetic = Column(Boolean, default=True, nullable=False)
    simulated_time = Column(Float)
    receipt_time = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    simulation_id = Column(String, index=True, nullable=True)
    alert_id = Column(String, ForeignKey("alerts.id"))
    status = Column(String, default="open")  # open, under_review, resolved, unresolved
    
    # Resolution Fields
    resolution = Column(String, nullable=True)
    resolution_notes = Column(String, nullable=True)
    
    is_synthetic = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    simulation_id = Column(String, index=True, nullable=True)
    actor = Column(String, nullable=False, default="system")
    action = Column(String, nullable=False)
    resource = Column(String, nullable=False) # Maps to entity_type + entity_id roughly
    outcome = Column(String, nullable=False, default="success")
    reason = Column(String, nullable=True)
    request_id = Column(String, nullable=True)
    
    previous_hash = Column(String, nullable=True)
    current_hash = Column(String, nullable=False)
    
    is_synthetic = Column(Boolean, default=True, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

class MockTransfer(Base):
    __tablename__ = "mock_transfers"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=False)
    is_synthetic = Column(Boolean, default=True, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
