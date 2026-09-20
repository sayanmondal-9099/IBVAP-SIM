from typing import Optional, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class AlertBase(BaseModel):
    object_id: str
    object_type: str
    alert_type: str
    simulated_time: float

class AlertCreate(AlertBase):
    is_synthetic: bool = Field(True, description="Must be true for prototype")

class AlertResponse(AlertBase):
    id: str
    status: str
    priority_score: Optional[float] = 0.0
    priority_band: Optional[str] = "P4"
    reason_code: Optional[str] = None
    is_synthetic: bool
    review_decision: Optional[str] = None
    review_notes: Optional[str] = None
    reviewer_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AlertUpdate(BaseModel):
    status: str

class HumanReviewRequest(BaseModel):
    decision: str
    notes: Optional[str] = None
    reviewer_id: Optional[str] = "operator_01"

class IncidentResponse(BaseModel):
    id: str
    alert_id: str
    status: str
    resolution: Optional[str] = None
    resolution_notes: Optional[str] = None
    is_synthetic: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class IncidentResolveRequest(BaseModel):
    resolution: str
    notes: Optional[str] = None

class MockTransferRequest(BaseModel):
    incident_id: str
    alert_data: dict
    is_synthetic: bool = Field(True)

class AuditLogResponse(BaseModel):
    id: str
    actor: str
    action: str
    resource: str
    outcome: str
    reason: Optional[str] = None
    request_id: Optional[str] = None
    previous_hash: Optional[str] = None
    current_hash: str
    timestamp: datetime
    is_synthetic: bool

    model_config = ConfigDict(from_attributes=True)

class AuditVerifyResponse(BaseModel):
    status: str
    message: str

class SimulationStartResponse(BaseModel):
    status: str
    scenario: str
    simulation_id: str

class SimulationStopResponse(BaseModel):
    status: str

class SimulationSyncResponse(BaseModel):
    status: str
    count: int

class AlertEscalateResponse(BaseModel):
    status: str
    incident_id: str

class MockTransferResponse(BaseModel):
    status: str

class SimulationStateResponse(BaseModel):
    is_running: bool
    is_paused: bool = False
    simulation_id: Optional[str] = None
    network_status: str
    scenario: Optional[str] = None
    tick_rate: float
    tick_count: int
    speed_multiplier: float = 1.0
    anomaly_detection_enabled: bool = False

class EnvironmentResponse(BaseModel):
    sensors: list
    zones: list
    events: list

class TrackResponse(BaseModel):
    id: str
    object_type: str
    x: float
    y: float
    altitude: float
    speed: float
    heading: float
