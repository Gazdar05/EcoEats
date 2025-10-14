from fastapi import APIRouter, HTTPException, status, Body
from app.database import db
from datetime import datetime, date
from bson import ObjectId
from bson.errors import InvalidId
from typing import Optional, List, Dict, Any

router = APIRouter(tags=["Donations"])
collection = db["food_items"]

# ✅ Same as browse page for consistency
ALLOWED_CATEGORIES = [
     "Fruits",
    "Vegetables",
    "Dairy",
    "Meat",
    "Grains",
    "Pantry Staples",
    "Bakery",
    "Beverages",
    "Canned",
    "Seafood",
]
ALLOWED_STORAGE = ["Fridge", "Freezer", "Pantry", "Counter"]

def serialize_doc(doc: dict) -> dict:
    doc["id"] = str(doc["_id"])
    del doc["_id"]

    for key, value in doc.items():
        if isinstance(value, (datetime, date)):
            doc[key] = value.isoformat()
    return doc


@router.post("/{item_id}", status_code=status.HTTP_201_CREATED)
async def convert_to_donation(
    item_id: str,
    pickupDate: Optional[str] = Body(None, embed=True),
    pickupLocation: Optional[str] = Body(None, embed=True),
):
    """Convert an inventory item into a donation entry."""
    try:
        obj_id = ObjectId(item_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid item ID format")

    item = await collection.find_one({"_id": obj_id, "source": "inventory"})
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    # ✅ Ensure fields are valid before conversion
    if item.get("category") not in ALLOWED_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category in item record")
    if item.get("storage") not in ALLOWED_STORAGE:
        raise HTTPException(status_code=400, detail="Invalid storage type in item record")

    update_data = {
        "source": "donation",
        "status": "Donated",
        "donated_at": datetime.utcnow(),
        "pickupLocation": pickupLocation,
        "pickupDate": pickupDate,
    }

    result = await collection.update_one({"_id": obj_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to convert to donation")

    updated_item = await collection.find_one({"_id": obj_id})
    return serialize_doc(updated_item)


@router.get("/", response_model=List[Dict[str, Any]], status_code=status.HTTP_200_OK)
async def get_all_donations():
    """Retrieve all donations, sorted by most recent."""
    cursor = collection.find({"source": "donation"}).sort("donated_at", -1)
    donations = []
    async for donation in cursor:
        donations.append(serialize_doc(donation))
    return donations


@router.get("/{donation_id}")
async def get_donation(donation_id: str):
    """Get a specific donation by ID."""
    try:
        obj_id = ObjectId(donation_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid donation ID format")

    donation = await collection.find_one({"_id": obj_id, "source": "donation"})
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")

    return serialize_doc(donation)


@router.delete("/{donation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_donation(donation_id: str):
    """Delete a donation by ID."""
    try:
        obj_id = ObjectId(donation_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid donation ID format")

    result = await collection.delete_one({"_id": obj_id, "source": "donation"})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Donation not found")

    return {"message": "Donation deleted successfully"}
