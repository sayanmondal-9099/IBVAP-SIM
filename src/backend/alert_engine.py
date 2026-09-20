import time
from typing import Dict, Any, Tuple

# Deduplication store for the prototype
# Maps key -> {"time": float, "band": str, "sensors": set}
COOLDOWN_DICT: Dict[str, Dict[str, Any]] = {}
COOLDOWN_SECONDS = 60.0

def check_virtual_fence_crossing(x: float, y: float, prev_x: float, prev_y: float) -> bool:
    """
    Checks if an object crossed a static virtual fence at x = 0.
    Moving from negative x to positive x.
    """
    if prev_x < 0 and x >= 0:
        return True
    return False

def check_border_tripwire_crossing(x: float, y: float, prev_x: float, prev_y: float) -> bool:
    """
    Checks if an approaching object crosses the warning tripwire at x = -150 moving east towards border.
    """
    if prev_x < -150 and x >= -150:
        return True
    return False

def check_intercept_corridor_entry(x: float, y: float, prev_x: float, prev_y: float) -> bool:
    """
    Checks if an incursion object penetrates past sovereign threshold into intercept corridor (x >= 150).
    """
    if prev_x < 150 and x >= 150:
        return True
    return False

def check_restricted_zone_entry(x: float, y: float) -> bool:
    """
    Checks if an object is within a restricted zone defined as y > 0 and y < 50, x between -50 and 50.
    """
    if 0 < y < 50 and -50 < x < 50:
        return True
    return False

def calculate_priority(
    zone_risk: float = 50.0,
    object_risk: float = 50.0,
    proximity_score: float = 50.0,
    persistence_score: float = 50.0,
    corroboration_score: float = 50.0,
    confidence_score: float = 50.0,
    response_urgency: float = 50.0,
    quality_penalty: float = 0.0,
    duplicate_penalty: float = 0.0,
    *args,
    **kwargs
) -> Tuple[float, str]:
    """
    Calculates the priority score using the canonical 9-factor weighted formula (ADR-005):
    priority_score =
        0.25 * zone_risk +
        0.20 * object_risk +
        0.15 * proximity_score +
        0.15 * persistence_score +
        0.10 * corroboration_score +
        0.10 * confidence_score +
        0.05 * response_urgency
        - quality_penalty
        - duplicate_penalty

    Clamped to [0.0, 100.0].
    Priority bands:
        P1 (Critical): 80–100
        P2 (High):     60–79
        P3 (Medium):   35–59
        P4 (Low):      0–34
    """
    # Backward-compatibility check: if 5 positional arguments are passed:
    # calculate_priority(base_score, confidence, quality, persistence, corroboration)
    if len(args) == 0 and "base_score" in kwargs:
        base_score = kwargs.get("base_score", 50.0)
        confidence = kwargs.get("confidence", 0.8)
        quality = kwargs.get("quality", 1.0)
        persistence = kwargs.get("persistence", 5.0)
        corroboration = kwargs.get("corroboration", 1)

        zone_risk = base_score
        object_risk = 60.0
        proximity_score = 50.0
        persistence_score = min(100.0, persistence * 10.0)
        corroboration_score = 100.0 if corroboration >= 2 else (60.0 if corroboration == 1 else 20.0)
        confidence_score = confidence * 100.0 if confidence <= 1.0 else confidence
        response_urgency = 50.0
        quality_penalty = max(0.0, (1.0 - quality) * 20.0) if quality <= 1.0 else 0.0
        duplicate_penalty = 0.0

    raw_score = (
        0.25 * zone_risk
        + 0.20 * object_risk
        + 0.15 * proximity_score
        + 0.15 * persistence_score
        + 0.10 * corroboration_score
        + 0.10 * confidence_score
        + 0.05 * response_urgency
        - quality_penalty
        - duplicate_penalty
    )

    # Clamp score to [0.0, 100.0] and round to 1 decimal place
    score = max(0.0, min(100.0, round(raw_score, 1)))

    if score >= 80.0:
        band = "P1"
    elif score >= 60.0:
        band = "P2"
    elif score >= 35.0:
        band = "P3"
    else:
        band = "P4"

    return score, band

def _get_band_severity(band: str) -> int:
    return {"P4": 1, "P3": 2, "P2": 3, "P1": 4}.get(band, 0)

def should_suppress_alert(object_id: str, reason_code: str, current_sim_time: float, current_band: str, sensor_id: str) -> bool:
    """
    Deduplication logic. Returns True if the alert should be suppressed (cooldown active).
    Bypasses cooldown if severity increases or a new sensor corroborates.
    Canonical cooldown window: 60.0 seconds.
    """
    key = f"{object_id}_{reason_code}"
    
    if key in COOLDOWN_DICT:
        last_state = COOLDOWN_DICT[key]
        time_elapsed = current_sim_time - last_state["time"]
        
        # Bypass if higher severity
        if _get_band_severity(current_band) > _get_band_severity(last_state["band"]):
            # Update state and do not suppress
            COOLDOWN_DICT[key] = {"time": current_sim_time, "band": current_band, "sensors": last_state["sensors"] | {sensor_id}}
            return False
            
        # Bypass if new sensor corroborates
        if sensor_id and sensor_id not in last_state["sensors"]:
            # Update state and do not suppress
            COOLDOWN_DICT[key] = {"time": current_sim_time, "band": current_band, "sensors": last_state["sensors"] | {sensor_id}}
            return False
            
        # Standard cooldown check
        if time_elapsed < COOLDOWN_SECONDS:
            return True
            
    COOLDOWN_DICT[key] = {"time": current_sim_time, "band": current_band, "sensors": {sensor_id} if sensor_id else set()}
    return False

def process_observation(obs: Dict[str, Any], previous_obs: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Evaluates an observation, triggering the rule engine, 9-factor priority calculation, and deduplication.
    Returns an alert dict if one should be generated, else None.
    """
    x = obs.get('x', 0)
    y = obs.get('y', 0)
    prev_x = previous_obs.get('x', x) if previous_obs else x
    prev_y = previous_obs.get('y', y) if previous_obs else y
    obj_type = obs.get('type', obs.get('object_type', 'unknown'))
    sim_time = obs.get('timestamp', time.time())
    
    alert_payload = None
    
    # 1. Evaluate Spatial/Temporal Rules (Tripwire -> Breach -> Intercept Zone)
    if check_restricted_zone_entry(x, y):
        base_zone_risk = 85.0 if obj_type in ["person", "vehicle", "truck"] else 40.0
        alert_payload = {
            "alert_type": "Restricted Zone Entry",
            "reason_code": "ZONE_ENTRY",
            "zone_risk": base_zone_risk
        }
    elif check_intercept_corridor_entry(x, y, prev_x, prev_y):
        alert_payload = {
            "alert_type": "Sovereign Intercept Corridor Penetration",
            "reason_code": "INTERCEPT_ZONE",
            "zone_risk": 95.0
        }
    elif check_virtual_fence_crossing(x, y, prev_x, prev_y):
        alert_payload = {
            "alert_type": "Virtual Fence Crossing (Border Breach)",
            "reason_code": "FENCE_CROSS",
            "zone_risk": 75.0
        }
    elif check_border_tripwire_crossing(x, y, prev_x, prev_y):
        alert_payload = {
            "alert_type": "Border Warning Tripwire Triggered",
            "reason_code": "TRIPWIRE_CROSS",
            "zone_risk": 50.0
        }
    elif obj_type in ["unknown", "unknown aerial object", "bird-like mechanical object"]:
        # Anomaly rules
        alert_payload = {
            "alert_type": "Anomalous Object Detected",
            "reason_code": "ANOMALY",
            "zone_risk": 70.0
        }
    elif obj_type == "bird":
        # Low priority background event
        alert_payload = {
            "alert_type": "Biological Track",
            "reason_code": "BIOLOGICAL",
            "zone_risk": 15.0
        }
        
    if not alert_payload:
        return None
        
    obj_id = obs.get('id', obs.get('object_id', 'unknown_id'))
        
    # 2. Canonical 9-Factor Priority Score Calculation (0-100 normalized inputs)
    # Factor 1: zone_risk (0-100)
    zone_risk = alert_payload["zone_risk"]

    # Factor 2: object_risk (0-100)
    object_risk_map = {
        "drone": 90.0,
        "unknown aerial object": 90.0,
        "bird-like mechanical object": 90.0,
        "truck": 75.0,
        "vehicle": 75.0,
        "person": 60.0,
        "unknown": 70.0,
        "bird": 20.0
    }
    object_risk = object_risk_map.get(obj_type, 50.0)

    # Factor 3: proximity_score (0-100, proximity to sovereign border fence at x=0)
    if x >= 0:
        proximity_score = 100.0
    else:
        # Distance from negative x approaching 0: closer = higher proximity
        proximity_score = 100.0 * max(0.0, 1.0 - abs(x) / 500.0)

    # Factor 4: persistence_score (0-100, tracking duration)
    persistence = obs.get('persistence', obs.get('persistence_time', 5.0))
    persistence_score = min(100.0, persistence * 10.0)

    # Factor 5: corroboration_score (0-100)
    corroboration = obs.get('corroboration', obs.get('corroboration_count', 1))
    if corroboration >= 2:
        corroboration_score = 100.0
    elif corroboration == 1:
        corroboration_score = 60.0
    else:
        corroboration_score = 20.0

    # Factor 6: confidence_score (0-100)
    raw_conf = obs.get('confidence', 0.8)
    confidence_score = (raw_conf * 100.0) if raw_conf <= 1.0 else raw_conf

    # Factor 7: response_urgency (0-100, dynamic velocity / threat speed)
    speed = obs.get('speed', 0.0)
    if speed == 0.0 and previous_obs:
        # Calculate velocity from displacement
        dx = x - prev_x
        dy = y - prev_y
        speed = (dx**2 + dy**2)**0.5
    if speed > 20.0 or obj_type in ["drone", "unknown aerial object"]:
        response_urgency = 90.0
    elif speed > 10.0 or obj_type in ["vehicle", "truck"]:
        response_urgency = 70.0
    else:
        response_urgency = 40.0

    # Factor 8: quality_penalty (deducted if quality < 1.0)
    quality = obs.get('quality_score', obs.get('quality', 1.0))
    quality_penalty = max(0.0, (1.0 - quality) * 20.0) if quality <= 1.0 else 0.0

    # Factor 9: duplicate_penalty (0.0 standard)
    duplicate_penalty = 0.0

    score, band = calculate_priority(
        zone_risk=zone_risk,
        object_risk=object_risk,
        proximity_score=proximity_score,
        persistence_score=persistence_score,
        corroboration_score=corroboration_score,
        confidence_score=confidence_score,
        response_urgency=response_urgency,
        quality_penalty=quality_penalty,
        duplicate_penalty=duplicate_penalty
    )

    sensor_id = obs.get('sensor_id', 'unknown_sensor')
    
    # 3. Deduplication check (60-second cooldown window)
    if should_suppress_alert(obj_id, alert_payload["reason_code"], sim_time, band, sensor_id):
        return None
    
    return {
        "object_id": obj_id,
        "object_type": obj_type,
        "alert_type": alert_payload["alert_type"],
        "reason_code": alert_payload["reason_code"],
        "priority_score": score,
        "priority_band": band,
        "confidence": raw_conf,
        "quality": quality,
        "persistence_time": persistence,
        "corroboration_count": corroboration,
        "simulated_time": sim_time,
        "is_synthetic": True,
        "simulation_id": obs.get('simulation_id'),
        "scenario_id": obs.get('scenario_id'),
        "sensor_id": sensor_id,
        "site_id": obs.get('site_id')
    }
