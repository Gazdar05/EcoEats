// src/WebPage/BrowseFood/BrowsePage.tsx
import React, { useMemo, useState } from "react";
import { sampleItems } from "./mockData";
import type { FoodItem } from "./mockData";
import FilterPanel from "./FilterPanel";
import ItemList from "./ItemList";
import ItemDetailModal from "./ItemDetailModal";
import "./BrowseFood.css";

const BrowsePage: React.FC = () => {
  const [items, setItems] = useState<FoodItem[]>(
    sampleItems.map((i) => ({ ...i }))
  );
  const [source, setSource] = useState<"inventory" | "donation">("inventory");
  const [filters, setFilters] = useState<any>({});
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"" | "expiry" | "category">("");
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);

  // Apply filters, search and source
  const filtered = useMemo(() => {
    const now = new Date();
    let list = items.filter((i) => i.source === source);

    if (filters.categories && filters.categories.length) {
      list = list.filter((i) => filters.categories.includes(i.category));
    }

    if (filters.storage) {
      list = list.filter(
        (i) => i.storage.toLowerCase() === filters.storage.toLowerCase()
      );
    }

    if (filters.expiryDays) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // strip time

      if (filters.expiryDays === "expired") {
        list = list.filter((i) => new Date(i.expiry) < today);
      } else if (filters.expiryDays === "0") {
        list = list.filter(
          (i) => new Date(i.expiry).toDateString() === today.toDateString()
        );
      } else {
        const max = new Date(today);
        max.setDate(today.getDate() + Number(filters.expiryDays));
        list = list.filter(
          (i) => new Date(i.expiry) >= today && new Date(i.expiry) <= max
        );
      }
    }
    if (search && search.trim() !== "") {
      const q = search.trim().toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q));
    }

    if (sortBy === "expiry") {
      list = list
        .slice()
        .sort(
          (a, b) => new Date(a.expiry).getTime() - new Date(b.expiry).getTime()
        );
    } else if (sortBy === "category") {
      list = list.slice().sort((a, b) => a.category.localeCompare(b.category));
    }

    return list;
  }, [items, source, filters, search, sortBy]);

  function handleApplyFilters(f: any) {
    setFilters(f); // ✅ store filters in state
  }

  function handleClearFilters() {
    setFilters({}); // ✅ reset filters
  }

  function handleMarkUsed(id: string) {
    setItems((prev) =>
      prev.reduce<FoodItem[]>((acc, it) => {
        if (it.id !== id) {
          acc.push(it);
          return acc;
        }
        if (it.quantity > 1) {
          acc.push({ ...it, quantity: it.quantity - 1 });
          alert(`Marked ${it.name} as used. Quantity decreased.`);
        } else {
          alert(`${it.name} fully used and removed from inventory`);
        }
        return acc;
      }, [])
    );
    setSelectedItem(null);
  }

  function handlePlanMeal(id: string) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        if (it.reserved) {
          alert("This item is already reserved for a meal.");
          return it;
        }
        alert(`${it.name} reserved for meal`);
        return { ...it, reserved: true };
      })
    );
    setSelectedItem(null);
  }

  function handleFlagDonation(
    id: string,
    details: { location: string; availability: string; contact: string }
  ) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, source: "donation", donationDetails: details }
          : it
      )
    );
    alert("Item flagged for donation.");
    setSelectedItem(null);
  }

  function handleRemoveDonation(id: string) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, source: "inventory", donationDetails: undefined } // 👈 reset back to inventory
          : it
      )
    );
    alert("Item removed from donation list and moved back to inventory.");
    setSelectedItem(null);
  }

  return (
    <div className="browse-wrap">
      <aside className="left-column">
        <FilterPanel
          source={source}
          setSource={setSource}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
        />
      </aside>

      <section className="main-column">
        <div className="main-top">
          <h2>🍽️ Browse Items</h2>
          <div className="main-controls">
            <input
              className="search"
              placeholder="🔍 Search food items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="">📊 Sort by: Default</option>
              <option value="expiry">📅 Sort by: Expiry Date</option>
              <option value="category">🍴 Sort by: Category</option>📊📅🍴
            </select>
          </div>
        </div>

        <ItemList items={filtered} onItemClick={setSelectedItem} />
      </section>

      <ItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onMarkUsed={handleMarkUsed}
        onPlanMeal={handlePlanMeal}
        onFlagDonation={handleFlagDonation}
        onRemoveDonation={handleRemoveDonation}
      />
    </div>
  );
};

export default BrowsePage;
