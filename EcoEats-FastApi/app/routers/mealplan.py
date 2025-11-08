# app/routers/mealplan.py
from fastapi import APIRouter, HTTPException, status, Body, Query
from app.database import db
from pydantic import BaseModel, Field
from bson import ObjectId
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.utils import food_status_from_date
from bson import ObjectId
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


# -----------------------------
# Pydantic Models
# -----------------------------
class Ingredient(BaseModel):
    name: str
    quantity: Optional[str] = None


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
    if user_id == "me":
        user_id = "671ff16f5e7a4b2f71e23b44"

    # Fetch inventory
    user_items_cursor = await db.food_items.find({"user_id": user_id}).to_list(None)
    user_items = [i["name"].lower() for i in user_items_cursor]

    recipes = await db.generic_recipes.find().to_list(None)
    suggested = []

    for recipe in recipes:
        ingredients = [
            Ingredient(
                name=i.get("name") or i.get("ingredient"),
                quantity=i.get("quantity"),
            )
            for i in recipe.get("ingredients", [])
        ]

        matched, missing = [], []
        for ing in ingredients:
            found = any(
                ing.name.lower() in u or u in ing.name.lower() for u in user_items
            )
            if found:
                matched.append(ing.name)
            else:
                missing.append(ing.name)

        match_pct = (len(matched) / len(ingredients)) * 100 if ingredients else 0

        if match_pct >= 50:
            suggested.append({
                "id": str(recipe.get("_id")),
                "name": recipe.get("name"),
                "image": recipe.get("image"),
                "ingredients": [
                    {
                        "name": ing.name,
                        "quantity": ing.quantity,
                        "have": ing.name.lower() in [m.lower() for m in matched]
                    }
                    for ing in ingredients
                ],
                "matched_items": matched,
                "missing_items": missing,
                "match_pct": round(match_pct, 2)
            })

    return [r["name"] for r in suggested]


    
    


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
    plan["id"] = str(plan["_id"])
    return serialize_mongo(plan)


@router.put("")
async def frontend_save_mealplan(plan: dict = Body(...)):
    """Frontend: Save or update plan from UI"""
    # Accept both camelCase and snake_case
    user_id = plan.get("userId") or plan.get("user_id") or "me"
    week_start = plan.get("weekStart") or plan.get("week_start")

    if not week_start:
        raise HTTPException(status_code=400, detail="Missing weekStart or week_start")

    result = await db.meal_plans.update_one(
        {"user_id": user_id, "week_start": week_start},
        {"$set": {"meals": plan.get("meals", {}), "updated_at": datetime.utcnow()}},
        upsert=True,
    )
    return {"status": "saved", "modified": result.modified_count}




@router.post("/copy")
async def frontend_copy_mealplan(body: dict = Body(...)):
    """Frontend: Copy a week's plan to another"""
    from_week = body.get("fromWeekStart")
    to_week = body.get("toWeekStart")
    user_id = body.get("userId", "me")

    if not from_week or not to_week:
        raise HTTPException(status_code=400, detail="Missing week start values")

    from_plan = await db.meal_plans.find_one(
        {"user_id": user_id, "week_start": from_week}
    )
    if not from_plan:
        raise HTTPException(status_code=404, detail="Source week not found")

    new_plan = from_plan.copy()
    new_plan["_id"] = ObjectId()
    new_plan["week_start"] = to_week
    new_plan["created_at"] = datetime.utcnow()
    new_plan["updated_at"] = datetime.utcnow()
    await db.meal_plans.insert_one(new_plan)
    return {"status": "copied"}
