# seed_data.py
import asyncio
from datetime import datetime, timedelta, timezone
from app.database import db


def utc(): return datetime.now(timezone.utc)

def make_item(name, days, category, storage, qty):
    return {
        "name": name,
        "expiry": utc() + timedelta(days=days),
        "category": category,
        "storage": storage,
        "quantity": qty,
        "reserved": False,
        "created_at": utc(),
        "updated_at": utc(),
    }


items = [
    make_item("Chicken Breasts", 5, "Meat", "Freezer", 6),
    make_item("Shrimp Packs", 12, "Seafood", "Freezer", 4),
    make_item("Salmon Fillets", 8, "Seafood", "Freezer", 3),

    make_item("Eggs", 10, "Dairy", "Fridge", 12),
    make_item("Milk", 5, "Dairy", "Fridge", 2),
    make_item("Cheese", 14, "Dairy", "Fridge", 3),
    make_item("Butter", 20, "Dairy", "Fridge", 2),
    make_item("Yogurts", 7, "Dairy", "Fridge", 6),

    make_item("Carrots", 9, "Vegetables", "Fridge", 6),
    make_item("Broccolis", 6, "Vegetables", "Fridge", 4),
    make_item("Onions", 25, "Vegetables", "Pantry", 8),
    make_item("Garlics", 30, "Vegetables", "Pantry", 6),
    make_item("Potatoes", 30, "Vegetables", "Pantry", 8),

    make_item("Bananas", 3, "Fruits", "Counter", 6),
    make_item("Apples", 10, "Fruits", "Counter", 8),
    make_item("Oranges", 7, "Fruits", "Counter", 10),
    make_item("Lemons", 12, "Fruits", "Fridge", 4),

    make_item("Bread Loaves", 2, "Bakery", "Pantry", 2),

    make_item("Rice", 160, "Grains", "Pantry", 2),
    make_item("Pasta Packs", 90, "Grains", "Pantry", 3),

    make_item("Olive Oil", 120, "Pantry Staples", "Pantry", 1),
    make_item("Cooking Oil", 120, "Pantry Staples", "Pantry", 1),
    make_item("Salt", 365, "Pantry Staples", "Pantry", 1),
    make_item("Soy Sauce", 180, "Pantry Staples", "Pantry", 1),
]


async def seed():
    await db.food_items.delete_many({})
    r = await db.food_items.insert_many(items)
    print(f"✅ Inserted {len(r.inserted_ids)} inventory items")


if __name__ == "__main__":
    asyncio.run(seed())
