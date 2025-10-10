import React, { useState, useEffect } from "react";
import "./FoodInventory.css";
import { Plus, Filter, Search, Edit, Trash2, Eye } from "lucide-react";
import ViewItemPopup from "./ViewItemPopup";
import EditItemPopup from "./EditItemPopup";
import AddItemPopup from "./AddItemPopup";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: string;
  expiry: string;
  storage: string;
  status: string;
  notes?: string;
  image?: string;
}

const API_BASE = "http://127.0.0.1:8000"; // FastAPI backend URL

const FoodInventory: React.FC = () => {
  const [showViewPopup, setShowViewPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    storage: "",
  });

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [categories] = useState<{ id: string; name: string }[]>([
    { id: "produce", name: "Produce" },
    { id: "dairy", name: "Dairy" },
    { id: "bakery", name: "Bakery" },
    { id: "meat", name: "Meat" },
    { id: "seafood", name: "Seafood" },
    { id: "dry", name: "Dry Goods" },
    { id: "frozen", name: "Frozen" },
  ]);

  // Calculate status
  const calculateStatus = (expiryDate: string): string => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Expired";
    if (diffDays <= 3) return "Expiring Soon";
    return "Fresh";
  };

  // Load inventory
  const loadInventory = async () => {
    try {
      const res = await fetch(`${API_BASE}/inventory`);
      if (!res.ok) throw new Error("Failed to load inventory");
      const data = await res.json();
      const itemsWithStatus = data.map((item: InventoryItem) => ({
        ...item,
        status: calculateStatus(item.expiry),
      }));
      setInventory(itemsWithStatus);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.quantity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.storage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = !filters.category || item.category === filters.category;
    const matchesStatus = !filters.status || item.status === filters.status;
    const matchesStorage = !filters.storage || item.storage === filters.storage;

    return matchesSearch && matchesCategory && matchesStatus && matchesStorage;
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filterType: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  };

  const clearFilters = () => setFilters({ category: "", status: "", storage: "" });
  const toggleFilterDropdown = () => setShowFilterDropdown(!showFilterDropdown);

  const handleViewItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowViewPopup(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowEditPopup(true);
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await fetch(`${API_BASE}/inventory/${itemId}`, { method: "DELETE" });
      setInventory((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = async (newItem: {
    name: string;
    category: string;
    quantity: string;
    expiry: string;
    storage: string;
    notes?: string;
    image?: string;
  }) => {
    try {
      const res = await fetch(`${API_BASE}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      const created = await res.json();
      setInventory((prev) => [
        ...prev,
        { ...created, status: calculateStatus(created.expiry) },
      ]);
      setShowAddPopup(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateItem = async (updatedItem: InventoryItem) => {
    try {
      const res = await fetch(`${API_BASE}/inventory/${updatedItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItem),
      });
      const saved = await res.json();
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

  const closePopups = () => {
    setShowViewPopup(false);
    setShowEditPopup(false);
    setShowAddPopup(false);
    setSelectedItem(null);
  };

  // ✅ Hide navbar/footer if any popup is open
  const isPopupOpen = showViewPopup || showEditPopup || showAddPopup;

  return (
    <div className="food-inventory-page">
      {/* ✅ Navbar only visible if no popup is open */}
      {!isPopupOpen && <Navbar />}

      <div className="inventory-container">
        <h1 className="inventory-title">Inventory</h1>

        {/* Controls */}
        <div className="inventory-controls">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <div className="control-buttons">
            <button className="btn-add" onClick={() => setShowAddPopup(true)}>
              <Plus size={16} /> Add Item
            </button>
            <div className="filter-container">
              <button className="btn-filter" onClick={toggleFilterDropdown}>
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
                      {categories.map((category) => (
                        <option key={category.id} value={category.name}>
                          {category.name}
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

        {/* Table */}
        <table className="inventory-table">
          <thead>
            <tr>
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
                <td className="actions">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ Footer only visible if no popup is open */}
      {!isPopupOpen && <Footer />}

      {/* Popups */}
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
          onSave={handleUpdateItem}
        />
      )}
      {showAddPopup && (
        <AddItemPopup
          onClose={() => setShowAddPopup(false)}
          onSave={handleAddItem}
          categories={categories}
        />
      )}
    </div>
  );
};

export default FoodInventory;