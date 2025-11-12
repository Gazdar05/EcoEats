from fastapi import APIRouter, HTTPException, status, Body
from app.database import db
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId

router = APIRouter(tags=["Donations"])
collection = db["food_items"]
notifications = db["notifications"]

async def create_notification(title, message, notif_type="donation", link=None):
    await notifications.insert_one({
        "title": title,
        "message": message,
        "type": notif_type,
        "link": link,
        "is_read": False,
        "created_at": datetime.utcnow()
    })

@router.post("/{item_id}", status_code=status.HTTP_201_CREATED)
async def convert_to_donation(
    item_id: str,
    pickupDate: str = Body(...),
    pickupLocation: str = Body(...)
):
    try:
        obj_id = ObjectId(item_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid item ID")

    item = await collection.find_one({"_id": obj_id, "source": "inventory"})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    await collection.update_one(
        {"_id": obj_id},
        {"$set": {
            "source": "donation",
            "status": "Donated",
            "donated_at": datetime.utcnow(),
            "pickupDate": pickupDate,
            "pickupLocation": pickupLocation
        }}
    )

    # 🔔 Notify donation
    await create_notification(
        title="Item Donated",
        message=f"{item['name']} has been successfully donated.",
        notif_type="donation",
        link=f"/donations"
    )

    updated_item = await collection.find_one({"_id": obj_id})
    updated_item["id"] = str(updated_item["_id"])
    del updated_item["_id"]
    return updated_item

@router.get("/")
async def get_donations():
    items = await collection.find({"source": "donation"}).to_list(length=None)
    for item in items:
        item["id"] = str(item["_id"])
        del item["_id"]
    return items