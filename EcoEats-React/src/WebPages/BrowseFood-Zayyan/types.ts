// src/WebPage/BrowseFood/types.ts
export type FoodItem = {
  // support both mock and backend shapes
  id?: string;            // mockData used `id`
  _id?: string;           // backend returns `_id`
  name: string;
  // expiry can be in either field (mock uses expiry, backend uses expiry_date)
  expiry?: string;        // mockData: ISO date string
  expiry_date?: string;   // backend: ISO date / datetime string
  category: string;
  storage: string;
  quantity: number;
  notes?: string;
  source: "inventory" | "donation";
  reserved?: boolean;
  donationDetails?: {
    location: string;
    availability: string;
    contact: string;
  };
  image?: string; // optional image filename or URL
};

/** helper: canonical id */
export function getItemId(item: FoodItem): string {
  return item._id ?? item.id ?? "";
}

/** helper: canonical expiry string */
export function getExpiryString(item: FoodItem): string {
  return item.expiry_date ?? item.expiry ?? "";
}
