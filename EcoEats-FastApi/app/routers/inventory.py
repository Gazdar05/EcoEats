from fastapi import APIRouter, HTTPException, status, Request
from bson import ObjectId
from bson.errors import InvalidId
from app.database import db
from datetime import datetime

router = APIRouter(tags=["Inventory"])
collection = db["food_items"]
notifications = db["notifications"]

ALLOWED_CATEGORIES = [
    "Fruits", "Vegetables", "Dairy", "Meat", "Grains",
    "Pantry Staples", "Bakery", "Beverages", "Canned", "Seafood"
]
ALLOWED_STORAGE = ["Fridge", "Freezer", "Pantry", "Counter"]

CATEGORY_MAP = {
    "Fruit": "Fruits", "Vegetable": "Vegetables",
    "Grain": "Grains", "Pantry Staple": "Pantry Staples",
    "Dairy": "Dairy", "Meat": "Meat", "Bakery": "Bakery",
    "Beverages": "Beverages", "Canned": "Canned", "Seafood": "Seafood"
}

def normalize_category(cat: str) -> str:
    return CATEGORY_MAP.get(cat, cat)

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

    item["category"] = normalize_category(item.get("category", ""))
    item["image"] = item.get("image", "")
    item["quantity"] = int(item.get("quantity", 1))
    item["reserved"] = item.get("reserved", False)

    if item["expiry"]:
        today = datetime.utcnow().date()
        exp_date = datetime.strptime(item["expiry"], "%Y-%m-%d").date()
        if exp_date < today:
            item["status"] = "Expired"
        elif (exp_date - today).days <= 3:
            item["status"] = "Expiring Soon"
        else:
            item["status"] = "Fresh"
    else:
        item["status"] = item.get("status", "Unknown")
    return item

# Notification helper
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

# GET inventory items only
@router.get("/")
async def get_inventory():
    items = await collection.find({"source": "inventory"}).to_list(length=None)
    serialized = [serialize_item(item) for item in items]

    # Only create one notification per expiring/expired item
    for item in serialized:
        if item["status"] in ["Expired", "Expiring Soon"]:
            existing = await notifications.find_one({
                "title": f"Item {item['status']}",
                "link": str(item["id"]),
                "type": "system"
            })
            if not existing:
                await create_notification(
                    title=f"Item {item['status']}",
                    message=f"{item['name']} is {item['status'].lower()}!",
                    notif_type="system",
                    link=f"/inventory/{item['id']}",
                    show_action=False
                )
    return serialized

# GET donated items
@router.get("/donations/")
async def get_donated_items():
    items = await collection.find({"source": "donation"}).to_list(length=None)
    return [serialize_item(item) for item in items]

# GET single inventory item
@router.get("/{item_id}")
async def get_inventory_item(item_id: str):
    try:
        obj_id = ObjectId(item_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid item ID format")

    item = await collection.find_one({"_id": obj_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return serialize_item(item)

# CREATE inventory item
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_inventory_item(request: Request):
    item = await request.json()
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
        raise HTTPException(status_code=400, detail="Invalid category.")
    if item["storage"] not in ALLOWED_STORAGE:
        raise HTTPException(status_code=400, detail="Invalid storage.")

    item["quantity"] = int(item.get("quantity", 1))
    item["expiry_date"] = datetime.strptime(item["expiry_date"], "%Y-%m-%d")
    item["source"] = "inventory"
    item["created_at"] = datetime.utcnow()

    result = await collection.insert_one(item)
    new_item = await collection.find_one({"_id": result.inserted_id})

    # Notification for new item
    await create_notification(
        title="New Item Added",
        message=f"{item['name']} was added to inventory.",
        notif_type="inventory",
        link=f"/inventory/{result.inserted_id}"
    )
    return serialize_item(new_item)

# UPDATE inventory item
@router.put("/{item_id}")
async def update_inventory_item(item_id: str, request: Request):
    updated_data = await request.json()
    if "expiry" in updated_data:
        updated_data["expiry_date"] = datetime.strptime(updated_data.pop("expiry"), "%Y-%m-%d")

    try:
        obj_id = ObjectId(item_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid item ID")

    result = await collection.update_one({"_id": obj_id}, {"$set": updated_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")

    updated_item = await collection.find_one({"_id": obj_id})

    # Notification for update
    await create_notification(
        title="Item Updated",
        message=f"{updated_item['name']} details were updated.",
        notif_type="inventory",
        link=f"/inventory/{item_id}"
    )
    return serialize_item(updated_item)

# DELETE inventory item
@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_inventory_item(item_id: str):
    try:
        obj_id = ObjectId(item_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    deleted_item = await collection.find_one({"_id": obj_id})
    result = await collection.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")

    if deleted_item:
        await create_notification(
            title="Item Deleted",
            message=f"{deleted_item['name']} was removed from inventory.",
            notif_type="inventory"
        )
    return {"message": "Item deleted successfully"}