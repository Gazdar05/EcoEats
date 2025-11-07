import asyncio
from app.database import db

async def seed_suggested_recipes():
    suggested_recipes = [
        {
            "name": "Egg Fried Rice",
            "ingredients": [
                {"name": "Eggs", "quantity": 2, "unit": "pcs"},
                {"name": "Rice", "quantity": 1, "unit": "cup"},
                {"name": "Soy Sauce", "quantity": 2, "unit": "tbsp"},
                {"name": "Oil", "quantity": 1, "unit": "tbsp"},
                {"name": "Garlic", "quantity": 2, "unit": "cloves"},
            ],
            "instructions": [
                "Cook rice and set aside.",
                "Scramble eggs with garlic in a pan.",
                "Add rice, soy sauce, and oil. Stir-fry for 5 minutes."
            ],
            "category": "Lunch",
            "calories": 450,
            "image": "egg_fried_rice.jpg"
        },
        {
            "name": "Cheesy Omelette",
            "ingredients": [
                {"name": "Eggs", "quantity": 3, "unit": "pcs"},
                {"name": "Cheese", "quantity": 50, "unit": "g"},
                {"name": "Salt", "quantity": 1, "unit": "tsp"},
                {"name": "Butter", "quantity": 1, "unit": "tbsp"},
                {"name": "Milk", "quantity": 2, "unit": "tbsp"}
            ],
            "instructions": [
                "Beat eggs with milk and salt.",
                "Melt butter in a pan and add egg mixture.",
                "Sprinkle cheese and fold once cooked."
            ],
            "category": "Breakfast",
            "calories": 320,
            "image": "cheesy_omelette.jpg"
        },
        {
            "name": "Creamy Tomato Pasta",
            "ingredients": [
                {"name": "Pasta", "quantity": 200, "unit": "g"},
                {"name": "Tomato Sauce", "quantity": 1, "unit": "cup"},
                {"name": "Cream", "quantity": 0.5, "unit": "cup"},
                {"name": "Cheese", "quantity": 50, "unit": "g"},
                {"name": "Salt", "quantity": 1, "unit": "tsp"}
            ],
            "instructions": [
                "Boil pasta until tender.",
                "Cook tomato sauce and mix with cream.",
                "Add pasta and cheese. Stir and serve."
            ],
            "category": "Dinner",
            "calories": 600,
            "image": "creamy_tomato_pasta.jpg"
        },
        {
            "name": "Peanut Butter Banana Toast",
            "ingredients": [
                {"name": "Bread", "quantity": 2, "unit": "slices"},
                {"name": "Peanut Butter", "quantity": 2, "unit": "tbsp"},
                {"name": "Banana", "quantity": 1, "unit": "pcs"},
                {"name": "Honey", "quantity": 1, "unit": "tsp"}
            ],
            "instructions": [
                "Toast the bread lightly.",
                "Spread peanut butter evenly.",
                "Top with banana slices and drizzle honey."
            ],
            "category": "Snack",
            "calories": 310,
            "image": "pb_banana_toast.jpg"
        },
        {
            "name": "Vegetable Stir Fry",
            "ingredients": [
                {"name": "Carrot", "quantity": 1, "unit": "pcs"},
                {"name": "Broccoli", "quantity": 1, "unit": "cup"},
                {"name": "Bell Pepper", "quantity": 1, "unit": "pcs"},
                {"name": "Soy Sauce", "quantity": 2, "unit": "tbsp"},
                {"name": "Oil", "quantity": 1, "unit": "tbsp"},
                {"name": "Garlic", "quantity": 2, "unit": "cloves"}
            ],
            "instructions": [
                "Heat oil in a wok, add garlic and vegetables.",
                "Stir-fry with soy sauce for 5–6 minutes.",
                "Serve hot with rice or noodles."
            ],
            "category": "Lunch",
            "calories": 280,
            "image": "veg_stir_fry.jpg"
        },
        {
            "name": "Chicken Sandwich",
            "ingredients": [
                {"name": "Bread", "quantity": 2, "unit": "slices"},
                {"name": "Chicken Breast", "quantity": 100, "unit": "g"},
                {"name": "Mayonnaise", "quantity": 1, "unit": "tbsp"},
                {"name": "Lettuce", "quantity": 1, "unit": "leaf"},
                {"name": "Cheese", "quantity": 1, "unit": "slice"}
            ],
            "instructions": [
                "Grill the chicken and slice it.",
                "Assemble sandwich with mayo, lettuce, and cheese.",
                "Toast for a minute until warm."
            ],
            "category": "Snack",
            "calories": 390,
            "image": "chicken_sandwich.jpg"
        },
        {
            "name": "Garlic Butter Shrimp",
            "ingredients": [
                {"name": "Shrimp", "quantity": 200, "unit": "g"},
                {"name": "Butter", "quantity": 2, "unit": "tbsp"},
                {"name": "Garlic", "quantity": 3, "unit": "cloves"},
                {"name": "Salt", "quantity": 1, "unit": "tsp"},
                {"name": "Lemon", "quantity": 0.5, "unit": "pcs"}
            ],
            "instructions": [
                "Melt butter in a pan and sauté garlic.",
                "Add shrimp and cook until pink.",
                "Squeeze lemon juice before serving."
            ],
            "category": "Dinner",
            "calories": 420,
            "image": "garlic_butter_shrimp.jpg"
        },
        {
            "name": "Avocado Salad",
            "ingredients": [
                {"name": "Avocado", "quantity": 1, "unit": "pcs"},
                {"name": "Lettuce", "quantity": 1, "unit": "cup"},
                {"name": "Tomato", "quantity": 1, "unit": "pcs"},
                {"name": "Olive Oil", "quantity": 1, "unit": "tbsp"},
                {"name": "Salt", "quantity": 1, "unit": "tsp"}
            ],
            "instructions": [
                "Chop all ingredients and toss in a bowl.",
                "Drizzle olive oil and sprinkle salt.",
                "Mix gently and serve fresh."
            ],
            "category": "Lunch",
            "calories": 250,
            "image": "avocado_salad.jpg"
        },
        {
            "name": "Pancakes",
            "ingredients": [
                {"name": "Flour", "quantity": 1, "unit": "cup"},
                {"name": "Milk", "quantity": 1, "unit": "cup"},
                {"name": "Eggs", "quantity": 1, "unit": "pcs"},
                {"name": "Sugar", "quantity": 2, "unit": "tbsp"},
                {"name": "Butter", "quantity": 1, "unit": "tbsp"}
            ],
            "instructions": [
                "Mix flour, milk, eggs, and sugar to form batter.",
                "Heat pan, melt butter, and pour batter.",
                "Flip and cook both sides until golden."
            ],
            "category": "Breakfast",
            "calories": 400,
            "image": "pancakes.jpg"
        },
        {
            "name": "Grilled Cheese Sandwich",
            "ingredients": [
                {"name": "Bread", "quantity": 2, "unit": "slices"},
                {"name": "Cheese", "quantity": 2, "unit": "slices"},
                {"name": "Butter", "quantity": 1, "unit": "tbsp"}
            ],
            "instructions": [
                "Butter the bread and place cheese in between.",
                "Grill until the bread is golden and cheese melts."
            ],
            "category": "Snack",
            "calories": 370,
            "image": "grilled_cheese.jpg"
        }
    ]

    collection = db["suggested_recipes"]
    existing = await collection.count_documents({})

    if existing == 0:
        await collection.insert_many(suggested_recipes)
        print("✅ Suggested recipes seeded successfully!")
    else:
        print("⚠️ Suggested recipes already exist, skipping seeding.")

if __name__ == "__main__":
    asyncio.run(seed_suggested_recipes())
