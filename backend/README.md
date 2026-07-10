# EcoFlow AI - Python FastAPI Backend

An AI-powered environmental sustainability and carbon emission prediction platform featuring Odoo ERP integration, pandas data cleaning, scikit-learn forecasts, and AI recommendations.

## Tech Stack
* **Python 3.12+**
* **FastAPI** (High-performance API framework)
* **PostgreSQL** (Relational Database)
* **SQLAlchemy** (Object Relational Mapper)
* **Alembic** (Database Migrations)
* **Pydantic** (Data validation and schemas)
* **Supabase Authentication** (Bearer JWT verification)
* **Pandas** (Data cleaning and unit standardization)
* **Scikit-Learn** (Linear Regression forecasting model)

---

## Folder Structure

```
backend/
├── app/
│   ├── api/                  # API routing and parameters
│   ├── core/
│   │   ├── config.py         # Pydantic Settings, environment variables
│   │   └── security.py       # Supabase JWT decoding and authorization checks
│   ├── database/
│   │   └── session.py        # SQLAlchemy engine and session providers
│   ├── models/               # SQLAlchemy ORM schemas
│   │   ├── __init__.py
│   │   ├── activity.py
│   │   ├── company.py
│   │   ├── department.py
│   │   └── prediction.py
│   ├── schemas/              # Pydantic validation schemas
│   │   ├── __init__.py
│   │   ├── activity.py
│   │   ├── api.py
│   │   ├── company.py
│   │   ├── department.py
│   │   └── prediction.py
│   ├── services/             # Core computational engines
│   │   ├── __init__.py
│   │   ├── odoo_service.py   # Odoo XML-RPC inventory/purchase/fleet connections
│   │   ├── prediction_service.py # Scikit-Learn carbon predictive algorithms
│   │   ├── preprocessing.py  # Pandas cleaning pipeline
│   │   └── recommendation_service.py # Sustainability recommendations system
│   └── main.py               # Main application entry point & CORS configuration
├── .env                      # Database, Supabase and Odoo credential variables
├── alembic.ini               # Alembic database migration config
└── requirements.txt          # PIP package requirements
```

---

## How to Run Locally

### 1. Prerequisites
Ensure you have the following installed on your machine:
* Python 3.12 or newer
* PostgreSQL database

### 2. Set Up Virtual Environment
Navigate to the `backend` folder and initialize a python virtual environment:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies
Install all pip packages declared in `requirements.txt`:
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy or modify `.env` file to match your PostgreSQL, Supabase, and Odoo credentials:
```bash
cp .env.example .env  # If not already present
```
Update these lines inside `.env`:
* `DATABASE_URL`: Connection string pointing to your PostgreSQL instance.
* `SUPABASE_JWT_SECRET`: The JWT Secret key found in your Supabase Project Settings -> API page.
* `SUPABASE_AUDIENCE`: Defaults to `"authenticated"`.

### 5. Run Database Migrations
Initialize and execute database tables via Alembic:
```bash
alembic upgrade head
```

### 6. Start the FastAPI Server
Run the application server using `uvicorn`:
```bash
uvicorn app.main:app --reload --port 8000
```

The API will now be accessible at `http://localhost:8000` with the following key paths:
* **Interactive Documentation (Swagger UI)**: `http://localhost:8000/docs`
* **Health Check**: `GET http://localhost:8000/health`
* **Me (Profile Profile)**: `GET http://localhost:8000/me` (Protected)
* **Odoo ERP Sync**: `POST http://localhost:8000/sync-odoo` (Protected)
* **AI Carbon Prediction**: `GET http://localhost:8000/predict` (Protected)
* **AI Recommendations**: `GET http://localhost:8000/recommendations` (Protected)
