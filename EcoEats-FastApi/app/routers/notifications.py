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
    seen_expiring_items = set()  # to avoid duplicate notifications for expiring items

    result = []
    for item in items:
        item["id"] = str(item["_id"])
        del item["_id"]

        # Ensure created_at is ISO string
        if "created_at" in item:
            item["created_at"] = item["created_at"].isoformat()

        title_lower = item.get("title", "").lower()
        item_type = item.get("type", "system")  # default type

        # Hide action for expiring/deleted items
        show_action = True
        if "expired" in title_lower or "expiring" in title_lower or "deleted" in title_lower or "removed" in title_lower:
            show_action = False
            if item["title"] in seen_expiring_items:
                continue
            seen_expiring_items.add(item["title"])

        # Upcoming meals: always type "meal", no action needed
        if item_type == "meal" and "upcoming" in title_lower:
            item_type = "meal"
            show_action = False  # no action button

        # Set action_label and action_link
        action_label = None
        action_link = None

        if item_type == "inventory":
            if "added" in title_lower or "updated" in title_lower or "edited" in title_lower:
                action_label = "View Item"
                action_link = f"/inventory?action=view&id={item.get('link')}"
        elif item_type == "donation":
            if "donated" in title_lower:
                action_label = "View Donation"
                action_link = "/inventory?action=donations"
        elif item_type == "system":
            action_label = "Learn More"
            action_link = None
        # meals (including upcoming) have no action
        elif item_type == "meal":
            action_label = None
            action_link = None

        # Ensure show_action is False if no action_label
        if not action_label:
            show_action = False

        item["type"] = item_type
        item["show_action"] = show_action
        item["action_label"] = action_label
        item["action_link"] = action_link

        result.append(item)

    return result

# ✅ POST mark a notification as read
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

# Optional: GET unread notifications count
@router.get("/unread_count")
async def unread_count():
    count = await notifications.count_documents({"is_read": False})
    return {"unread_count": count}