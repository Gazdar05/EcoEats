from fastapi import APIRouter, HTTPException, status, Body
from app.database import db
from pydantic import BaseModel, Field
from bson import ObjectId
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.utils import food_status_from_date

router = APIRouter(prefix="/mealplan", tags=["Meal Planner"])


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
    name: str
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


# -----------------------------
# Helper Functions
# -----------------------------
async def get_user_inventory(user_id: str):
    """Fetch user's inventory items"""
    items = await db.food_items.find({"user_id": user_id}).to_list(None)
    return [item["name"].lower() for item in items]


def calculate_match(recipe_ingredients: List[Ingredient], user_items: List[str]):
    """Calculate ingredient match %"""
    if not recipe_ingredients:
        return 0
    user_items_set = set(user_items)
    recipe_items = set(i.name.lower() for i in recipe_ingredients)
    matched = len(recipe_items & user_items_set)
    return (matched / len(recipe_items)) * 100


# -----------------------------
# Routes
# -----------------------------

@router.get("/generic", response_model=List[GenericRecipe])
async def get_generic_recipes():
    """Return all generic recipes"""
    recipes = await db.generic_recipes.find().to_list(None)
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


@router.get("/suggested/{user_id}", response_model=List[GenericRecipe])
async def get_suggested_recipes(user_id: str):
    """Return recipes where user has ≥80% ingredients"""
    user_items = await get_user_inventory(user_id)
    if not user_items:
        return []

    recipes = await db.generic_recipes.find().to_list(None)
    suggested = []
    for recipe in recipes:
        match_pct = calculate_match(
            [Ingredient(**i) for i in recipe.get("ingredients", [])], user_items
        )
        if match_pct >= 80:
            suggested.append(recipe)

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
        raise HTTPException(status_code=404, detail="Meal plan not found")
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
