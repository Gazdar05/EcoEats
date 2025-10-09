// C:\GitHub\EcoEats\EcoEats-React\src\WebPages\FoodInventory-Mamoudou\ViewItemPopup.tsx
import React, { useEffect } from "react";
import "./ViewItemPopup.css";

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

interface ViewItemPopupProps {
  item: InventoryItem;
  onClose: () => void;
}

const ViewItemPopup: React.FC<ViewItemPopupProps> = ({ item, onClose }) => {
  useEffect(() => {
    document.body.classList.add("no-chrome");
    return () => {
      document.body.classList.remove("no-chrome");
    };
  }, []);
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="view-popup-overlay" onClick={handleOverlayClick}>
      <div className="view-popup-container">
        <div className="view-popup-header">
          <h1 className="view-popup-title">
            {item.name}
            <button className="view-popup-close" onClick={onClose}>✕</button>
          </h1>
        </div>

        <div className="view-popup-content">
          <div className="view-image-placeholder">
            {item.image ? <img src={item.image} alt={item.name} /> : "✕"}
          </div>
          
          <div className="view-item-details">
            <div className="view-detail-item">
              <span className="view-detail-icon icon-cutlery"></span>
              <span className="view-detail-text">{item.category}</span>
            </div>
            
            <div className="view-detail-item">
              <span className="view-detail-icon icon-calendar"></span>
              <span className={`view-detail-text ${item.status === 'Expired' || item.status === 'Expiring Soon' ? 'expiry-warning' : ''}`}>
                {new Date(item.expiry).toLocaleDateString()} ({item.status})
              </span>
            </div>
            
            <div className="view-detail-item">
              <span className="view-detail-icon icon-box"></span>
              <span className="view-detail-text">{item.quantity}</span>
            </div>
            
            <div className="view-detail-item">
              <span className="view-detail-icon icon-fridge"></span>
              <span className="view-detail-text">{item.storage}</span>
            </div>
            
            {item.notes && (
              <div className="view-detail-item">
                <span className="view-detail-icon icon-notes"></span>
                <span className="view-detail-text">{item.notes}</span>
              </div>
            )}
          </div>
        </div>

        <div className="view-donation-section">
          <h3 className="view-donation-title">Donation Details</h3>
          
          <div className="view-item-details">
            <div className="view-detail-item">
              <span className="view-detail-icon icon-location"></span>
              <span className="view-detail-text">Damansara</span>
            </div>
            
            <div className="view-detail-item">
              <span className="view-detail-icon icon-clock"></span>
              <span className="view-detail-text">Weekdays 9 AM - 5 PM</span>
            </div>
            
            <div className="view-detail-item">
              <span className="view-detail-icon icon-email"></span>
              <span className="view-detail-text">Email: donate@localfood.org</span>
            </div>
          </div>
        </div>

        <div className="view-popup-footer">
          <button className="view-action-btn secondary">Plan for Meal</button>
          <button className="view-action-btn secondary">Edit Donation</button>
          <button className="view-action-btn primary">Mark as Used</button>
        </div>
      </div>
    </div>
  );
};

export default ViewItemPopup;