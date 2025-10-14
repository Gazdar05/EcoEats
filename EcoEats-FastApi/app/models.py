from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Any
from datetime import datetime, date
from bson import ObjectId
from pydantic_core import core_schema

# --------------------
# Helper for Mongo ObjectId serialization
# --------------------
class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type: Any, handler):
        return core_schema.no_info_after_validator_function(
            cls.validate,
            core_schema.str_schema()
        )

    @classmethod
    def validate(cls, v: Any) -> ObjectId:
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        return {"type": "string", "example": "507f1f77bcf86cd799439011"}


# --------------------
# HouseholdUser
# --------------------
class HouseholdUser(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    full_name: str = Field(..., max_length=50)
    email: EmailStr
    pwd_hash: str
    house_size: Optional[int] = None
    acct_status: str = Field(default="pending", max_length=16)
    locale: Optional[str] = Field(default="en-MY", max_length=10)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login_at: Optional[datetime] = None

    model_config = {
        "validate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
    }


# --------------------
# PrivacySetting
# --------------------
class PrivacySetting(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    enable_2fa: bool = False
    food_vis: str = Field(default="private")  # public, friends, private, partnered
    saved_filter_json: Optional[dict] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "validate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
    }


# --------------------
# VerificationCode
# --------------------
class VerificationCode(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    code: str = Field(..., max_length=8)
    purpose: str = Field(..., max_length=32)  # email_verification, 2fa
    expires_at: datetime
    is_used: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "validate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
    }


# --------------------
# FoodCategory
# --------------------
class FoodCategory(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    fc_cat_id: Optional[int] = Field(None, description="Custom category ID from data dictionary")
    name: str = Field(..., max_length=80)
    desc: Optional[str] = None

    model_config = {
        "validate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
    }


# --------------------
# FoodItem
# --------------------
class FoodItem(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: Optional[PyObjectId] = None
    name: str = Field(..., max_length=200)
    qty: int
    reserved_qty: int = 0
    unit: str = Field(..., max_length=32)
    expiry_date: Optional[date] = None
    category: str = Field(..., max_length=100)
    storage: str = Field(..., max_length=50)
    quantity: int = 1
    notes: Optional[str] = None
    source: str = Field(default="inventory")  # inventory or donation
    reserved: bool = False
    donationDetails: Optional[dict] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# --------------------
# InventoryItemModel
# --------------------
class InventoryItemModel(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    name: str
    category: str
    quantity: str
    expiry: date
    storage: str
    status: Optional[str] = None
    notes: Optional[str] = None
    image: Optional[str] = None

    model_config = {
        "validate_by_name": True,
        "json_encoders": {ObjectId: str},
        "arbitrary_types_allowed": True,
    }