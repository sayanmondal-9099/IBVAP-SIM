# Simulation Specification

## 1. Simulation Identity
The prototype strictly models synthetic data. All objects generated are explicitly marked `is_synthetic = True`. 

## 2. Synthetic Objects
The engine generates the following explicitly synthetic classes:
- `person`
- `vehicle` (includes car/truck)
- `drone`
- `helicopter`
- `aircraft`
- `bird`
- `bird-like mechanical object`
- `unknown object`

## 3. Scenarios (IMPLEMENTED)
The deterministic scenario generator supports:
- **Restricted-zone person entry**
- **Vehicle virtual-fence crossing**
- **Drone restricted-airspace entry**
- **Network Failure:** Simulates a cut connection, forcing the `edge_buffer` to queue observations.
- **Sensor Failure:** (PLANNED)

## 4. Synthetic Sensors
- **Camera Simulation:** Outputs bounding boxes and confidence scores based on simulated weather degradation (PLANNED).
- **Radar Simulation:** Outputs distance, altitude, and speed trajectories (IMPLEMENTED).

## 5. Environmental Factors (PLANNED)
The engine will support deterministic modifiers:
- Day/night conditions
- Weather degradation
- Blur/Occlusion
- Packet loss / Clock drift

## 6. Offline / Replay
Scenarios are deterministic (seedable). The system models edge restarts, storage pressure, and queue synchronization upon network restoration.
