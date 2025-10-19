from fastapi import APIRouter, HTTPException, status, Request
from bson import ObjectId
from bson.errors import InvalidId
from app.database import db
from datetime import datetime

router = APIRouter(tags=["Inventory"])
collection = db["food_items"]  # ✅ stay with food_items collection

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

# ✅ Map plural → singular
CATEGORY_MAP = {
    "Fruits": "Fruits",
    "Fruit": "Fruits",
    "Vegetables": "Vegetables",
    "Vegetable": "Vegetables",
    "Grains": "Grains",
    "Grain": "Grains",
    "Pantry Staple": "Pantry Staples",
    "Dairy": "Dairy",
    "Meat": "Meat",
    "Bakery": "Bakery",
    "Beverages": "Beverages",
    "Canned": "Canned",
    "Seafood": "Seafood",
}

def normalize_category(cat: str) -> str:
    return CATEGORY_MAP.get(cat, cat)


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

    # normalize category
    if "category" in item:
        item["category"] = normalize_category(item["category"])

    # ensure image exists
    item["image"] = item.get("image", "")

    # ✅ safely handle quantity (can be "2", "2L", "3 bottles", etc.)
    quantity_val = item.get("quantity", 1)
    try:
        item["quantity"] = int(quantity_val)
    except (ValueError, TypeError):
        # Keep as string if not a plain integer
        item["quantity"] = str(quantity_val)

    # include status for frontend
    if "expiry" in item and item["expiry"]:
        today = datetime.utcnow().date()
        try:
            exp_date = datetime.strptime(item["expiry"], "%Y-%m-%d").date()
            if exp_date < today:
                item["status"] = "Expired"
            elif (exp_date - today).days <= 3:
                item["status"] = "Expiring Soon"
            else:
                item["status"] = "Fresh"
        except Exception:
            item["status"] = "Unknown"
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
    print("🧾 Received inventory payload:", item)

    # map frontend "expiry" → backend "expiry_date"
    if "expiry" in item:
        item["expiry_date"] = item.pop("expiry")

    # Required fields
    required = ["name", "category", "quantity", "expiry_date", "storage"]
    for field in required:
        if field not in item or not item[field]:
            print(f"❌ Missing or empty field: {field}")
            raise HTTPException(status_code=400, detail=f"Missing field: {field}")

    # ✅ Trim strings
    item["category"] = str(item["category"]).strip()
    item["storage"] = str(item["storage"]).strip()
    item["name"] = str(item["name"]).strip()

    print(f"📋 Before normalization - Category: '{item['category']}', Storage: '{item['storage']}'")

    # normalize category before validating
    item["category"] = normalize_category(item["category"])

    print(f"📋 After normalization - Category: '{item['category']}'")
    print(f"✅ Allowed categories: {ALLOWED_CATEGORIES}")

    # validate category/storage
    if item["category"] not in ALLOWED_CATEGORIES:
        print(f"❌ Invalid category: {item['category']}")
        raise HTTPException(status_code=400, detail=f"Invalid category: {item['category']}")
    if item["storage"] not in ALLOWED_STORAGE:
        print(f"❌ Invalid storage: {item['storage']}")
        raise HTTPException(status_code=400, detail=f"Invalid storage type: {item['storage']}")

    # ✅ safely handle quantity conversion
    try:
        item["quantity"] = int(item.get("quantity", 1))
    except (ValueError, TypeError):
        print(f"⚠️ Non-numeric quantity detected: {item.get('quantity')} — storing as string")
        item["quantity"] = str(item.get("quantity", "1"))

    # convert expiry_date string → datetime
    if isinstance(item.get("expiry_date"), str):
        try:
            item["expiry_date"] = datetime.strptime(item["expiry_date"], "%Y-%m-%d")
        except ValueError:
            print(f"❌ Invalid expiry_date format: {item.get('expiry_date')}")
            raise HTTPException(status_code=400, detail="Invalid expiry_date format. Use YYYY-MM-DD.")

    # optional image
    item["image"] = item.get("image", "")

    item["source"] = "inventory"
    item["created_at"] = datetime.utcnow()

    result = await collection.insert_one(item)
    new_item = await collection.find_one({"_id": result.inserted_id})
    return serialize_item(new_item)


# ✅ PUT (update) inventory item
@router.put("/{item_id}")
async def update_inventory_item(item_id: str, request: Request):
    updated_data = await request.json()

    # ✅ Map frontend "expiry" → backend "expiry_date"
    if "expiry" in updated_data:
        try:
            updated_data["expiry_date"] = datetime.strptime(updated_data.pop("expiry"), "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid expiry format. Use YYYY-MM-DD.")

    try:
        obj_id = ObjectId(item_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid item ID format")

    # normalize category before validating
    if "category" in updated_data:
        updated_data["category"] = normalize_category(updated_data["category"])
        if updated_data["category"] not in ALLOWED_CATEGORIES:
            raise HTTPException(status_code=400, detail=f"Invalid category: {updated_data['category']}")

    if "storage" in updated_data and updated_data["storage"] not in ALLOWED_STORAGE:
        raise HTTPException(status_code=400, detail=f"Invalid storage type: {updated_data['storage']}")

    # ✅ Ensure image can be updated
    if "image" not in updated_data:
        updated_data["image"] = ""

    # ✅ Safely handle quantity updates
    if "quantity" in updated_data:
        try:
            updated_data["quantity"] = int(updated_data["quantity"])
        except (ValueError, TypeError):
            updated_data["quantity"] = str(updated_data["quantity"])

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