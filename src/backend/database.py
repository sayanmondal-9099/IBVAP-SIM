import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Use SQLite for local development/testing to fulfill the requirement without external services
# In production, this would be an asyncpg connection string to Supabase PostgreSQL
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ibvap.db")

# check_same_thread is needed only for SQLite
connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    # Ensure directory exists if SQLite is placed on a persistent volume mount
    raw_path = SQLALCHEMY_DATABASE_URL.replace("sqlite:////", "/").replace("sqlite:///", "")
    if raw_path.startswith("./"):
        raw_path = raw_path[2:]
    dir_name = os.path.dirname(raw_path)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
