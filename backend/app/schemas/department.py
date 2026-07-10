from pydantic import BaseModel, ConfigDict
from typing import Optional

class DepartmentBase(BaseModel):
    company_id: int
    name: str

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None

class DepartmentInDBBase(DepartmentBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)

class Department(DepartmentInDBBase):
    pass
