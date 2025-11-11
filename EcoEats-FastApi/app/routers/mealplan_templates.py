# app/routers/mealplan_templates.py  (this is your /mealplan/templates router file)
from fastapi import APIRouter, HTTPException, Body
from app.database import db
from datetime import datetime, timedelta, timezone
from bson import ObjectId



router = APIRouter(prefix="/mealplan/templates", tags=["Meal Plan Templates"])

def normalize_week_start(raw: str) -> str:
    """
    Normalize any ISO date string to the Monday of that week, formatted exactly
    like the frontend's toISOString() output, e.g. 2025-02-03T00:00:00.000Z
    """
    if not raw:
        return raw

    base = raw.replace("Z", "")
    try:
        dt = datetime.fromisoformat(base)
    except ValueError:
        # fallback: drop milliseconds if parsing fails
        dt = datetime.fromisoformat(base.split(".")[0])

    # snap to Monday 00:00:00 UTC
    dt = dt.replace(hour=0, minute=0, second=0, microsecond=0)
    monday = dt - timedelta(days=dt.weekday())

    # ✅ emit with milliseconds + trailing Z (exactly like JS .toISOString())
    return (
        monday.replace(tzinfo=timezone.utc)
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
    )




@router.post("")
async def save_template(body: dict = Body(...)):
    """Save a plan as a template"""
    name = (body.get("name") or "").strip()
    meals = body.get("meals")
    user_id = body.get("userId", "me")

    if not name:
        raise HTTPException(400, "Template name is required")
    if not meals or not isinstance(meals, dict):
        raise HTTPException(400, "Meals payload is required")

    doc = {
        "user_id": user_id,
        "name": name,
        "meals": meals,     # full Mon→Sun structure
        "created_at": datetime.utcnow()
    }
    res = await db.mealplan_templates.insert_one(doc)
    return {"id": str(res.inserted_id), "status": "saved"}

@router.get("")
async def list_templates(userId: str = "me"):
    """List saved templates"""
    rows = await db.mealplan_templates.find({"user_id": userId}).sort("created_at", -1).to_list(None)
    for r in rows:
        r["id"] = str(r["_id"])
        r["created_at"] = r.get("created_at")
        del r["_id"]
    return rows

@router.delete("/id/{template_id}")

async def delete_template(template_id: str):
    oid = ObjectId(template_id)
    doc = await db.mealplan_templates.find_one({"_id": oid})
    if not doc:
        raise HTTPException(404, "Template not found in DB")
    
    await db.mealplan_templates.delete_one({"_id": oid})
    return {"status": "deleted", "id": template_id}

@router.post("/apply")
async def apply_template(body: dict = Body(...)):
    """Apply template to a selected week"""
    template_id = body.get("templateId")
    user_id = body.get("userId", "me")
    week_start_raw = body.get("weekStart")

    if not template_id or not week_start_raw:
        raise HTTPException(400, "Missing templateId or weekStart")

    # normalize week_start to full ISO like copyLastWeek does
  
    week_start = normalize_week_start(week_start_raw)


    tpl = await db.mealplan_templates.find_one({"_id": ObjectId(template_id)})
    if not tpl:
        raise HTTPException(404, "Template not found")

    meals = tpl["meals"]

    # write the weekly plan record
    await db.meal_plans.update_one(
        {"user_id": user_id, "week_start": week_start},
        {"$set": {"meals": meals, "updated_at": datetime.utcnow()}},
        upsert=True
    )

    # write meal_entries (copyLastWeek does this)
    from app.routers.mealplan import get_date_for_day

    await db.meal_entries.delete_many({"user_id": user_id, "week_start": week_start})
    to_insert = []

    for day, slots in meals.items():
        if not slots: 
            continue
        for slot, meal in slots.items():
            if not meal: 
                continue
            to_insert.append({
                "user_id": user_id,
                "week_start": week_start,
                "day": day,
                "slot": slot,
                "date": get_date_for_day(week_start, day),
                "meal": meal,
                "created_at": datetime.utcnow(),
            })
 # ✅ Check inventory and build warnings
    warnings = []
    for day, slots in meals.items():
        for slot, meal in (slots or {}).items():
            if not meal or "ingredients" not in meal:
                continue
            for ing in meal["ingredients"]:
                if not ing.get("id"):
                    continue
                item = await db.food_items.find_one({"_id": ObjectId(ing["id"])})
                if not item:
                    warnings.append(f"{ing['name']} missing in inventory")
                elif item.get("quantity", 0) <= 0:
                    warnings.append(f"{ing['name']} is out of stock")

    return {
        "status": "applied",
        "message": "Template applied successfully",
        "warnings": warnings
    }
