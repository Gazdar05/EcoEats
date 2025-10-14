// src/pages/Inventory/ViewItemPopup.tsx
import React from "react";
import "./ViewItemPopup.css";

interface ViewItemPopupProps {
  item: {
    id: string;
    name: string;
    category: string;
    quantity: string;
    expiry: string;
    storage: string;
    status: string;
    notes?: string;
    image?: string;
  };
  onClose: () => void;
}

const ViewItemPopup: React.FC<ViewItemPopupProps> = ({ item, onClose }) => {
  return (
    <div className="view-overlay">
      <div className="view-container">
        <div className="view-header">
          <h2>{item.name}</h2>
          <button className="view-close-icon" onClick={onClose}>✕</button>
        </div>

        <div className="view-image-box">
          {item.image ? <img src={item.image} alt={item.name} /> : <div className="no-image">No Image Available</div>}
        </div>

        <div className="view-details">
          <div className="view-row"><span className="label">Category:</span><span className="value">{item.category}</span></div>
          <div className="view-row"><span className="label">Quantity:</span><span className="value">{item.quantity}</span></div>
          <div className="view-row"><span className="label">Expiry:</span><span className="value">{item.expiry}</span></div>
          <div className="view-row"><span className="label">Storage:</span><span className="value">{item.storage}</span></div>
          <div className="view-row"><span className="label">Status:</span><span className={`value status ${item.status.toLowerCase().replace(" ", "-")}`}>{item.status}</span></div>
          {item.notes && <div className="view-row"><span className="label">Notes:</span><span className="value">{item.notes}</span></div>}
        </div>

        <div className="view-actions">
          <button className="btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ViewItemPopup;