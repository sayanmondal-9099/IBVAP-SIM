import math
import random
from typing import Tuple

def move_object(
    x: float, 
    y: float, 
    speed: float, 
    heading_degrees: float, 
    delta_time: float
) -> Tuple[float, float]:
    """
    Computes the new (x, y) coordinates for an object based on its current position, 
    speed, heading, and elapsed time.
    """
    heading_radians = math.radians(heading_degrees)
    dx = speed * math.sin(heading_radians) * delta_time
    dy = speed * math.cos(heading_radians) * delta_time
    return x + dx, y + dy

def navigate_to_waypoint(
    x: float,
    y: float,
    speed: float,
    target_x: float,
    target_y: float,
    delta_time: float
) -> Tuple[float, float, float, bool]:
    """
    Moves an object towards a target waypoint.
    Returns: (new_x, new_y, new_heading_degrees, reached_waypoint)
    """
    dx = target_x - x
    dy = target_y - y
    distance = math.sqrt(dx**2 + dy**2)
    
    # Calculate heading to target (0 is North, 90 is East)
    heading_radians = math.atan2(dx, dy)
    heading_degrees = math.degrees(heading_radians)
    if heading_degrees < 0:
        heading_degrees += 360
        
    step_distance = speed * delta_time
    
    if distance <= step_distance:
        # Reached waypoint
        return target_x, target_y, heading_degrees, True
        
    # Move towards waypoint
    new_x = x + (dx / distance) * step_distance
    new_y = y + (dy / distance) * step_distance
    
    return new_x, new_y, heading_degrees, False

def calculate_degraded_confidence(
    base_confidence: float, 
    is_degraded: bool, 
    rng: random.Random
) -> float:
    """
    Computes a degraded confidence score if camera degradation is active.
    """
    if not is_degraded:
        return base_confidence
    
    # Introduce random noise to reduce confidence significantly
    noise = rng.uniform(0.2, 0.6)
    new_confidence = max(0.1, base_confidence - noise)
    return round(new_confidence, 2)

def generate_position_noise(
    x: float, 
    y: float, 
    is_degraded: bool, 
    rng: random.Random
) -> Tuple[float, float]:
    """
    Adds positional noise if sensors are degraded.
    """
    if not is_degraded:
        return x, y
        
    noise_x = rng.uniform(-10.0, 10.0)
    noise_y = rng.uniform(-10.0, 10.0)
    
    return x + noise_x, y + noise_y
