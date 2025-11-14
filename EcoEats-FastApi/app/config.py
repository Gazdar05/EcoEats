from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

class Settings(BaseSettings):
    MONGO_URI: str
    DB_NAME: str
    JWT_SECRET: str
    EMAIL_SENDER: str
    EMAIL_PASSWORD: str
    FRONTEND_URL: str = "http://localhost:5173"
    ALLOW_ORIGINS: Optional[str] = None  # ✅ temporarily store as string first

    model_config = SettingsConfigDict(env_file="app/.env")

    def get_allow_origins(self) -> List[str]:
        """
        ✅ Safely split comma-separated origins from .env into a clean list
        """
        if not self.ALLOW_ORIGINS:
            return ["http://localhost:5173"]
        return [o.strip() for o in self.ALLOW_ORIGINS.split(",") if o.strip()]

# ✅ Instantiate settings
settings = Settings()

# ✅ Add this line so your CORS middleware in main.py can use a ready-made list:
settings.ALLOW_ORIGINS = settings.get_allow_origins()