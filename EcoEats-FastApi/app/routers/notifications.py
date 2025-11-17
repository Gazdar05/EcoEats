from fastapi import APIRouter, HTTPException
from app.database import db
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel, Field
from typing import Optional, List

router = APIRouter(tags=["Notifications"])
notifications = db["notifications"]

# ----------------------
# Pydantic Models
# ----------------------
class NotificationModel(BaseModel):
    id: str = Field(..., alias="_id")
    title: str
    message: Optional[str] = None
    type: str
    created_at: datetime
    link: Optional[str] = None
    is_read: Optional[bool] = False
    show_action: Optional[bool] = False
    action_label: Optional[str] = None
    action_link: Optional[str] = None

    model_config = {
        "populate_by_name": True,
        "json_encoders": {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }
    }

# ----------------------
# Helper: CREATE SYSTEM NOTIFICATION
# ----------------------
async def create_system_notification(title: str, message: str = ""):
    """Creates a system notification usable by login / signup / system events."""
    doc = {
        "title": title,
        "message": message,
        "type": "system",
        "created_at": datetime.utcnow(),
        "link": None,
        "is_read": False,
        "show_action": False,
        "action_label": None,
        "action_link": None,
    }
    await notifications.insert_one(doc)

# ----------------------
# Normalization Helper
# ----------------------
def normalize_notification(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    if "timestamp" in doc and "created_at" not in doc:
        doc["created_at"] = doc["timestamp"]

    item_type = doc.get("type", "system")
    title_lower = doc.get("title", "").lower()

    if item_type == "meal_reminder":
        item_type = "meal"
    if "expiring" in title_lower or "expired" in title_lower:
        item_type = "inventory"
    if item_type == "meal" and "upcoming" in title_lower:
        item_type = "meal"

    show_action = True
    if "deleted" in title_lower or "removed" in title_lower:
        show_action = False
    if item_type == "meal" and "upcoming" in title_lower:
        show_action = False

    action_label = None
    action_link = None
    if item_type == "inventory":
        if any(k in title_lower for k in ["added", "updated", "expiring", "expired"]):
            action_label = "View Item"
            action_link = f"/inventory?action=view&id={doc.get('link','')}"
    elif item_type == "donation":
        action_label = "View Donation"
        action_link = "/inventory?action=donations"
        show_action = True
    elif item_type == "meal":
        action_label = None
        action_link = None
    else:
        action_label = "Learn More"
        action_link = None

    if not action_label:
        show_action = False

    doc["type"] = item_type
    doc["show_action"] = show_action
    doc["action_label"] = action_label
    doc["action_link"] = action_link
    doc["is_read"] = doc.get("is_read", False)

    return doc

# ----------------------
# Routes
# ----------------------
@router.get("/", response_model=List[NotificationModel])
async def get_notifications():
    items = await notifications.find().sort("created_at", -1).to_list(length=None)
    normalized = [normalize_notification(item) for item in items]
    return normalized

@router.post("/{notif_id}/mark_read")
async def mark_as_read(notif_id: str):
    try:
        obj_id = ObjectId(notif_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid notification ID")

    result = await notifications.update_one({"_id": obj_id}, {"$set": {"is_read": True}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"modified_count": result.modified_count}

@router.post("/mark_all_read")
async def mark_all_read():
    result = await notifications.update_many({"is_read": False}, {"$set": {"is_read": True}})
    return {"modified_count": result.modified_count}

@router.delete("/clear_all")
async def clear_all_notifications():
    result = await notifications.delete_many({})
    return {"deleted_count": result.deleted_count}

@router.get("/unread_count")
async def unread_count():
    count = await notifications.count_documents({"is_read": False})
    return {"unread_count": count}