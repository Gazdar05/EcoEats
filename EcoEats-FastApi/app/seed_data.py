import asyncio
from datetime import datetime, timedelta, timezone
from app.database import db

# Helper: UTC timestamp
def utc_now():
    return datetime.now(timezone.utc)

# Helper to build inventory item
def make_item(
    name,
    days_to_expiry,
    category,
    storage,
    quantity,
    source="inventory",
    notes="",
    reserved=False,
    donation_details=None,
):
    item = {
        "name": name,
        "expiry_date": utc_now() + timedelta(days=days_to_expiry),
        "category": category,
        "storage": storage,
        "quantity": quantity,
        "notes": notes,
        "source": source,
        "reserved": reserved,
        "created_at": utc_now(),
        "updated_at": utc_now(),
    }
    if source == "donation" and donation_details:
        item["donationDetails"] = donation_details
    return item


sample_items = [
    # 🥩 Meat & Seafood
    make_item("Chicken Breast", 3, "Meat", "Freezer", 5, notes="Fresh chicken fillets"),
    make_item("Shrimp Pack", 14, "Seafood", "Freezer", 6, notes="Frozen shrimps"),
    make_item("Salmon Fillet", 4, "Seafood", "Freezer", 3, notes="Atlantic salmon"),

    # 🥛 Dairy
    make_item("Milk", 2, "Dairy", "Fridge", 3, notes="Low-fat milk cartons"),
    make_item("Cheese", 14, "Dairy", "Fridge", 3, notes="Cheddar cheese slices"),
    make_item("Butter", 30, "Dairy", "Fridge", 2, notes="Salted butter block"),
    make_item("Yogurt", 7, "Dairy", "Fridge", 6, notes="Plain yogurt cups"),

    # 🥬 Vegetables
    make_item("Carrots", 14, "Vegetables", "Fridge", 8, notes="Fresh carrots"),
    make_item("Broccoli", 5, "Vegetables", "Fridge", 4, notes="Organic broccoli"),
    make_item("Onions", 30, "Vegetables", "Pantry", 10, notes="Yellow onions"),
    make_item("Garlic", 45, "Vegetables", "Pantry", 8, notes="Garlic bulbs"),
    make_item("Potatoes", 40, "Vegetables", "Pantry", 10, notes="Russet potatoes"),

    # 🍎 Fruits
    make_item("Bananas", 3, "Fruits", "Counter", 6, notes="Ripe bananas"),
    make_item("Apples", 10, "Fruits", "Counter", 8, notes="Red apples"),
    make_item("Oranges", 7, "Fruits", "Counter", 10, notes="Juicy oranges"),
    make_item("Lemon", 10, "Fruits", "Fridge", 4, notes="Fresh lemons"),

    # 🍞 Bakery
    make_item("Bread", 3, "Bakery", "Pantry", 2, notes="Whole grain bread"),

    # 🍝 Grains
    make_item("Rice", 180, "Grains", "Pantry", 2, notes="White rice"),
    make_item("Pasta", 90, "Grains", "Pantry", 3, notes="Penne pasta"),

    # 🧂 Pantry Staples
    make_item("Oil", 120, "Pantry Staples", "Pantry", 2, notes="Cooking oil"),
    make_item("Olive Oil", 180, "Pantry Staples", "Pantry", 1, notes="Extra virgin olive oil"),
    make_item("Salt", 365, "Pantry Staples", "Pantry", 1, notes="Iodized salt"),
    make_item("Soy Sauce", 180, "Pantry Staples", "Pantry", 2, notes="Light soy sauce"),
    make_item("Honey", 180, "Pantry Staples", "Pantry", 1, notes="Pure honey"),
    make_item("Flour", 90, "Pantry Staples", "Pantry", 2, notes="All-purpose flour"),
]

async def seed():
    await db.food_items.delete_many({})
    result = await db.food_items.insert_many(sample_items)
    print(f"✅ Inserted {len(result.inserted_ids)} inventory items aligned with recipes")

if __name__ == "__main__":
    asyncio.run(seed())
