from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.backend.database import Base, engine
import src.backend.models  # Register all models with Base.metadata

from src.backend.routers import simulation, alerts, mock_receiver, incidents, audit

import sqlite3
import os

# Create database tables for the prototype if they do not exist
Base.metadata.create_all(bind=engine)

# Automatic schema migration for new columns
for db_path in ["ibvap.db", "ibvap_sim.db"]:
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            c = conn.cursor()
            for col_sql in [
                "ALTER TABLE alerts ADD COLUMN simulation_id VARCHAR;",
                "ALTER TABLE alerts ADD COLUMN scenario_id VARCHAR;",
                "ALTER TABLE alerts ADD COLUMN sensor_id VARCHAR;",
                "ALTER TABLE alerts ADD COLUMN site_id VARCHAR;",
                "ALTER TABLE incidents ADD COLUMN simulation_id VARCHAR;",
                "ALTER TABLE audit_logs ADD COLUMN simulation_id VARCHAR;",
            ]:
                try:
                    c.execute(col_sql)
                except sqlite3.OperationalError:
                    pass
            conn.commit()
            conn.close()
        except Exception:
            pass

app = FastAPI(
    title="IBVAP-SIM API",
    description="Backend API for the simulation-only IBVAP prototype",
    version="1.0.0"
)

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simulation.router)
app.include_router(alerts.router)
app.include_router(mock_receiver.router)
app.include_router(incidents.router)
app.include_router(audit.router)

@app.get("/health")
def health_check():
    return {"status": "healthy", "is_synthetic_environment": True}
