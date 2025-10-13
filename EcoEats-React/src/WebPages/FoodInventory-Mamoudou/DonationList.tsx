// src/pages/Inventory/DonationList.tsx
import React, { useEffect } from "react";
import "./DonationList.css";

export interface DonationItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  expiry: string;
  storage: string;
  status: string;
  pickupLocation?: string;
  pickupDate?: string;
  availability?: string;
}

interface DonationListProps {
  donations: DonationItem[];
  onClose: () => void;
}

const DonationList: React.FC<DonationListProps> = ({ donations, onClose }) => {
  useEffect(() => {
    document.body.classList.add("popup-open");
    return () => document.body.classList.remove("popup-open");
  }, []);

  return (
    <div className="donation-list-overlay" onClick={onClose}>
      <div className="donation-list-container" onClick={(e) => e.stopPropagation()}>
        <div className="donation-list-header">
          <h2>Donation List</h2>
          <button className="close-donation-list" onClick={onClose}>✕</button>
        </div>

        {donations.length === 0 ? (
          <p className="no-donations">No donations available.</p>
        ) : (
          <table className="donation-list-table">
            <thead>
              <tr>
                <th>ID</th><th>Item Name</th><th>Category</th><th>Quantity</th><th>Expiry</th>
                <th>Storage</th><th>Status</th><th>Pickup Location</th><th>Pickup Date</th><th>Availability</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((donation) => (
                <tr key={donation.id}>
                  <td>{donation.id}</td>
                  <td>{donation.name}</td>
                  <td>{donation.category}</td>
                  <td>{donation.quantity}</td>
                  <td>{donation.expiry}</td>
                  <td>{donation.storage}</td>
                  <td><span className={`status ${donation.status === "Expired" ? "expired" : donation.status === "Expiring Soon" ? "expiring" : "fresh"}`}>{donation.status}</span></td>
                  <td>{donation.pickupLocation || "—"}</td>
                  <td>{donation.pickupDate || "—"}</td>
                  <td>{donation.availability || "Available"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="donation-list-actions">
          <button className="close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default DonationList;