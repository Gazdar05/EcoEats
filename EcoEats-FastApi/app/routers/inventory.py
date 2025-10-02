# app/routers/inventory.py
from fastapi import APIRouter

router = APIRouter()

# TODO: Inventory endpoints will be added by teammate

'''from fastapi import APIRouter, HTTPException
from app.models import FoodItem, FoodCategory
from app.database import db
from datetime import datetime
from bson import ObjectId

router = APIRouter()

# --- Add food category ---
@router.post("/category")
async def add_category(cat: FoodCategory):
    existing = await db.food_categories.find_one({"name": cat.name})
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")

    result = await db["food_categories"].insert_one(cat.model_dump(by_alias=True))
    return {"status": "success", "id": str(result.inserted_id)}


# --- Add food item ---
@router.post("/item")
async def add_food_item(item: FoodItem):
    item_dict = item.model_dump(by_alias=True)
    item_dict["created_at"] = datetime.utcnow()
    item_dict["updated_at"] = datetime.utcnow()

    result = await db.food_items.insert_one(item_dict)
    return {"status": "success", "id": str(result.inserted_id)}


# --- Update food item (mark used/donated etc.) ---
@router.put("/item/{food_id}")
async def update_food_item(food_id: str, update: dict):
    result = await db.food_items.update_one(
        {"_id": ObjectId(food_id)}, {"$set": update}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Food item not found")
    return {"status": "updated"}
'''