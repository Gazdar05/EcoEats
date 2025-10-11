# app/routers/browse.py
from fastapi import APIRouter, HTTPException, Query, Body
from bson import ObjectId
from datetime import datetime, timedelta
from app.database import db

router = APIRouter(prefix="/browse", tags=["Browse"])

# ✅ Get all items with optional filters
@router.get("/items")
async def get_items(
    source: str | None = Query(None, description="inventory or donation"),
    categories: list[str] | None = Query(None),
    storage: str | None = Query(None),
    expiryDays: str | None = Query(None),
    search: str | None = Query(None)
):
    query = {}

    # filters based on query params
    if source:
        query["source"] = source
    if categories:
        query["category"] = {"$in": categories}
    if storage and storage.lower() != "all":
        query["storage"] = {"$regex": f"^{storage}$", "$options": "i"}

    # handle expiry filters
    today = datetime.utcnow().date()
    if expiryDays:
        if expiryDays == "expired":
            query["expiry_date"] = {"$lt": today}
        elif expiryDays == "0":
            query["expiry_date"] = {
                "$gte": datetime(today.year, today.month, today.day),
                "$lt": datetime(today.year, today.month, today.day) + timedelta(days=1)
            }
        else:
            max_date = today + timedelta(days=int(expiryDays))
            query["expiry_date"] = {"$gte": today, "$lte": max_date}

    # search filter
    if search:
        query["name"] = {"$regex": search, "$options": "i"}

    results = []
    async for doc in db.food_items.find(query):
        doc["_id"] = str(doc["_id"])
        results.append(doc)
    return results


# ✅ Get one item details
@router.get("/item/{item_id}")
async def get_item(item_id: str):
    item = await db.food_items.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item["_id"] = str(item["_id"])
    return item


# ✅ Mark an item as used
@router.put("/item/{item_id}/mark-used")
async def mark_item_used(item_id: str):
    item = await db.food_items.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    qty = item.get("quantity", 1)
    if qty > 1:
        await db.food_items.update_one(
            {"_id": ObjectId(item_id)},
            {"$inc": {"quantity": -1}}
        )
        return {"status": "quantity decreased"}
    else:
        await db.food_items.delete_one({"_id": ObjectId(item_id)})
        return {"status": "item removed"}


# ✅ Plan a meal (reserve item)
@router.put("/item/{item_id}/plan-meal")
async def plan_meal(item_id: str):
    result = await db.food_items.update_one(
        {"_id": ObjectId(item_id), "reserved": {"$ne": True}},
        {"$set": {"reserved": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Already reserved or not found")
    return {"status": "reserved for meal"}


# ✅ Flag for donation
@router.put("/item/{item_id}/flag-donation")
async def flag_donation(
    item_id: str,
    details: dict = Body(...)
):
    update = {
        "source": "donation",
        "donationDetails": {
            "location": details.get("location"),
            "availability": details.get("availability"),
            "contact": details.get("contact"),
        }
    }
    result = await db.food_items.update_one(
        {"_id": ObjectId(item_id)},
        {"$set": update}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"status": "flagged for donation"}


# ✅ Remove from donation
@router.put("/item/{item_id}/remove-donation")
async def remove_donation(item_id: str):
    result = await db.food_items.update_one(
        {"_id": ObjectId(item_id)},
        {"$set": {"source": "inventory"}, "$unset": {"donationDetails": ""}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"status": "removed from donation"}
# ✅ Mark item as donated (Option 2: keep it, mark as donated)
@router.put("/item/{item_id}/mark-donated")
async def mark_donated(item_id: str):
    result = await db.food_items.update_one(
        {"_id": ObjectId(item_id)},
        {"$set": {"donated": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Item not found or already donated")
    return {"status": "marked as donated"}
