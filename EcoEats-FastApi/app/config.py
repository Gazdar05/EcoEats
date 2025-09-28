# backend/app/config.py
import os
from dotenv import load_dotenv

load_dotenv()  # read .env file

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "food_saver")
