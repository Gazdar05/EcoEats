import React, { useState, useEffect } from "react";
import "./FoodInventory.css";
import { Plus, Filter, Search, Edit, Trash2, Eye, CheckSquare, Heart } from "lucide-react";
import ViewItemPopup from "./ViewItemPopup";
import EditItemPopup from "./EditItemPopup";
import AddItemPopup from "./AddItemPopup";
import DonationPopup from "./DonationPopup";
import type { DonationItem as DonationListItem } from "./DonationList"; // type-only
import DonationList from "./DonationList";
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

interface DonationItem {
  id: number;
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

const API_BASE = "http://127.0.0.1:8000";

const FoodInventory: React.FC = () => {
  const [showViewPopup, setShowViewPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showDonationPopup, setShowDonationPopup] = useState(false);
  const [showDonationList, setShowDonationList] = useState(false);

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [donationItem, setDonationItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filters, setFilters] = useState({ category: "", status: "", storage: "" });

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [donations, setDonations] = useState<DonationItem[]>([]);

  const [categories] = useState<{ id: string; name: string }[]>([
    { id: "produce", name: "Produce" },
    { id: "dairy", name: "Dairy" },
    { id: "bakery", name: "Bakery" },
    { id: "meat", name: "Meat" },
    { id: "seafood", name: "Seafood" },
    { id: "dry", name: "Dry Goods" },
    { id: "frozen", name: "Frozen" },
  ]);

  const calculateStatus = (expiryDate: string): string => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "Expired";
    if (diffDays <= 3) return "Expiring Soon";
    return "Fresh";
  };

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

  const loadDonations = async () => {
    try {
      const res = await fetch(`${API_BASE}/donations`);
      if (!res.ok) throw new Error("Failed to load donations");
      const data = await res.json();
      const normalized: DonationItem[] = data.map((d: any) => ({
        ...d,
        id: Number(d.id),
        expiry: d.expiry || "",
        status: d.status || "Fresh",
        pickupLocation: d.pickupLocation || "",
        availability: d.availability || "Available",
      }));
      setDonations(normalized);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadInventory();
    loadDonations();
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value);
  const handleFilterChange = (filterType: keyof typeof filters, value: string) =>
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  const clearFilters = () => setFilters({ category: "", status: "", storage: "" });
  const toggleFilterDropdown = () => setShowFilterDropdown(!showFilterDropdown);
  const handleViewItem = (item: InventoryItem) => { setSelectedItem(item); setShowViewPopup(true); };
  const handleEditItem = (item: InventoryItem) => { setSelectedItem(item); setShowEditPopup(true); };
  const toggleSelectItem = (id: number) =>
    setSelectedItems((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const handleDeleteItem = async (itemId: number) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await fetch(`${API_BASE}/inventory/${itemId}`, { method: "DELETE" });
      setInventory((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = async (newItem: Omit<InventoryItem, "id" | "status">) => {
    try {
      const res = await fetch(`${API_BASE}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      const created = await res.json();
      setInventory((prev) => [...prev, { ...created, status: calculateStatus(created.expiry) }]);
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
        prev.map((i) => (i.id === saved.id ? { ...saved, status: calculateStatus(saved.expiry) } : i))
      );
      setShowEditPopup(false);
      setSelectedItem(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAsUsed = async () => {
    const updatedInventory = await Promise.all(
      inventory.map(async (item) => {
        if (!selectedItems.includes(item.id)) return item;
        const currentQty = parseInt(item.quantity, 10);
        if (isNaN(currentQty)) return item;

        const newQty = currentQty - 1;
        if (newQty <= 0) {
          await fetch(`${API_BASE}/inventory/${item.id}`, { method: "DELETE" });
          return null;
        } else {
          const updatedItem = { ...item, quantity: newQty.toString() };
          await fetch(`${API_BASE}/inventory/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedItem),
          });
          return updatedItem;
        }
      })
    );
    setInventory(updatedInventory.filter((item): item is InventoryItem => item !== null));
    setSelectedItems([]);
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm("Are you sure you want to delete the selected items?")) return;
    await Promise.all(selectedItems.map((id) => fetch(`${API_BASE}/inventory/${id}`, { method: "DELETE" })));
    setInventory((prev) => prev.filter((item) => !selectedItems.includes(item.id)));
    setSelectedItems([]);
  };

  const isPopupOpen = showViewPopup || showEditPopup || showAddPopup || showDonationPopup || showDonationList;

  return (
    <div className="food-inventory-page">
      {!isPopupOpen && <Navbar />}
      <div className="inventory-container">
        <h1 className="inventory-title">Inventory</h1>

        {/* Controls */}
        <div className="inventory-controls">
          <div className="search-bar">
            <Search size={18} />
            <input type="text" placeholder="Search inventory..." value={searchTerm} onChange={handleSearchChange} />
          </div>
          <div className="control-buttons">
            <button className="btn-add" onClick={() => setShowAddPopup(true)}>
              <Plus size={16} /> Add Item
            </button>

            {/* Open Donations List */}
            <button className="btn-filter" onClick={() => setShowDonationList(true)}>
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
              <button className="btn-filter" onClick={toggleFilterDropdown}>
                <Filter size={16} /> Filter by
              </button>
              {showFilterDropdown && (
                <div className="filter-dropdown">
                  <div className="filter-section">
                    <label>Category</label>
                    <select value={filters.category} onChange={(e) => handleFilterChange("category", e.target.value)}>
                      <option value="">All Categories</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-section">
                    <label>Status</label>
                    <select value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)}>
                      <option value="">All Status</option>
                      <option value="Fresh">Fresh</option>
                      <option value="Expiring Soon">Expiring Soon</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>
                  <div className="filter-section">
                    <label>Storage</label>
                    <select value={filters.storage} onChange={(e) => handleFilterChange("storage", e.target.value)}>
                      <option value="">All Storage</option>
                      <option value="Fridge">Fridge</option>
                      <option value="Pantry">Pantry</option>
                      <option value="Freezer">Freezer</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="filter-actions">
                    <button className="btn-clear" onClick={clearFilters}>Clear Filters</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inventory Table */}
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
                  <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => toggleSelectItem(item.id)} />
                </td>
                <td className="item-name-with-image">
                  {item.image ? <img src={item.image} alt={item.name} className="item-image-thumb" /> : <div className="item-image-placeholder">No Image</div>}
                  <span className="item-name-text">{item.name}</span>
                </td>
                <td>{item.category}</td>
                <td>{item.quantity}</td>
                <td className={item.status === "Expired" ? "expired-date" : ""}>{item.expiry}</td>
                <td>{item.storage}</td>
                <td>
                  <span className={`status ${item.status === "Expired" ? "expired" : item.status === "Expiring Soon" ? "expiring" : "fresh"}`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <Edit size={16} className="action-icon" onClick={() => handleEditItem(item)} />
                    <Trash2 size={16} className="action-icon" onClick={() => handleDeleteItem(item.id)} />
                    <Eye size={16} className="action-icon" onClick={() => handleViewItem(item)} />

                    {item.status !== "Fresh" && (
                      <Heart
                        size={16}
                        className="action-icon"
                        onClick={() => { setDonationItem(item); setShowDonationPopup(true); }}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isPopupOpen && <Footer />}

      {/* Popups */}
      {showViewPopup && selectedItem && <ViewItemPopup item={selectedItem} onClose={() => setShowViewPopup(false)} />}
      {showEditPopup && selectedItem && <EditItemPopup item={selectedItem} onClose={() => setShowEditPopup(false)} onSave={handleUpdateItem} />}
      {showAddPopup && <AddItemPopup onClose={() => setShowAddPopup(false)} onSave={handleAddItem} categories={categories} />}

      {/* UPDATED DonationPopup section */}
      {showDonationPopup && donationItem && (
        <DonationPopup
          donationItem={donationItem}
          onClose={() => { setShowDonationPopup(false); setDonationItem(null); }}
          onDonationAdded={(newDonationId: number) => {
            setDonations((prev) => [
              ...prev,
              {
                ...donationItem,
                id: newDonationId,
                pickupLocation: donationItem.storage,
                availability: "Available",
              } as DonationListItem,
            ]);
            setInventory((prev) => prev.filter((i) => i.id !== donationItem.id));
            setShowDonationPopup(false);
            setDonationItem(null);
          }}
        />
      )}

      {showDonationList && <DonationList donations={donations} onClose={() => setShowDonationList(false)} />}
    </div>
  );
};

export default FoodInventory;