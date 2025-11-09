# suggested_seed_data.py
import asyncio
from datetime import datetime
from app.database import db

now = datetime.utcnow()

recipes = [
    { "name":"Chicken Stir Fry","ingredients":[{"name":"Chicken Breasts"},{"name":"Carrots"},{"name":"Broccolis"},{"name":"Soy Sauce"},{"name":"Olive Oil"}],"type":"suggested","created_at":now },
    { "name":"Egg Fried Rice","ingredients":[{"name":"Eggs"},{"name":"Rice"},{"name":"Soy Sauce"},{"name":"Cooking Oil"},{"name":"Carrots"}],"type":"suggested","created_at":now },
    { "name":"Cheese Omelette","ingredients":[{"name":"Eggs"},{"name":"Cheese"},{"name":"Butter"},{"name":"Salt"}],"type":"suggested","created_at":now },
    { "name":"Garlic Butter Shrimp","ingredients":[{"name":"Shrimp Packs"},{"name":"Garlics"},{"name":"Butter"},{"name":"Lemons"}],"type":"suggested","created_at":now },
    { "name":"Baked Salmon","ingredients":[{"name":"Salmon Fillets"},{"name":"Olive Oil"},{"name":"Lemons"},{"name":"Salt"}],"type":"suggested","created_at":now },
    { "name":"Banana Smoothie","ingredients":[{"name":"Bananas"},{"name":"Milk"},{"name":"Yogurts"},{"name":"Honey"}],"type":"suggested","created_at":now },
    { "name":"Veggie Bowl","ingredients":[{"name":"Carrots"},{"name":"Broccolis"},{"name":"Onions"},{"name":"Cooking Oil"}],"type":"suggested","created_at":now },
    { "name":"Garlic Rice","ingredients":[{"name":"Rice"},{"name":"Garlics"},{"name":"Olive Oil"},{"name":"Salt"}],"type":"suggested","created_at":now },
    { "name":"Cheesy Pasta","ingredients":[{"name":"Pasta Packs"},{"name":"Cheese"},{"name":"Butter"},{"name":"Salt"}],"type":"suggested","created_at":now },
    { "name":"Fruit Yogurt Bowl","ingredients":[{"name":"Apples"},{"name":"Bananas"},{"name":"Yogurts"},{"name":"Honey"}],"type":"suggested","created_at":now },
    { "name":"Orange Lemon Juice","ingredients":[{"name":"Oranges"},{"name":"Lemons"}],"type":"suggested","created_at":now },
    { "name":"Chicken Soup","ingredients":[{"name":"Chicken Breasts"},{"name":"Carrots"},{"name":"Onions"},{"name":"Garlics"}],"type":"suggested","created_at":now },
]


async def seed():
    await db.suggested_recipes.delete_many({})
    r = await db.suggested_recipes.insert_many(recipes)
    print(f"✅ Inserted {len(r.inserted_ids)} suggested recipes")


if __name__ == "__main__":
    asyncio.run(seed())
