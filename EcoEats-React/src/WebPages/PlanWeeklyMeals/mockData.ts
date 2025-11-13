// src/WebPage/PlanWeeklyMeals/mockData.ts
import type { InventoryItem } from "./types";

export const sampleInventory: InventoryItem[] = [
  { id: "a1", name: "Chicken Breast", expiry: "2025-11-10", category: "Meat", storage: "Fridge", quantity: 2 },
  { id: "a2", name: "Broccoli", expiry: "2025-11-06", category: "Vegetables", storage: "Fridge", quantity: 1 },
  { id: "a3", name: "Pasta", expiry: "2026-02-01", category: "Pantry Staples", storage: "Pantry", quantity: 1 },
  { id: "a4", name: "Eggs", expiry: "2025-11-02", category: "Dairy", storage: "Fridge", quantity: 12 },
  { id: "a5", name: "Tomato", expiry: "2025-11-03", category: "Vegetables", storage: "Pantry", quantity: 5 },
];

export const sampleRecipes = [
  "Green Goddess Salad",
  "Spicy Chickpea Bowl",
  "Mediterranean Quinoa",
  "Creamy Tomato Pasta",
  "Chicken Stir Fry",
  "Omelette with Veggies",
];
