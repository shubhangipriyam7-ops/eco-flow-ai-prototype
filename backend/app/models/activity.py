from sqlalchemy import Column, Integer, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    
    # Material / Resource items
    electricity_kwh = Column(Float, default=0.0, nullable=False)
    fuel_liters = Column(Float, default=0.0, nullable=False)
    paper_kg = Column(Float, default=0.0, nullable=False)
    plastic_kg = Column(Float, default=0.0, nullable=False)
    food_kg = Column(Float, default=0.0, nullable=False)
    packaging_kg = Column(Float, default=0.0, nullable=False)
    water_liters = Column(Float, default=0.0, nullable=False)

    company = relationship("Company", back_populates="activities")
    department = relationship("Department", back_populates="activities")
