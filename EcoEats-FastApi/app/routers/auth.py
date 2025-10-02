# app/routers/auth.py
from fastapi import APIRouter, HTTPException
from app.models import HouseholdUser, VerificationCode, PrivacySetting
from app.database import db
from datetime import datetime

router = APIRouter()

# --- Register user ---
@router.post("/register")
async def register_user(user: HouseholdUser):
    existing = await db.household_users.find_one({"hu_email": user.hu_email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_dict = user.dict()
    user_dict["hu_created_at"] = datetime.utcnow()
    user_dict["hu_updated_at"] = datetime.utcnow()
    user_dict["hu_last_login_at"] = None

    result = await db.household_users.insert_one(user_dict)
    return {"status": "success", "id": str(result.inserted_id)}

# --- Verify code (simplified) ---
@router.post("/verify")
async def verify_code(code: VerificationCode):
    record = await db.verification_codes.find_one({
        "hu_user_id": code.hu_user_id,
        "vc_code": code.vc_code,
        "vc_is_used": False
    })
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    await db.verification_codes.update_one(
        {"_id": record["_id"]}, {"$set": {"vc_is_used": True}}
    )
    return {"status": "verified"}
