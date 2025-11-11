from fastapi import APIRouter, HTTPException, status, Request
from bson import ObjectId
from bson.errors import InvalidId
from app.database import db
from datetime import datetime
from pydantic import BaseModel
import json

# -------------------------------
# Setup
# -------------------------------

class BulkItem(BaseModel):
    id: str
    quantity: int

router = APIRouter(tags=["Inventory"])
collection = db["food_items"]   # ✅ use food_items collection

# ✅ Centralized filter for both tagged and untagged inventory items
SOURCE_FILTER = {"$or": [{"source": "inventory"}, {"source": {"$exists": False}}]}

# -------------------------------
# Constants
# -------------------------------
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

# -------------------------------
# Helper: serialization
# -------------------------------
def serialize_item(item):
    item["id"] = str(item["_id"])
    del item["_id"]

    if "expiry_date" in item:
        if isinstance(item["expiry_date"], datetime):
            item["expiry"] = item["expiry_date"].strftime("%Y-%m-%d")
        else:
            item["expiry"] = item["expiry_date"]
        del item["expiry_date"]
    else:
        item["expiry"] = None

    if "category" in item:
        item["category"] = normalize_category(item["category"])

    item["image"] = item.get("image", "")
    item["quantity"] = int(item.get("quantity", 1))

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

    item["reserved"] = item.get("reserved", False)
    return item

# -------------------------------
# Routes
# -------------------------------

# ✅ GET all inventory items
@router.get("/")
async def get_inventory():
    items = await collection.find(SOURCE_FILTER).to_list(length=None)
    print(f"📦 returning {len(items)} items from DB (with or without source flag)")
    return [serialize_item(item) for item in items]

# ✅ GET single item
@router.get("/{item_id}")
async def get_inventory_item(item_id: str):
    try:
        obj_id = ObjectId(item_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid item ID format")

    item = await collection.find_one({"$and": [{"_id": obj_id}, SOURCE_FILTER]})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    return serialize_item(item)

# ✅ POST (create)
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_inventory_item(request: Request):
    item = await request.json()
    print("🧾 Received inventory payload:", item)

    if "expiry" in item:
        item["expiry_date"] = item.pop("expiry")

    required = ["name", "category", "quantity", "expiry_date", "storage"]
    for field in required:
        if field not in item or not item[field]:
            raise HTTPException(status_code=400, detail=f"Missing field: {field}")

    item["category"] = normalize_category(str(item["category"]).strip())
    item["storage"] = str(item["storage"]).strip()
    item["name"] = str(item["name"]).strip()

    if item["category"] not in ALLOWED_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category: {item['category']}")
    if item["storage"] not in ALLOWED_STORAGE:
        raise HTTPException(status_code=400, detail=f"Invalid storage type: {item['storage']}")

    try:
        item["quantity"] = int(item.get("quantity", 1))
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Quantity must be a number")

    if isinstance(item.get("expiry_date"), str):
        try:
            item["expiry_date"] = datetime.strptime(item["expiry_date"], "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid expiry_date format. Use YYYY-MM-DD.")

    item["image"] = item.get("image", "")
    item["source"] = "inventory"
    item["created_at"] = datetime.utcnow()

    result = await collection.insert_one(item)
    new_item = await collection.find_one({"_id": result.inserted_id})
    return serialize_item(new_item)

# ✅ BULK update (move ABOVE single-item PUT)
@router.put("/bulk-update")
async def bulk_update_inventory_items(request: Request):
    try:
        raw = await request.body()
        items = json.loads(raw)
    except Exception as e:
        print("❌ Failed to parse JSON body:", e)
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    print(f"📦 Received bulk update with {len(items)} items")
    if len(items) > 0:
        print("First item sample:", items[0])

    matched = 0
    modified = 0

    for it in items:
        _id = it.get("id")
        qty = it.get("quantity")

        if not _id or not isinstance(_id, str):
            print(f"⚠️ Skipping invalid id: {_id}")
            continue
        if not ObjectId.is_valid(_id):
            print(f"⚠️ Invalid ObjectId string: {_id}")
            continue

        obj_id = ObjectId(_id)
        res = await collection.update_one(
            {"$and": [{"_id": obj_id}, SOURCE_FILTER]},
            {"$set": {"quantity": qty, "updated_at": datetime.utcnow()}}
        )

        matched += res.matched_count
        modified += res.modified_count
        print(f"🛠 Updated {_id}: quantity → {qty}")

    print(f"✅ bulk-update done: matched={matched}, modified={modified}, total={len(items)}")
    return {"status": "ok", "matched": matched, "modified": modified}

# ✅ PUT (update single item)
@router.put("/{item_id}")
async def update_inventory_item(item_id: str, request: Request):
    updated_data = await request.json()

    if "expiry" in updated_data:
        try:
            updated_data["expiry_date"] = datetime.strptime(updated_data.pop("expiry"), "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid expiry format. Use YYYY-MM-DD.")

    try:
        obj_id = ObjectId(item_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid item ID format")

    if "category" in updated_data:
        updated_data["category"] = normalize_category(updated_data["category"])
        if updated_data["category"] not in ALLOWED_CATEGORIES:
            raise HTTPException(status_code=400, detail=f"Invalid category: {updated_data['category']}")

    if "storage" in updated_data and updated_data["storage"] not in ALLOWED_STORAGE:
        raise HTTPException(status_code=400, detail=f"Invalid storage type: {updated_data['storage']}")

    if "image" not in updated_data:
        updated_data["image"] = ""

    result = await collection.update_one(
        {"$and": [{"_id": obj_id}, SOURCE_FILTER]},
        {"$set": updated_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")

    updated_item = await collection.find_one({"_id": obj_id})
    return serialize_item(updated_item)
