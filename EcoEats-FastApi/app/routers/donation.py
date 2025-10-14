# app/routers/donation.py
from fastapi import APIRouter, HTTPException, status, Body
from app.database import db
from datetime import datetime, date
from bson import ObjectId
from bson.errors import InvalidId
from typing import Optional, List, Dict, Any

router = APIRouter(tags=["Donations"])

collection_inventory = db["inventory"]
collection_donations = db["donations"]


def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB _id to string and format datetime fields."""
    doc["id"] = str(doc["_id"])
    del doc["_id"]

    # Convert datetime fields to ISO string
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

    item = await collection_inventory.find_one({"_id": obj_id})
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    # Proper expiry handling
    expiry_value = item.get("expiry")
    if isinstance(expiry_value, datetime):
        expiry_value = expiry_value.isoformat()
    elif isinstance(expiry_value, date):
        expiry_value = datetime.combine(expiry_value, datetime.min.time()).isoformat()
    elif isinstance(expiry_value, str):
        expiry_value = expiry_value
    else:
        expiry_value = None

    donation = {
        "inventory_id": str(item["_id"]),
        "name": item.get("name"),
        "category": item.get("category"),
        "quantity": item.get("quantity"),
        "expiry": expiry_value,
        "storage": item.get("storage"),
        "notes": item.get("notes"),
        "image": item.get("image"),
        "donated_at": datetime.utcnow(),
        "status": "Donated",
        "pickupLocation": pickupLocation,
        "pickupDate": pickupDate,
    }

    # Insert into donations collection with error handling
    try:
        result = await collection_donations.insert_one(donation)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to insert donation: {e}")

    donation["_id"] = result.inserted_id

    # Remove the original item from inventory
    try:
        await collection_inventory.delete_one({"_id": obj_id})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove inventory item: {e}")

    return serialize_doc(donation)


@router.get("/", response_model=List[Dict[str, Any]], status_code=status.HTTP_200_OK)
async def get_all_donations():
    """Retrieve all donations, sorted by most recent."""
    donations_cursor = collection_donations.find().sort("donated_at", -1)
    donations = []
    async for donation in donations_cursor:
        donations.append(serialize_doc(donation))
    return donations


@router.get("/{donation_id}")
async def get_donation(donation_id: str):
    """Get a specific donation by ID."""
    try:
        obj_id = ObjectId(donation_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid donation ID format")

    donation = await collection_donations.find_one({"_id": obj_id})
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

    result = await collection_donations.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Donation not found")

    return {"message": "Donation deleted successfully"}