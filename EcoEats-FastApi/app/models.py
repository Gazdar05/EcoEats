# app/models.py
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime, date
from bson import ObjectId
from pydantic_core import core_schema
from typing import Any


# Helper for Mongo ObjectId serialization
class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type: Any, handler):
        # tells Pydantic how to validate
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
        # tells Pydantic how to display in docs
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
        "populate_by_name": True,
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

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


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

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# --------------------
# FoodCategory
# --------------------
class FoodCategory(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")  # MongoDB _id
    fc_cat_id: Optional[int] = Field(None, description="Custom category ID from data dictionary")
    name: str = Field(..., max_length=80)
    desc: Optional[str] = None

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# --------------------
# FoodItem
# --------------------
class FoodItem(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    category_id: PyObjectId
    name: str = Field(..., max_length=200)
    qty: int
    reserved_qty: int = 0
    unit: str = Field(..., max_length=32)
    storage_loc: Optional[str] = None  # fridge, freezer, pantry, other
    expiry_date: Optional[date] = None
    status: str = Field(default="active", max_length=20)  # active, used, donation, archived
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
