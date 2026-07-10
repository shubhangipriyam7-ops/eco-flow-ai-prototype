import datetime
from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship
from app.database.session import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False, unique=True)
    industry = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    departments = relationship("Department", back_populates="company", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="company", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="company", cascade="all, delete-orphan")
