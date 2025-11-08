import asyncio
from app.database import db

async def seed_suggested_recipes():
    suggested_recipes = [
        {
            "name": "Egg Fried Rice",
            "description": "A savory fried rice with eggs and soy sauce.",
            "ingredients": [
                {"name": "Eggs", "quantity": "2 pcs"},
                {"name": "Rice", "quantity": "1 cup"},
                {"name": "Soy Sauce", "quantity": "2 tbsp"},
                {"name": "Oil", "quantity": "1 tbsp"},
                {"name": "Garlic", "quantity": "2 cloves"}
            ],
            "nutrition": {"calories": 450, "protein": 10, "carbs": 60, "fat": 15},
            "preparationTime": 15,
            "imageUrl": "egg_fried_rice.jpg",
            "type": "suggested"
        },
        {
            "name": "Cheesy Omelette",
            "description": "A fluffy omelette with melted cheese.",
            "ingredients": [
                {"name": "Eggs", "quantity": "3 pcs"},
                {"name": "Cheese", "quantity": "50g"},
                {"name": "Salt", "quantity": "1 tsp"},
                {"name": "Butter", "quantity": "1 tbsp"},
                {"name": "Milk", "quantity": "2 tbsp"}
            ],
            "nutrition": {"calories": 320, "protein": 15, "carbs": 5, "fat": 20},
            "preparationTime": 10,
            "imageUrl": "cheesy_omelette.jpg",
            "type": "suggested"
        },
        # More recipes can follow...
    ]

    collection = db["suggested_recipes"]
    await collection.delete_many({})  # Clean up any existing data
    await collection.insert_many(suggested_recipes)
    print("✅ Suggested recipes seeded successfully!")


    collection = db["suggested_recipes"]
    existing = await collection.count_documents({})

    if existing == 0:
        await collection.insert_many(suggested_recipes)
        print("✅ Suggested recipes seeded successfully!")
    else:
        print("⚠️ Suggested recipes already exist, skipping seeding.")

if __name__ == "__main__":
    asyncio.run(seed_suggested_recipes())
