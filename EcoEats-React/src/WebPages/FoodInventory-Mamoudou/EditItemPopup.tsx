import React, { useState } from "react";
import "./EditItemPopup.css";

interface EditItemPopupProps {
  item: any;
  onClose: () => void;
  onSave: (updatedItem: any) => void;
}

const EditItemPopup: React.FC<EditItemPopupProps> = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState(item);
  const [imagePreview, setImagePreview] = useState<string | null>(item.image || null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Ensures preview shows immediately after upload
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

  const handleRemoveImage = () => {
    setImagePreview(null);
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

          <div className="edit-form-group">
            <label>Category</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            />
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

          {/* ✅ Updated image upload section */}
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