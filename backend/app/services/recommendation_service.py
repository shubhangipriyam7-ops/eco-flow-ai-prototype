from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.activity import Activity

class RecommendationEngine:
    @staticmethod
    def get_recommendations(db: Session) -> List[Dict[str, Any]]:
        """
        Analyzes historical resource levels and returns top 5 recommendations
        prioritized by the highest possible environmental and monetary impact.
        """
        # Fetch latest month activities (most recent 30 by date, matching prediction_service's window)
        activities = db.query(Activity).order_by(Activity.date.desc()).limit(30).all()
        
        # Default fallback consumption if DB is fresh
        total_elec = sum(a.electricity_kwh for a in activities) if activities else 15000.0
        total_fuel = sum(a.fuel_liters for a in activities) if activities else 8000.0
        total_paper = sum(a.paper_kg for a in activities) if activities else 2500.0
        total_plastic = sum(a.plastic_kg for a in activities) if activities else 3500.0
        total_water = sum(a.water_liters for a in activities) if activities else 50000.0

        # Define candidate recommendations with impact percentages and financial rates
        candidates = [
            {
                "recommendation": "Switch to energy-efficient LED lighting and smart sensors in all production facilities.",
                "target_metric": total_elec,
                "co2_saving_ratio": 0.15,  # Save 15% of electricity
                "co2_factor": 0.38,        # kg CO2 / kWh
                "cost_saving_rate": 0.12,   # $0.12 per kWh
                "label": "Switch to LED lighting"
            },
            {
                "recommendation": "Transition to digital invoices and cloud paperless documentation across departments.",
                "target_metric": total_paper,
                "co2_saving_ratio": 0.40,  # Save 40% of paper
                "co2_factor": 0.95,        # kg CO2 / kg paper
                "cost_saving_rate": 1.50,   # $1.50 per kg paper
                "label": "Reduce printing"
            },
            {
                "recommendation": "Combine logistics routes and optimize delivery schedules using automated fleet dispatch.",
                "target_metric": total_fuel,
                "co2_saving_ratio": 0.12,  # Save 12% fuel
                "co2_factor": 2.68,        # kg CO2 / liter fuel
                "cost_saving_rate": 1.15,   # $1.15 per liter
                "label": "Combine logistics routes"
            },
            {
                "recommendation": "Implement biodegradable packaging materials and eliminate single-use plastics.",
                "target_metric": total_plastic,
                "co2_saving_ratio": 0.25,  # Save 25% plastic
                "co2_factor": 1.85,        # kg CO2 / kg plastic
                "cost_saving_rate": 2.10,   # $2.10 per kg plastic
                "label": "Reduce plastic usage"
            },
            {
                "recommendation": "Install low-flow water fixtures and recycle greywater in cooling towers.",
                "target_metric": total_water,
                "co2_saving_ratio": 0.20,  # Save 20% water
                "co2_factor": 0.0003,      # water pumping carbon multiplier
                "cost_saving_rate": 0.005,  # $0.005 per liter
                "label": "Optimize water consumption"
            },
            {
                "recommendation": "Optimize route patterns and vehicle loads to minimize empty transport miles.",
                "target_metric": total_fuel,
                "co2_saving_ratio": 0.08,  # Save 8% fuel
                "co2_factor": 2.68,
                "cost_saving_rate": 1.15,
                "label": "Optimize delivery schedules"
            }
        ]

        # Calculate impacts for each candidate
        processed = []
        for c in candidates:
            savings_units = c["target_metric"] * c["co2_saving_ratio"]
            co2_saved = savings_units * c["co2_factor"]
            cost_saved = savings_units * c["cost_saving_rate"]
            
            processed.append({
                "recommendation": c["recommendation"],
                "estimated_co2_savings_kg": round(co2_saved, 2),
                "estimated_cost_savings_usd": round(cost_saved, 2)
            })

        # Sort recommendations by highest CO2 savings and select top 5
        processed.sort(key=lambda x: x["estimated_co2_savings_kg"], reverse=True)
        return processed[:5]
