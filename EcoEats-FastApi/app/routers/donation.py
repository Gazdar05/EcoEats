from fastapi import APIRouter, HTTPException, status, Body
from app.database import db
from datetime import datetime
from bson import ObjectId
from typing import Optional

router = APIRouter(prefix="/donations", tags=["Donations"])

@router.post("/{item_id}", status_code=status.HTTP_201_CREATED)
async def convert_to_donation(
    item_id: str,
    pickupDate: Optional[str] = Body(None, embed=True),
    pickupLocation: Optional[str] = Body(None, embed=True)
):
    item = await db.inventory.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    expiry_value = item.get("expiry")
    if hasattr(expiry_value, "isoformat"):
        expiry_value = expiry_value.isoformat()

    donation = {
        "inventory_id": str(item["_id"]),
        "name": item["name"],
        "category": item["category"],
        "quantity": item["quantity"],
        "expiry": expiry_value,
        "storage": item.get("storage"),
        "notes": item.get("notes"),
        "image": item.get("image"),
        "donated_at": datetime.utcnow(),
        "status": "Donated",
        "pickupLocation": pickupLocation,
        "pickupDate": pickupDate,
    }

    result = await db.donations.insert_one(donation)
    await db.inventory.delete_one({"_id": ObjectId(item_id)})

    donation["_id"] = result.inserted_id
    donation["id"] = str(donation["_id"])
    del donation["_id"]

    return donation

@router.get("/", status_code=status.HTTP_200_OK)
async def get_all_donations():
    donations_cursor = db.donations.find().sort("donated_at", -1)
    donations = []
    async for donation in donations_cursor:
        donation["id"] = str(donation["_id"])
        del donation["_id"]
        donations.append(donation)
    return donations