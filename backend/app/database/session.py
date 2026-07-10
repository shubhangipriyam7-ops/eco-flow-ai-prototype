from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from typing import Generator
from app.core.config import settings

# For PostgreSQL, use standard engine parameters
# For Alembic or general migrations, this URL is loaded from settings
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # checks connection liveness
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db() -> Generator:
    """
    FastAPI dependency that provides a transactional database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
