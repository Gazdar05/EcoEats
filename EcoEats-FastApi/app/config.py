# app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Database
    MONGO_URI: str = "your-mongodb-atlas-uri"  # fallback default
    DB_NAME: str = "ecoeats"

    # Auth / Email
    JWT_SECRET: str
    EMAIL_SENDER: str
    EMAIL_PASSWORD: str

    # Frontend URL
    FRONTEND_URL: str = "http://localhost:5173"

    # Config
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )

settings = Settings()
