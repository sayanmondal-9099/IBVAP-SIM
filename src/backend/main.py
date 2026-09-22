import os
import sqlite3
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.backend.database import Base, engine
import src.backend.models  # Register all models with Base.metadata

from src.backend.routers import simulation, alerts, mock_receiver, incidents, audit

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

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup lifecycle
    yield
    # Shutdown lifecycle: cleanly terminate active simulation loop and disconnect WebSockets
    try:
        if simulation.engine_task and not simulation.engine_task.done():
            simulation.engine_task.cancel()
        if simulation.active_engine:
            simulation.active_engine.stop()
        for ws in list(simulation.connected_websockets):
            try:
                await ws.close()
            except Exception:
                pass
        simulation.connected_websockets.clear()
    except Exception:
        pass

app = FastAPI(
    title="IBVAP-SIM API",
    description="Backend API for the simulation-only IBVAP prototype",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS origins from environment variable or standard defaults
# W3C specification strictly disallows allow_credentials=True with wildcard origin ["*"]
raw_origins = os.getenv("ALLOWED_ORIGINS", "").strip()
if raw_origins:
    allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
else:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

allow_credentials = False if "*" in allowed_origins else True

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
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

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("src.backend.main:app", host=host, port=port, reload=False)
