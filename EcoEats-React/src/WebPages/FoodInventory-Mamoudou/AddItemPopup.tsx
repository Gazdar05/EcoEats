import React, { useState } from "react";
import "./AddItemPopup.css";

interface AddItemPopupProps {
  onClose: () => void;
  onSave: (newItem: Omit<InventoryItem, "id">) => Promise<void>;
  categories: { id: string; name: string }[];
}

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

const AddItemPopup: React.FC<AddItemPopupProps> = ({ onClose, onSave, categories }) => {
  const [formData, setFormData] = useState<Omit<InventoryItem, "id">>({
    name: "",
    category: "",
    quantity: "",
    expiry: "",
    storage: "",
    status: "Fresh",
    notes: "",
    image: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="popup-overlay">
      <div className="popup-container">
        <div className="popup-header">
          <h2>Add New Item</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="popup-form">
          <div className="form-group">
            <label>Name</label>
            <input name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select name="category" value={formData.category} onChange={handleChange} required>
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Quantity</label>
            <input name="quantity" value={formData.quantity} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Expiry Date</label>
            <input type="date" name="expiry" value={formData.expiry} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Storage</label>
            <select name="storage" value={formData.storage} onChange={handleChange} required>
              <option value="">Select Storage</option>
              <option value="Fridge">Fridge</option>
              <option value="Pantry">Pantry</option>
            </select>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Add any details..." />
          </div>

          <div className="form-group">
            <label>Item Image</label>
            <div className="upload-section">
              {imagePreview ? (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button type="button" onClick={() => setImagePreview(null)}>Remove</button>
                </div>
              ) : (
                <label className="upload-label">
                  Upload Image
                  <input type="file" accept="image/*" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </div>

          <div className="popup-actions">
            <button type="submit" className="btn-primary">Save Item</button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemPopup;