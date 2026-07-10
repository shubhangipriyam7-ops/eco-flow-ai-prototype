from pydantic import BaseModel, ConfigDict, Field
from datetime import date
from typing import Optional

class ActivityBase(BaseModel):
    company_id: int
    department_id: int
    date: date
    electricity_kwh: float = Field(default=0.0, ge=0.0)
    fuel_liters: float = Field(default=0.0, ge=0.0)
    paper_kg: float = Field(default=0.0, ge=0.0)
    plastic_kg: float = Field(default=0.0, ge=0.0)
    food_kg: float = Field(default=0.0, ge=0.0)
    packaging_kg: float = Field(default=0.0, ge=0.0)
    water_liters: float = Field(default=0.0, ge=0.0)

class ActivityCreate(ActivityBase):
    pass

class ActivityUpdate(BaseModel):
    date: Optional[date] = None
    electricity_kwh: Optional[float] = None
    fuel_liters: Optional[float] = None
    paper_kg: Optional[float] = None
    plastic_kg: Optional[float] = None
    food_kg: Optional[float] = None
    packaging_kg: Optional[float] = None
    water_liters: Optional[float] = None

class ActivityInDBBase(ActivityBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)

class Activity(ActivityInDBBase):
    pass
