import asyncio
from datetime import datetime, timedelta, timezone
from app.database import db

# UTC-aware now() function
def utc_now():
    return datetime.now(timezone.utc)

# Helper to build item
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
    # 🥩 Meat
    make_item("Chicken Breast", 3, "Meat", "Freezer", 5, notes="Fresh chicken fillets"),
    make_item("Ground Beef", -1, "Meat", "Freezer", 3, notes="Expired minced beef"),
    make_item("Fish Fillet", 7, "Meat", "Freezer", 6, notes="Cod fish fillets"),
    
    # 🥛 Dairy
    make_item("Milk Carton", 0, "Dairy", "Fridge", 2, notes="Expires today"),
    make_item("Cheddar Cheese", 14, "Dairy", "Fridge", 1, notes="Block cheese"),
    make_item("Yogurt Cup", 3, "Dairy", "Fridge", 8, notes="Strawberry yogurt"),
    
    # 🍞 Bakery
    make_item("Bread Loaf", 2, "Bakery", "Pantry", 1, "donation",
              donation_details={"location": "Drop Point A", "availability": "Weekdays 9-5", "contact": "012-3456789"},
              notes="Whole grain bread"),
    make_item("Croissant Pack", 5, "Bakery", "Pantry", 4, notes="Buttery croissants"),
    make_item("Bagel", -3, "Bakery", "Pantry", 2, notes="Expired sesame bagels"),
    
    # 🥬 Vegetables
    make_item("Spinach", 1, "Vegetables", "Fridge", 10, notes="Fresh baby spinach"),
    make_item("Carrots", 30, "Vegetables", "Fridge", 12, notes="Organic carrots"),
    make_item("Tomatoes", -2, "Vegetables", "Counter", 6, notes="Expired tomatoes"),
    
    # 🍎 Fruits
    make_item("Apples", 15, "Fruits", "Counter", 8, notes="Red Fuji apples"),
    make_item("Bananas", 0, "Fruits", "Counter", 5, notes="Perfectly ripe"),
    make_item("Oranges", 7, "Fruits", "Counter", 10, notes="Seedless oranges"),
    make_item("Strawberries", -1, "Fruits", "Fridge", 3, notes="Expired strawberries"),
    
    # 🍝 Grains
    make_item("Rice Bag", 180, "Grains", "Pantry", 1, notes="10kg white rice"),
    make_item("Pasta Pack", 60, "Grains", "Pantry", 5, notes="Fusilli pasta"),
    
    # 🥫 Canned
    make_item("Canned Beans", 365, "Canned", "Pantry", 8, notes="Long shelf life"),
    make_item("Instant Noodles", 20, "Canned", "Pantry", 12, "donation",
              donation_details={"location": "Drop Point B", "availability": "Weekend 10-4", "contact": "013-8765432"},
              notes="Noodles donation"),
    make_item("Peanut Butter", 90, "Canned", "Pantry", 3, notes="Crunchy peanut butter"),
    
    # 🧂 Pantry Staples
    make_item("Cooking Oil", 120, "Pantry Staples", "Pantry", 2, notes="Sunflower oil"),
    make_item("Salt Pack", 365, "Pantry Staples", "Pantry", 1, notes="Iodized salt"),
    
    # 🥤 Beverages
    make_item("Orange Juice", 5, "Beverages", "Fridge", 3, notes="Fresh juice bottle"),
    make_item("Tea Bags", 200, "Beverages", "Pantry", 2, notes="Green tea pack"),
    
    # 🐟 Seafood
    make_item("Salmon Fillet", 3, "Seafood", "Freezer", 4, notes="Norwegian salmon"),
    make_item("Shrimp Pack", 14, "Seafood", "Freezer", 6, notes="Frozen shrimps"),
]

async def seed():
    await db.food_items.delete_many({})
    result = await db.food_items.insert_many(sample_items)
    print(f"✅ Inserted {len(result.inserted_ids)} sample items")

if __name__ == "__main__":
    asyncio.run(seed())
