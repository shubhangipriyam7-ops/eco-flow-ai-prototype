from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from app.core.config import settings
from app.core.security import get_current_user, UserPayload
from app.database.session import get_db, engine
from app.database.session import Base
from app.schemas.api import OdooSyncResponse, PredictResponse, RecommendationResponse
from app.services.odoo_service import odoo_service
from app.services.preprocessing import DataPreprocessor
from app.services.prediction_service import predictor
from app.services.recommendation_service import RecommendationEngine

# Create FastAPI instance
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="EcoFlow AI - Enterprise Sustainability and Carbon Accounting Backend",
    version="1.0.0"
)

# Enable CORS for local Vite development server on port 3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database table creation (Fallback if Alembic has not run yet)
@app.on_event("startup")
def configure_db():
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Warning: Database tables could not be initialized at startup. Ensure postgresql is running: {str(e)}")

# Public Endpoints
@app.get("/health", tags=["System"])
def health_check():
    """
    Returns API status verification.
    """
    return {"status": "ok"}

# Protected Endpoints (Requires Supabase JWT Auth)
@app.get("/me", response_model=UserPayload, tags=["Authentication"])
def get_user_profile(current_user: UserPayload = Depends(get_current_user)):
    """
    Extracts profile information from verified Supabase access token.
    """
    return current_user

@app.post("/sync-odoo", response_model=OdooSyncResponse, tags=["Data Synchronization"])
def sync_odoo_data(
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Initiates Odoo ERP XML-RPC connections, retrieves stock-move, procurement, fleet, and accounting metrics,
    runs pandas cleanup/normalization to handle missing or duplicate items, and upserts them to PostgreSQL.
    """
    try:
        # 1. Fetch raw data from XML-RPC services
        raw_records = odoo_service.get_normalized_sync_data()
        
        # 2. Clean and preprocess using pandas
        cleaned_df = DataPreprocessor.clean_and_normalize(raw_records)
        
        # 3. Store into Postgres database
        records_saved = DataPreprocessor.save_to_db(db, cleaned_df)
        
        # 4. Automatically trigger prediction model retraining on new arrivals
        try:
            predictor.train_model(db)
        except Exception as pe:
            print(f"Non-blocking model training alert: {str(pe)}")
            
        return OdooSyncResponse(
            status="success",
            records_synced=records_saved,
            message=f"Successfully synced and cleaned {records_saved} records from Odoo modules."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Odoo sync failed: {str(e)}"
        )

@app.get("/predict", response_model=PredictResponse, tags=["AI Prediction"])
def predict_carbon_emissions(
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Employs a scikit-learn regression algorithm trained on historical data to predict next-month carbon emissions.
    """
    try:
        predictions = predictor.predict_future(db)
        return PredictResponse(
            current_emission=predictions["current_emission"],
            predicted_next_month=predictions["predicted_next_month"],
            trend=predictions["trend"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecasting calculation failed: {str(e)}"
        )

@app.get("/recommendations", response_model=RecommendationResponse, tags=["AI Recommendation"])
def get_recommendations(
    db: Session = Depends(get_db),
    current_user: UserPayload = Depends(get_current_user)
):
    """
    Analyses resource margins to yield top-5 sustainability suggestions detailing exact CO2 and cost savings.
    """
    try:
        recs = RecommendationEngine.get_recommendations(db)
        return RecommendationResponse(recommendations=recs)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recommendation evaluation failed: {str(e)}"
        )
