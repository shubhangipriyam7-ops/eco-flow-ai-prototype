import pandas as pd
from typing import List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.company import Company
from app.models.department import Department
from app.models.activity import Activity

class DataPreprocessor:
    @staticmethod
    def clean_and_normalize(raw_data: List[Dict[str, Any]]) -> pd.DataFrame:
        """
        Loads raw records into a pandas DataFrame, performs cleaning, normalization,
        and unit standardization, and returns a sanitized DataFrame.
        """
        if not raw_data:
            return pd.DataFrame()
            
        # 1. Load into DataFrame
        df = pd.DataFrame(raw_data)
        
        # Ensure all columns exist, fill default values if absent
        required_cols = [
            "date", "department", "electricity_kwh", "fuel_liters", 
            "paper_kg", "plastic_kg", "food_kg", "packaging_kg", "water_liters"
        ]
        for col in required_cols:
            if col not in df.columns:
                df[col] = 0.0 if col != "date" and col != "department" else None
                
        # 2. Remove duplicates (subsetting on key unique items: date + department)
        df.drop_duplicates(subset=["date", "department"], keep="first", inplace=True)
        
        # 3. Handle missing values
        # For strings/categorical
        df["department"] = df["department"].fillna("General Operations")
        df["date"] = df["date"].fillna(datetime.now().strftime("%Y-%m-%d"))
        
        # For numeric values, fill NaN/None with 0.0
        numeric_cols = ["electricity_kwh", "fuel_liters", "paper_kg", "plastic_kg", "food_kg", "packaging_kg", "water_liters"]
        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0.0)
            
        # 4. Standardize / Validate numeric values (ensure no negative values)
        for col in numeric_cols:
            df[col] = df[col].apply(lambda x: max(0.0, float(x)))
            
        # 5. Normalize department names (e.g., standardizing casings, stripping whitespace)
        df["department"] = df["department"].astype(str).str.strip().str.title()
        
        # Department alias mapping to standard department names
        dept_mapping = {
            "Sales Fleet": "Fleet",
            "Logistics Fleet": "Fleet",
            "Logistics": "Operations",
            "Procurement": "Finance",
            "Headquarters": "Administration"
        }
        df["department"] = df["department"].replace(dept_mapping)
        
        # 6. Convert and validate dates
        def parse_date(d):
            try:
                if isinstance(d, datetime):
                    return d.date()
                return pd.to_datetime(d).date()
            except Exception:
                return datetime.now().date()
                
        df["date"] = df["date"].apply(parse_date)
        
        return df

    @classmethod
    def save_to_db(cls, db: Session, cleaned_df: pd.DataFrame, company_name: str = "Default Corporation") -> int:
        """
        Saves the cleaned Pandas DataFrame records to PostgreSQL using SQLAlchemy,
        auto-generating Company and Department relations if necessary.
        """
        if cleaned_df.empty:
            return 0
            
        # Ensure default company exists
        company = db.query(Company).filter(Company.name == company_name).first()
        if not company:
            company = Company(name=company_name, industry="Technology & Logistics")
            db.add(company)
            db.commit()
            db.refresh(company)
            
        records_saved = 0
        
        # Cache departments to reduce DB queries
        dept_cache = {}
        
        for _, row in cleaned_df.iterrows():
            dept_name = row["department"]
            
            if dept_name not in dept_cache:
                dept = db.query(Department).filter(
                    Department.company_id == company.id,
                    Department.name == dept_name
                ).first()
                if not dept:
                    dept = Department(company_id=company.id, name=dept_name)
                    db.add(dept)
                    db.commit()
                    db.refresh(dept)
                dept_cache[dept_name] = dept.id
                
            dept_id = dept_cache[dept_name]
            
            # Check if Activity already exists for this company, department, and date
            activity = db.query(Activity).filter(
                Activity.company_id == company.id,
                Activity.department_id == dept_id,
                Activity.date == row["date"]
            ).first()
            
            if not activity:
                activity = Activity(
                    company_id=company.id,
                    department_id=dept_id,
                    date=row["date"],
                    electricity_kwh=row["electricity_kwh"],
                    fuel_liters=row["fuel_liters"],
                    paper_kg=row["paper_kg"],
                    plastic_kg=row["plastic_kg"],
                    food_kg=row["food_kg"],
                    packaging_kg=row["packaging_kg"],
                    water_liters=row["water_liters"]
                )
                db.add(activity)
            else:
                # Update existing records (Upsert logic)
                activity.electricity_kwh = row["electricity_kwh"]
                activity.fuel_liters = row["fuel_liters"]
                activity.paper_kg = row["paper_kg"]
                activity.plastic_kg = row["plastic_kg"]
                activity.food_kg = row["food_kg"]
                activity.packaging_kg = row["packaging_kg"]
                activity.water_liters = row["water_liters"]
                
            records_saved += 1
            
        db.commit()
        return records_saved
