# app/routers/inventory.py
from fastapi import APIRouter, HTTPException, status
from bson import ObjectId
from bson.errors import InvalidId
from app.database import db
from datetime import datetime

router = APIRouter()
collection = db["inventory"]

def serialize_item(item):
    """Convert MongoDB _id to string and clean datetime fields."""
    item["id"] = str(item["_id"])
    del item["_id"]

    # Convert expiry datetime to string (YYYY-MM-DD)
    if "expiry" in item and isinstance(item["expiry"], datetime):
        item["expiry"] = item["expiry"].strftime("%Y-%m-%d")

    return item


@router.get("/")
async def get_inventory():
    """Get all inventory items."""
    items = await collection.find().to_list(length=None)
    return [serialize_item(item) for item in items]


@router.get("/{item_id}")
async def get_inventory_item(item_id: str):
    """Get a single inventory item by ID."""
    try:
        obj_id = ObjectId(item_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid item ID format")

    item = await collection.find_one({"_id": obj_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    return serialize_item(item)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_inventory_item(item: dict):
    """Create a new inventory item."""
    required = ["name", "category", "quantity", "expiry", "storage"]
    for field in required:
        if field not in item or not item[field]:
            raise HTTPException(status_code=400, detail=f"Missing field: {field}")

    # Convert expiry string to datetime
    if isinstance(item.get("expiry"), str):
        try:
            item["expiry"] = datetime.strptime(item["expiry"], "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid expiry date format. Use YYYY-MM-DD.")

    result = await collection.insert_one(item)
    new_item = await collection.find_one({"_id": result.inserted_id})
    return serialize_item(new_item)


@router.put("/{item_id}")
async def update_inventory_item(item_id: str, updated_data: dict):
    """Update an inventory item."""
    try:
        obj_id = ObjectId(item_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid item ID format")

    # Convert expiry if needed
    if isinstance(updated_data.get("expiry"), str):
        try:
            updated_data["expiry"] = datetime.strptime(updated_data["expiry"], "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid expiry date format. Use YYYY-MM-DD.")

    result = await collection.update_one({"_id": obj_id}, {"$set": updated_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")

    updated_item = await collection.find_one({"_id": obj_id})
    return serialize_item(updated_item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_inventory_item(item_id: str):
    """Delete an inventory item."""
    try:
        obj_id = ObjectId(item_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid item ID format")

    result = await collection.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")

    return {"message": "Item deleted successfully"}