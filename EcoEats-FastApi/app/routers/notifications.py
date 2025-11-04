from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
from app.database import db

router = APIRouter()

# =============================
# 📘 Notification Schema
# =============================
class Notification(BaseModel):
    title: str
    message: str
    type: str  # e.g. "inventory", "donation", "system", etc.
    user_id: str
    link: str | None = None
    is_read: bool = False
    created_at: datetime = datetime.utcnow()

# Helper function for BSON → JSON
def serialize_notification(notification):
    notification["_id"] = str(notification["_id"])
    return notification

# =============================
# 🟢 Get all notifications (most recent first)
# =============================
@router.get("/", summary="Get all notifications for user")
async def get_notifications(user_id: str):
    notifications_col = db["notifications"]
    notifications = await notifications_col.find({"user_id": user_id}).sort("created_at", -1).to_list(100)
    
    if not notifications:
        return {"message": "No new notifications."}
    
    return [serialize_notification(n) for n in notifications]

# =============================
# 🟡 Create new notification
# =============================
@router.post("/", summary="Create a new notification")
async def create_notification(data: Notification):
    notifications_col = db["notifications"]
    new_note = jsonable_encoder(data)
    result = await notifications_col.insert_one(new_note)
    created = await notifications_col.find_one({"_id": result.inserted_id})
    return serialize_notification(created)

# =============================
# 🟣 Mark a single notification as read
# =============================
@router.put("/{notification_id}/read", summary="Mark one notification as read")
async def mark_as_read(notification_id: str):
    notifications_col = db["notifications"]
    result = await notifications_col.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"is_read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}

# =============================
# 🔵 Mark all notifications as read
# =============================
@router.put("/mark_all_read", summary="Mark all notifications as read")
async def mark_all_read(user_id: str):
    notifications_col = db["notifications"]
    result = await notifications_col.update_many(
        {"user_id": user_id, "is_read": False},
        {"$set": {"is_read": True}}
    )
    return {"message": f"{result.modified_count} notifications marked as read"}

# =============================
# 🔴 Clear all notifications
# =============================
@router.delete("/clear_all", summary="Delete all notifications for user")
async def clear_all_notifications(user_id: str):
    notifications_col = db["notifications"]
    result = await notifications_col.delete_many({"user_id": user_id})
    return {"message": f"{result.deleted_count} notifications deleted"}