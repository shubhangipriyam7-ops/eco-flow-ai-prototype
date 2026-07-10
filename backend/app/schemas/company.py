from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class CompanyBase(BaseModel):
    name: str
    industry: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None

class CompanyInDBBase(CompanyBase):
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class Company(CompanyInDBBase):
    pass
