# app/routers/mealplan.py
from fastapi import APIRouter, HTTPException, status, Body, Query
from app.database import db
from pydantic import BaseModel, Field
from bson import ObjectId
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.utils import food_status_from_date
from bson import ObjectId
from datetime import timedelta
router = APIRouter(prefix="/mealplan", tags=["Meal Planner"])



def serialize_mongo(doc):
    """Recursively convert ObjectIds to strings."""
    if isinstance(doc, list):
        return [serialize_mongo(d) for d in doc]
    if isinstance(doc, dict):
        return {k: serialize_mongo(v) for k, v in doc.items()}
    if isinstance(doc, ObjectId):
        return str(doc)
    return doc

# -----------------------------
# Helper for ObjectId
# -----------------------------
def to_objectid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ObjectId")


def get_date_for_day(week_start_str: str, day: str) -> str:
    """Return ISO date string (YYYY-MM-DD) for given day of the week."""
    week_start = datetime.fromisoformat(week_start_str.replace("Z", ""))
    day_index = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].index(day)
    date = week_start + timedelta(days=day_index)
    return date.strftime("%Y-%m-%d")


# -----------------------------
# Pydantic Models
# -----------------------------
class Ingredient(BaseModel):
    id: Optional[str] = None
    name: str
    used_qty: Optional[int] = None   # <-- allow used_qty



class RecipeBase(BaseModel):
    name: str
    ingredients: List[Ingredient]
    instructions: Optional[str] = None
    image: Optional[str] = None


class GenericRecipe(RecipeBase):
    category: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CustomRecipe(RecipeBase):
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MealSlot(BaseModel):
    name: Optional[str] = None
    recipe_id: Optional[str] = None
    ingredients: Optional[List[Ingredient]] = []
    image: Optional[str] = None


class DayMeals(BaseModel):
    breakfast: Optional[MealSlot] = None
    lunch: Optional[MealSlot] = None
    dinner: Optional[MealSlot] = None
    snacks: Optional[MealSlot] = None


class WeekPlan(BaseModel):
    user_id: str
    week_start: str  # YYYY-MM-DD
    meals: Dict[str, DayMeals]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# ✅ ADD THIS MODEL RIGHT HERE (just before "Recipes & Suggestions")
class RecipeResponse(BaseModel):
    id: Optional[str] = None
    name: str
    ingredients: List[Ingredient]
    instructions: Optional[str] = None
    image: Optional[str] = None
    category: Optional[str] = None
    created_at: Optional[datetime] = None



# -----------------------------
# Helper Functions
# -----------------------------
async def get_user_inventory(user_id: str):
    """Fetch user's inventory items"""
    items = await db.food_items.find({"user_id": user_id}).to_list(None)
    return [item["name"].lower() for item in items]


def calculate_match(recipe_ingredients: List[Ingredient], user_items: List[str]):
    """Calculate ingredient match % (case-insensitive partial matching)"""
    if not recipe_ingredients:
        return 0

    recipe_items = [i.name.lower() for i in recipe_ingredients]
    matched = 0
    for r in recipe_items:
        for u in user_items:
            if r in u or u in r:
                matched += 1
                break  # avoid double-counting
    return (matched / len(recipe_items)) * 100



# -----------------------------
# Recipes & Suggestions
# -----------------------------
@router.get("/generic", response_model=List[RecipeResponse])
async def get_generic_recipes():
    recipes = await db["generic_recipes"].find().to_list(None)

    # Convert defaultIngredients → ingredients for compatibility
    for r in recipes:
        if "defaultIngredients" in r:
            r["ingredients"] = r["defaultIngredients"]
            del r["defaultIngredients"]

        if "_id" in r:
            r["id"] = str(r["_id"])
            del r["_id"]

    return recipes




@router.get("/custom/{user_id}", response_model=List[CustomRecipe])
async def get_custom_recipes(user_id: str):
    """Return all custom recipes for user"""
    recipes = await db.custom_recipes.find({"user_id": user_id}).to_list(None)
    return recipes


@router.post("/custom", response_model=dict)
async def create_custom_recipe(recipe: CustomRecipe):
    """Create a new custom recipe"""
    result = await db.custom_recipes.insert_one(recipe.model_dump())
    return {"inserted_id": str(result.inserted_id)}

@router.get("/suggested/{user_id}")
async def get_suggested_recipes(user_id: str):
    """Return recipes where user has ≥50% ingredients + show detailed match info"""
   

    # Fetch inventory
    user_items_cursor = await db.food_items.find({}).to_list(None)

    user_items = [i["name"].lower() for i in user_items_cursor]

    # ✅ load from SUGGESTED collection (was wrongly generic)
    recipes = await db.suggested_recipes.find().to_list(None)

    suggested = []

    for recipe in recipes:
        ingredients = recipe.get("ingredients", [])

        matched, missing = [], []
        for ing in ingredients:
            ing_name = ing.get("name", "").lower()
            found = any(
                ing_name in u or u in ing_name for u in user_items
            )
            if found:
                matched.append(ing_name)
            else:
                missing.append(ing_name)

        match_pct = (len(matched) / len(ingredients)) * 100 if ingredients else 0

        if match_pct >= 80:
            suggested.append({
                "id": str(recipe.get("_id")),
                "name": recipe.get("name"),
                "image": recipe.get("imageUrl"),
                "ingredients": recipe.get("ingredients", []),
                "matched_items": matched,
                "missing_items": missing,
                "match_pct": round(match_pct, 2)
            })

    # ✅ return full objects not just names
    return suggested




# -----------------------------
# Meal Plan Save / Load
# -----------------------------
@router.post("/save", response_model=dict)
async def save_meal_plan(plan: WeekPlan):
    """Save or update weekly plan"""
    existing = await db.meal_plans.find_one(
        {"user_id": plan.user_id, "week_start": plan.week_start}
    )
    plan.updated_at = datetime.utcnow()
    if existing:
        await db.meal_plans.update_one(
            {"_id": existing["_id"]}, {"$set": plan.model_dump()}
        )
        return {"message": "Meal plan updated"}
    else:
        await db.meal_plans.insert_one(plan.model_dump())
        return {"message": "Meal plan saved"}


@router.get("/{user_id}/{week_start}", response_model=Optional[WeekPlan])
async def get_meal_plan(user_id: str, week_start: str):
    """Get meal plan by user and week"""
    plan = await db.meal_plans.find_one(
        {"user_id": user_id, "week_start": week_start}
    )
    if not plan:
        # auto-create empty week if not found (for frontend load)
        empty = {
            "user_id": user_id,
            "week_start": week_start,
            "meals": {
                d: {"breakfast": None, "lunch": None, "dinner": None, "snacks": None}
                for d in [
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                    "saturday",
                    "sunday",
                ]
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        await db.meal_plans.insert_one(empty)
        return empty
    return plan


@router.delete("/{user_id}/{week_start}", response_model=dict)
async def delete_meal_plan(user_id: str, week_start: str):
    """Delete weekly plan"""
    result = await db.meal_plans.delete_one(
        {"user_id": user_id, "week_start": week_start}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {"message": "Meal plan deleted"}


# -----------------------------
# Copy Previous Week’s Plan
# -----------------------------
@router.post("/copy-previous", response_model=dict)
async def copy_previous_week(user_id: str, prev_week_start: str, new_week_start: str):
    """Duplicate last week's plan into new week"""
    prev = await db.meal_plans.find_one(
        {"user_id": user_id, "week_start": prev_week_start}
    )
    if not prev:
        raise HTTPException(status_code=404, detail="Previous week plan not found")

    new_plan = prev.copy()
    new_plan["_id"] = ObjectId()
    new_plan["week_start"] = new_week_start
    new_plan["created_at"] = datetime.utcnow()
    new_plan["updated_at"] = datetime.utcnow()

    await db.meal_plans.insert_one(new_plan)
    return {"message": "Copied previous week’s plan"}


# -----------------------------
# ✅ Added: Frontend-compatible routes (/mealplan GET, PUT, COPY)
# -----------------------------
@router.get("")
async def frontend_get_mealplan(weekStart: str = Query(...), userId: str = Query("me")):
    """Frontend: Fetch or create empty plan for given week"""
    plan = await db.meal_plans.find_one({"user_id": userId, "week_start": weekStart})
    if not plan:
        empty = {
            "user_id": userId,
            "week_start": weekStart,
            "meals": {
                d: {"breakfast": None, "lunch": None, "dinner": None, "snacks": None}
                for d in [
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                    "saturday",
                    "sunday",
                ]
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        await db.meal_plans.insert_one(empty)
        plan = empty

    # ✅ fix: ensure week_start always ends with Z for FE match
    ws = plan.get("week_start")
    if ws and not ws.endswith("Z"):
        plan["week_start"] = ws + "Z"

    plan["id"] = str(plan["_id"]) if "_id" in plan else None
    return serialize_mongo(plan)


@router.put("")
async def frontend_save_mealplan(plan: dict = Body(...)):
    """Frontend: Save or update plan from UI + record individual meals"""
    user_id = plan.get("userId") or plan.get("user_id") or "me"
    week_start = plan.get("weekStart") or plan.get("week_start")

    if not week_start:
        raise HTTPException(status_code=400, detail="Missing weekStart or week_start")

    meals = plan.get("meals", {})

    # 1️⃣ Save/update the whole weekly plan
    result = await db.meal_plans.update_one(
        {"user_id": user_id, "week_start": week_start},
        {"$set": {"meals": meals, "updated_at": datetime.utcnow()}},
        upsert=True,
    )

    # 2️⃣ Now update individual meal entries
    await db.meal_entries.delete_many({"user_id": user_id, "week_start": week_start})

    meal_entries = []
    for day, slots in meals.items():
        if not slots:
            continue
        for slot, meal in slots.items():
            if not meal:
                continue

            # ✅ ensure used_qty is allowed
            if "ingredients" in meal:
                for ing in meal["ingredients"]:
                    ing.setdefault("used_qty", None)
            
            entry = {
                "user_id": user_id,
                "week_start": week_start,
                "day": day,
                "slot": slot,
                "date": get_date_for_day(week_start, day),
                "meal": meal,
                "created_at": datetime.utcnow(),
            }
            meal_entries.append(entry)

    if meal_entries:
        await db.meal_entries.insert_many(meal_entries)
            # 3️⃣ create notifications for each meal added (Meal Reminders)
        for entry in meal_entries:
            meal_name = entry["meal"]["name"]
            slot = entry["slot"]
            day = entry["day"]

            await db.notifications.insert_one({
                "user_id": user_id,
                "type": "meal_reminder",
                "title": f"Upcoming meal: {meal_name}",
                "message": f"{slot.title()} on {day} is planned.",
                "timestamp": datetime.utcnow(),
                "read": False,
                "link_to": {
                    "module": "mealplan",
                    "day": day,
                    "slot": slot
            }
        })

    return {"status": "saved", "modified": result.modified_count, "entries_saved": len(meal_entries)}

@router.get("/entries/{user_id}/{week_start}")
async def get_meal_entries(user_id: str, week_start: str):
    """Get all recorded meal entries for a given week"""
    entries = await db.meal_entries.find(
        {"user_id": user_id, "week_start": week_start}
    ).to_list(None)
    return serialize_mongo(entries)


@router.post("/copy")
async def frontend_copy_mealplan(body: dict = Body(...)):
    """Frontend: Copy a week's plan + meal entries (persistent save)"""
    from_week = body.get("fromWeekStart")
    to_week = body.get("toWeekStart")
    user_id = body.get("userId", "me")

    if not from_week or not to_week:
        raise HTTPException(status_code=400, detail="Missing week start values")

    # 1️⃣ Fetch the source plan
    from_plan = await db.meal_plans.find_one(
        {"user_id": user_id, "week_start": from_week}
    )
    if not from_plan:
        raise HTTPException(status_code=404, detail="Source week not found")

    # 2️⃣ Prepare new plan
    new_plan = from_plan.copy()
    new_plan["_id"] = ObjectId()
    new_plan["week_start"] = to_week
    new_plan["created_at"] = datetime.utcnow()
    new_plan["updated_at"] = datetime.utcnow()

    meals = from_plan.get("meals", {})

    # 3️⃣ Upsert (replace or insert) the new plan
    await db.meal_plans.update_one(
        {"user_id": user_id, "week_start": to_week},
        {"$set": {"meals": meals, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()}},
        upsert=True,
    )

    # 4️⃣ Also store individual meal entries for persistence
    await db.meal_entries.delete_many({"user_id": user_id, "week_start": to_week})

    meal_entries = []
    for day, slots in meals.items():
        if not slots:
            continue
        for slot, meal in slots.items():
            if not meal:
                continue
            meal_entries.append({
                "user_id": user_id,
                "week_start": to_week,
                "day": day,
                "slot": slot,
                "date": get_date_for_day(to_week, day),
                "meal": meal,
                "created_at": datetime.utcnow(),
            })

    if meal_entries:
        await db.meal_entries.insert_many(meal_entries)

    # 5️⃣ Return frontend-ready response
    return {
        "userId": user_id,
        "weekStart": to_week,
        "meals": meals,
        "id": str(new_plan["_id"]),
        "status": "copied_and_saved"
    }

