// src/WebPage/BrowseFood/mockData.ts
export type FoodItem = {
  id: string;
  name: string;
  expiry: string;
  category: string;
  storage: string;
  notes?: string;
  quantity: number;
  source: "inventory" | "donation";
  donationDetails?: {
    location: string;
    availability: string;
    contact: string;
  };
};

export const sampleItems: FoodItem[] = [
  {
    id: "1",
    name: "Milk",
    expiry: "2025-09-25",
    category: "Dairy",
    storage: "Fridge",
    notes: "Low fat",
    quantity: 2,
    source: "inventory",
  },
  {
    id: "2",
    name: "Rice",
    expiry: "2026-01-10",
    category: "Grains",
    storage: "Pantry",
    quantity: 1,
    source: "inventory",
  },
  {
    id: "3",
    name: "Canned Beans",
    expiry: "2025-12-01",
    category: "Canned",
    storage: "Pantry",
    quantity: 5,
    source: "donation",
    donationDetails: {
      location: "KL Sentral",
      availability: "Weekdays 9am - 5pm",
      contact: "012-3456789",
    },
  },
];
