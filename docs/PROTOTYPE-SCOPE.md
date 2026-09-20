# Prototype Scope Specification

## Objective
To strictly define the boundaries of the IBVAP-SIM demonstration software, ensuring it remains isolated, safe, and legally compliant as a simulation-only prototype.

## IN SCOPE
The following components are explicitly **IN SCOPE** for this prototype:

- **Synthetic Camera Feeds (IMPLEMENTED/PLANNED):** Visual generation or mocking of camera detection events.
- **Synthetic Radar (IMPLEMENTED/PLANNED):** Mathematical modeling of radar blips (x,y,z coordinates).
- **Synthetic Tracks (IMPLEMENTED):** Simulated object persistence across time.
- **Synthetic Observations (IMPLEMENTED):** Mock payloads structured exactly like hardware output.
- **Simulated Network Conditions (IMPLEMENTED):** The ability to toggle the API connection off and queue events.
- **Simulated Sensor Failures (PLANNED):** Modeling camera dropouts or radar occlusions.
- **Synthetic Evidence (PLANNED):** Dummy image links or bounding box coordinates for the Human Review panel.
- **Simulated Alerts (IMPLEMENTED):** P1-P4 rule-based evaluations based on synthetic data.
- **Simulated Incidents (PARTIAL):** Escalating a mock alert into a mock incident report.
- **Simulated Audit Events (IMPLEMENTED):** Chaining local prototype interactions into a secure ledger.
- **Simulated Mock-Base Transfer (PARTIAL):** Forwarding a JSON payload to a local `/api/mock-receiver` dummy endpoint.

## OUT OF SCOPE
The following capabilities are explicitly **OUT OF SCOPE** and must **NEVER** be implemented:

- **Real CCTV integration:** No RTSP streams from physical cameras.
- **Real radar hardware:** No physical sensor integration.
- **Real defence networks:** No connections to operational API gateways.
- **Real military systems:** No real command-and-control software integration.
- **Weapons control:** No targeting or firing logic.
- **Autonomous interception:** No automated drone dispatch logic.
- **Operational biometrics:** No real facial recognition or database lookups.
- **Real personal data:** No PII or real civilian movement data.
- **Model training:** No live training of ML models on real datasets.
- **Operational accuracy/readiness claims:** No assertions that this software is "battle-ready".

## Enforced Banner
The UI must continuously display: `SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION`.
