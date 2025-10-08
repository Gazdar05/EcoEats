import React, { useState, useEffect } from "react";
import "./FoodInventory.css";
import { Plus, Filter, Search, Edit, Trash2, Eye } from "lucide-react";
import ViewItemPopup from "./ViewItemPopup";
import EditItemPopup from "./EditItemPopup";
import AddItemPopup from "./AddItemPopup";

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
    storage: ""
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

  // Function to calculate status based on expiry date
  const calculateStatus = (expiryDate: string): string => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return "Expired";
    } else if (diffDays <= 3) {
      return "Expiring Soon";
    } else {
      return "Fresh";
    }
  };

  // Initialize with mock data
  const loadInventory = async () => {
    const sample: InventoryItem[] = [
      {
        id: 1,
        name: "Organic Apples",
        category: "Produce",
        quantity: "4 pcs",
        expiry: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        storage: "Fridge",
        status: "",
        notes: "Crisp and sweet",
      },
      {
        id: 2,
        name: "Milk",
        category: "Dairy",
        quantity: "1 L",
        expiry: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        storage: "Fridge",
        status: "",
        notes: "Low fat",
      },
      {
        id: 3,
        name: "Fresh carrots",
        category: "Fruit",
        quantity: "5 pcs",
        expiry: "2025-09-10",
        storage: "Fridge",
        status: "",
        notes: "Organic and crunchy",
      },
      {
        id: 4,
        name: "Whole Wheat Bread",
        category: "Bakery",
        quantity: "1 loaf",
        expiry: "2025-09-13",
        storage: "Pantry",
        status: "",
        notes: "Freshly baked",
      },
      {
        id: 5,
        name: "Spinach",
        category: "Vegetables",
        quantity: "200 g",
        expiry: "2025-09-05",
        storage: "Fridge",
        status: "",
        notes: "Organic and fresh",
      },
      {
        id: 6,
        name: "Cheddar Cheese",
        category: "Dairy",
        quantity: "250 g",
        expiry: "2025-10-01",
        storage: "Fridge",
        status: "",
        notes: "Aged and sharp",
      },
      {
        id: 7,
        name: "Spagehetti Pasta",
        category: "Dry Goods",
        quantity: "500 g",
        expiry: "2025-10-05",
        storage: "Pantry",
        status: "",
        notes: "Whole grain",
      },

    ];

    // ✅ Now it actually loads data
    setInventory(sample);
  };

  // Load data on component mount
  useEffect(() => {
    loadInventory();
  }, []);

  // Function to get inventory items with dynamically calculated status
  const getInventoryWithStatus = (items: InventoryItem[]): InventoryItem[] => {
    return items.map(item => ({
      ...item,
      status: calculateStatus(item.expiry)
    }));
  };

  // Get inventory with dynamically calculated status
  const inventoryWithStatus = getInventoryWithStatus(inventory);

  // Search and filter logic
  const filteredInventory = inventoryWithStatus.filter(item => {
    // Search filter
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.quantity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.storage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    // Category filter
    const matchesCategory = !filters.category || item.category === filters.category;
    
    // Status filter
    const matchesStatus = !filters.status || item.status === filters.status;
    
    // Storage filter
    const matchesStorage = !filters.storage || item.storage === filters.storage;

    return matchesSearch && matchesCategory && matchesStatus && matchesStorage;
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filterType: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      status: "",
      storage: ""
    });
  };

  const toggleFilterDropdown = () => {
    setShowFilterDropdown(!showFilterDropdown);
  };

  // Handler functions
  const handleViewItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowViewPopup(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowEditPopup(true);
  };

  const handleDeleteItem = async (itemId: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setInventory(prev => prev.filter(i => i.id !== itemId));
    }
  };

  const handleAddItem = async (newItem: Omit<InventoryItem, 'id'>) => {
    setInventory(prev => {
      const nextId = (prev.reduce((max, i) => Math.max(max, i.id), 0) || 0) + 1;
      return [...prev, { id: nextId, ...newItem }];
    });
    setShowAddPopup(false);
  };

  const handleUpdateItem = async (updatedItem: InventoryItem) => {
    setInventory(prev => prev.map(i => (i.id === updatedItem.id ? updatedItem : i)));
    setShowEditPopup(false);
    setSelectedItem(null);
  };

  const closePopups = () => {
    setShowViewPopup(false);
    setShowEditPopup(false);
    setShowAddPopup(false);
    setSelectedItem(null);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePopups();
        setShowFilterDropdown(false);
      }
    };

    if (showViewPopup || showEditPopup || showAddPopup) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showViewPopup, showEditPopup, showAddPopup]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (showFilterDropdown && !target.closest('.filter-container')) {
        setShowFilterDropdown(false);
      }
    };

    if (showFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFilterDropdown]);

  return (
    <div className="inventory-container">
      <h1 className="inventory-title">Inventory</h1>

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
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
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
                    onChange={(e) => handleFilterChange('status', e.target.value)}
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
                    onChange={(e) => handleFilterChange('storage', e.target.value)}
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
          {filteredInventory.map((item, index) => (
            <tr key={index}>
              <td className="item-name">{item.name}</td>
              <td>{item.category}</td>
              <td>{item.quantity}</td>
              <td className={item.status === "Expired" ? "expired-date" : undefined}>
                {item.expiry}
              </td>
              <td>{item.storage}</td>
              <td>
                {item.status === "Expired" ? (
                  <span className="status expired">Expired</span>
                ) : item.status === "Expiring Soon" ? (
                  <span className="status expiring">Expiring Soon</span>
                ) : (
                  <span className="status fresh">Fresh</span>
                )}
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