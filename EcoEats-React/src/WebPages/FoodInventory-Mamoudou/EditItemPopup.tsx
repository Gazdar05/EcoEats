import React, { useEffect, useState } from "react";
import "./EditItemPopup.css";

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

interface EditItemPopupProps {
  item: InventoryItem;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
}

const EditItemPopup: React.FC<EditItemPopupProps> = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    expiry: item.expiry,
    storage: item.storage,
    notes: item.notes || '',
  });

  const [quantity, setQuantity] = useState(parseInt(item.quantity) || 1);

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
      quantity: `${newQuantity} ${item.quantity.split(' ').slice(1).join(' ') || 'pcs'}`
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedItem: InventoryItem = {
      ...item,
      ...formData,
      quantity: `${quantity} ${item.quantity.split(' ').slice(1).join(' ') || 'pcs'}`,
    };
    onSave(updatedItem);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="edit-popup-overlay" onClick={handleOverlayClick}>
      <div className="edit-popup-container">
        <div className="edit-popup-header">
          <h2 className="edit-popup-title">
            Edit Item
            <button className="edit-popup-close" onClick={onClose}>✕</button>
          </h2>
        </div>

        <p className="edit-popup-subtitle">
          Make changes to your inventory item here. Click save when you're done.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="edit-popup-body">
            <div className="edit-form-group">
              <label className="edit-form-label">Item Name</label>
              <input 
                type="text" 
                className="edit-form-input"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="edit-form-group">
              <label className="edit-form-label">Category</label>
              <select 
                className="edit-form-select"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              >
                <option value="Produce">Produce</option>
                <option value="Dairy">Dairy</option>
                <option value="Bakery">Bakery</option>
                <option value="Meat">Meat</option>
                <option value="Seafood">Seafood</option>
                <option value="Dry Goods">Dry Goods</option>
                <option value="Frozen">Frozen</option>
              </select>
            </div>

            <div className="edit-form-group">
              <label className="edit-form-label">Quantity</label>
              <div className="edit-quantity-control">
                <button 
                  type="button"
                  className="edit-quantity-btn"
                  onClick={() => handleQuantityChange(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <span className="edit-quantity-display">{quantity}</span>
                <button 
                  type="button"
                  className="edit-quantity-btn"
                  onClick={() => handleQuantityChange(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <div className="edit-form-group">
              <label className="edit-form-label">Expiry Date</label>
              <input 
                type="date" 
                className="edit-form-input"
                name="expiry"
                value={formData.expiry}
                onChange={handleInputChange}
                required
              />
              <p className="edit-expiry-warning">Expiry date must be in the future.</p>
            </div>

            <div className="edit-form-group">
              <label className="edit-form-label">Storage Location</label>
              <select 
                className="edit-form-select"
                name="storage"
                value={formData.storage}
                onChange={handleInputChange}
              >
                <option value="Fridge">Fridge</option>
                <option value="Pantry">Pantry</option>
                <option value="Freezer">Freezer</option>
              </select>
            </div>

            <div className="edit-form-group">
              <label className="edit-form-label">Notes</label>
              <textarea 
                className="edit-form-textarea"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Add any specific notes about the item..."
              />
            </div>

          <div className="edit-form-group">
            <label className="edit-form-label">Item Image</label>
            <div className="edit-image-section">
              <div className="edit-image-container">
                <div className="edit-image-placeholder">✕</div>
                <div className="edit-image-actions">
                  <button className="edit-image-btn">Change Photo</button>
                  <button className="edit-remove-btn">Remove Photo</button>
                </div>
              </div>
            </div>
          </div>
        </div>

          <div className="edit-popup-footer">
            <button type="button" className="edit-action-btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="edit-action-btn primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItemPopup;