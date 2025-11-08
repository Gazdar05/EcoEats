#C:\Users\HP\Documents\GitHub\EcoEats\EcoEats-FastApi\app\generic_seed_data.py
import asyncio
from app.database import db
from datetime import datetime

async def seed_generic_recipes():
    generic_recipes = [
        {
            "name": "Pasta",
            "description": "A simple pasta recipe that can be customized with various sauces and toppings.",
            "defaultIngredients": [
                {"name": "Pasta", "quantity": "200g"},
                {"name": "Olive Oil", "quantity": "1 tbsp"},
                {"name": "Garlic", "quantity": "2 cloves"},
                {"name": "Salt", "quantity": "to taste"}
            ],
            "nutrition": {"calories": 400, "protein": 10, "carbs": 60, "fat": 12},
            "preparationTime": 20,
            "imageUrl": "pasta.jpg",
            "type": "generic",
            "created_at": datetime.utcnow(),
        },
        {
            "name": "Grilled Cheese Sandwich",
            "description": "A quick and simple grilled cheese sandwich.",
            "defaultIngredients": [
                {"name": "Bread", "quantity": "2 slices"},
                {"name": "Cheese", "quantity": "2 slices"},
                {"name": "Butter", "quantity": "1 tbsp"}
            ],
            "nutrition": {"calories": 350, "protein": 15, "carbs": 35, "fat": 20},
            "preparationTime": 15,
            "imageUrl": "grilled_cheese.jpg",
            "type": "generic",
            "created_at": datetime.utcnow(),
        },
        # Add more recipes if needed...
    ]

    # Check if any generic recipes exist already
    count = await db.generic_recipes.count_documents({})
    if count == 0:
        # Insert the new recipes if the collection is empty
        await db.generic_recipes.insert_many(generic_recipes)
        print(f"✅ Inserted {len(generic_recipes)} generic recipes.")
    else:
        print("⚠️ generic_recipes collection already has data.")

async def main():
    await seed_generic_recipes()
    print("🌱 Seeding complete.")
    # Optionally: await db.client.close() if you want to close connection

if __name__ == "__main__":
    asyncio.run(main())
