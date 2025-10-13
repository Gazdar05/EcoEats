from pydantic import BaseModel, Field
from datetime import date
from typing import Optional

class InventoryCreate(BaseModel):
    name: str
    category: str
    quantity: str
    expiry: date
    storage: str
    notes: Optional[str] = None
    image: Optional[str] = None

class InventoryUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[str] = None
    expiry: Optional[date] = None
    storage: Optional[str] = None
    notes: Optional[str] = None
    image: Optional[str] = None

class InventoryResponse(BaseModel):
    id: str
    name: str
    category: str
    quantity: str
    expiry: date
    storage: str
    status: str
    notes: Optional[str]
    image: Optional[str]

    class Config:
        from_attributes = True  # ✅ Updated for Pydantic v2