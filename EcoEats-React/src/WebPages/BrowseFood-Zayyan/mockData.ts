// src/WebPage/BrowseFood/mockData.ts
export type FoodItem = {
  id: string;
  name: string;
  expiry: string; // ISO date
  category: string;
  storage: string;
  notes?: string;
  quantity: number;
  source: "inventory" | "donation";
  reserved?: boolean;
  donationDetails?: {
    location: string;
    availability: string;
    contact: string;
  };
};

export const sampleItems: FoodItem[] = [
  { id: "1", name: "Bagels", expiry: "2025-07-04", category: "Bakery", storage: "Pantry", quantity: 6, source: "inventory" },
  { id: "2", name: "Bread", expiry: "2025-07-05", category: "Bakery", storage: "Pantry", quantity: 1, source: "inventory" },
  { id: "3", name: "Beef", expiry: "2024-10-10", category: "Meat", storage: "Fridge", quantity: 1, source: "inventory" },
  { id: "4", name: "Salmon", expiry: "2025-10-07", category: "Seafood", storage: "Freezer", quantity: 2, source: "inventory" },
  { id: "5", name: "Chicken", expiry: "2025-07-08", category: "Meat", storage: "Fridge", quantity: 2, source: "inventory" },
  { id: "6", name: "Milk", expiry: "2024-10-10", category: "Dairy", storage: "Fridge", quantity: 1, source: "inventory" },
  { id: "7", name: "Juice", expiry: "2025-10-10", category: "Beverages", storage: "Fridge", quantity: 1, source: "inventory" },
  { id: "8", name: "Apples", expiry: "2025-07-20", category: "Fruits", storage: "Pantry", quantity: 6, source: "inventory" },
  { id: "9", name: "Berries", expiry: "2025-09-01", category: "Fruits", storage: "Fridge", quantity: 1, source: "inventory" },
  { id: "10", name: "Tomato", expiry: "2025-01-15", category: "Vegetables", storage: "Pantry", quantity: 2, source: "donation", donationDetails: { location: "Drop Point A", availability: "Weekdays 9-5", contact: "012-3456789" } },
  { id: "11", name: "Coffee", expiry: "2025-03-10", category: "Beverages", storage: "Pantry", quantity: 3, source: "inventory" },
  { id: "12", name: "Pasta", expiry: "2025-06-20", category: "Pantry Staples", storage: "Pantry", quantity: 1, source: "inventory" }
];
