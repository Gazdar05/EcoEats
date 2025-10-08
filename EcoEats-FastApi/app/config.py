from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URI: str = "your-mongodb-atlas-uri"
    DB_NAME: str = "ecoeats"
    ALLOW_ORIGINS: list[str] = ["*"]  # change in production

    class Config:
        env_file = ".env"


settings = Settings()
