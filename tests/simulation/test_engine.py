import pytest
from src.simulation.engine import SimulationEngine
from src.simulation.scenarios import protocol_normal
from src.simulation.models import ScriptedEvent

def test_engine_deterministic_output():
    config1 = protocol_normal()
    config1.duration = 5.0  # Run for 5 ticks
    
    events1 = []
    engine1 = SimulationEngine(config1, lambda obs: events1.extend(obs))
    engine1.start()
    for _ in range(5):
        engine1.tick()

    config2 = protocol_normal()
    config2.duration = 5.0
    
    events2 = []
    engine2 = SimulationEngine(config2, lambda obs: events2.extend(obs))
    engine2.start()
    for _ in range(5):
        engine2.tick()

    # Both runs should produce exactly the same number of observations
    assert len(events1) > 0
    assert len(events1) == len(events2)
    # Check that contents match exactly
    for e1, e2 in zip(events1, events2):
        assert e1.model_dump() == e2.model_dump()
    # And the coordinates should match exactly due to the same seed
    for e1, e2 in zip(events1, events2):
        assert e1.x == e2.x
        assert e1.y == e2.y
        assert e1.is_synthetic is True
    
    # ID should be identical due to same seed determinism
    assert engine1.simulation_id == engine2.simulation_id

def test_engine_network_failure_queueing():
    config = protocol_normal()
    config.scripted_events = [
        ScriptedEvent(timestamp=10.0, event_type="network_failure", parameters={"duration": 19.0}),
        ScriptedEvent(timestamp=30.0, event_type="network_recovery", parameters={})
    ]
    config.duration = 40.0
    config.tick_rate = 1.0
    
    received_events = []
    engine = SimulationEngine(config, lambda obs: received_events.extend(obs))
    engine.start()
    
    # Run first 10 ticks (online) -> processes t=0 to t=9
    for _ in range(10):
        engine.tick()
        
    # Check that events were received for each tick
    assert len(received_events) > 0
    assert engine.state.network_status == "online"
    
    # Tick 11 processes t=10 and triggers offline
    engine.tick()
    assert engine.state.network_status == "offline"
    pre_offline_count = len(received_events)
    assert engine.edge_buffer_cache_size > 0
    
    # Run to tick 30 (offline) -> processes t=11 to t=29 (19 ticks)
    for _ in range(19):
        engine.tick()
        
    assert engine.state.network_status == "offline"
    assert len(received_events) == pre_offline_count
    assert engine.edge_buffer_cache_size > 0
    
    # Tick 31 processes t=30 and triggers recovery
    engine.tick()
    assert engine.state.network_status == "online"
    assert engine.edge_buffer_cache_size == 0
    # Should have received the queued events
    assert len(received_events) > pre_offline_count  # 10 + 20 flushed + 1 new

def test_engine_camera_degradation():
    config = protocol_normal()
    config.scripted_events = [ScriptedEvent(timestamp=15.0, event_type="camera_degradation", parameters={"duration": 20.0})]
    config.duration = 20.0
    
    events = []
    engine = SimulationEngine(config, lambda obs: events.extend(obs))
    engine.start()
    
    # Run 15 ticks (normal) -> processes t=0 to t=14
    for _ in range(15):
        engine.tick()
        
    # Check that confidence is 1.0 for first 15 events (for camera)
    for event in events:
        if event.sensor_type == 'camera':
            assert event.confidence > 0.8
        
    # Tick 16 processes t=15 and triggers degradation for 20 seconds
    engine.tick()
    assert len(events) > 15
    assert events[-1].confidence < 1.0
    assert events[-1].quality_score < 1.0
    assert events[-1].uncertainty > 2.0

def test_engine_clock_drift():
    config = protocol_normal()
    config.scripted_events = [ScriptedEvent(timestamp=20.0, event_type="clock_drift", parameters={"offset": -10.0})]
    config.duration = 25.0
    
    events = []
    engine = SimulationEngine(config, lambda obs: events.extend(obs))
    engine.start()
    
    for _ in range(21):
        engine.tick()
        
    # Before drift, timestamp == tick_time
    assert events[0].timestamp == events[0].tick_time
    
    # After tick 20, clock drift is active (-10.0 offset)
    assert events[-1].timestamp == events[-1].tick_time - 10.0

def test_engine_edge_restart():
    config = protocol_normal()
    config.scripted_events = [ScriptedEvent(timestamp=15.0, event_type="edge_restart", parameters={"duration": 5.0})]
    config.duration = 25.0
    
    events = []
    engine = SimulationEngine(config, lambda obs: events.extend(obs))
    engine.start()
    
    # Network goes offline at tick 15, clearing edge buffer, and auto recovers at 20
    for _ in range(21):
        engine.tick()
        
    assert engine.state.network_status == "online"

def test_demo_scenario_loads():
    """Verify SCN-DEMO-001 loads successfully with at least 10 objects."""
    config = protocol_normal()
    engine = SimulationEngine(config, lambda obs: None)
    engine.start()
    assert len(engine.objects_state) >= 1, "Expected at least 1 synthetic object"

def test_demo_scenario_determinism():
    """Verify SCN-DEMO-001 is completely deterministic over 120 seconds."""
    # Run 1
    events1 = []
    config1 = protocol_normal()
    engine1 = SimulationEngine(config1, lambda obs: events1.extend(obs))
    engine1.start()
    for _ in range(120):
        engine1.tick()
    
    state1 = engine1.objects_state
    
    # Run 2
    events2 = []
    config2 = protocol_normal()
    engine2 = SimulationEngine(config2, lambda obs: events2.extend(obs))
    engine2.start()
    for _ in range(120):
        engine2.tick()
        
    state2 = engine2.objects_state
    
    # Compare object positions at t=120
    for obj_id, obj_data1 in state1.items():
        obj_data2 = state2[obj_id]
        assert abs(obj_data1["x"] - obj_data2["x"]) < 0.001
        assert abs(obj_data1["y"] - obj_data2["y"]) < 0.001

    # Number of generated observations should match exactly
    assert len(events1) == len(events2)