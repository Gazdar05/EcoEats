import React, { useEffect, useState } from "react";
import "./AddItemPopup.css";

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

interface AddItemPopupProps {
  onClose: () => void;
  onSave: (item: Omit<InventoryItem, 'id'>) => void;
  categories?: { id: string; name: string }[];
}

const AddItemPopup: React.FC<AddItemPopupProps> = ({ onClose, onSave, categories = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Produce',
    quantity: '1 pcs',
    expiry: '',
    storage: 'Fridge',
    notes: '',
  });

  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    document.body.classList.add("no-chrome");
    return () => {
      document.body.classList.remove("no-chrome");
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
    setFormData(prev => ({
      ...prev,
      quantity: `${newQuantity} pcs`
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: Omit<InventoryItem, 'id'> = {
      ...formData,
      quantity: `${quantity} pcs`,
      status: '', // Status will be calculated dynamically in parent component
    };
    onSave(newItem);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="add-popup-overlay" onClick={handleOverlayClick}>
      <div className="add-popup-container">
        <div className="add-popup-header">
          <h2 className="add-popup-title">
            Add New Item
            <button className="add-popup-close" onClick={onClose}>✕</button>
          </h2>
        </div>

        <p className="add-popup-subtitle">
          Add a new food item to your inventory.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="add-popup-body">
            <div className="add-form-group">
              <label className="add-form-label">Item Name</label>
              <input 
                type="text" 
                className="add-form-input"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Organic Apples"
                required
              />
            </div>

            <div className="add-form-group">
              <label className="add-form-label">Category</label>
              <select 
                className="add-form-select"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              >
                {categories.length > 0 ? (
                  categories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Produce">Produce</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Meat">Meat</option>
                    <option value="Seafood">Seafood</option>
                    <option value="Dry Goods">Dry Goods</option>
                    <option value="Frozen">Frozen</option>
                  </>
                )}
              </select>
            </div>

            <div className="add-form-group">
              <label className="add-form-label">Quantity</label>
              <div className="add-quantity-control">
                <button 
                  type="button"
                  className="add-quantity-btn"
                  onClick={() => handleQuantityChange(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <span className="add-quantity-display">{quantity}</span>
                <button 
                  type="button"
                  className="add-quantity-btn"
                  onClick={() => handleQuantityChange(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <div className="add-form-group">
              <label className="add-form-label">Expiry Date</label>
              <input 
                type="date" 
                className="add-form-input"
                name="expiry"
                value={formData.expiry}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="add-form-group">
              <label className="add-form-label">Storage Location</label>
              <select 
                className="add-form-select"
                name="storage"
                value={formData.storage}
                onChange={handleInputChange}
              >
                <option value="Fridge">Fridge</option>
                <option value="Pantry">Pantry</option>
                <option value="Freezer">Freezer</option>
              </select>
            </div>

            <div className="add-form-group">
              <label className="add-form-label">Notes</label>
              <textarea 
                className="add-form-textarea"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Add any specific notes about the item…"
              />
            </div>

          <div className="add-form-group">
            <label className="add-form-label">Image</label>
            <label className="add-upload-area">
              <input type="file" accept="image/*" className="add-upload-input" />
              <span className="add-upload-icon">⬆</span>
              <span className="add-upload-text">Upload Image</span>
            </label>
          </div>
        </div>

          <div className="add-popup-footer">
            <button type="button" className="add-action-btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="add-action-btn primary">
              Save Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemPopup;