import os
from typing import Optional
from pydantic import PostgresDsn, field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "FlexAGE"
    
    # Security
    SECRET_KEY: str = "your_secret_key_here_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS settings
    CORS_ORIGINS: list = ["*"]
    
    # Database settings
    DATABASE_URL: Optional[PostgresDsn] = None

    # Gemini API Key
    GOOGLE_API_KEY: Optional[str] = None

    @field_validator("DATABASE_URL", mode="before")
    def assemble_db_url(cls, v: Optional[str]) -> str:
        if v and isinstance(v, str):
            return v
        return os.getenv("DATABASE_URL", "")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
