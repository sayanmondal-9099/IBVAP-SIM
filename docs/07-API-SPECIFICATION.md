# 07 - API Specification

## Purpose
Define the contracts between the various prototype components.

## ACTUAL ENDPOINTS (IMPLEMENTED)

### `POST /api/simulation/sync_events`
- **Purpose:** Idempotent bulk ingestion of synthetic events from the edge buffer.
- **Request:** List of `Observation` objects.
- **Response:** `200 OK` `{"status": "success", "processed": int}`
- **Simulation Note:** This endpoint handles offline network restoration.

### `GET /api/alerts`
- **Purpose:** Retrieve active alerts for the Command Map.
- **Response:** List of `Alert` objects.

### `PATCH /api/alerts/{alert_id}/acknowledge`
- **Purpose:** Operator acknowledges a P1-P4 alert.
- **Request:** Empty body.
- **Response:** `200 OK` updated `Alert` object with `status: "acknowledged"`.
- **Note:** Implemented in `routers/alerts.py` and called from `Alerts.tsx`.

### `POST /api/alerts/{alert_id}/review`
- **Purpose:** Submit human review decision.
- **Request:** `{"decision": str, "notes": str, "reviewer_id": str}`
- **Response:** `200 OK` updated `Alert` object.
- **Note:** Implemented in `HumanReview.tsx`.

### `POST /api/alerts/{alert_id}/escalate`
- **Purpose:** Operator escalates an alert to an Incident.
- **Request:** Empty body.
- **Response:** `200 OK` `{"status": "escalated"}`
- **Note:** Implemented in `Alerts.tsx` and `HumanReview.tsx`.

### `POST /api/mock-receiver`
- **Purpose:** Sanitized dummy endpoint representing an external base.
- **Request:** Sanitized JSON Payload (No internal IDs).
- **Response:** `202 Accepted` or `500 Server Error`.
- **Status:** IMPLEMENTED. Bug resolved. Used in `Incidents.tsx` for Mock Transfer.

### `GET /api/incidents`
- **Purpose:** Retrieves all active incidents.
- **Response:** List of `Incident` objects.

### `GET /api/incidents/{incident_id}`
- **Purpose:** Retrieves single incident.
- **Response:** `Incident` object.

### `POST /api/incidents/{incident_id}/resolve`
- **Purpose:** Submits the Human Review resolution for a specific incident.
- **Request:** `{"resolution": str, "notes": str}`
- **Status:** IMPLEMENTED in `Incidents.tsx`.

### `GET /api/audit`
- **Purpose:** Retrieves chronological audit chain.
- **Response:** List of `AuditLog` objects.

### `GET /api/audit/verify`
- **Purpose:** Runs cryptographic validation across the entire audit chain.
- **Response:** `{"status": "VERIFIED" | "INVALID", "message": str}`
- **Status:** IMPLEMENTED in `Audit.tsx`.
