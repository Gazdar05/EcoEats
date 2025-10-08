from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URI: str = "your-mongodb-atlas-uri"
    DB_NAME: str = "ecoeats"

    class Config:
        env_file = ".env"
        ALLOW_ORIGINS: list[str] = ["*"]  # change in production

settings = Settings()
