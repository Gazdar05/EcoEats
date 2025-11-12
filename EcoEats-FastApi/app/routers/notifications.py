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
        if "created_at" in item:
            item["created_at"] = item["created_at"].isoformat()

        # hide action button for expiring/deleted items
        item["show_action"] = True
        item["action_label"] = "Learn More"
        item["action_link"] = None

        title_lower = item.get("title", "").lower()
        if "expired" in title_lower or "expiring" in title_lower:
            item["show_action"] = False
            # Only one notification per item
            if item["title"] in seen_expiring_items:
                continue
            seen_expiring_items.add(item["title"])

        # Set proper button links
        if item.get("type") == "inventory" and "added" in title_lower:
            item["action_label"] = "View Item"
            item["action_link"] = f"/inventory?action=view&id={item.get('link')}"
        elif item.get("type") == "inventory" and "updated" in title_lower:
            item["action_label"] = "View Item"
            item["action_link"] = f"/inventory?action=view&id={item.get('link')}"
        elif item.get("type") == "donation" and "donated" in title_lower:
            item["action_label"] = "View Donation"
            item["action_link"] = "/donations"

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