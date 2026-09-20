from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

# Types
ObjectType = Literal[
    "person",
    "vehicle",
    "truck",
    "drone",
    "helicopter",
    "aircraft",
    "bird",
    "bird-like mechanical object",
    "unknown aerial object"
]

EventType = Literal[
    "network_failure",
    "network_recovery",
    "camera_degradation",
    "radar_disagreement",
    "radar_loss",
    "camera_outage",
    "storage_pressure",
    "clock_drift",
    "edge_restart",
    "sensor_unavailable",
    "sensor_recovery",
    "zone_entry",
    "zone_exit",
    "correlation_lost",
    "correlation_established",
    "track_created"
]

class Waypoint(BaseModel):
    """A target point for a synthetic object to navigate towards."""
    x: float
    y: float
    speed: Optional[float] = None # Optional speed override

class SyntheticZone(BaseModel):
    """A defined area in the simulation."""
    id: str = Field(..., description="Unique zone ID")
    name: str = Field(..., description="Human readable name")
    zone_type: Literal["restricted", "warning", "virtual_fence"] = "restricted"
    points: List[tuple[float, float]] = Field(default_factory=list, description="Polygon vertices (x, y)")
    radius: Optional[float] = Field(None, description="If circle, the radius")
    center: Optional[tuple[float, float]] = Field(None, description="If circle, the center")

class SensorConfig(BaseModel):
    """Configuration for a synthetic sensor in the simulation."""
    id: str = Field(..., description="Unique sensor ID")
    sensor_type: Literal["camera", "radar"] = Field(..., description="Type of sensor")
    x: float = Field(..., description="X location")
    y: float = Field(..., description="Y location")
    range: float = Field(..., description="Maximum range in meters")
    fov: float = Field(360.0, description="Field of view in degrees (e.g. 90 for camera)")
    orientation: float = Field(0.0, description="Center orientation for FOV (0=North)")
    status: Literal["online", "degraded", "offline"] = "online"

class SimulationEvent(BaseModel):
    """An event that occurred during the simulation runtime."""
    id: str = Field(..., description="Unique event ID")
    simulation_id: str = Field(..., description="Associated simulation run")
    timestamp: float = Field(..., description="Absolute time of event")
    tick_time: float = Field(..., description="Tick time of event")
    event_type: EventType = Field(..., description="Type of event")
    description: str = Field(..., description="Human readable description")
    related_track_id: Optional[str] = Field(None, description="Track related to this event")
    related_zone_id: Optional[str] = Field(None, description="Zone related to this event")
    related_sensor_id: Optional[str] = Field(None, description="Sensor related to this event")

class SyntheticObject(BaseModel):
    """Configuration for an object in the simulation."""
    id: str = Field(..., description="Unique identifier for the object")
    object_type: ObjectType = Field(..., description="Type of the simulated object")
    initial_x: float = Field(0.0, description="Initial X coordinate (meters)")
    initial_y: float = Field(0.0, description="Initial Y coordinate (meters)")
    initial_altitude: float = Field(0.0, description="Initial altitude (meters)")
    speed: float = Field(1.0, description="Speed in meters per second")
    heading: float = Field(0.0, description="Heading in degrees (0 = North, 90 = East)")
    waypoints: List[Waypoint] = Field(default_factory=list, description="List of target waypoints for movement")
    loop_waypoints: bool = Field(False, description="If true, object will loop waypoints indefinitely")
    behavior: Literal["linear", "waypoint", "loiter"] = Field("linear", description="Movement behavior type")
    
class ScriptedEvent(BaseModel):
    """An event triggered at a specific timestamp in the scenario."""
    timestamp: float = Field(..., description="Seconds into the simulation to trigger")
    event_type: EventType = Field(..., description="Type of event")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Event parameters")

class ScenarioConfig(BaseModel):
    """Configuration defining a synthetic scenario."""
    scenario_id: str = Field(..., description="Identifier for the scenario")
    simulation_id: Optional[str] = Field(None, description="Optional explicit simulation ID. If None, deterministically generated from seed.")
    name: str = Field(..., description="Human-readable name")
    seed: int = Field(42, description="Random seed for deterministic generation")
    duration: float = Field(60.0, description="Total duration of the simulation in seconds")
    tick_rate: float = Field(1.0, description="Tick interval in seconds")
    objects: List[SyntheticObject] = Field(default_factory=list)
    zones: List[SyntheticZone] = Field(default_factory=list)
    sensors: List[SensorConfig] = Field(default_factory=list)
    scripted_events: List[ScriptedEvent] = Field(default_factory=list)

class Observation(BaseModel):
    """A generated synthetic observation simulating a sensor reading."""
    simulation_id: str = Field(..., description="ID of the current simulation run")
    scenario_id: str = Field(..., description="ID of the scenario")
    timestamp: float = Field(..., description="Absolute time of observation")
    tick_time: float = Field(..., description="Simulation time elapsed (seconds)")
    object_id: str = Field(..., description="ID of the object observed")
    object_type: ObjectType = Field(..., description="Type of object")
    
    x: float = Field(..., description="X coordinate")
    y: float = Field(..., description="Y coordinate")
    altitude: float = Field(0.0, description="Altitude")
    speed: float = Field(..., description="Speed")
    heading: float = Field(..., description="Heading")
    
    confidence: float = Field(1.0, description="Confidence score [0.0 - 1.0]")
    quality_score: float = Field(1.0, description="Quality score representing environmental or sensor degradation")
    sensor_id: str = Field("sim_fused_01", description="Identifier for the simulated sensor")
    site_id: str = Field("site_alpha", description="Identifier for the simulated site")
    distance: float = Field(0.0, description="Calculated distance in meters")
    uncertainty: float = Field(0.0, description="Positional uncertainty in meters")
    sensor_type: Literal["camera", "radar", "fused"] = Field("fused", description="Simulated sensor type")
    
    # NON-NEGOTIABLE SAFETY BOUNDARY FLAG
    is_synthetic: bool = Field(True, description="Strict flag indicating this is NOT real data. Must always be True.")

class SimulationState(BaseModel):
    """Current state of the simulation engine."""
    simulation_id: str
    scenario_id: str
    is_running: bool = False
    is_paused: bool = False
    current_tick: float = 0.0
    network_status: Literal["online", "offline"] = "online"
    active_events: List[str] = Field(default_factory=list)
    zones: List[SyntheticZone] = Field(default_factory=list)
    sensors: List[SensorConfig] = Field(default_factory=list)
    simulation_events: List[SimulationEvent] = Field(default_factory=list)
