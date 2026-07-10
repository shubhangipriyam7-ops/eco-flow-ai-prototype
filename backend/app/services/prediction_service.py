import numpy as np
import pandas as pd
from typing import Dict, Any, Union
from sklearn.linear_model import LinearRegression
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.activity import Activity
from app.models.prediction import Prediction
from app.models.company import Company

# standard emission factors (kg CO2 eq per unit)
EMISSION_FACTORS = {
    "electricity_kwh": 0.38,   # average grid mix factor
    "fuel_liters": 2.68,       # diesel/gasoline average
    "paper_kg": 0.95,          # paper manufacturing and disposal
    "plastic_kg": 1.85,        # general polymer plastic
    "food_kg": 2.10,           # organic landfill emission equivalence
}

class CarbonPredictor:
    def __init__(self):
        self.model = LinearRegression()
        self._trained = False

    def calculate_emissions(self, row: Dict[str, Any] | pd.Series) -> float:
        """
        Calculates the carbon footprint in kg CO2eq using standard emission factor multipliers.
        """
        return (
            row.get("electricity_kwh", 0.0) * EMISSION_FACTORS["electricity_kwh"] +
            row.get("fuel_liters", 0.0) * EMISSION_FACTORS["fuel_liters"] +
            row.get("paper_kg", 0.0) * EMISSION_FACTORS["paper_kg"] +
            row.get("plastic_kg", 0.0) * EMISSION_FACTORS["plastic_kg"] +
            row.get("food_kg", 0.0) * EMISSION_FACTORS["food_kg"]
        )

    def train_model(self, db: Session) -> bool:
        """
        Retrieves historical activities from PostgreSQL, prepares the dataset,
        trains the scikit-learn LinearRegression model, and caches it.
        If database data is limited, we generate standard synthetic training points.
        """
        activities = db.query(Activity).all()
        
        # Load records into pandas
        data = []
        for act in activities:
            data.append({
                "electricity_kwh": act.electricity_kwh,
                "fuel_liters": act.fuel_liters,
                "paper_kg": act.paper_kg,
                "plastic_kg": act.plastic_kg,
                "food_kg": act.food_kg,
            })
            
        # Seed synthetic historical training records if the DB is empty/low
        if len(data) < 10:
            # Generate 30 historical records with random variation to seed scikit-learn
            np.random.seed(42)
            for i in range(30):
                elec = 400 + np.random.normal(0, 50)
                fuel = 300 + np.random.normal(0, 40)
                paper = 80 + np.random.normal(0, 10)
                plastic = 110 + np.random.normal(0, 15)
                food = 60 + np.random.normal(0, 8)
                data.append({
                    "electricity_kwh": max(0.0, elec),
                    "fuel_liters": max(0.0, fuel),
                    "paper_kg": max(0.0, paper),
                    "plastic_kg": max(0.0, plastic),
                    "food_kg": max(0.0, food),
                })
                
        df = pd.DataFrame(data)
        
        # Add targets (emissions)
        df["emissions"] = df.apply(self.calculate_emissions, axis=1)
        
        # Train linear regression
        X = df[["electricity_kwh", "fuel_liters", "paper_kg", "plastic_kg", "food_kg"]]
        y = df["emissions"]
        
        try:
            self.model.fit(X, y)
            self._trained = True
            return True
        except Exception as e:
            print(f"Prediction Model training failed: {str(e)}")
            return False

    def predict_future(self, db: Session) -> Dict[str, Any]:
        """
        Generates emission forecasts and trends.
        """
        if not self._trained:
            self.train_model(db)
            
        # Calculate current emissions (sum of latest 30 days)
        latest_activities = db.query(Activity).order_by(Activity.date.desc()).limit(30).all()
        
        if latest_activities:
            curr_elec = sum(a.electricity_kwh for a in latest_activities)
            curr_fuel = sum(a.fuel_liters for a in latest_activities)
            curr_paper = sum(a.paper_kg for a in latest_activities)
            curr_plastic = sum(a.plastic_kg for a in latest_activities)
            curr_food = sum(a.food_kg for a in latest_activities)
            count = len(latest_activities)
        else:
            # Defaults representing standard monthly quantities
            curr_elec = 480.0
            curr_fuel = 350.0
            curr_paper = 90.0
            curr_plastic = 115.0
            curr_food = 55.0
            count = 1
            
        current_emission = (
            curr_elec * EMISSION_FACTORS["electricity_kwh"] +
            curr_fuel * EMISSION_FACTORS["fuel_liters"] +
            curr_paper * EMISSION_FACTORS["paper_kg"] +
            curr_plastic * EMISSION_FACTORS["plastic_kg"] +
            curr_food * EMISSION_FACTORS["food_kg"]
        ) / count
        
        # Forecast input features for next month (e.g., simulating 1.08x inflation/seasonality)
        predicted_inputs = np.array([[
            curr_elec * 1.08,
            curr_fuel * 1.05,
            curr_paper * 1.02,
            curr_plastic * 1.03,
            curr_food * 1.04
        ]])
        
        predicted_emission = float(self.model.predict(predicted_inputs)[0])
        
        # Establish trend
        trend = "Increasing" if predicted_emission > current_emission else "Decreasing"
        if abs(predicted_emission - current_emission) / current_emission < 0.01:
            trend = "Stable"
            
        # Log prediction to PostgreSQL database
        try:
            company = db.query(Company).first()
            comp_id = company.id if company else 1
            
            # Record tomorrow/next-month forecast
            pred_record = Prediction(
                company_id=comp_id,
                prediction_date=(datetime.now() + timedelta(days=30)).date(),
                predicted_emission=predicted_emission
            )
            db.add(pred_record)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Failed to persist prediction history: {str(e)}")
            
        return {
            "current_emission": round(current_emission, 2),
            "predicted_next_month": round(predicted_emission, 2),
            "trend": trend
        }

predictor = CarbonPredictor()
