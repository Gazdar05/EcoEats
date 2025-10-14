import React, { useEffect, useMemo, useState } from "react";
import "./FoodInventory.css";
import {
  Plus,
  Filter,
  Search,
  Edit,
  Trash2,
  Eye,
  CheckSquare,
  Heart,
} from "lucide-react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import ViewItemPopup from "./ViewItemPopup";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import EditItemPopup from "./EditItemPopup";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import AddItemPopup from "./AddItemPopup";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import DonationPopup from "./DonationPopup";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import DonationList from "./DonationList";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";

const API_BASE = "http://127.0.0.1:8000";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  expiry: string; // ISO date or YYYY-MM-DD
  storage: string;
  status: string;
  notes?: string;
  image?: string;
}

interface DonationItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  expiry: string;
  storage: string;
  status: string;
  notes?: string;
  image?: string;
  pickupLocation?: string;
  availability?: string;
}

const FoodInventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [donations, setDonations] = useState<DonationItem[]>([]);

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [donationItem, setDonationItem] = useState<InventoryItem | null>(null);

  const [showViewPopup, setShowViewPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showDonationPopup, setShowDonationPopup] = useState(false);
  const [showDonationList, setShowDonationList] = useState(false);

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    storage: "",
  });

  const categories = [
    { id: "produce", name: "Produce" },
    { id: "dairy", name: "Dairy" },
    { id: "bakery", name: "Bakery" },
    { id: "meat", name: "Meat" },
    { id: "seafood", name: "Seafood" },
    { id: "dry", name: "Dry Goods" },
    { id: "frozen", name: "Frozen" },
  ];

  const isPopupOpen =
    showViewPopup ||
    showEditPopup ||
    showAddPopup ||
    showDonationPopup ||
    showDonationList;
  useEffect(() => {
    if (isPopupOpen) document.body.classList.add("popup-open");
    else document.body.classList.remove("popup-open");
    return () => document.body.classList.remove("popup-open");
  }, [isPopupOpen]);

  const calculateStatus = (expiryDate: string): string => {
    if (!expiryDate) return "Unknown";
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays < 0) return "Expired";
    if (diffDays <= 3) return "Expiring Soon";
    return "Fresh";
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${API_BASE}/inventory/`);
      if (!res.ok) {
        console.error("Failed to fetch inventory", res.status);
        return;
      }
      const data: InventoryItem[] = await res.json();
      const normalized = data.map((it) => ({
        ...it,
        id: String(it.id),
        status: calculateStatus(it.expiry),
      }));
      setInventory(normalized);
    } catch (err) {
      console.error("Error loading inventory:", err);
    }
  };

  const fetchDonations = async () => {
    try {
      const res = await fetch(`${API_BASE}/donations/`);
      if (!res.ok) {
        console.error("Failed to fetch donations", res.status);
        return;
      }
      const data: DonationItem[] = await res.json();
      const normalized = data.map((d) => ({
        ...d,
        id: String(d.id),
        expiry: d.expiry || "",
        status: d.status || "Fresh",
        pickupLocation: d.pickupLocation || "",
        availability: d.availability || "Available",
      }));
      setDonations(normalized);
    } catch (err) {
      console.error("Error loading donations:", err);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchDonations();
  }, []);

  const filteredInventory = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return inventory.filter((item) => {
      const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.quantity.toLowerCase().includes(term) ||
        item.storage.toLowerCase().includes(term) ||
        item.status.toLowerCase().includes(term) ||
        (item.notes && item.notes.toLowerCase().includes(term));

      const matchesCategory =
        !filters.category || item.category === filters.category;
      const matchesStatus = !filters.status || item.status === filters.status;
      const matchesStorage =
        !filters.storage || item.storage === filters.storage;

      return (
        matchesSearch && matchesCategory && matchesStatus && matchesStorage
      );
    });
  }, [inventory, searchTerm, filters]);

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch(`${API_BASE}/inventory/${itemId}/`, {
        method: "DELETE",
      });
      if (!res.ok) console.error("Delete failed", res.status);
      else {
        setInventory((prev) => prev.filter((i) => i.id !== itemId));
        setSelectedItems((prev) => prev.filter((id) => id !== itemId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = async (
    newItem: Omit<InventoryItem, "id" | "status">
  ) => {
    try {
      const res = await fetch(`${API_BASE}/inventory/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      if (!res.ok) {
        console.error("Add failed", res.status);
        return;
      }
      const created: InventoryItem = await res.json();
      setInventory((prev) => [
        ...prev,
        { ...created, status: calculateStatus(created.expiry) },
      ]);
      setShowAddPopup(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateItem = async (
    updatedItem: Omit<InventoryItem, "status">
  ) => {
    try {
      const res = await fetch(`${API_BASE}/inventory/${updatedItem.id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItem),
      });
      if (!res.ok) {
        console.error("Update failed", res.status);
        return;
      }
      const saved: InventoryItem = await res.json();
      setInventory((prev) =>
        prev.map((i) =>
          i.id === saved.id
            ? { ...saved, status: calculateStatus(saved.expiry) }
            : i
        )
      );
      setShowEditPopup(false);
      setSelectedItem(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAsUsed = async () => {
    const nextInventory = await Promise.all(
      inventory.map(async (item) => {
        if (!selectedItems.includes(item.id)) return item;
        const currentQty = parseInt(item.quantity || "0", 10);
        if (isNaN(currentQty)) return item;
        const newQty = currentQty - 1;
        if (newQty <= 0) {
          try {
            await fetch(`${API_BASE}/inventory/${item.id}/`, {
              method: "DELETE",
            });
            return null;
          } catch (err) {
            console.error(err);
            return item;
          }
        } else {
          const updated = { ...item, quantity: newQty.toString() };
          try {
            const res = await fetch(`${API_BASE}/inventory/${item.id}/`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updated),
            });
            if (res.ok) return updated;
            return item;
          } catch (err) {
            console.error(err);
            return item;
          }
        }
      })
    );
    setInventory(nextInventory.filter((i): i is InventoryItem => i !== null));
    setSelectedItems([]);
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm("Are you sure you want to delete the selected items?"))
      return;
    await Promise.all(
      selectedItems.map((id) =>
        fetch(`${API_BASE}/inventory/${id}/`, { method: "DELETE" })
      )
    );
    setInventory((prev) =>
      prev.filter((item) => !selectedItems.includes(item.id))
    );
    setSelectedItems([]);
  };

  const toggleSelectItem = (id: string) =>
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleOpenDonationPopup = (item: InventoryItem) => {
    setDonationItem(item);
    setShowDonationPopup(true);
  };

  const handleDonationAdded = async () => {
    await fetchInventory();
    await fetchDonations();
    setShowDonationPopup(false);
    setDonationItem(null);
  };

  const handleViewItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowViewPopup(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowEditPopup(true);
  };

  const handleFilterChange = (
    filterType: keyof typeof filters,
    value: string
  ) => setFilters((p) => ({ ...p, [filterType]: value }));
  const clearFilters = () =>
    setFilters({ category: "", status: "", storage: "" });

  return (
    <div className="food-inventory-page">
      {!isPopupOpen && <Navbar />}

      <div className="inventory-container">
        <h1 className="inventory-title">Inventory</h1>

        <div className="inventory-controls">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="control-buttons">
            <button className="btn-add" onClick={() => setShowAddPopup(true)}>
              <Plus size={16} /> Add Item
            </button>
            <button
              className="btn-filter"
              onClick={() => setShowDonationList(true)}
            >
              <Heart size={16} /> View Donations
            </button>

            {selectedItems.length > 0 && (
              <>
                <button className="btn-filter" onClick={handleMarkAsUsed}>
                  <CheckSquare size={16} /> Mark as Used
                </button>
                <button className="btn-filter" onClick={handleDeleteSelected}>
                  <Trash2 size={16} /> Delete Selected
                </button>
              </>
            )}

            <div className="filter-container">
              <button
                className="btn-filter"
                onClick={() => setShowFilterDropdown((s) => !s)}
              >
                <Filter size={16} /> Filter by
              </button>
              {showFilterDropdown && (
                <div className="filter-dropdown">
                  <div className="filter-section">
                    <label>Category</label>
                    <select
                      value={filters.category}
                      onChange={(e) =>
                        handleFilterChange("category", e.target.value)
                      }
                    >
                      <option value="">All Categories</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-section">
                    <label>Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) =>
                        handleFilterChange("status", e.target.value)
                      }
                    >
                      <option value="">All Status</option>
                      <option value="Fresh">Fresh</option>
                      <option value="Expiring Soon">Expiring Soon</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>
                  <div className="filter-section">
                    <label>Storage</label>
                    <select
                      value={filters.storage}
                      onChange={(e) =>
                        handleFilterChange("storage", e.target.value)
                      }
                    >
                      <option value="">All Storage</option>
                      <option value="Fridge">Fridge</option>
                      <option value="Pantry">Pantry</option>
                      <option value="Freezer">Freezer</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="filter-actions">
                    <button className="btn-clear" onClick={clearFilters}>
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <table className="inventory-table">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Expiry</th>
              <th>Storage</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map((item) => (
              <tr key={item.id}>
                <td style={{ textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleSelectItem(item.id)}
                  />
                </td>
                <td className="item-name-with-image">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="item-image-thumb"
                    />
                  ) : (
                    <div className="item-image-placeholder">No Image</div>
                  )}
                  <span className="item-name-text">{item.name}</span>
                </td>
                <td>{item.category}</td>
                <td>{item.quantity}</td>
                <td className={item.status === "Expired" ? "expired-date" : ""}>
                  {item.expiry}
                </td>
                <td>{item.storage}</td>
                <td>
                  <span
                    className={`status ${
                      item.status === "Expired"
                        ? "expired"
                        : item.status === "Expiring Soon"
                        ? "expiring"
                        : "fresh"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <Edit
                      size={16}
                      className="action-icon"
                      onClick={() => handleEditItem(item)}
                    />
                    <Trash2
                      size={16}
                      className="action-icon"
                      onClick={() => handleDeleteItem(item.id)}
                    />
                    <Eye
                      size={16}
                      className="action-icon"
                      onClick={() => handleViewItem(item)}
                    />
                    {item.status !== "Fresh" && (
                      <Heart
                        size={16}
                        className="action-icon"
                        onClick={() => handleOpenDonationPopup(item)}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredInventory.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center" }}>
                  No items found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!isPopupOpen && <Footer />}

      {showViewPopup && selectedItem && (
        <ViewItemPopup
          item={selectedItem}
          onClose={() => setShowViewPopup(false)}
        />
      )}

      {showEditPopup && selectedItem && (
        <EditItemPopup
          item={selectedItem}
          onClose={() => setShowEditPopup(false)}
          onSave={(updated) => handleUpdateItem(updated)} // ✅ fixed type
        />
      )}

      {showAddPopup && (
        <AddItemPopup
          onClose={() => setShowAddPopup(false)}
          onSave={handleAddItem}
          categories={categories}
        />
      )}

      {showDonationPopup && donationItem && (
        <DonationPopup
          donationItem={donationItem}
          onClose={() => {
            setShowDonationPopup(false);
            setDonationItem(null);
          }}
          onDonationAdded={handleDonationAdded}
        />
      )}

      {showDonationList && (
        <DonationList
          donations={donations}
          onClose={() => setShowDonationList(false)}
        />
      )}
    </div>
  );
};

export default FoodInventory;
