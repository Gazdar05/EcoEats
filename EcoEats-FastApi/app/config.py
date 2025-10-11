#config.py inside app
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URI: str = "your-mongodb-atlas-uri"
    DB_NAME: str = "ecoeats"

    class Config:
        env_file = ".env"

settings = Settings()
