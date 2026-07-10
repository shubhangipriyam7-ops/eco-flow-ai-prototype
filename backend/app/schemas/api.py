from pydantic import BaseModel
from typing import List

class OdooSyncResponse(BaseModel):
    status: str
    records_synced: int
    message: str

class PredictResponse(BaseModel):
    current_emission: float
    predicted_next_month: float
    trend: str

class RecommendationItem(BaseModel):
    recommendation: str
    estimated_co2_savings_kg: float
    estimated_cost_savings_usd: float

class RecommendationResponse(BaseModel):
    recommendations: List[RecommendationItem]
