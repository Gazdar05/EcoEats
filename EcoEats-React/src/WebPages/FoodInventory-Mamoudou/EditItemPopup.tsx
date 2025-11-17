import React, { useState } from "react";
import "./EditItemPopup.css";

interface InventoryItem {
  id: string;
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
  onSave: (updatedItem: Omit<InventoryItem, "status">) => Promise<void>; // ✅ now async
}

const EditItemPopup: React.FC<EditItemPopupProps> = ({
  item,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: item.name,
    category: item.category || "",
    quantity: item.quantity,
    expiry: item.expiry,
    storage: item.storage || "",
    notes: item.notes || "",
  });

  const [imagePreview, setImagePreview] = useState<string>(item.image || "");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => setImagePreview("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedItem = {
        ...item,
        ...formData,
        image: imagePreview || item.image || "",
      };
      await onSave(updatedItem); // ✅ wait for backend save
      onClose(); // close popup after save
    } catch (err) {
      console.error("Failed to save item:", err);
      alert("Failed to save item. Try again.");
    } finally {
      setLoading(false);
    }
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
            <button
              type="submit"
              className="edit-save-btn"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              className="edit-cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItemPopup;