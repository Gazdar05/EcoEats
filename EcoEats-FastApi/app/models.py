# backend/app/models.py
from pydantic import BaseModel
from typing import Optional

class FoodItem(BaseModel):
    id: Optional[str] = None
    name: str
    category: str
    storage: str
    expiry: str
    quantity: int
    notes: Optional[str] = None
    source: str  # "inventory" or "donation"
    donationDetails: Optional[dict] = None

class DonationDetails(BaseModel):
    location: str
    availability: str
    contact: str
