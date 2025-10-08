# app/routers/inventory.py
from fastapi import APIRouter

router = APIRouter()

# TODO: Inventory endpoints will be added by teammate
# app/routers/inventory.py
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from typing import Optional
from app.database import db
from app.utils import to_objectid, food_status_from_date
from bson import ObjectId
from datetime import datetime, date
import aiofiles
import os
from fastapi import Request

router = APIRouter()

COL = "food_items"  # collection name

def normalize_item_doc(doc: dict) -> dict:
    """Convert mongo doc -> JSON serializable for frontend."""
    if not doc:
        return doc
    doc["id"] = str(doc.pop("_id"))
    # Ensure expiry is yyyy-mm-dd if present
    if doc.get("expiry_date") and isinstance(doc["expiry_date"], (datetime, date)):
        doc["expiry"] = doc["expiry_date"].strftime("%Y-%m-%d")
    else:
        doc["expiry"] = doc.get("expiry_date")
    # Compute status
    doc["status"] = food_status_from_date(doc.get("expiry"))
    # Keep existing keys mapping expected by front-end
    # Provide `quantity` string like "4 pcs" from qty + unit
    doc["quantity"] = f"{doc.get('qty', 0)} {doc.get('unit','pcs')}"
    return doc

@router.get("/", summary="List inventory items")
async def list_inventory(
    search: Optional[str] = None,
    category: Optional[str] = None,
    status_filter: Optional[str] = None,
    storage: Optional[str] = None,
    limit: int = 200,
):
    query = {}
    if category:
        query["category"] = category
    if storage:
        query["storage_loc"] = storage
    # text search across name/notes
    if search:
        q = search.lower()
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"notes": {"$regex": q, "$options": "i"}},
            {"unit": {"$regex": q, "$options": "i"}},
        ]

    cursor = db[COL].find(query).limit(limit)
    results = []
    async for doc in cursor:
        doc_norm = normalize_item_doc(doc)
        # status filter must be applied after normalization
        if status_filter and doc_norm.get("status") != status_filter:
            continue
        results.append(doc_norm)
    return {"items": results, "count": len(results)}

@router.get("/{item_id}", summary="Get a single inventory item")
async def get_item(item_id: str):
    try:
        oid = to_objectid(item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid item id")
    doc = await db[COL].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Item not found")
    return normalize_item_doc(doc)

@router.post("/", status_code=status.HTTP_201_CREATED, summary="Create a new inventory item")
async def create_item(
    # Accept JSON body primarily. If client sends multipart (image), this endpoint will also accept form fields.
    request: Request
):
    """
    This endpoint supports:
      - JSON body with keys: name, qty (int), unit, expiry (YYYY-MM-DD), storage_loc, notes, category, image (optional URL)
      - Or multipart form-data with same fields plus `image_file` (file). If file uploaded, it will be saved to ./uploads (development).
    """
    # Try to read JSON body first
    try:
        payload = await request.json()
    except Exception:
        # Might be form-data; use form()
        form = await request.form()
        payload = dict(form)

    # Normalize common fields
    name = payload.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="name is required")
    # qty and unit: frontend sends `quantity` like "4 pcs" but AddItemPopup sends qty & auto unit here we expect 'qty' & 'unit' OR 'quantity' string.
    qty = payload.get("qty")
    unit = payload.get("unit") or payload.get("quantity", "pcs").split(" ")[1] if payload.get("quantity") else "pcs"
    if qty is None:
        # try parse from quantity string e.g. "4 pcs"
        qstr = payload.get("quantity")
        try:
            qty = int(str(qstr).split(" ")[0]) if qstr else 1
        except Exception:
            qty = 1

    expiry = payload.get("expiry") or payload.get("expiry_date")
    storage_loc = payload.get("storage") or payload.get("storage_loc") or "Fridge"
    notes = payload.get("notes")
    category = payload.get("category") or "Produce"
    image = payload.get("image")  # URL optional

    doc = {
        "name": name,
        "category": category,
        "qty": int(qty),
        "unit": unit,
        "storage_loc": storage_loc,
        "expiry_date": expiry,
        "notes": notes,
        "image": image,
        "status": "active",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    res = await db[COL].insert_one(doc)
    doc["_id"] = res.inserted_id
    return normalize_item_doc(doc)

@router.put("/{item_id}", summary="Update an inventory item")
async def update_item(item_id: str, payload: dict):
    try:
        oid = to_objectid(item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid item id")

    update_doc = {}
    # allow updating typical fields
    for key in ("name", "category", "notes", "image", "storage_loc"):
        if key in payload:
            update_doc[key] = payload[key]
    # qty/unit mapping
    if "qty" in payload:
        update_doc["qty"] = int(payload["qty"])
    if "unit" in payload:
        update_doc["unit"] = payload["unit"]
    if "expiry" in payload:
        update_doc["expiry_date"] = payload["expiry"]

    if not update_doc:
        raise HTTPException(status_code=400, detail="No update fields provided")

    update_doc["updated_at"] = datetime.utcnow()
    result = await db[COL].update_one({"_id": oid}, {"$set": update_doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    doc = await db[COL].find_one({"_id": oid})
    return normalize_item_doc(doc)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an inventory item")
async def delete_item(item_id: str):
    try:
        oid = to_objectid(item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid item id")
    res = await db[COL].delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {}






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