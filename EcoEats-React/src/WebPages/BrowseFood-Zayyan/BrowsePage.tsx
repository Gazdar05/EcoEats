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
    sampleItems.map((i) => ({ ...i }))
  );
  const [source, setSource] = useState<"inventory" | "donation">("inventory");
  const [filters, setFilters] = useState<any>({});
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"" | "expiry" | "category">("");
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);

  // ✅ pagination states
  const [currentPage, setCurrentPage] = useState(1);

  // ✅ donated toggle state
  const [showDonated, setShowDonated] = useState(false);

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
      donationDetails: doc.donationDetails ?? undefined,
      donated: !!doc.donated,
      image: doc.image ?? "", // ✅ add this
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
    let list = [...items];

    // ✅ if showing donated items, only those
    if (showDonated) {
      list = list.filter((i) => i.donated);

      // ✅ still apply filters/search/sort on donated list
      if (filters.categories?.length) {
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
      if (search?.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter((i) => i.name.toLowerCase().includes(q));
      }
      if (sortBy === "expiry") {
        list = list
          .slice()
          .sort(
            (a, b) =>
              new Date(a.expiry).getTime() - new Date(b.expiry).getTime()
          );
      } else if (sortBy === "category") {
        list = list
          .slice()
          .sort((a, b) => a.category.localeCompare(b.category));
      }

      return list;
    }

    // otherwise filter by normal source (inventory / donation)
    list = list.filter((i) => i.source === source && !i.donated);

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
  }, [items, source, filters, search, sortBy, showDonated]);

  // ✅ pagination logic applied on filtered data
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedItems = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // reset page to 1 when filters/search/source/donated view changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, search, sortBy, source, showDonated]);

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
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setItems((prev) =>
        prev.reduce<FoodItem[]>((acc, it) => {
          if (it.id !== id) {
            acc.push(it);
            return acc;
          }
          if (it.quantity > 1) {
            acc.push({ ...it, quantity: it.quantity - 1 });
          }
          return acc;
        }, [])
      );

      setSelectedItem(null);
      alert(data.status);
    } catch (err) {
      console.error("Error marking used:", err);
      alert("Failed to mark item as used.");
    }
  }

  async function handlePlanMeal(id: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/browse/item/${id}/plan-meal`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      alert(data.status);

      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, reserved: true } : it))
      );
      setSelectedItem(null);
    } catch (err) {
      console.error("Error planning meal:", err);
      alert("Failed to reserve item.");
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
      if (!res.ok) throw new Error(await res.text());
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
      alert("Failed to flag donation.");
    }
  }

  async function handleMarkDonated(id: string) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/browse/item/${id}/mark-donated`,
        { method: "PUT" }
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      alert(data.status);

      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, donated: true } : it))
      );

      setSelectedItem(null);
    } catch (err) {
      console.error("Error marking donated:", err);
      alert("Failed to mark as donated.");
    }
  }

  async function handleRemoveDonation(id: string) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/browse/item/${id}/remove-donation`,
        { method: "PUT" }
      );
      if (!res.ok) throw new Error(await res.text());
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
      alert("Failed to remove from donation.");
    }
  }

  return (
    <div className="browse-wrap">
      <aside className="left-column">
        <FilterPanel
          source={source}
          setSource={(val) => {
            setShowDonated(false);
            setSource(val);
          }}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
        />
      </aside>

      <section className="main-column">
        <div className="main-top">
          <h2>
            {showDonated
              ? "Donated Items"
              : source === "donation"
              ? "🎁 Donation Listings"
              : "🍽️ Browse Items"}
          </h2>
          {!showDonated && (
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
                <option value="expiry">📅 Expiry Date</option>
                <option value="category">🍴 Category</option>
              </select>
            </div>
          )}
        </div>

        <div className="item-list-container">
          <ItemList items={paginatedItems} onItemClick={setSelectedItem} />
        </div>

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

      {/* ✅ Floating button */}
      <button
        className="donated-items-btn"
        onClick={() => setShowDonated((s) => !s)}
      >
        {showDonated ? "⬅ Back to Listings" : "View Donated Items"}
      </button>

      <ItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onMarkUsed={handleMarkUsed}
        onPlanMeal={handlePlanMeal}
        onFlagDonation={handleFlagDonation}
        onRemoveDonation={handleRemoveDonation}
        onMarkDonated={handleMarkDonated}
      />
    </div>
  );
};

export default BrowsePage;
