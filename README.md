# IBVAP-SIM (Intelligent Border Video Analytics Platform — Simulation-Only Prototype)

> **⚠️ STRICT SIMULATION-ONLY BOUNDARY**  
> **IBVAP-SIM is 100% SIMULATION ONLY.**  
> - It does **NOT** connect to real military, army, police, or border surveillance networks.  
> - It does **NOT** ingest real CCTV, radar hardware feeds, or operational border data.  
> - It does **NOT** interface with real weapon systems, targeting systems, firing mechanisms, or autonomous interception/engagement systems.  
> - All observations, tracks, alerts, sensor measurements, and incidents are **purely synthetic and simulated**.  
> - Permanent UI and system status: `SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION`.

---

## 📌 Overview

**IBVAP-SIM** is a simulation prototype developed for technical demonstrations and research into intelligent border video analytics. It simulates edge-first sensor ingestion (camera, thermal, radar), multi-sensor track correlation, real-time alert evaluation (tripwires, loitering, anomalous movement), human-in-the-loop incident resolution, and cryptographically verified SHA-256 audit logging.

---

## 🏗️ Architecture & Core Principles

1. **Edge-First Simulation:** Simulates edge devices that buffer observations during network disconnects and idempotently sync back when reconnected.
2. **Event-Driven Processing:** Structured pipeline: `Observation → Detection → Track → Event → Alert → Incident`.
3. **Separation of Detection from Decision:** Sensors observe; rules engines alert; human operators make incident decisions.
4. **Honest Uncertainty Representation:** Every sensor observation explicitly reports confidence and quality degradation.
5. **Cryptographic Auditability:** Critical operational actions (acknowledge, escalate, resolve) are recorded into a SHA-256 chained audit log (`previous_hash` validation).
6. **No Autonomous Engagement:** System assists human review; zero automated defense actions.

---

## 📁 Repository Structure

```text
├── .agents/                 # AI agent skills and project constitutions
├── docs/                    # Architectural documents, PRDs, SRS, and verification logs
│   ├── ADR/                 # Architecture Decision Records
│   ├── 04-TECHNICAL-ARCHITECTURE.md
│   ├── 06-DATA-MODEL.md
│   ├── 07-API-SPECIFICATION.md
│   └── ...
├── src/
│   ├── backend/             # FastAPI backend service
│   │   ├── alert_engine.py  # Real-time alert & rule evaluation
│   │   ├── audit_service.py # SHA-256 hash-chained audit service
│   │   ├── database.py      # SQLAlchemy DB configuration
│   │   ├── models.py        # Database models (Observations, Alerts, Incidents, Audits)
│   │   ├── schemas.py       # Pydantic validation schemas
│   │   └── routers/         # API endpoints (simulation, alerts, incidents, audit)
│   ├── simulation/          # Core synthetic simulation engine
│   │   ├── engine.py        # Discrete-time simulation engine
│   │   ├── generators.py    # Synthetic noise & motion generators
│   │   ├── models.py        # Simulation schemas & state models
│   │   └── scenarios.py     # Deterministic multi-threat scenarios
│   └── frontend/            # React 19 + Vite + Tailwind CSS dashboard
│       ├── src/components/  # Command map, alert drawer, simulation controls
│       └── ...
├── supabase/                # Supabase configuration & migrations
├── tests/                   # Pytest test suite (backend, simulation, audit chain)
├── AGENTS.md                # Project constitution & agent safety rules
├── pytest.ini               # Pytest configuration
├── requirements.txt         # Python dependencies
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Backend Setup

```bash
# Clone the repository
git clone https://github.com/sayanmondal-9099/IBVAP-SIM.git
cd IBVAP-SIM

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
fastapi dev src/backend/main.py --port 8000
```
Backend API interactive documentation will be available at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup

```bash
cd src/frontend

# Install dependencies
npm install

# Launch development server
npm run dev
```
Open `http://localhost:5173` in your browser to view the Command & Control dashboard.

### 3. Running the Test Suite

```bash
# Run all backend and simulation tests
pytest
```

---

## 📖 Documentation & Verification

Comprehensive documentation is available in the [`docs/`](./docs) directory:
- [Technical Architecture](./docs/04-TECHNICAL-ARCHITECTURE.md)
- [Data Model & Schema](./docs/06-DATA-MODEL.md)
- [API Specification](./docs/07-API-SPECIFICATION.md)
- [Simulation Specification](./docs/08-SIMULATION-SPECIFICATION.md)
- [Audit & Verification Reports](./docs/FINAL-VALIDATION-REPORT.md)

---

## ⚖️ License & Compliance

Developed strictly as a software prototype for research and competition simulation demonstrations.
All rights reserved.
