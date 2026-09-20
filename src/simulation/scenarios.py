from .models import ScenarioConfig, SyntheticObject, ScriptedEvent, SyntheticZone, SensorConfig, Waypoint

def get_standard_zones():
    return [
        SyntheticZone(
            id="zone_base",
            name="Base Perimeter",
            zone_type="restricted",
            points=[(-150, -150), (150, -150), (150, 150), (-150, 150)]
        ),
        SyntheticZone(
            id="fence_border",
            name="Virtual Border Fence",
            zone_type="virtual_fence",
            points=[(0, -500), (0, 500)]
        ),
        SyntheticZone(
            id="zone_intercept",
            name="Sovereign Intercept Corridor",
            zone_type="restricted",
            points=[(200, -350), (360, -350), (360, 350), (200, 350)]
        )
    ]

def get_standard_sensors():
    return [
        SensorConfig(id="cam_01", sensor_type="camera", x=0, y=400, range=250, fov=160, orientation=270),
        SensorConfig(id="cam_02", sensor_type="camera", x=0, y=200, range=250, fov=160, orientation=270),
        SensorConfig(id="cam_03", sensor_type="camera", x=0, y=0, range=250, fov=160, orientation=270),
        SensorConfig(id="cam_04", sensor_type="camera", x=0, y=-200, range=250, fov=160, orientation=270),
        SensorConfig(id="cam_05", sensor_type="camera", x=0, y=-400, range=250, fov=160, orientation=270),
        SensorConfig(id="radar_base", sensor_type="radar", x=0, y=0, range=700, fov=360)
    ]

def protocol_normal() -> ScenarioConfig:
    return ScenarioConfig(
        scenario_id="PROTOCOL-NORMAL", name="Protocol: Normal Operations", seed=1001, duration=300.0,
        objects=[
            SyntheticObject(id="bird_1", object_type="bird", initial_x=-160, initial_y=140, initial_altitude=45, behavior="loiter", speed=5.5),
            SyntheticObject(id="bird_2", object_type="bird", initial_x=-220, initial_y=-160, initial_altitude=55, behavior="loiter", speed=4.8),
            SyntheticObject(id="person_local", object_type="person", initial_x=30, initial_y=60, behavior="waypoint", speed=1.6, waypoints=[Waypoint(x=120, y=80), Waypoint(x=30, y=60)], loop_waypoints=True),
            SyntheticObject(id="person_herder", object_type="person", initial_x=-90, initial_y=-70, behavior="waypoint", speed=1.4, waypoints=[Waypoint(x=-40, y=-50), Waypoint(x=-90, y=-70)], loop_waypoints=True),
            SyntheticObject(id="civilian_car", object_type="vehicle", initial_x=-380, initial_y=240, behavior="waypoint", speed=13, waypoints=[Waypoint(x=-120, y=240), Waypoint(x=100, y=240), Waypoint(x=320, y=240)])
        ],
        zones=get_standard_zones(), sensors=get_standard_sensors()
    )

def protocol_drone() -> ScenarioConfig:
    return ScenarioConfig(
        scenario_id="PROTOCOL-DRONE", name="Protocol: Drone Incursion", seed=1002, duration=300.0,
        objects=[
            SyntheticObject(id="drone_lead", object_type="drone", initial_x=-620, initial_y=-80, initial_altitude=150, behavior="waypoint", speed=18, waypoints=[Waypoint(x=-350, y=-50), Waypoint(x=-120, y=-20), Waypoint(x=80, y=0), Waypoint(x=280, y=20), Waypoint(x=480, y=40)]),
            SyntheticObject(id="drone_wing_1", object_type="drone", initial_x=-600, initial_y=140, initial_altitude=130, behavior="waypoint", speed=17, waypoints=[Waypoint(x=-320, y=110), Waypoint(x=-100, y=80), Waypoint(x=100, y=50), Waypoint(x=300, y=20), Waypoint(x=460, y=0)]),
            SyntheticObject(id="drone_wing_2", object_type="drone", initial_x=-640, initial_y=-220, initial_altitude=165, behavior="waypoint", speed=19, waypoints=[Waypoint(x=-360, y=-170), Waypoint(x=-80, y=-110), Waypoint(x=120, y=-60), Waypoint(x=320, y=-20), Waypoint(x=480, y=10)])
        ],
        zones=get_standard_zones(), sensors=get_standard_sensors()
    )

def protocol_vehicle() -> ScenarioConfig:
    return ScenarioConfig(
        scenario_id="PROTOCOL-VEHICLE", name="Protocol: Vehicle Approach", seed=1003, duration=300.0,
        objects=[
            SyntheticObject(id="convoy_lead", object_type="truck", initial_x=-620, initial_y=80, behavior="waypoint", speed=13, waypoints=[Waypoint(x=-360, y=80), Waypoint(x=-120, y=80), Waypoint(x=100, y=80), Waypoint(x=300, y=80), Waypoint(x=480, y=80)]),
            SyntheticObject(id="convoy_rear", object_type="truck", initial_x=-670, initial_y=80, behavior="waypoint", speed=13, waypoints=[Waypoint(x=-410, y=80), Waypoint(x=-170, y=80), Waypoint(x=50, y=80), Waypoint(x=250, y=80), Waypoint(x=430, y=80)]),
            SyntheticObject(id="patrol_pickup", object_type="vehicle", initial_x=-580, initial_y=-150, behavior="waypoint", speed=15, waypoints=[Waypoint(x=-320, y=-150), Waypoint(x=-80, y=-150), Waypoint(x=120, y=-150), Waypoint(x=310, y=-150), Waypoint(x=480, y=-150)])
        ],
        zones=get_standard_zones(), sensors=get_standard_sensors()
    )

def protocol_multi_threat() -> ScenarioConfig:
    return ScenarioConfig(
        scenario_id="PROTOCOL-MULTI-THREAT", name="Protocol: Multi-Threat Assault", seed=1004, duration=300.0,
        objects=[
            SyntheticObject(id="drone_strike", object_type="drone", initial_x=-640, initial_y=230, initial_altitude=140, behavior="waypoint", speed=24, waypoints=[Waypoint(x=-350, y=200), Waypoint(x=-60, y=170), Waypoint(x=120, y=140), Waypoint(x=320, y=110), Waypoint(x=500, y=80)]),
            SyntheticObject(id="tank_assault", object_type="vehicle", initial_x=-620, initial_y=-110, behavior="waypoint", speed=12, waypoints=[Waypoint(x=-340, y=-110), Waypoint(x=-100, y=-110), Waypoint(x=90, y=-110), Waypoint(x=290, y=-110), Waypoint(x=480, y=-110)]),
            SyntheticObject(id="troop_squad_1", object_type="person", initial_x=-460, initial_y=30, behavior="waypoint", speed=4.5, waypoints=[Waypoint(x=-240, y=30), Waypoint(x=-40, y=30), Waypoint(x=100, y=30), Waypoint(x=260, y=30), Waypoint(x=420, y=30)]),
            SyntheticObject(id="troop_squad_2", object_type="person", initial_x=-490, initial_y=-20, behavior="waypoint", speed=4.2, waypoints=[Waypoint(x=-260, y=-20), Waypoint(x=-50, y=-20), Waypoint(x=80, y=-20), Waypoint(x=240, y=-20), Waypoint(x=400, y=-20)]),
            SyntheticObject(id="unknown_bogey", object_type="unknown aerial object", initial_x=-660, initial_y=-260, initial_altitude=190, behavior="waypoint", speed=26, waypoints=[Waypoint(x=-360, y=-190), Waypoint(x=-80, y=-120), Waypoint(x=120, y=-60), Waypoint(x=320, y=-10), Waypoint(x=500, y=30)])
        ],
        zones=get_standard_zones(), sensors=get_standard_sensors()
    )

def protocol_emergency() -> ScenarioConfig:
    return ScenarioConfig(
        scenario_id="PROTOCOL-EMERGENCY", name="Protocol: Emergency Escalation", seed=1005, duration=300.0,
        objects=[
            SyntheticObject(id="unknown_1", object_type="unknown aerial object", initial_x=-650, initial_y=220, initial_altitude=200, behavior="waypoint", speed=28, waypoints=[Waypoint(x=-350, y=140), Waypoint(x=-80, y=80), Waypoint(x=100, y=30), Waypoint(x=300, y=0), Waypoint(x=480, y=-20)]),
            SyntheticObject(id="unknown_2", object_type="unknown aerial object", initial_x=-650, initial_y=-220, initial_altitude=200, behavior="waypoint", speed=28, waypoints=[Waypoint(x=-350, y=-140), Waypoint(x=-80, y=-80), Waypoint(x=100, y=-30), Waypoint(x=300, y=0), Waypoint(x=480, y=20)]),
            SyntheticObject(id="tank_1", object_type="vehicle", initial_x=-600, initial_y=110, behavior="waypoint", speed=14, waypoints=[Waypoint(x=-320, y=110), Waypoint(x=-70, y=110), Waypoint(x=110, y=110), Waypoint(x=300, y=110), Waypoint(x=480, y=110)]),
            SyntheticObject(id="tank_2", object_type="vehicle", initial_x=-600, initial_y=-110, behavior="waypoint", speed=14, waypoints=[Waypoint(x=-320, y=-110), Waypoint(x=-70, y=-110), Waypoint(x=110, y=-110), Waypoint(x=300, y=-110), Waypoint(x=480, y=-110)]),
            SyntheticObject(id="drone_swarm_1", object_type="drone", initial_x=-620, initial_y=0, initial_altitude=60, behavior="waypoint", speed=22, waypoints=[Waypoint(x=-320, y=0), Waypoint(x=-40, y=0), Waypoint(x=140, y=0), Waypoint(x=320, y=0), Waypoint(x=500, y=0)])
        ],
        zones=get_standard_zones(), sensors=get_standard_sensors()
    )

def protocol_sensor_degraded() -> ScenarioConfig:
    return ScenarioConfig(
        scenario_id="PROTOCOL-SENSOR-DEGRADED", name="Protocol: Sensor Degraded", seed=1006, duration=300.0,
        objects=[
            SyntheticObject(id="drone_test", object_type="drone", initial_x=-600, initial_y=-30, initial_altitude=100, behavior="waypoint", speed=15, waypoints=[Waypoint(x=-320, y=-20), Waypoint(x=-90, y=-10), Waypoint(x=110, y=10), Waypoint(x=300, y=30), Waypoint(x=480, y=40)]),
            SyntheticObject(id="truck_test", object_type="truck", initial_x=-580, initial_y=120, behavior="waypoint", speed=12, waypoints=[Waypoint(x=-300, y=120), Waypoint(x=-80, y=120), Waypoint(x=100, y=120), Waypoint(x=290, y=120), Waypoint(x=480, y=120)])
        ],
        zones=get_standard_zones(), sensors=get_standard_sensors(),
        scripted_events=[
            ScriptedEvent(timestamp=0.0, event_type="camera_degradation", parameters={"duration": 30.0}),
            ScriptedEvent(timestamp=35.0, event_type="radar_loss", parameters={"duration": 20.0})
        ]
    )
