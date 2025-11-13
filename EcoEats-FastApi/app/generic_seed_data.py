# generic_seed_data.py
import asyncio
from datetime import datetime
from app.database import db

now = datetime.utcnow()

recipes = [
    { "name":"Basic Pasta","defaultIngredients":[{"name":"Pasta Packs"},{"name":"Olive Oil"},{"name":"Garlics"}],"type":"generic","created_at":now },
    { "name":"Scrambled Eggs","defaultIngredients":[{"name":"Eggs"},{"name":"Butter"},{"name":"Salt"}],"type":"generic","created_at":now },
    { "name":"Rice Bowl","defaultIngredients":[{"name":"Rice"},{"name":"Eggs"},{"name":"Soy Sauce"}],"type":"generic","created_at":now },
    { "name":"Veg Soup","defaultIngredients":[{"name":"Carrots"},{"name":"Potatoes"},{"name":"Onions"},{"name":"Salt"}],"type":"generic","created_at":now },
    { "name":"Fruit Salad","defaultIngredients":[{"name":"Apples"},{"name":"Bananas"},{"name":"Oranges"},{"name":"Yogurts"}],"type":"generic","created_at":now },
    { "name":"Butter Toast","defaultIngredients":[{"name":"Bread Loaves"},{"name":"Butter"}],"type":"generic","created_at":now },
    { "name":"Cheese Toast","defaultIngredients":[{"name":"Bread Loaves"},{"name":"Cheese"}],"type":"generic","created_at":now },
    { "name":"Garlic Toast","defaultIngredients":[{"name":"Bread Loaves"},{"name":"Garlics"},{"name":"Butter"}],"type":"generic","created_at":now },
    { "name":"Olive Oil Pasta","defaultIngredients":[{"name":"Pasta Packs"},{"name":"Olive Oil"}],"type":"generic","created_at":now },
    { "name":"Boiled Eggs","defaultIngredients":[{"name":"Eggs"},{"name":"Salt"}],"type":"generic","created_at":now },
    { "name":"Honey Yogurt Cup","defaultIngredients":[{"name":"Yogurts"},{"name":"Honey"}],"type":"generic","created_at":now },
    { "name":"Broccoli Bowl","defaultIngredients":[{"name":"Broccolis"},{"name":"Salt"}],"type":"generic","created_at":now },
]


async def seed():
    await db.generic_recipes.delete_many({})
    r = await db.generic_recipes.insert_many(recipes)
    print(f"✅ Inserted {len(r.inserted_ids)} generic recipes")


if __name__ == "__main__":
    asyncio.run(seed())
