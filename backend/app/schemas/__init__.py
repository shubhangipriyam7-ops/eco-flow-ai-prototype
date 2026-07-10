from app.schemas.company import Company, CompanyCreate, CompanyUpdate
from app.schemas.department import Department, DepartmentCreate, DepartmentUpdate
from app.schemas.activity import Activity, ActivityCreate, ActivityUpdate
from app.schemas.prediction import Prediction, PredictionCreate
from app.schemas.api import OdooSyncResponse, PredictResponse, RecommendationResponse, RecommendationItem

__all__ = [
    "Company", "CompanyCreate", "CompanyUpdate",
    "Department", "DepartmentCreate", "DepartmentUpdate",
    "Activity", "ActivityCreate", "ActivityUpdate",
    "Prediction", "PredictionCreate",
    "OdooSyncResponse", "PredictResponse", "RecommendationResponse", "RecommendationItem"
]
