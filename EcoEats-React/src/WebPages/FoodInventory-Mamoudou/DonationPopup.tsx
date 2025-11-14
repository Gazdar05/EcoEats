import React, { useEffect, useState } from "react";
import "./DonationPopup.css";

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

interface DonationPopupProps {
  donationItem: InventoryItem | null;
  onClose: () => void;
  onDonationAdded?: (newDonationId: string) => void;
}

const API_BASE = "http://127.0.0.1:8000";

const DonationPopup: React.FC<DonationPopupProps> = ({
  donationItem,
  onClose,
  onDonationAdded,
}) => {
  const [pickupLocation, setPickupLocation] = useState("");
  const [donationDate, setDonationDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.classList.add("popup-open");
    return () => document.body.classList.remove("popup-open");
  }, []);

  if (!donationItem) return null;

  const handleSubmitDonation = async () => {
    if (!pickupLocation.trim()) {
      alert("Please enter a pickup location.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/donations/${donationItem.id}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupDate: donationDate,
          pickupLocation,
        }),
      });

      if (!res.ok) {
        let message = "Failed to create donation";
        try {
          const err = await res.json();
          if (err?.detail) message = err.detail;
        } catch {
          // ignore parse error
        }
        alert(message);
        setLoading(false);
        return;
      }

      const createdDonation = await res.json();
      const newId = String(createdDonation.id ?? createdDonation._id ?? "");
      if (onDonationAdded) onDonationAdded(newId);

      alert(`"${donationItem.name}" has been successfully converted to a donation.`);
      onClose();
    } catch (err) {
      console.error("Donation creation failed:", err);
      alert("Something went wrong while creating the donation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content donation-popup">
        <h2>Donate Item</h2>

        <div className="donation-item-summary">
          <img
            src={donationItem.image || "/placeholder.png"}
            alt={donationItem.name}
            className="donation-item-image"
          />
          <div className="donation-item-info">
            <h3>{donationItem.name}</h3>
            <p>
              Category: <strong>{donationItem.category}</strong>
            </p>
            <p>
              Quantity: <strong>{donationItem.quantity}</strong>
            </p>
            <p>
              Expiry: <strong>{donationItem.expiry}</strong>
            </p>
            <p>
              Storage: <strong>{donationItem.storage}</strong>
            </p>
          </div>
        </div>

        <label>Pickup Location</label>
        <input
          type="text"
          placeholder="Enter pickup location"
          value={pickupLocation}
          onChange={(e) => setPickupLocation(e.target.value)}
          className="pickup-input"
          required
        />

        <label>Donation Date</label>
        <input
          type="date"
          value={donationDate}
          onChange={(e) => setDonationDate(e.target.value)}
          className="donation-date-input"
          required
        />

        <div className="popup-buttons">
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="donate-btn"
            onClick={handleSubmitDonation}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Confirm Donation"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DonationPopup;