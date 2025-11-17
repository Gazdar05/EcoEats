import React, { useState, useEffect } from "react";
import "./DonationList.css";

export interface DonationItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  storage: string;
  status: string;
  notes?: string;
  image?: string;
  pickupLocation?: string;
}

interface DonationListProps {
  onClose?: () => void; // Optional callback for close button
}

const API_BASE = "http://127.0.0.1:8000";

const DonationList: React.FC<DonationListProps> = ({ onClose }) => {
  const [donationList, setDonationList] = useState<DonationItem[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const loadDonations = async () => {
      try {
        const res = await fetch(`${API_BASE}/donations/`);
        const data = await res.json();
        setDonationList(data);
      } catch (err) {
        console.error("Failed to load donations:", err);
      }
    };

    loadDonations();
  }, []);

  const sendNotification = async (deletedDonation: DonationItem) => {
    try {
      await fetch(`${API_BASE}/notifications/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Donation Deleted",
          message: `The donation "${deletedDonation.name}" has been deleted.`,
          type: "donation",
          link: deletedDonation.id,
          show_action: false,
        }),
      });
    } catch (err) {
      console.error("Failed to send notification:", err);
    }
  };

  const handleDelete = async (id: string) => {
    const donationToDelete = donationList.find((d) => d.id === id);
    if (!donationToDelete) return;

    if (!window.confirm(`Delete "${donationToDelete.name}"?`)) return;

    try {
      await fetch(`${API_BASE}/donations/${id}`, { method: "DELETE" });
      await sendNotification(donationToDelete);
      setDonationList((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Failed to delete donation:", err);
      alert("Failed to delete donation.");
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setIsVisible(false); // Hide locally if no callback provided
    }
  };

  if (!isVisible) return null; // Hide the component

  return (
    <div className="donation-list-wrapper">
      <div className="donation-header">
        <h2>Donations</h2>
        <button className="btn-close" onClick={handleClose}>
          Close
        </button>
      </div>

      {donationList.length === 0 ? (
        <div className="no-donations">No donations found.</div>
      ) : (
        <div
          className="donation-table-container"
          style={{ maxHeight: "500px", overflowY: "auto" }}
        >
          <table className="donation-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Storage</th>
                <th>Status</th>
                <th>Pickup Location</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {donationList.map((d) => (
                <tr key={d.id}>
                  <td>
                    {d.image ? (
                      <img
                        src={d.image}
                        alt={d.name}
                        className="donation-img"
                      />
                    ) : (
                      "No Image"
                    )}
                  </td>
                  <td>{d.name}</td>
                  <td>{d.category}</td>
                  <td>{d.quantity}</td>
                  <td>{d.storage}</td>
                  <td>{d.status}</td>
                  <td>{d.pickupLocation || "-"}</td>
                  <td>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(d.id)}
                    >
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