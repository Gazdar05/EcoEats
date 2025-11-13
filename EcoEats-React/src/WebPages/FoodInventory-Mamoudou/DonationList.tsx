import React, { useState } from "react";
import "./DonationList.css";

export interface DonationItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  expiry: string;
  storage: string;
  status: string;
  notes?: string;
  image?: string;
  pickupLocation?: string;
  availability?: string;
}

interface DonationListProps {
  donations: DonationItem[];
  onClose: () => void;
}

const API_BASE = "http://127.0.0.1:8000"; // FastAPI backend

const DonationList: React.FC<DonationListProps> = ({ donations, onClose }) => {
  const [donationList, setDonationList] = useState<DonationItem[]>(donations);

  // Send a donation-deleted notification to backend
  const sendNotification = async (deletedDonation: DonationItem) => {
    try {
      await fetch(`${API_BASE}/notifications/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Donation Deleted",
          message: `The donation "${deletedDonation.name}" has been deleted.`,
          type: "donation",
          link: deletedDonation.id,
          show_action: false, // No action button
        }),
      });
    } catch (err) {
      console.error("Failed to send notification:", err);
    }
  };

  // Delete donation from backend and update UI
  const handleDelete = async (id: string) => {
    const donationToDelete = donationList.find((d) => d.id === id);
    if (!donationToDelete) return;

    if (!window.confirm(`Are you sure you want to delete "${donationToDelete.name}"?`)) return;

    try {
      // Delete from backend
      await fetch(`${API_BASE}/donations/${id}`, {
        method: "DELETE",
      });

      // Send notification
      await sendNotification(donationToDelete);

      // Remove locally
      setDonationList((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Failed to delete donation:", err);
      alert("Failed to delete donation. Please try again.");
    }
  };

  return (
    <div className="donation-list-wrapper">
      <div className="donation-header">
        <h2>Donations</h2>
        <button className="btn-close" onClick={onClose}>
          Close
        </button>
      </div>

      {donationList.length === 0 ? (
        <div className="no-donations">No donations found.</div>
      ) : (
        <div className="donation-table-container" style={{ maxHeight: "500px", overflowY: "auto" }}>
          <table className="donation-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Expiry</th>
                <th>Storage</th>
                <th>Status</th>
                <th>Pickup Location</th>
                <th>Availability</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {donationList.map((d) => (
                <tr key={d.id} className="donation-row">
                  <td>{d.image ? <img src={d.image} alt={d.name} className="donation-img" /> : "No Image"}</td>
                  <td>{d.name}</td>
                  <td>{d.category}</td>
                  <td>{d.quantity}</td>
                  <td>{d.expiry}</td>
                  <td>{d.storage}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        d.status === "Expired"
                          ? "status-expired"
                          : d.status === "Expiring Soon"
                          ? "status-expiring"
                          : "status-fresh"
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td>{d.pickupLocation || "-"}</td>
                  <td>{d.availability || "-"}</td>
                  <td>
                    <button className="btn-delete" onClick={() => handleDelete(d.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DonationList;