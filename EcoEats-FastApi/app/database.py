# backend/app/database.py
from pymongo import MongoClient
from .config import MONGO_URI, DB_NAME

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Collections
inventory_collection = db["inventory"]
donation_collection = db["donations"]
users_collection = db["users"]