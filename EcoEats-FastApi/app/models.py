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
    fc_cat_id: int = Field(..., description="Custom category ID from data dictionary")
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
    user_id: Optional[PyObjectId] = None
    name: str = Field(..., max_length=200)
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


    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
