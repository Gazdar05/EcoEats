from fastapi import APIRouter, HTTPException
from app.database import db
from datetime import datetime
from bson import ObjectId

router = APIRouter(tags=["Notifications"])
notifications = db["notifications"]

# ✅ GET all notifications (newest first)
@router.get("/")
async def get_notifications():
    items = await notifications.find().sort("created_at", -1).to_list(length=None)
    result = []

    for item in items:
        item["id"] = str(item["_id"])
        del item["_id"]

        # Ensure timestamp consistency
        if "created_at" in item:
            item["created_at"] = item["created_at"].isoformat()
        elif "timestamp" in item:
            # Convert legacy field if needed
            item["created_at"] = item["timestamp"].isoformat()
            del item["timestamp"]

        title_lower = item.get("title", "").lower()
        item_type = item.get("type", "system")

        # ✅ Normalize types
        if item_type == "meal_reminder":
            item_type = "meal"
        if "expiring" in title_lower or "expired" in title_lower:
            item_type = "inventory"
        if item_type == "meal" and "upcoming" in title_lower:
            item_type = "meal"

        # ✅ Action visibility logic
        show_action = True
        if "deleted" in title_lower or "removed" in title_lower:
            show_action = False
        if item_type == "meal" and "upcoming" in title_lower:
            show_action = False  # upcoming meals: no button

        # ✅ Default action labels/links
        action_label = None
        action_link = None

        # Inventory notifications
        if item_type == "inventory":
            if any(k in title_lower for k in ["added", "updated", "expiring", "expired"]):
                action_label = "View Item"
                action_link = f"/inventory?action=view&id={item.get('link')}"
        # Donation notifications
        elif item_type == "donation":
            if "donated" in title_lower:
                action_label = "View Donation"
                action_link = "/inventory?action=donations"
        # Meal notifications
        elif item_type == "meal":
            action_label = None
            action_link = None
        # System notifications
        else:
            action_label = "Learn More"
            action_link = None

        if not action_label:
            show_action = False

        item["type"] = item_type
        item["show_action"] = show_action
        item["action_label"] = action_label
        item["action_link"] = action_link

        result.append(item)

    return result


# ✅ POST mark a single notification as read
@router.post("/{notif_id}/mark_read")
async def mark_as_read(notif_id: str):
    try:
        obj_id = ObjectId(notif_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid notification ID")

    result = await notifications.update_one(
        {"_id": obj_id},
        {"$set": {"is_read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"modified_count": result.modified_count}


# ✅ POST mark all notifications as read
@router.post("/mark_all_read")
async def mark_all_read():
    result = await notifications.update_many(
        {"is_read": False},
        {"$set": {"is_read": True}}
    )
    return {"modified_count": result.modified_count}


# ✅ GET unread notifications count
@router.get("/unread_count")
async def unread_count():
    count = await notifications.count_documents({"is_read": False})
    return {"unread_count": count}