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
collection = db["food_items"]
notifications = db["notifications"]   # ← his feature enabled

# Centralized filter (REQUIRED for main features)
SOURCE_FILTER = {"$or": [{"source": "inventory"}, {"source": {"$exists": False}}]}

# -------------------------------
# Constants
# -------------------------------
ALLOWED_CATEGORIES = [
    "Fruits", "Vegetables", "Dairy", "Meat", "Grains",
    "Pantry Staples", "Bakery", "Beverages", "Canned", "Seafood"
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
# Serialization Helper
# -------------------------------
def serialize_item(item):
    item["id"] = str(item["_id"])
    item.pop("_id", None)             # <-- final fix

    # expiry normalization
    if "expiry_date" in item:
        try:
            if isinstance(item["expiry_date"], datetime):
                item["expiry"] = item["expiry_date"].strftime("%Y-%m-%d")
            else:
                item["expiry"] = item["expiry_date"]
        except:
            item["expiry"] = None
        item.pop("expiry_date", None)
    else:
        item["expiry"] = None

    item["category"] = normalize_category(item.get("category", ""))

    item["image"] = item.get("image", "")
    item["quantity"] = int(item.get("quantity", 0))

    # expiry → status
    if item["expiry"]:
        try:
            today = datetime.utcnow().date()
            exp = datetime.strptime(item["expiry"], "%Y-%m-%d").date()
            diff = (exp - today).days
            if diff < 0:
                item["status"] = "Expired"
            elif diff <= 3:
                item["status"] = "Expiring Soon"
            else:
                item["status"] = "Fresh"
        except:
            item["status"] = "Unknown"
    else:
        item["status"] = "Unknown"

    item["reserved"] = bool(item.get("reserved", False))
    return item


# -------------------------------
# Notification Helper
# -------------------------------
async def create_notification(title, message, notif_type="inventory", user_id="default", link=None, show_action=True):
    await notifications.insert_one({
        "title": title,
        "message": message,
        "type": notif_type,
        "user_id": user_id,
        "link": link,
        "is_read": False,
        "created_at": datetime.utcnow(),
        "show_action": show_action
    })

# -------------------------------
# Routes
# -------------------------------

# GET all inventory items (merged)
@router.get("/")
async def get_inventory():
    items = await collection.find(SOURCE_FILTER).to_list(length=None)
    serialized = [serialize_item(item) for item in items]

    # Auto-create notifications for expired/expiring items
    for item in serialized:
        if item["status"] in ["Expired", "Expiring Soon"]:
            exists = await notifications.find_one({
                "title": f"Item {item['status']}",
                "link": f"/inventory/{item['id']}",
                "type": "system"
            })
            if not exists:
                await create_notification(
                    title=f"Item {item['status']}",
                    message=f"{item['name']} is {item['status'].lower()}!",
                    notif_type="system",
                    link=f"/inventory/{item['id']}",
                    show_action=False
                )

    return serialized

# GET donated items (his feature)
@router.get("/donations/")
async def get_donated_items():
    items = await collection.find({"source": "donation"}).to_list(length=None)
    return [serialize_item(item) for item in items]

# GET single item
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

# CREATE item (merged)
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_inventory_item(request: Request):
    item = await request.json()

    if "expiry" in item:
        item["expiry_date"] = item.pop("expiry")

    required = ["name", "category", "quantity", "expiry_date", "storage"]
    for field in required:
        if field not in item or not item[field]:
            raise HTTPException(400, f"Missing field: {field}")

    # normalization
    item["category"] = normalize_category(str(item["category"]).strip())
    item["storage"] = str(item["storage"]).strip()
    item["name"] = str(item["name"]).strip()

    if item["category"] not in ALLOWED_CATEGORIES:
        raise HTTPException(400, f"Invalid category: {item['category']}")
    if item["storage"] not in ALLOWED_STORAGE:
        raise HTTPException(400, f"Invalid storage type: {item['storage']}")

    try:
        item["quantity"] = int(item.get("quantity", 1))
    except:
        raise HTTPException(400, "Quantity must be a number")

    if isinstance(item.get("expiry_date"), str):
        try:
            item["expiry_date"] = datetime.strptime(item["expiry_date"], "%Y-%m-%d")
        except:
            raise HTTPException(400, "Invalid expiry_date format. Use YYYY-MM-DD.")

    item["image"] = item.get("image", "")
    item["source"] = "inventory"
    item["created_at"] = datetime.utcnow()

    result = await collection.insert_one(item)
    new_item = await collection.find_one({"_id": result.inserted_id})

    # send notification
    await create_notification(
        title="New Item Added",
        message=f"{item['name']} was added to inventory.",
        notif_type="inventory",
        link=f"/inventory/{result.inserted_id}",
        show_action=True
    )

    return serialize_item(new_item)

# BULK UPDATE (main feature)
@router.put("/bulk-update")
async def bulk_update_inventory_items(request: Request):
    try:
        items = json.loads(await request.body())
    except:
        raise HTTPException(400, "Invalid JSON body")

    matched = 0
    modified = 0

    for it in items:
        _id = it.get("id")
        qty = it.get("quantity")

        if not _id or not ObjectId.is_valid(_id):
            continue

        obj_id = ObjectId(_id)

        res = await collection.update_one(
            {"$and": [{"_id": obj_id}, SOURCE_FILTER]},
            {"$set": {"quantity": qty, "updated_at": datetime.utcnow()}}
        )

        matched += res.matched_count
        modified += res.modified_count

    return {"status": "ok", "matched": matched, "modified": modified}

# UPDATE item (merged)
@router.put("/{item_id}")
async def update_inventory_item(item_id: str, request: Request):
    updated_data = await request.json()

    # Handle expiry
    expiry_val = updated_data.pop("expiry", None)
    if expiry_val:
        try:
            updated_data["expiry_date"] = datetime.strptime(expiry_val, "%Y-%m-%d")
        except:
            raise HTTPException(400, "Invalid expiry format. Use YYYY-MM-DD.")
    else:
        updated_data["expiry_date"] = None

    # Normalize other fields
    if "quantity" in updated_data:
        try:
            updated_data["quantity"] = int(updated_data["quantity"])
        except:
            raise HTTPException(400, "Quantity must be a number.")

    if "name" in updated_data:
        updated_data["name"] = str(updated_data["name"]).strip()

    if "category" in updated_data:
        updated_data["category"] = normalize_category(updated_data["category"])
        if updated_data["category"] not in ALLOWED_CATEGORIES:
            raise HTTPException(400, f"Invalid category: {updated_data['category']}")

    if "storage" in updated_data:
        updated_data["storage"] = str(updated_data["storage"]).strip()
        if updated_data["storage"] not in ALLOWED_STORAGE:
            raise HTTPException(400, f"Invalid storage type: {updated_data['storage']}")

    if "image" in updated_data and updated_data["image"] is None:
        updated_data["image"] = ""

    # Always update timestamp
    updated_data["updated_at"] = datetime.utcnow()

    # Update in MongoDB
    try:
        obj_id = ObjectId(item_id)
    except:
        raise HTTPException(400, "Invalid item ID format")

    result = await collection.update_one(
        {"$and": [{"_id": obj_id}, SOURCE_FILTER]},
        {"$set": updated_data}
    )

    if result.matched_count == 0:
        raise HTTPException(404, "Item not found")

    # Fetch updated document
    updated_item = await collection.find_one({"_id": obj_id})

    # Send notification
    await create_notification(
        title="Item Updated",
        message=f"{updated_item['name']} was updated.",
        notif_type="inventory",
        user_id="default",
        link=f"/inventory/{item_id}",
        show_action=True
    )

    return serialize_item(updated_item)

# DELETE item (his feature merged safely)
@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_inventory_item(item_id: str):
    try:
        obj_id = ObjectId(item_id)
    except:
        raise HTTPException(400, "Invalid ID format")

    deleted_item = await collection.find_one({"_id": obj_id})

    result = await collection.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Item not found")

    if deleted_item:
        await create_notification(
            title="Item Deleted",
            message=f"{deleted_item['name']} was removed from inventory.",
            notif_type="inventory",
            show_action=False
        )

    return {"message": "Item deleted successfully"}