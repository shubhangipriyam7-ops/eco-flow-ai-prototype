from pydantic import BaseModel, ConfigDict
from datetime import date

class PredictionBase(BaseModel):
    company_id: int
    prediction_date: date
    predicted_emission: float

class PredictionCreate(PredictionBase):
    pass

class PredictionInDBBase(PredictionBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)

class Prediction(PredictionInDBBase):
    pass
