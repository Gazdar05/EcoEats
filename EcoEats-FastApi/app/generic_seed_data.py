import asyncio
from app.database import db
from datetime import datetime

async def seed_generic_recipes():
    sample_recipes = [
        {
            "name": "Creamy Tomato Pasta",
            "category": "Lunch",
            "ingredients": [
                {"name": "pasta", "quantity": "200g"},
                {"name": "tomato sauce", "quantity": "1 cup"},
                {"name": "olive oil", "quantity": "2 tbsp"},
                {"name": "garlic", "quantity": "2 cloves"},
                {"name": "salt", "quantity": "to taste"},
                {"name": "parmesan", "quantity": "30g"},
            ],
            "instructions": "Cook pasta, sauté garlic in olive oil, add tomato sauce, mix and top with parmesan.",
            "image": "https://www.themealdb.com/images/media/meals/ustsqw1468250014.jpg",
            "created_at": datetime.utcnow(),
        },
        {
            "name": "Omelette with Veggies",
            "category": "Breakfast",
            "ingredients": [
                {"name": "eggs", "quantity": "2"},
                {"name": "onion", "quantity": "1/2 diced"},
                {"name": "tomato", "quantity": "1 chopped"},
                {"name": "bell pepper", "quantity": "1/4 sliced"},
                {"name": "salt", "quantity": "pinch"},
                {"name": "black pepper", "quantity": "pinch"},
            ],
            "instructions": "Beat eggs, add veggies, and cook until firm.",
            "image": "https://www.themealdb.com/images/media/meals/hqaejl1695730610.jpg",
            "created_at": datetime.utcnow(),
        },
        {
            "name": "Grilled Chicken Salad",
            "category": "Dinner",
            "ingredients": [
                {"name": "chicken breast", "quantity": "150g"},
                {"name": "lettuce", "quantity": "1 cup"},
                {"name": "tomato", "quantity": "1 sliced"},
                {"name": "olive oil", "quantity": "1 tbsp"},
                {"name": "lemon juice", "quantity": "1 tbsp"},
                {"name": "salt", "quantity": "to taste"},
            ],
            "instructions": "Grill chicken, slice and mix with veggies. Dress with oil and lemon juice.",
            "image": "https://www.themealdb.com/images/media/meals/1548772327.jpg",
            "created_at": datetime.utcnow(),
        },
        {
            "name": "Peanut Butter Smoothie",
            "category": "Snacks",
            "ingredients": [
                {"name": "milk", "quantity": "1 cup"},
                {"name": "banana", "quantity": "1"},
                {"name": "peanut butter", "quantity": "2 tbsp"},
                {"name": "honey", "quantity": "1 tsp"},
            ],
            "instructions": "Blend all ingredients until smooth and serve cold.",
            "image": "https://www.themealdb.com/images/media/meals/xxtsvx1511814083.jpg",
            "created_at": datetime.utcnow(),
        },
        {
            "name": "Vegetable Fried Rice",
            "category": "Lunch",
            "ingredients": [
                {"name": "rice", "quantity": "1 cup"},
                {"name": "soy sauce", "quantity": "1 tbsp"},
                {"name": "carrot", "quantity": "1/2 chopped"},
                {"name": "peas", "quantity": "1/4 cup"},
                {"name": "egg", "quantity": "1"},
                {"name": "onion", "quantity": "1/4 diced"},
            ],
            "instructions": "Fry onion, add vegetables and rice, mix with soy sauce and scrambled egg.",
            "image": "https://www.themealdb.com/images/media/meals/1529443236.jpg",
            "created_at": datetime.utcnow(),
        },
    ]

    count = await db.generic_recipes.count_documents({})
    if count == 0:
        await db.generic_recipes.insert_many(sample_recipes)
        print(f"✅ Inserted {len(sample_recipes)} generic recipes.")
    else:
        print("⚠️ generic_recipes collection already has data.")


async def main():
    await seed_generic_recipes()
    print("🌱 Seeding complete.")
    # Optionally: await db.client.close() if you want to close connection


if __name__ == "__main__":
    asyncio.run(main())
