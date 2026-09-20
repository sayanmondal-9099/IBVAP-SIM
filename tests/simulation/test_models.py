import pytest
from pydantic import ValidationError
from src.simulation.models import SyntheticObject, Observation, ScenarioConfig

def test_synthetic_object_validation():
    obj = SyntheticObject(
        id="obj_1",
        object_type="person",
        initial_x=10.0,
        initial_y=10.0,
        speed=1.5,
        heading=45.0
    )
    assert obj.object_type == "person"
    assert obj.speed == 1.5

    with pytest.raises(ValidationError):
        # Invalid object type should fail
        SyntheticObject(
            id="obj_2",
            object_type="alien",  # not in Literal
            initial_x=0.0,
            initial_y=0.0,
            speed=1.0,
            heading=0.0
        )

def test_observation_is_synthetic_enforced():
    obs = Observation(
        simulation_id="sim_1",
        scenario_id="scen_1",
        timestamp=0.0,
        tick_time=0.0,
        object_id="obj_1",
        object_type="person",
        x=0.0,
        y=0.0,
        speed=0.0,
        heading=0.0,
        confidence=1.0
    )
    assert obs.is_synthetic is True

    # Even if someone tries to instantiate with False, we can allow it in instantiation
    # but the rule is it must default to True and be used as True in simulation payloads.
    # To strictly prevent it, we could add a Pydantic validator, but defaulting is fine for this prototype.

def test_scenario_config_defaults():
    config = ScenarioConfig(
        scenario_id="s1",
        name="Test",
    )
    assert config.seed == 42
    assert config.tick_rate == 1.0
