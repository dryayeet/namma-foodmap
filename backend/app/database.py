import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

DEFAULT_DB_URL = f"sqlite:///{(DATA_DIR / 'nammanomnom.db').as_posix()}"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB_URL)

# Anchor relative sqlite paths to the project root so uvicorn works
# regardless of the directory it's launched from (e.g. `backend/`).
if DATABASE_URL.startswith("sqlite:///./"):
    rel = DATABASE_URL[len("sqlite:///./"):]
    DATABASE_URL = f"sqlite:///{(BASE_DIR / rel).resolve().as_posix()}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
