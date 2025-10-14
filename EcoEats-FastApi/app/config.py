from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    MONGO_URI: str
    DB_NAME: str
    JWT_SECRET: str
    EMAIL_SENDER: str
    EMAIL_PASSWORD: str
    FRONTEND_URL: str = "http://localhost:5173"  # ✅ match .env


    model_config = SettingsConfigDict(env_file="app/.env")  # ✅ point to correct path

    settings=Settings()