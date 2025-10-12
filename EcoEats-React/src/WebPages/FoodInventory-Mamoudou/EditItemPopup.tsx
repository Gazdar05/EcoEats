import React, { useState } from "react";
import "./EditItemPopup.css";

interface EditItemPopupProps {
  item: any;
  onClose: () => void;
  onSave: (updatedItem: any) => void;
}

const EditItemPopup: React.FC<EditItemPopupProps> = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    ...item,
    category: item.category || "",
    storage: item.storage || "",
  });

  const [imagePreview, setImagePreview] = useState<string>(
    item.image ? String(item.image) : ""
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // ✅ Add explicit type for prev
    setFormData((prev: typeof formData) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(typeof reader.result === "string" ? reader.result : "");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedItem = {
      ...formData,
      image: imagePreview || "",
    };
    onSave(updatedItem);
  };

  return (
    <div className="edit-popup-overlay">
      <div className="edit-popup-container">
        <h2>Edit Item</h2>
        <form onSubmit={handleSubmit}>
          <div className="edit-form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* ✅ Category dropdown */}
          <div className="edit-form-group">
            <label>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select category</option>
              <option value="Produce">Produce</option>
              <option value="Fruit">Fruit</option>
              <option value="Vegetable">Vegetable</option>
              <option value="Dairy">Dairy</option>
              <option value="Bakery">Bakery</option>
              <option value="Meat">Meat</option>
              <option value="Seafood">Seafood</option>
              <option value="Dry Goods">Dry Goods</option>
              <option value="Frozen">Frozen</option>
            </select>
          </div>

          <div className="edit-form-group">
            <label>Quantity</label>
            <input
              type="text"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
            />
          </div>

          <div className="edit-form-group">
            <label>Expiry Date</label>
            <input
              type="date"
              name="expiry"
              value={formData.expiry}
              onChange={handleChange}
              required
            />
          </div>

          {/* ✅ Storage dropdown */}
          <div className="edit-form-group">
            <label>Storage</label>
            <select
              name="storage"
              value={formData.storage}
              onChange={handleChange}
              required
            >
              <option value="">Select storage</option>
              <option value="Fridge">Fridge</option>
              <option value="Freezer">Freezer</option>
              <option value="Pantry">Pantry</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Image upload section */}
          <div className="edit-form-group">
            <label>Item Image</label>
            <div className="edit-image-section">
              {imagePreview ? (
                <div className="edit-image-container">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="edit-image-preview"
                  />
                  <div className="edit-image-actions">
                    <label className="edit-image-btn">
                      Change Photo
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleImageUpload}
                      />
                    </label>
                    <button
                      type="button"
                      className="edit-remove-btn"
                      onClick={handleRemoveImage}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="edit-image-btn">
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="edit-popup-actions">
            <button type="submit" className="edit-save-btn">
              Save Changes
            </button>
            <button type="button" className="edit-cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItemPopup;