from sqlalchemy import Column, Integer, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    prediction_date = Column(Date, nullable=False, index=True)
    predicted_emission = Column(Float, nullable=False)  # in kg CO2eq, etc.

    company = relationship("Company", back_populates="predictions")
