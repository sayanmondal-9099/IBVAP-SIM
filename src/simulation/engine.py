import uuid
import random
import math
from typing import Callable, List, Dict, Any, Optional

from .models import (
    ScenarioConfig, 
    SimulationState, 
    Observation, 
    SyntheticObject,
    ScriptedEvent,
    SimulationEvent,
    SensorConfig
)
from .generators import (
    move_object, 
    navigate_to_waypoint,
    calculate_degraded_confidence, 
    generate_position_noise
)
from src.backend.database import SessionLocal
from src.backend.models import EdgeObservation

def point_in_polygon(x, y, polygon):
    n = len(polygon)
    inside = False
    p1x, p1y = polygon[0]
    for i in range(1, n + 1):
        p2x, p2y = polygon[i % n]
        if min(p1y, p2y) < y <= max(p1y, p2y) and x <= max(p1x, p2x):
            if p1y != p2y:
                xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
            if p1x == p2x or x <= xinters:
                inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def is_in_sensor_coverage(obj_x, obj_y, sensor: SensorConfig) -> bool:
    if sensor.status == "offline":
        return False
    dx = obj_x - sensor.x
    dy = obj_y - sensor.y
    dist = math.sqrt(dx**2 + dy**2)
    if dist > sensor.range:
        return False
    if sensor.sensor_type == "camera" and sensor.fov < 360:
        angle_to_obj = math.degrees(math.atan2(dx, dy))
        if angle_to_obj < 0:
            angle_to_obj += 360
        # Check if angle is within FOV centered at orientation
        diff = abs(angle_to_obj - sensor.orientation)
        if diff > 180:
            diff = 360 - diff
        if diff > (sensor.fov / 2):
            return False
    return True

class SimulationEngine:
    def __init__(self, config: ScenarioConfig, callback: Callable[[List[Observation]], None]):
        self.config = config
        self.callback = callback
        
        if self.config.simulation_id:
            self.simulation_id = self.config.simulation_id
        else:
            namespace = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')
            self.simulation_id = str(uuid.uuid5(namespace, str(self.config.seed)))
            
        self.rng = random.Random(self.config.seed)
        
        self.state = SimulationState(
            simulation_id=self.simulation_id,
            scenario_id=self.config.scenario_id,
            zones=self.config.zones,
            sensors=self.config.sensors
        )
        
        self.objects_state: Dict[str, dict] = {
            obj.id: {
                "x": obj.initial_x,
                "y": obj.initial_y,
                "altitude": obj.initial_altitude,
                "speed": obj.speed,
                "heading": obj.heading,
                "type": obj.object_type,
                "waypoints": obj.waypoints,
                "current_waypoint_idx": 0,
                "behavior": obj.behavior,
                "loop_waypoints": obj.loop_waypoints,
                "active_zones": set()
            }
            for obj in self.config.objects
        }
        
        self.edge_buffer_cache_size = 0
        self.active_degradation_end: Optional[float] = None
        self.active_disagreement_end: Optional[float] = None
        self.active_outage_end: Optional[float] = None
        self.clock_drift_offset = 0.0
        self.storage_pressure = False
        self.speed_multiplier: float = 1.0

    def start(self):
        self.state.is_running = True
        self.state.is_paused = False

    def pause(self):
        if self.state.is_running:
            self.state.is_paused = True

    def resume(self):
        if self.state.is_running:
            self.state.is_paused = False

    def stop(self):
        self.state.is_running = False
        self.active_degradation_end = None
        self.active_outage_end = None
        for s in self.state.sensors:
            s.status = "online"
        self._flush_buffer()

    def _flush_buffer(self):
        with SessionLocal() as db:
            edge_obs = db.query(EdgeObservation).filter(EdgeObservation.simulation_id == self.simulation_id).order_by(EdgeObservation.timestamp).all()
            if edge_obs:
                obs_list = []
                for db_obs in edge_obs:
                    obs = Observation(
                        simulation_id=db_obs.simulation_id,
                        scenario_id=db_obs.scenario_id,
                        timestamp=db_obs.timestamp,
                        tick_time=db_obs.tick_time,
                        object_id=db_obs.object_id,
                        object_type=db_obs.object_type,
                        x=db_obs.x,
                        y=db_obs.y,
                        altitude=db_obs.altitude,
                        speed=db_obs.speed,
                        heading=db_obs.heading,
                        confidence=db_obs.confidence,
                        quality_score=db_obs.quality_score,
                        distance=db_obs.distance,
                        uncertainty=db_obs.uncertainty,
                        sensor_id=db_obs.sensor_id,
                        site_id=db_obs.site_id,
                        sensor_type=db_obs.sensor_type,
                        is_synthetic=db_obs.is_synthetic
                    )
                    obs_list.append(obs)
                self.callback(obs_list)
                
                db.query(EdgeObservation).filter(EdgeObservation.simulation_id == self.simulation_id).delete()
                db.commit()
                self.edge_buffer_cache_size = 0

    def tick(self, delta_time: Optional[float] = None):
        if not self.state.is_running or self.state.is_paused:
            return

        dt = delta_time if delta_time is not None else (self.config.tick_rate * self.speed_multiplier)

        if self.state.current_tick >= self.config.duration:
            self.stop()
            return

        self._process_events(dt)

        # Check degradation recovery (DEGRADED -> RECOVERY -> HEALTHY)
        if self.active_degradation_end is not None and self.state.current_tick >= self.active_degradation_end:
            self.active_degradation_end = None
            for s in self.state.sensors:
                if s.sensor_type == "camera" and s.status == "degraded":
                    s.status = "online"
            self.state.simulation_events.append(SimulationEvent(
                id=str(uuid.uuid4()),
                simulation_id=self.simulation_id,
                timestamp=self.state.current_tick + self.clock_drift_offset,
                tick_time=self.state.current_tick,
                event_type="sensor_recovery",
                description="Camera sensors recovered to healthy state"
            ))

        # Check outage recovery (OFFLINE -> HEALTHY)
        if self.active_outage_end is not None and self.state.current_tick >= self.active_outage_end:
            self.active_outage_end = None
            for s in self.state.sensors:
                if s.status == "offline":
                    s.status = "online"
            self.state.simulation_events.append(SimulationEvent(
                id=str(uuid.uuid4()),
                simulation_id=self.simulation_id,
                timestamp=self.state.current_tick + self.clock_drift_offset,
                tick_time=self.state.current_tick,
                event_type="sensor_recovery",
                description="Sensors recovered to healthy state from outage"
            ))

        observations = []
        is_degraded = (
            self.active_degradation_end is not None 
            and self.state.current_tick < self.active_degradation_end
        ) or self.storage_pressure
        
        is_outage = (
            self.active_outage_end is not None 
            and self.state.current_tick < self.active_outage_end
        )
        
        for obj_id, obj_data in self.objects_state.items():
            # Update Position
            if obj_data["behavior"] == "waypoint" and obj_data["waypoints"]:
                wp_idx = obj_data["current_waypoint_idx"]
                if wp_idx < len(obj_data["waypoints"]):
                    wp = obj_data["waypoints"][wp_idx]
                    speed = wp.speed if wp.speed else obj_data["speed"]
                    new_x, new_y, new_heading, reached = navigate_to_waypoint(
                        obj_data["x"], obj_data["y"], speed, wp.x, wp.y, dt
                    )
                    obj_data["x"] = new_x
                    obj_data["y"] = new_y
                    obj_data["heading"] = new_heading
                    if reached:
                        obj_data["current_waypoint_idx"] += 1
                        if obj_data["current_waypoint_idx"] >= len(obj_data["waypoints"]) and obj_data["loop_waypoints"]:
                            obj_data["current_waypoint_idx"] = 0
                else:
                    # Trajectory continues naturally across sovereign depth
                    new_x, new_y = move_object(
                        obj_data["x"], obj_data["y"], obj_data["speed"], obj_data["heading"], dt
                    )
                    obj_data["x"] = new_x
                    obj_data["y"] = new_y
            elif obj_data["behavior"] == "loiter":
                # minimal random movement
                obj_data["heading"] += self.rng.uniform(-30, 30)
                new_x, new_y = move_object(
                    obj_data["x"], obj_data["y"], obj_data["speed"] * 0.2, obj_data["heading"], dt
                )
                obj_data["x"] = new_x
                obj_data["y"] = new_y
            else:
                new_x, new_y = move_object(
                    obj_data["x"], obj_data["y"], obj_data["speed"], obj_data["heading"], dt
                )
                obj_data["x"] = new_x
                obj_data["y"] = new_y

            # Zone checks
            current_zones = set()
            for zone in self.state.zones:
                if zone.points and len(zone.points) >= 3 and point_in_polygon(obj_data["x"], obj_data["y"], zone.points):
                    current_zones.add(zone.id)
                elif zone.center and zone.radius:
                    dist = math.sqrt((obj_data["x"] - zone.center[0])**2 + (obj_data["y"] - zone.center[1])**2)
                    if dist <= zone.radius:
                        current_zones.add(zone.id)
            
            entered = current_zones - obj_data["active_zones"]
            exited = obj_data["active_zones"] - current_zones
            
            for z_id in entered:
                self.state.simulation_events.append(SimulationEvent(
                    id=str(uuid.uuid4()),
                    simulation_id=self.simulation_id,
                    timestamp=self.state.current_tick + self.clock_drift_offset,
                    tick_time=self.state.current_tick,
                    event_type="zone_entry",
                    description=f"{obj_data['type'].upper()} {obj_id} entered zone {z_id}",
                    related_track_id=obj_id,
                    related_zone_id=z_id
                ))
            
            for z_id in exited:
                self.state.simulation_events.append(SimulationEvent(
                    id=str(uuid.uuid4()),
                    simulation_id=self.simulation_id,
                    timestamp=self.state.current_tick + self.clock_drift_offset,
                    tick_time=self.state.current_tick,
                    event_type="zone_exit",
                    description=f"{obj_data['type'].upper()} {obj_id} exited zone {z_id}",
                    related_track_id=obj_id,
                    related_zone_id=z_id
                ))
                
            obj_data["active_zones"] = current_zones

            if is_outage:
                continue

            # Sensor checks
            seen_by_camera = False
            seen_by_radar = False
            camera_conf = 0.0
            
            for sensor in self.state.sensors:
                if is_in_sensor_coverage(obj_data["x"], obj_data["y"], sensor):
                    if sensor.sensor_type == "camera":
                        seen_by_camera = True
                        conf = calculate_degraded_confidence(0.9, is_degraded or sensor.status=="degraded", self.rng)
                        camera_conf = max(camera_conf, conf)
                        obs_x, obs_y = generate_position_noise(obj_data["x"], obj_data["y"], is_degraded or sensor.status=="degraded", self.rng)
                        obs = Observation(
                            simulation_id=self.simulation_id,
                            scenario_id=self.config.scenario_id,
                            timestamp=self.state.current_tick + self.clock_drift_offset,
                            tick_time=self.state.current_tick,
                            object_id=obj_id,
                            object_type=obj_data["type"],
                            x=obs_x, y=obs_y, altitude=obj_data["altitude"], speed=obj_data["speed"], heading=obj_data["heading"],
                            confidence=conf, quality_score=0.5 if is_degraded else 1.0,
                            distance=math.sqrt(obs_x**2 + obs_y**2), uncertainty=10.0 if is_degraded else 2.0,
                            sensor_id=sensor.id, site_id="site_alpha", sensor_type="camera", is_synthetic=True
                        )
                        observations.append(obs)
                    elif sensor.sensor_type == "radar":
                        seen_by_radar = True
                        obs_x, obs_y = generate_position_noise(obj_data["x"], obj_data["y"], False, self.rng)
                        obs = Observation(
                            simulation_id=self.simulation_id,
                            scenario_id=self.config.scenario_id,
                            timestamp=self.state.current_tick + self.clock_drift_offset,
                            tick_time=self.state.current_tick,
                            object_id=obj_id,
                            object_type=obj_data["type"],
                            x=obs_x, y=obs_y, altitude=obj_data["altitude"], speed=obj_data["speed"], heading=obj_data["heading"],
                            confidence=0.8, quality_score=1.0,
                            distance=math.sqrt(obs_x**2 + obs_y**2), uncertainty=5.0,
                            sensor_id=sensor.id, site_id="site_alpha", sensor_type="radar", is_synthetic=True
                        )
                        observations.append(obs)
                        
            # Emit fused observation if seen by either
            if seen_by_camera or seen_by_radar:
                final_conf = 1.0
                if seen_by_radar and seen_by_camera:
                    final_conf = (camera_conf + 0.8) / 2 + 0.1
                elif seen_by_radar:
                    final_conf = 0.7
                elif seen_by_camera:
                    final_conf = camera_conf
                
                final_conf = min(1.0, final_conf)
                
                obs = Observation(
                    simulation_id=self.simulation_id,
                    scenario_id=self.config.scenario_id,
                    timestamp=self.state.current_tick + self.clock_drift_offset,
                    tick_time=self.state.current_tick,
                    object_id=obj_id,
                    object_type=obj_data["type"],
                    x=obj_data["x"], y=obj_data["y"], altitude=obj_data["altitude"], speed=obj_data["speed"], heading=obj_data["heading"],
                    confidence=final_conf, quality_score=1.0 if not is_degraded else 0.5,
                    distance=math.sqrt(obj_data["x"]**2 + obj_data["y"]**2), uncertainty=2.0 if seen_by_camera and not is_degraded else 10.0,
                    sensor_id="sim_fused_01", site_id="site_alpha", sensor_type="fused", is_synthetic=True
                )
                observations.append(obs)

        # 3. Handle Network State and Queuing
        if self.state.network_status == "offline":
            if observations:
                with SessionLocal() as db:
                    for obs in observations:
                        db_obs = EdgeObservation(
                            simulation_id=obs.simulation_id, scenario_id=obs.scenario_id, timestamp=obs.timestamp, tick_time=obs.tick_time,
                            object_id=obs.object_id, object_type=obs.object_type, x=obs.x, y=obs.y, altitude=obs.altitude,
                            speed=obs.speed, heading=obs.heading, confidence=obs.confidence, quality_score=obs.quality_score,
                            distance=obs.distance, uncertainty=obs.uncertainty, sensor_id=obs.sensor_id, site_id=obs.site_id,
                            sensor_type=obs.sensor_type, is_synthetic=obs.is_synthetic
                        )
                        db.add(db_obs)
                    db.commit()
                    self.edge_buffer_cache_size += len(observations)
        else:
            if self.edge_buffer_cache_size > 0:
                self._flush_buffer()
            if observations:
                self.callback(observations)

        self.state.current_tick += dt

    def _process_events(self, dt: float):
        for event in self.config.scripted_events:
            if self.state.current_tick <= event.timestamp < (self.state.current_tick + dt):
                self._execute_event(event)
                
                # Push event to timeline
                self.state.simulation_events.append(SimulationEvent(
                    id=str(uuid.uuid4()),
                    simulation_id=self.simulation_id,
                    timestamp=self.state.current_tick,
                    tick_time=self.state.current_tick,
                    event_type=event.event_type,
                    description=f"Scripted event: {event.event_type.upper()}"
                ))

    def _execute_event(self, event: ScriptedEvent):
        if event.event_type == "network_failure":
            self.state.network_status = "offline"
        elif event.event_type == "network_recovery":
            self.state.network_status = "online"
        elif event.event_type == "camera_degradation":
            duration = event.parameters.get("duration", 10.0)
            self.active_degradation_end = self.state.current_tick + duration
            for s in self.state.sensors:
                if s.sensor_type == "camera":
                    s.status = "degraded"
        elif event.event_type == "radar_disagreement":
            self.active_disagreement_end = self.state.current_tick + event.parameters.get("duration", 10.0)
        elif event.event_type in ["camera_outage", "radar_loss", "sensor_unavailable"]:
            self.active_outage_end = self.state.current_tick + event.parameters.get("duration", 10.0)
            for s in self.state.sensors:
                if s.sensor_type == event.event_type.split("_")[0]:
                    s.status = "offline"
        elif event.event_type == "clock_drift":
            self.clock_drift_offset = event.parameters.get("offset", 5.0)
        elif event.event_type == "storage_pressure":
            self.storage_pressure = event.parameters.get("active", True)
        elif event.event_type == "edge_restart":
            self.state.network_status = "offline"
            self.config.scripted_events.append(ScriptedEvent(
                timestamp=self.state.current_tick + event.parameters.get("duration", 5.0),
                event_type="network_recovery"
            ))
