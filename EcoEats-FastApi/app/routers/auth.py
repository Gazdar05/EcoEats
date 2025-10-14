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

class Update2FARequest(BaseModel):
    email: EmailStr
    enable_2fa: bool

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
# Register User
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
#  Enable/Resend 2FA
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

# ---------------------------
#Get User ID by Email (for resend functionality)
# ---------------------------
@router.get("/get-user-by-email")
async def get_user_by_email(email: EmailStr):
    

    """Get user ID by email - used for resending verification codes"""
    user = await db.household_users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # ✅ Normalize user_id to ObjectId
    user_id = user["_id"]
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)

    return {"user_id": str(user["_id"]), "email": user["email"]}


# ---------------------------
#  Verify 2FA
# ---------------------------
# ---------------------------
#  Verify 2FA (Updated to mark code as used and set purpose)
# ---------------------------
@router.post("/verify-2fa")
async def verify_2fa(request: Verify2FARequest):
    user = await db.household_users.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Normalize ObjectId
    user_id = user["_id"]
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)

    record = await db.verification_codes.find_one({
        "user_id": user_id,  # ✅ use normalized ObjectId consistently
        "code": request.code,
        "is_used": False
    })

    if not record:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    # Check expiry
    expires_at = record["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Verification code expired")

    # Mark as used
    await db.verification_codes.update_one(
        {"_id": record["_id"]},
        {"$set": {"is_used": True}}
    )

    purpose = record.get("purpose", "2fa")

    if purpose == "enable_2fa":
        return {
            "message": "2FA verified successfully. Please set your new password.",
            "purpose": "enable_2fa"
        }

    await db.household_users.update_one(
        {"_id": user_id},
        {"$set": {"acct_status": "pending"}}
    )
    return {
        "message": "2FA verified successfully. Please set your password to activate your account.",
        "purpose": "register_2fa"
    }


# ---------------------------
#  Login
# ---------------------------

@router.post("/login")
async def login_user(request: LoginRequest):
    
    # 🔍 Step 1: Find the user by email
    user = await db.household_users.find_one({"email": request.email})
    if not user:
        raise HTTPException(
            status_code=400, detail="Invalid email or password. Please try again."
        )
    user_id = user["_id"]
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)

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
#  Set Password (After Register)
# ---------------------------
# ---------------------------
#  Set Password (After Register or Enable 2FA)
# ---------------------------
@router.post("/set-password")
async def set_password(request: SetPasswordRequest):
    user = await db.household_users.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_id = user["_id"]
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)

    hashed = hash_password(request.new_password)

    # Look for a recently used verification code for enabling 2FA
    recent_verification = await db.verification_codes.find_one(
        {
            "user_id": user_id,   # ✅ same normalized type
            "purpose": "enable_2fa",
            "is_used": True
        },
        sort=[("created_at", -1)]
    )

    enable_2fa_value = user.get("enable_2fa", False)
    message = "Password updated successfully."

    if recent_verification:
        enable_2fa_value = True
        message = "Password updated successfully. Two-Factor Authentication has been enabled for your account."

    await db.household_users.update_one(
        {"_id": user_id},
        {"$set": {
            "pwd_hash": hashed,
            "acct_status": "active",
            "enable_2fa": enable_2fa_value,
            "updated_at": datetime.now(timezone.utc)
        }}
    )

    return {"message": message}

# ---------------------------
# Get User Profile
# ---------------------------
@router.get("/profile")
async def get_user_profile(email: EmailStr):
    """Get user profile information by email"""
    user = await db.household_users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id = user["_id"]
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)

    return {
        "user_id": str(user["_id"]),  # ✅ Added user_id
        "full_name": user["full_name"],
        "email": user["email"],
        "household_size": user.get("household_size"),
        "enable_2fa": user.get("enable_2fa", False),
        "acct_status": user.get("acct_status", "active"),
        "created_at": user["created_at"].isoformat() if user.get("created_at") else None,
        "last_login_at": user["last_login_at"].isoformat() if user.get("last_login_at") else None
    }

@router.post("/update-2fa-status")
async def update_2fa_status(request: Update2FARequest):
    """Enable or disable 2FA for a user"""
    user = await db.household_users.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id = user["_id"]
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)

    await db.household_users.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "enable_2fa": request.enable_2fa,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    return {
        "message": f"2FA {'enabled' if request.enable_2fa else 'disabled'} successfully",
        "enable_2fa": request.enable_2fa
    }

@router.post("/profile/enable-2fa/{user_id}")
async def enable_2fa(user_id: str):
    
    """Generate and send a new 2FA code for enabling 2FA from profile"""
    user = await db.household_users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id = user["_id"]
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)

    code = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

    # ✅ Use "enable_2fa" purpose to distinguish from registration
    await db.verification_codes.insert_one({
        "user_id": ObjectId(user_id),
        "code": code,
        "purpose": "enable_2fa",  # Different purpose
        "expires_at": expires_at,
        "is_used": False,
        "created_at": datetime.now(timezone.utc)
    })

    verification_link = f"{FRONTEND_URL}/verify-account?email={user['email']}&purpose=enable_2fa"

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
                <h1>Enable Two-Factor Authentication</h1>
            </div>
            <div class="content">
                <p>Hi {user['full_name']},</p>
                <p>You requested to enable Two-Factor Authentication for your EcoEats account.</p>
                
                <p><strong>Your verification code is:</strong></p>
                <div class="code-box">{code}</div>

                <p style="text-align: center;">
                    <a href="{verification_link}" class="button">Verify & Enable 2FA</a>
                </p>

                <p><strong>After verification, you'll need to set a new password to complete the 2FA setup.</strong></p>
                <p style="color: #dc3545; font-weight: bold;">⏰ This code expires in 5 minutes</p>

                <p>If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>© 2025 EcoEats. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

    send_email_html(
        user["email"],
        "EcoEats - Enable Two-Factor Authentication",
        html_content
    )

    return {"message": "Verification code sent successfully."}
