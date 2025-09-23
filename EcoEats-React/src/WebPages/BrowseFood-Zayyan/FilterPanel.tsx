// src/WebPage/BrowseFood/FilterPanel.tsx
import React, { useState } from "react";

type Filters = {
  expiryDays?: string; // 👈 was number
  categories?: string[];
  storage?: string;
};

type Props = {
  source: "inventory" | "donation";
  setSource: (val: "inventory" | "donation") => void;
  onApply: (filters: Filters) => void;
  onClear: () => void;
};
const EXPIRY_OPTIONS = [
  { label: "Expired", value: "expired" },
  { label: "Today", value: "0" },
  { label: "3 days", value: "3" },
  { label: "7 days", value: "7" },
  { label: "14 days", value: "14" },
  { label: "30 days", value: "30" },
];

const CATEGORIES = [
  "Fruits",
  "Vegetables",
  "Dairy",
  "Meat",
  "Grains",
  "Pantry Staples",
  "Bakery",
  "Beverages",
  "Canned",
  "Seafood",
];
const STORAGE_TYPES = ["All", "Fridge", "Freezer", "Pantry", "Counter"];

const FilterPanel: React.FC<Props> = ({
  source,
  setSource,
  onApply,
  onClear,
}) => {
  const [selCategories, setSelCategories] = useState<string[]>([]);
  const [storage, setStorage] = useState<string>("All");
  const [expiryDays, setExpiryDays] = useState<string | undefined>(undefined);

  function toggleCategory(cat: string) {
    setSelCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function apply() {
    const filters: Filters = {};
    if (expiryDays) filters.expiryDays = expiryDays; // now string
    if (selCategories.length) filters.categories = selCategories;
    if (storage && storage !== "All") filters.storage = storage;
    onApply(filters);
  }

  function clearAll() {
    setSelCategories([]);
    setStorage("All");
    setExpiryDays(undefined);
    onClear();
  }

  return (
    <div className="fp-panel" role="region" aria-label="Filters">
      <h3 className="fp-title">Filters</h3>

      <div className="fp-section">
        <label className="fp-label">Source</label>
        <div className="fp-toggle">
          <button
            className={source === "inventory" ? "active" : ""}
            onClick={() => setSource("inventory")}
          >
            Inventory
          </button>
          <button
            className={source === "donation" ? "active" : ""}
            onClick={() => setSource("donation")}
          >
            Donations
          </button>
        </div>
      </div>

      <div className="fp-section">
        <label className="fp-label">Categories</label>
        <div className="fp-cats">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="fp-checkbox">
              <input
                type="checkbox"
                checked={selCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
              />
              <span>{cat}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="fp-section">
        <label className="fp-label">Store Type</label>
        <select value={storage} onChange={(e) => setStorage(e.target.value)}>
          {STORAGE_TYPES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="fp-section">
        <label className="fp-label">Expiry Filter</label>
        <div className="fp-expiry-buttons">
          {EXPIRY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={expiryDays === opt.value ? "selected" : ""}
              onClick={() => setExpiryDays(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="fp-actions">
        <button className="fp-clear" onClick={clearAll}>
          Clear
        </button>
        <button className="fp-apply" onClick={apply}>
          Apply
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
