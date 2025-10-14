from fastapi import APIRouter, HTTPException, status, Request
from bson import ObjectId
from bson.errors import InvalidId
from app.database import db
from datetime import datetime

router = APIRouter(tags=["Inventory"])
collection = db["food_items"]

# ✅ Constants synced with Browse Page
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


# ✅ Helper: Convert DB item to frontend format
def serialize_item(item):
    item["id"] = str(item["_id"])
    del item["_id"]

    # rename expiry_date → expiry
    if "expiry_date" in item:
        if isinstance(item["expiry_date"], datetime):
            item["expiry"] = item["expiry_date"].strftime("%Y-%m-%d")
        else:
            item["expiry"] = item["expiry_date"]
        del item["expiry_date"]
    else:
        item["expiry"] = None

    # ensure image exists
    item["image"] = item.get("image", "")

    # ensure quantity exists
    item["quantity"] = int(item.get("quantity", 1))

    # include status for frontend
    if "expiry" in item:
        today = datetime.utcnow().date()
        exp_date = datetime.strptime(item["expiry"], "%Y-%m-%d").date()
        if exp_date < today:
            item["status"] = "Expired"
        elif (exp_date - today).days <= 3:
            item["status"] = "Expiring Soon"
        else:
            item["status"] = "Fresh"
    else:
        item["status"] = "Unknown"

    # reserved flag
    item["reserved"] = item.get("reserved", False)

    return item



# ✅ GET all inventory items
@router.get("/")
async def get_inventory():
    items = await collection.find({"source": "inventory"}).to_list(length=None)
    return [serialize_item(item) for item in items]


# ✅ GET single item by ID
@router.get("/{item_id}")
async def get_inventory_item(item_id: str):
    try:
        obj_id = ObjectId(item_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid item ID format")

    item = await collection.find_one({"_id": obj_id, "source": "inventory"})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    return serialize_item(item)


# ✅ POST (create) a new inventory item
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_inventory_item(request: Request):
    item = await request.json()

    # map frontend "expiry" → backend "expiry_date"
    if "expiry" in item:
        item["expiry_date"] = item.pop("expiry")

    required = ["name", "category", "quantity", "expiry_date", "storage"]
    for field in required:
        if field not in item or not item[field]:
            raise HTTPException(status_code=400, detail=f"Missing field: {field}")

    # validate category/storage
    if item["category"] not in ALLOWED_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category: {item['category']}")
    if item["storage"] not in ALLOWED_STORAGE:
        raise HTTPException(status_code=400, detail=f"Invalid storage type: {item['storage']}")

    # convert expiry_date string → datetime
    if isinstance(item.get("expiry_date"), str):
        try:
            item["expiry_date"] = datetime.strptime(item["expiry_date"], "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid expiry_date format. Use YYYY-MM-DD.")

    # ✅ Allow optional image (base64 or URL)
    if "image" not in item:
        item["image"] = ""

    item["source"] = "inventory"
    item["created_at"] = datetime.utcnow()

    result = await collection.insert_one(item)
    new_item = await collection.find_one({"_id": result.inserted_id})
    return serialize_item(new_item)


# ✅ PUT (update) inventory item
@router.put("/{item_id}")
async def update_inventory_item(item_id: str, request: Request):
    updated_data = await request.json()

    # map frontend "expiry" → backend "expiry_date"
    if "expiry" in updated_data:
        updated_data["expiry_date"] = updated_data.pop("expiry")

    try:
        obj_id = ObjectId(item_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid item ID format")

    # validate if category/storage updated
    if "category" in updated_data and updated_data["category"] not in ALLOWED_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category: {updated_data['category']}")
    if "storage" in updated_data and updated_data["storage"] not in ALLOWED_STORAGE:
        raise HTTPException(status_code=400, detail=f"Invalid storage type: {updated_data['storage']}")

    # convert expiry_date to datetime if string
    if isinstance(updated_data.get("expiry_date"), str):
        try:
            updated_data["expiry_date"] = datetime.strptime(updated_data["expiry_date"], "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid expiry_date format. Use YYYY-MM-DD.")

    # ✅ Ensure image can be updated
    if "image" not in updated_data:
        updated_data["image"] = ""

    result = await collection.update_one({"_id": obj_id, "source": "inventory"}, {"$set": updated_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")

    updated_item = await collection.find_one({"_id": obj_id})
    return serialize_item(updated_item)


# ✅ DELETE inventory item
@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_inventory_item(item_id: str):
    try:
        obj_id = ObjectId(item_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid item ID format")

    result = await collection.delete_one({"_id": obj_id, "source": "inventory"})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")

    return {"message": "Item deleted successfully"}
