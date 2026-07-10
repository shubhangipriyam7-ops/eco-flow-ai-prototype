import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "EcoFlow AI Backend"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/ecoflow_ai",
        validation_alias="DATABASE_URL"
    )
    
    # Supabase JWT Auth
    SUPABASE_URL: str = Field(default="", validation_alias="SUPABASE_URL")
    SUPABASE_JWT_SECRET: str = Field(default="your-supabase-jwt-secret", validation_alias="SUPABASE_JWT_SECRET")
    SUPABASE_AUDIENCE: str = Field(default="authenticated", validation_alias="SUPABASE_AUDIENCE")
    
    # Odoo
    ODOO_URL: str = Field(default="", validation_alias="ODOO_URL")
    ODOO_DB: str = Field(default="", validation_alias="ODOO_DB")
    ODOO_USERNAME: str = Field(default="", validation_alias="ODOO_USERNAME")
    ODOO_PASSWORD: str = Field(default="", validation_alias="ODOO_PASSWORD")
    
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
