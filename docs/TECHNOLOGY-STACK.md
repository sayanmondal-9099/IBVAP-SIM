# Technology Stack

## ACTUAL INVENTORY

This document records the strict technological reality of the repository based on `package.json`, `requirements.txt`, and source code.

### 1. Language
- **CURRENT:** Python 3.12+ (Backend/Simulation), TypeScript (Frontend).
- **PLANNED:** No changes.

### 2. Frontend Framework
- **CURRENT:** React 19, Vite.
- **PLANNED:** No changes.

### 3. Styling & UI Components
- **CURRENT:** Tailwind CSS (v3), Lucide React.
- **PLANNED:** shadcn/ui components (if required for Human Review/Incident UI).

### 4. Backend Framework
- **CURRENT:** FastAPI, Pydantic.
- **PLANNED:** No changes.

### 5. Database & ORM
- **CURRENT:** SQLite (file-based `ibvap.db`), SQLAlchemy.
- **PLANNED:** No changes (acceptable for local prototype).

### 6. Simulation Technology
- **CURRENT:** Custom Python tick-based loop (`src/simulation/engine.py`).
- **PLANNED:** No changes.

### 7. Mapping / Visualization
- **CURRENT:** MapLibre GL JS (`react-map-gl/maplibre`), standard 2D mapping.
- **PLANNED / MISSING:** Cesium or Three.js (For the 3D Operational View).

### 8. Testing
- **CURRENT:** `pytest` (Backend), HTTPX (Async API testing).
- **PLANNED:** Frontend testing (Vitest/Playwright).

### 9. Build System
- **CURRENT:** `npm run build` (Vite), native Python execution.
- **PLANNED:** Dockerization (Dockerfile / docker-compose).

### 10. Communication Mechanisms
- **CURRENT:** REST (FastAPI Routers).
- **PLANNED:** WebSockets (For real-time telemetry streaming from simulation to UI).
