import asyncio
from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends
from pydantic import BaseModel
from src.simulation.engine import SimulationEngine
from src.simulation.scenarios import (
    protocol_normal,
    protocol_drone,
    protocol_vehicle,
    protocol_multi_threat,
    protocol_emergency,
    protocol_sensor_degraded
)
from src.simulation.models import Observation
from src.backend.schemas import (
    SimulationStartResponse,
    SimulationStopResponse,
    SimulationSyncResponse,
    SimulationStateResponse,
    EnvironmentResponse,
    TrackResponse
)
from src.backend.database import get_db
from sqlalchemy.orm import Session
from src.backend.models import Alert
from src.backend.alert_engine import process_observation
from src.backend.audit_service import create_audit_log

router = APIRouter(prefix="/api/simulation", tags=["Simulation"])

import logging
logger = logging.getLogger("simulation")

# Global state for prototype
active_engine: SimulationEngine = None
engine_task: asyncio.Task = None
connected_websockets: List[WebSocket] = []
current_speed_multiplier: float = 1.0

# Track previous positions for fence crossing
object_positions = {}

def process_observations(observations: List[Observation], is_offline_sync: bool = False):
    """Callback for the simulation engine. Sends telemetry and checks alerts."""
    from src.backend.database import SessionLocal
    
    new_alerts = []
    
    # Alert rules must be evaluated on fused observations to avoid raw multi-sensor alert flurries.
    # Fall back to raw observations only if no fused observation is present.
    fused_obs = [o for o in observations if o.sensor_type == "fused"]
    alert_candidates = fused_obs if fused_obs else observations

    try:
        with SessionLocal() as db:
            for obs in alert_candidates:
                obs_dict = obs.model_dump()
                obs_dict['timestamp'] = obs.tick_time
                prev_pos = object_positions.get(obs.object_id)
                
                alert_payload = process_observation(obs_dict, prev_pos)
                
                # Create Alert if rule violated and not suppressed
                if alert_payload:
                    new_alert = Alert(
                        object_id=alert_payload["object_id"],
                        object_type=alert_payload["object_type"],
                        alert_type=alert_payload["alert_type"],
                        priority_score=alert_payload["priority_score"],
                        priority_band=alert_payload["priority_band"],
                        reason_code=alert_payload["reason_code"],
                        persistence_time=alert_payload["persistence_time"],
                        corroboration_count=alert_payload["corroboration_count"],
                        simulated_time=alert_payload["simulated_time"],
                        is_synthetic=True,
                        simulation_id=alert_payload.get("simulation_id"),
                        scenario_id=alert_payload.get("scenario_id"),
                        sensor_id=alert_payload.get("sensor_id"),
                        site_id=alert_payload.get("site_id")
                    )
                    db.add(new_alert)
                    db.commit()
                    db.refresh(new_alert)
                    new_alerts.append(new_alert.object_id)
                    
                    # Audit log for alert generation
                    create_audit_log(
                        db=db,
                        actor="alert_engine",
                        action="generate_alert",
                        resource=f"Alert_{new_alert.id}",
                        outcome="success",
                        reason=alert_payload["reason_code"],
                        simulation_id=alert_payload.get("simulation_id")
                    )
    except Exception as db_err:
        logger.error("Error persisting alerts/audit logs during simulation tick: %s", db_err, exc_info=True)

    # Update position tracking for next tick
    for obs in alert_candidates:
        object_positions[obs.object_id] = {"x": obs.x, "y": obs.y}

    # Broadcast telemetry
    if not connected_websockets:
        return
        
    payload = {
        "type": "telemetry",
        "observations": [obs.model_dump() for obs in observations],
        "new_alerts": new_alerts
    }
    
    # Fire and forget broadcasting
    for ws in list(connected_websockets):
        asyncio.create_task(send_message(ws, payload))

async def send_message(ws: WebSocket, payload: dict):
    try:
        await ws.send_json(payload)
    except Exception:
        if ws in connected_websockets:
            connected_websockets.remove(ws)

async def run_simulation_loop(engine: SimulationEngine):
    global current_speed_multiplier
    tick_interval = 0.25
    try:
        while engine and engine.state.is_running:
            mult = max(1.0, getattr(engine, "speed_multiplier", current_speed_multiplier))
            sim_dt = tick_interval * mult
            engine.tick(delta_time=sim_dt)
            await asyncio.sleep(tick_interval)
    except asyncio.CancelledError:
        pass
    except Exception as e:
        logger.error("Simulation loop crashed with unexpected error: %s", e, exc_info=True)
        if engine and engine.state:
            engine.state.is_running = False

class StartRequest(BaseModel):
    scenario: str
    speed_multiplier: float = 1.0
    anomaly_detection_enabled: bool = False

class SpeedRequest(BaseModel):
    speed_multiplier: float

@router.post("/start", response_model=SimulationStartResponse)
async def start_simulation(req: StartRequest):
    global active_engine, engine_task, object_positions
    
    scenarios = {
        "PROTOCOL-NORMAL": protocol_normal,
        "PROTOCOL-DRONE": protocol_drone,
        "PROTOCOL-VEHICLE": protocol_vehicle,
        "PROTOCOL-MULTI-THREAT": protocol_multi_threat,
        "PROTOCOL-EMERGENCY": protocol_emergency,
        "PROTOCOL-SENSOR-DEGRADED": protocol_sensor_degraded,
    }
    
    if req.scenario not in scenarios:
        raise HTTPException(status_code=400, detail="Invalid scenario")
        
    config = scenarios[req.scenario]()
    
    if engine_task and not engine_task.done():
        engine_task.cancel()
    if active_engine:
        active_engine.stop()
            
    object_positions.clear()
    current_speed_multiplier = req.speed_multiplier
    active_engine = SimulationEngine(config, process_observations)
    active_engine.speed_multiplier = req.speed_multiplier
    active_engine.anomaly_detection_enabled = req.anomaly_detection_enabled
    
    if req.anomaly_detection_enabled:
        # Inject synthetic anomalous object that triggers alert_engine's ANOMALY rule
        active_engine.objects_state["anomaly_lead"] = {
            "x": -520.0,
            "y": 60.0,
            "altitude": 140.0,
            "speed": 22.0,
            "heading": 90.0,
            "type": "unknown aerial object",
            "waypoints": [],
            "current_waypoint_idx": 0,
            "behavior": "linear",
            "loop_waypoints": False,
            "active_zones": set()
        }
        
    active_engine.start()
    
    engine_task = asyncio.create_task(run_simulation_loop(active_engine))
    
    return {"status": "started", "scenario": req.scenario, "simulation_id": active_engine.simulation_id}

@router.post("/stop", response_model=SimulationStopResponse)
async def stop_simulation():
    global active_engine, engine_task, object_positions
    object_positions.clear()
    if active_engine:
        active_engine.stop()
        active_engine = None
    if engine_task:
        engine_task.cancel()
        engine_task = None
    return {"status": "stopped"}

@router.post("/pause", response_model=SimulationStopResponse)
async def pause_simulation():
    global active_engine
    if active_engine:
        active_engine.pause()
    return {"status": "paused"}

@router.post("/resume", response_model=SimulationStopResponse)
async def resume_simulation():
    global active_engine
    if active_engine:
        active_engine.resume()
    return {"status": "resumed"}

@router.post("/speed")
async def update_speed(req: SpeedRequest):
    global active_engine, current_speed_multiplier
    current_speed_multiplier = req.speed_multiplier
    if active_engine:
        active_engine.speed_multiplier = req.speed_multiplier
    return {"status": "speed_updated", "speed_multiplier": req.speed_multiplier}


@router.post("/sync_events", response_model=SimulationSyncResponse)
async def sync_events(observations: List[Observation]):
    """Endpoint for edge simulator to bulk upload offline queued events upon recovery."""
    process_observations(observations, is_offline_sync=True)
    return {"status": "synced", "count": len(observations)}

@router.get("/state", response_model=SimulationStateResponse)
async def get_simulation_state():
    if not active_engine:
        return {
            "is_running": False,
            "is_paused": False,
            "simulation_id": None,
            "network_status": "online",
            "tick_rate": 1.0,
            "tick_count": 0,
            "speed_multiplier": current_speed_multiplier,
            "anomaly_detection_enabled": False
        }
    
    speed_mult = getattr(active_engine, "speed_multiplier", current_speed_multiplier)
    anomaly_flag = getattr(active_engine, "anomaly_detection_enabled", False)
    return {
        "is_running": active_engine.state.is_running,
        "is_paused": getattr(active_engine.state, 'is_paused', False),
        "simulation_id": active_engine.simulation_id,
        "network_status": active_engine.state.network_status,
        "scenario": active_engine.config.scenario_id,
        "tick_rate": active_engine.config.tick_rate,
        "tick_count": int(active_engine.state.current_tick),
        "speed_multiplier": speed_mult,
        "anomaly_detection_enabled": anomaly_flag
    }

@router.get("/environment", response_model=EnvironmentResponse)
async def get_simulation_environment():
    """Returns the current synthetic environment and sensor status."""
    from src.simulation.scenarios import get_standard_sensors, get_standard_zones
    
    if not active_engine:
        return {
            "sensors": [s.model_dump() for s in get_standard_sensors()],
            "zones": [z.model_dump() for z in get_standard_zones()],
            "events": []
        }
        
    sensors = [s.model_dump() for s in active_engine.state.sensors]
    zones = [z.model_dump() for z in active_engine.state.zones]
    events = [e.model_dump() for e in active_engine.state.simulation_events]
    
    # Prune old events (keep last 50)
    events = events[-50:]
    
    return {"sensors": sensors, "zones": zones, "events": events}

@router.get("/tracks", response_model=List[TrackResponse])
async def get_simulation_tracks():
    if not active_engine:
        return []
    
    tracks = []
    for obj_id, obj_data in active_engine.objects_state.items():
        tracks.append({
            "id": obj_id,
            "object_type": obj_data["type"],
            "x": obj_data["x"],
            "y": obj_data["y"],
            "altitude": obj_data["altitude"],
            "speed": obj_data["speed"],
            "heading": obj_data["heading"]
        })
    return tracks

@router.websocket("/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await websocket.accept()
    connected_websockets.append(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        if websocket in connected_websockets:
            connected_websockets.remove(websocket)
