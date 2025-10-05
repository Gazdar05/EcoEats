// src/WebPage/BrowseFood/BrowsePage.tsx
import React, { useMemo, useState, useEffect } from "react";
import { sampleItems } from "./mockData";
import type { FoodItem } from "./mockData";
import FilterPanel from "./FilterPanel";
import ItemList from "./ItemList";
import ItemDetailModal from "./ItemDetailModal";
import "./BrowseFood.css";
import { API_BASE_URL } from "../../config"; // new config file

const ITEMS_PER_PAGE = 12; // ✅ number of items per page

const BrowsePage: React.FC = () => {
  const [items, setItems] = useState<FoodItem[]>(
    // keep a fallback to sampleItems for dev if fetch fails
    sampleItems.map((i) => ({ ...i }))
  );
  const [source, setSource] = useState<"inventory" | "donation">("inventory");
  const [filters, setFilters] = useState<any>({});
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"" | "expiry" | "category">("");
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);

  // ✅ pagination states
  const [currentPage, setCurrentPage] = useState(1);

  // Normalize backend doc -> frontend FoodItem shape (id, expiry)
  function normalizeBackendDoc(doc: any): FoodItem {
    return {
      id: doc._id ?? doc.id ?? "",
      name: doc.name ?? "",
      expiry:
        doc.expiry_date !== undefined && doc.expiry_date !== null
          ? String(doc.expiry_date)
          : doc.expiry ?? "",
      category: doc.category ?? "",
      storage: doc.storage ?? "",
      notes: doc.notes ?? "",
      quantity:
        typeof doc.quantity === "number"
          ? doc.quantity
          : Number(doc.quantity ?? 1),
      source: doc.source === "donation" ? "donation" : "inventory",
      reserved: !!doc.reserved,
      donationDetails: doc.donationDetails ?? doc.donationDetails ?? undefined,
    };
  }

  // Fetch items from backend
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/browse/items`);
        if (!res.ok) {
          console.warn("Failed to fetch items from backend, using mock data");
          return;
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
          console.warn("Unexpected items response, using mock data");
          return;
        }
        const norm = data.map(normalizeBackendDoc);
        setItems(norm);
      } catch (err) {
        console.error("Error fetching items:", err);
      }
    };
    fetchItems();
  }, []);

  // Apply filters, search, sort
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
      today.setHours(0, 0, 0, 0);
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

  // ✅ pagination logic applied on filtered data
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedItems = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // reset page to 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, search, sortBy, source]);

  function handleApplyFilters(f: any) {
    setFilters(f);
  }

  function handleClearFilters() {
    setFilters({});
  }

  // === Backend-connected action handlers ===
  async function handleMarkUsed(id: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/browse/item/${id}/mark-used`, {
        method: "PUT",
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Mark-used failed");
      }
      const data = await res.json();
      alert(data.status);

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
    } catch (err) {
      console.error("Error marking used:", err);
      alert("Failed to mark item as used. See console for details.");
    }
  }

  async function handlePlanMeal(id: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/browse/item/${id}/plan-meal`, {
        method: "PUT",
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Plan-meal failed");
      }
      const data = await res.json();
      alert(data.status);

      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, reserved: true } : it))
      );
      setSelectedItem(null);
    } catch (err) {
      console.error("Error planning meal:", err);
      alert("Failed to reserve item. See console for details.");
    }
  }

  async function handleFlagDonation(
    id: string,
    details: { location: string; availability: string; contact: string }
  ) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/browse/item/${id}/flag-donation`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(details),
        }
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Flag-donation failed");
      }
      const data = await res.json();
      alert(data.status);

      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, source: "donation", donationDetails: details }
            : it
        )
      );
      setSelectedItem(null);
    } catch (err) {
      console.error("Error flagging donation:", err);
      alert("Failed to flag donation. See console for details.");
    }
  }

  async function handleRemoveDonation(id: string) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/browse/item/${id}/remove-donation`,
        { method: "PUT" }
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Remove-donation failed");
      }
      const data = await res.json();
      alert(data.status);

      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, source: "inventory", donationDetails: undefined }
            : it
        )
      );
      setSelectedItem(null);
    } catch (err) {
      console.error("Error removing donation:", err);
      alert("Failed to remove from donation. See console for details.");
    }
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
              <option value="category">🍴 Sort by: Category</option>
            </select>
          </div>
        </div>

        {/* ✅ Main item list area */}
        <div className="item-list-container">
          <ItemList items={paginatedItems} onItemClick={setSelectedItem} />
        </div>

        {/* ✅ Fixed-bottom pagination */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Prev
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={currentPage === i + 1 ? "active-page" : ""}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
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
