from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URI: str = "your-mongodb-atlas-uri"
    DB_NAME: str = "ecoeats"
    JWT_SECRET: str
    EMAIL_SENDER: str
    EMAIL_PASSWORD: str

    FRONTEND_URL: str = "http://localhost:5173"
    class Config:
        env_file = ".env"

settings = Settings()