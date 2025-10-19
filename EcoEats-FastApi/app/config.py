from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    MONGO_URI: str
    DB_NAME: str
    JWT_SECRET: str
    EMAIL_SENDER: str
    EMAIL_PASSWORD: str
    ALLOW_ORIGINS: str  # comma-separated list in .env

    model_config = SettingsConfigDict(env_file="app/.env")

    @property
    def origins(self) -> List[str]:
        """Convert ALLOW_ORIGINS string to list for CORS."""
        return [origin.strip() for origin in self.ALLOW_ORIGINS.split(",")]

settings = Settings()