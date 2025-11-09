from fastapi import APIRouter, HTTPException, Body
from app.database import db
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/mealplan/templates", tags=["Meal Plan Templates"])


@router.post("")
async def save_template(body: dict = Body(...)):
    """Save a plan as a template"""
    name = body.get("name")
    meals = body.get("meals")
    user_id = body.get("userId", "me")

    if not name or not meals:
        raise HTTPException(400, "Missing name or meals")

    doc = {
        "user_id": user_id,
        "name": name,
        "meals": meals,
        "created_at": datetime.utcnow()
    }
    res = await db.mealplan_templates.insert_one(doc)
    return {"id": str(res.inserted_id), "status": "saved"}


@router.get("")
async def list_templates(userId: str = "me"):
    """List saved templates"""
    rows = await db.mealplan_templates.find({"user_id": userId}).to_list(None)
    for r in rows:
        r["id"] = str(r["_id"])
        del r["_id"]
    return rows


@router.post("/apply")
async def apply_template(body: dict = Body(...)):
    """Apply template to a selected week"""
    template_id = body.get("templateId")
    user_id = body.get("userId", "me")
    week_start = body.get("weekStart")

    if not template_id or not week_start:
        raise HTTPException(400, "Missing templateId or weekStart")

    tpl = await db.mealplan_templates.find_one({"_id": ObjectId(template_id)})
    if not tpl:
        raise HTTPException(404, "Template not found")

    meals = tpl["meals"]

    await db.meal_plans.update_one(
        {"user_id": user_id, "week_start": week_start},
        {"$set": {"meals": meals, "updated_at": datetime.utcnow()}},
        upsert=True
    )

    return {"status": "applied", "weekStart": week_start}
