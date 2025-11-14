// src/WebPage/PlanWeeklyMeals/types.ts
export type InventoryItem = {
  id?: string;
  _id?: string;
  name: string;
  expiry?: string;
  category?: string;
  storage?: string;
  quantity: number;
  reserved?: boolean;
  notes?: string;
  source?: "inventory" | "donation";
  image?: string;
};

// ✅ updated this section
export type MealEntry = {
  name: string;
  type: "recipe" | "generic" | "custom";
  ingredients?: { id: string; name: string; used_qty: number }[]; // <-- updated
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fats?: number;
  } | null;
} | null;

export type MealSlot = {
  breakfast: MealEntry;
  lunch: MealEntry;
  dinner: MealEntry;
  snacks: MealEntry;
};

export type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type WeekPlan = {
  id?: string | null;   // ⭐ ADD THIS LINE
  userId: string;
  weekStart: string; // ISO
  meals: {
    monday: MealSlot;
    tuesday: MealSlot;
    wednesday: MealSlot;
    thursday: MealSlot;
    friday: MealSlot;
    saturday: MealSlot;
    sunday: MealSlot;
  };
};
const EMPTY_SLOT: MealSlot = {
  breakfast: null,
  lunch: null,
  dinner: null,
  snacks: null,
};
