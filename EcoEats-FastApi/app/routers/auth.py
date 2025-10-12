from email.mime.multipart import MIMEMultipart
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from dotenv import load_dotenv
import os, jwt, random, string, smtplib
from email.mime.text import MIMEText
from app.database import db  # ✅ MongoDB connection

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ---------------------------
# Config
# ---------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("JWT_SECRET", "supersecret")
EMAIL_SENDER = os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# ---------------------------
# Pydantic Models
# ---------------------------
class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    household_size: int | None = None
    enable_2fa: bool = False

class Verify2FARequest(BaseModel):
    email: EmailStr
    code: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str

# ---------------------------
# Helpers
# ---------------------------
def hash_password(password: str):
    if len(password) > 72:
        password = password[:72]
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str):
    if len(plain) > 72:
        plain = plain[:72]
    return pwd_context.verify(plain, hashed)

def send_email_html(to_email: str, subject: str, html_content: str):
    """Send HTML email via Gmail SMTP"""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = EMAIL_SENDER
    msg["To"] = to_email

    html_part = MIMEText(html_content, "html")
    msg.attach(html_part)

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        server.send_message(msg)

# ---------------------------
# 1️⃣ Register User
# ---------------------------
@router.post("/register")
async def register_user(request: RegisterRequest):
    existing = await db.household_users.find_one({"email": request.email})
    if existing:
        raise HTTPException(status_code=400, detail="Account already exists")

    hashed = hash_password(request.password)
    acct_status = "pending" if request.enable_2fa else "active"

    user = {
        "full_name": request.full_name,
        "email": request.email,
        "pwd_hash": hashed,
        "household_size": request.household_size,
        "enable_2fa": request.enable_2fa,
        "acct_status": acct_status,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    result = await db.household_users.insert_one(user)
    user_id = str(result.inserted_id)

    # ✅ Send verification email with link only if 2FA enabled
    if request.enable_2fa:
        code = "".join(random.choices(string.digits, k=6))
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

        await db.verification_codes.insert_one({
            "user_id": ObjectId(user_id),
            "code": code,
            "purpose": "2fa",
            "expires_at": expires_at,
            "is_used": False,
            "created_at": datetime.now(timezone.utc)
        })

        # Create verification link
        verification_link = f"{FRONTEND_URL}/verify-account?email={request.email}"

         # HTML email template
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #6EA124; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
                .code-box {{ background-color: #fff; border: 2px dashed #6EA124; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; color: #2a5d14; }}
                .button {{ display: inline-block; background-color: #6EA124; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }}
                .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to EcoEats! </h1>
                </div>
                <div class="content">
                    <p>Hi {request.full_name},</p>
                    <p>Thank you for registering with EcoEats! We're excited to have you join our community of environmentally conscious food lovers.</p>
                    
                    <p><strong>To complete your registration, please follow these steps:</strong></p>
                    <ol>
                        <li>Click the confirmation link below</li>
                        <li>Enter your 6-digit verification code</li>
                        <li>Set your new password</li>
                    </ol>

                    <div class="code-box">
                        {code}
                    </div>

                    <p style="text-align: center;">
                        <a href="{verification_link}" class="button">Verify My Account</a>
                    </p>

                    <p style="color: #dc3545; font-weight: bold;"> This code expires in 5 minutes</p>

                    <p>If you didn't create an account with EcoEats, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>© 2025 EcoEats. All rights reserved.</p>
                    <p>If the button doesn't work, copy and paste this link into your browser:<br>
                    {verification_link}</p>
                </div>
            </div>
        </body>
        </html>
        """
        send_email_html(
            request.email,
            "EcoEats - Verify Your Account",
            html_content
        )

        return {
            "message": "Registration successful! Please check your email to verify your account.",
            "user_id": user_id
        }
    # ✅ If no 2FA, immediate login allowed
    return {"message": "Registration successful. You can now log in.", "user_id": user_id}


# ---------------------------
# 2️⃣ Enable/Resend 2FA
# ---------------------------
@router.post("/enable-2fa/{user_id}")
async def enable_2fa(user_id: str):
    """Generate and send a new 2FA code for an existing user"""
    user = await db.household_users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    code = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

    await db.verification_codes.insert_one({
        "user_id": ObjectId(user_id),
        "code": code,
        "purpose": "2fa",
        "expires_at": expires_at,
        "is_used": False,
        "created_at": datetime.now(timezone.utc)
    })

    verification_link = f"{FRONTEND_URL}/verify-account?email={user['email']}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #6EA124; color: white; padding: 20px; text-align: center; }}
            .content {{ background-color: #f9f9f9; padding: 30px; }}
            .code-box {{ background-color: #fff; border: 2px dashed #6EA124; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; color: #2a5d14; }}
            .button {{ display: inline-block; background-color: #6EA124; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>New Verification Code</h2>
            </div>
            <div class="content">
                <p>Your new verification code is:</p>
                <div class="code-box">{code}</div>
                <p style="text-align: center;">
                    <a href="{verification_link}" class="button">Verify My Account</a>
                </p>
                <p style="color: #dc3545;"> This code expires in 5 minutes.</p>
            </div>
        </div>
    </body>
    </html>
    """

    send_email_html(
        user["email"],
        "EcoEats - New Verification Code",
        html_content
    )

    return {"message": "Verification code sent successfully."}

#Get User ID by Email (for resend functionality)
# ---------------------------
@router.get("/get-user-by-email")
async def get_user_by_email(email: EmailStr):
    """Get user ID by email - used for resending verification codes"""
    user = await db.household_users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"user_id": str(user["_id"]), "email": user["email"]}


# ---------------------------
# 3️⃣ Verify 2FA
# ---------------------------
@router.post("/verify-2fa")
async def verify_2fa(request: Verify2FARequest):
    user = await db.household_users.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    record = await db.verification_codes.find_one({
        "user_id": user["_id"], "code": request.code, "is_used": False
    })
    if not record:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    # ✅ Fix timezone-aware comparison
    expires_at = record["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Verification code expired")

    # ✅ Activate user and mark code used
    await db.household_users.update_one(
        {"_id": user["_id"]},
        {"$set": {"acct_status": "pending"}}
    )

    ##dont need?
    await db.verification_codes.update_one(
        {"_id": record["_id"]},
        {"$set": {"is_used": True}}
    )

    return {"message": "2FA verified successfully. You can now log in."}


# ---------------------------
# 4️⃣ Login
# ---------------------------

@router.post("/login")
async def login_user(request: LoginRequest):
    # 🔍 Step 1: Find the user by email
    user = await db.household_users.find_one({"email": request.email})
    if not user:
        raise HTTPException(
            status_code=400, detail="Invalid email or password. Please try again."
        )

    # 🔑 Step 2: Check password
    if not verify_password(request.password, user["pwd_hash"]):
        raise HTTPException(
            status_code=400, detail="Invalid email or password. Please try again."
        )

    # 🔒 Step 3: Check if account is active
    if user.get("acct_status") != "active":
        raise HTTPException(
            status_code=403,
            detail="Your account is not activated. Please verify your email or contact support.",
        )

    # 🕒 Step 4: Generate JWT access token (valid for 15 minutes)
    payload = {
        "sub": str(user["_id"]),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

    # 🧾 Step 5: Update last login time
    await db.household_users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login_at": datetime.now(timezone.utc)}},
    )

    # ✅ Step 6: Return access token to frontend
    return {
        "access_token": token,
        "token_type": "bearer",
        "message": "Login successful!",
        "user": {
            "full_name": user["full_name"],
            "email": user["email"],
        },
    }


# ---------------------------
# 5️⃣ Set Password (After Register)
# ---------------------------
@router.post("/set-password")
async def set_password(request: SetPasswordRequest):
    user = await db.household_users.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    hashed = hash_password(request.new_password)
    await db.household_users.update_one(
        {"_id": user["_id"]},
        {"$set": {"pwd_hash": hashed, "acct_status": "active"}}
    )

    return {"message": "Password updated successfully."}
