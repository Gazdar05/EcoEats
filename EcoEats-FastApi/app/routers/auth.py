# app/auth.py
from fastapi import APIRouter, HTTPException, status
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt, os, random, string, smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv
from bson import ObjectId
from app.database import db  # ✅ Use teammate’s db connection

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("JWT_SECRET")
EMAIL_SENDER = os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")


# ---------------------------
# Helper functions
# ---------------------------
def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def send_email(to_email: str, subject: str, message: str):
    msg = MIMEText(message)
    msg["Subject"] = subject
    msg["From"] = EMAIL_SENDER
    msg["To"] = to_email

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        server.send_message(msg)


# ---------------------------
# Register new user
# ---------------------------
@router.post("/register")
async def register_user(full_name: str, email: str, password: str):
    existing = await db.household_users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Account already exists")

    hashed = hash_password(password)
    user = {
        "full_name": full_name,
        "email": email,
        "pwd_hash": hashed,
        "acct_status": "pending",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    result = await db.household_users.insert_one(user)
    return {"message": "Registration successful. Please enable 2FA.", "user_id": str(result.inserted_id)}


# ---------------------------
# Enable 2FA (generate code)
# ---------------------------
@router.post("/enable-2fa/{user_id}")
async def enable_2fa(user_id: str):
    user = await db.household_users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    code = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    await db.verification_codes.insert_one({
        "user_id": ObjectId(user_id),
        "code": code,
        "purpose": "2fa",
        "expires_at": expires_at,
        "is_used": False,
        "created_at": datetime.utcnow()
    })

    message = f"Welcome to EcoEats, {user['full_name']}!\n\nYour verification code is {code}\nIt expires in 5 minutes."
    send_email(user["email"], "EcoEats 2FA Verification", message)

    return {"message": "Verification code sent via email."}


# ---------------------------
# Verify 2FA
# ---------------------------
@router.post("/verify-2fa")
async def verify_2fa(email: str, code: str):
    user = await db.household_users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    record = await db.verification_codes.find_one({
        "user_id": user["_id"], "code": code, "is_used": False
    })
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    if datetime.utcnow() > record["expires_at"]:
        raise HTTPException(status_code=400, detail="Code expired")

    await db.household_users.update_one(
        {"_id": user["_id"]},
        {"$set": {"acct_status": "active"}}
    )
    await db.verification_codes.update_one(
        {"_id": record["_id"]}, {"$set": {"is_used": True}}
    )

    return {"message": "2FA verified. You may now log in."}


# ---------------------------
# Login user
# ---------------------------
@router.post("/login")
async def login_user(email: str, password: str):
    user = await db.household_users.find_one({"email": email})
    if not user or not verify_password(password, user["pwd_hash"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    if user["acct_status"] != "active":
        raise HTTPException(status_code=403, detail="Account not activated")

    payload = {"sub": str(user["_id"]), "exp": datetime.utcnow() + timedelta(minutes=15)}
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

    await db.household_users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login_at": datetime.utcnow()}}
    )

    return {"access_token": token, "token_type": "bearer"}
