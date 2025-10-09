# app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    MONGO_URI: str
    DB_NAME: str
    ALLOW_ORIGINS: str

    model_config = SettingsConfigDict(env_file="app/.env")  # ✅ point to correct path

settings = Settings()
