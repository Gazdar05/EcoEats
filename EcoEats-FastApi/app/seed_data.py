import asyncio
from datetime import datetime, timedelta, timezone
from app.database import db

# UTC-aware now() function
def utc_now():
    return datetime.now(timezone.utc)

# Generate a few reusable helpers
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
    make_item("Fish Fillet", 5, "Meat", "Freezer", 6, notes="Cod fish fillets"),

    # 🥛 Dairy
    make_item("Milk Carton", -2, "Dairy", "Fridge", 2, notes="Expired full cream milk"),
    make_item("Cheddar Cheese", 14, "Dairy", "Fridge", 1, notes="Block cheese"),
    make_item("Yogurt Cup", 1, "Dairy", "Fridge", 8, notes="Strawberry flavored yogurt"),

    # 🍞 Bakery
    make_item("Bread Loaf", 2, "Bakery", "Pantry", 1, "donation",
              donation_details={
                  "location": "Drop Point A",
                  "availability": "Weekdays 9-5",
                  "contact": "012-3456789",
              },
              notes="Whole grain bread"),
    make_item("Croissant Pack", 5, "Bakery", "Pantry", 4, notes="Buttery croissants"),
    make_item("Bagel", -1, "Bakery", "Pantry", 2, notes="Expired sesame bagels"),

    # 🥬 Vegetables
    make_item("Spinach", 2, "Vegetables", "Fridge", 10, notes="Fresh baby spinach"),
    make_item("Carrots", 10, "Vegetables", "Fridge", 12, notes="Organic carrots"),
    make_item("Tomatoes", -3, "Vegetables", "Pantry", 6, notes="Expired tomatoes"),

    # 🍎 Fruits
    make_item("Apples", 15, "Fruits", "Pantry", 8, notes="Red Fuji apples"),
    make_item("Bananas", 1, "Fruits", "Pantry", 5, notes="Ripe bananas"),
    make_item("Oranges", 7, "Fruits", "Pantry", 10, notes="Sweet seedless oranges"),
    make_item("Strawberries", -1, "Fruits", "Fridge", 3, notes="Expired strawberries"),

    # 🍝 Pantry / Grains
    make_item("Rice Bag", 180, "Grains", "Pantry", 1, notes="10kg white rice"),
    make_item("Pasta Pack", 60, "Grains", "Pantry", 5, notes="Fusilli pasta"),
    make_item("Canned Beans", 365, "Canned Goods", "Pantry", 8, notes="Long shelf life"),

    # 🥫 Donations
    make_item(" Noodles", 20, "Canned Goods", "Pantry", 12, "donation",
              donation_details={
                  "location": "Drop Point B",
                  "availability": "Weekend 10-4",
                  "contact": "013-8765432",
              },
              notes="Ready for donation"),
    make_item("Peanut Butter", 30, "Canned Goods", "Pantry", 3, "donation",
              donation_details={
                  "location": "Drop Point C",
                  "availability": "Everyday 8-8",
                  "contact": "011-9988776",
              },
              notes="Crunchy peanut butter donation"),
]

async def seed():
    await db.food_items.delete_many({})  # clear existing
    result = await db.food_items.insert_many(sample_items)
    print(f"✅ Inserted {len(result.inserted_ids)} sample items")

if __name__ == "__main__":
    asyncio.run(seed())
