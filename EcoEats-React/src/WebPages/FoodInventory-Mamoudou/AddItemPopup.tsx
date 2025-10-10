import React, { useState } from "react";
import "./AddItemPopup.css";

interface AddItemPopupProps {
  onClose: () => void;
  onSave: (item: {
    name: string;
    category: string;
    quantity: string;
    expiry: string;
    storage: string;
    notes?: string;
    image?: string;
  }) => void;
  categories?: { id: string; name: string }[]; // ✅ made optional
}

const AddItemPopup: React.FC<AddItemPopupProps> = ({ onClose, onSave, categories = [] }) => {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    quantity: "",
    expiry: "",
    storage: "",
    notes: "",
    image: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () =>
        setFormData({ ...formData, image: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content add-item-popup">
        <h2>Add New Item</h2>
        <form onSubmit={handleSubmit} className="popup-form">
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label>Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          <label>Quantity</label>
          <input
            type="text"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
          />

          <label>Expiry Date</label>
          <input
            type="date"
            name="expiry"
            value={formData.expiry}
            onChange={handleChange}
            required
          />

          <label>Storage</label>
          <select
            name="storage"
            value={formData.storage}
            onChange={handleChange}
            required
          >
            <option value="">Select Storage</option>
            <option value="Fridge">Fridge</option>
            <option value="Pantry">Pantry</option>
          </select>

          <label>Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
          />

          <label>Image</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} />

          {formData.image && (
            <div className="image-preview">
              <img src={formData.image} alt="Preview" />
            </div>
          )}

          <div className="popup-buttons">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              Save Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemPopup;
