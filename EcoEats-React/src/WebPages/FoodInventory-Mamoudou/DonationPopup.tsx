import React, { useState, useEffect } from "react";
import "./DonationPopup.css";

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

interface DonationPopupProps {
  donationItem: InventoryItem | null;
  onClose: () => void;
  onDonationAdded?: (newDonationId: number) => void;
}

const API_BASE = "http://127.0.0.1:8000";

const DonationPopup: React.FC<DonationPopupProps> = ({ donationItem, onClose, onDonationAdded }) => {
  const [pickupLocation, setPickupLocation] = useState("Main Storage");
  const [availability, setAvailability] = useState("Available");
  const [donationDate, setDonationDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.classList.add("popup-open");
    return () => document.body.classList.remove("popup-open");
  }, []);

  if (!donationItem) return null;

  const handleSubmitDonation = async () => {
    setLoading(true);

    // Validate quantity
    const quantityNum = parseInt(donationItem.quantity, 10);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      alert("Invalid quantity. Cannot convert to donation.");
      setLoading(false);
      return;
    }

    // Construct payload with all required fields and type-safe values
    const payload = {
      name: donationItem.name || "Unnamed",
      category: donationItem.category || "Other",
      quantity: quantityNum,
      expiry: donationItem.expiry || new Date().toISOString().slice(0, 10),
      storage: donationItem.storage || "Unknown",
      status: donationItem.status || "Fresh",
      pickupLocation: pickupLocation || "Main Storage",
      availability: availability || "Available",
      donationDate: donationDate || new Date().toISOString().slice(0, 10),
      notes: donationItem.notes || "",
      image: donationItem.image || "",
    };

    try {
      const res = await fetch(`${API_BASE}/donations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Try to get backend message
        let message = "Failed to create donation";
        try {
          const errorData = await res.json();
          if (errorData?.message) message = errorData.message;
        } catch {
          console.error("Non-JSON backend error");
        }
        console.error("Donation creation error:", message);
        alert(message);
        return; // exit early
      }

      const createdDonation = await res.json();

      if (!createdDonation?.id) {
        alert("Donation created but no ID returned. Please check backend.");
        return;
      }

      if (onDonationAdded) onDonationAdded(Number(createdDonation.id));

      // Delete from inventory safely
      await fetch(`${API_BASE}/inventory/${donationItem.id}`, { method: "DELETE" });

      alert(`"${donationItem.name}" has been successfully converted to a donation.`);
      onClose();
    } catch (err: any) {
      console.error("Unexpected donation error:", err);
      alert(err?.message || "An unexpected error occurred while creating donation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="donation-popup-backdrop">
      <div className="donation-popup">
        <h2>Convert to Donation</h2>
        <div className="donation-field">
          <label>Name</label>
          <input type="text" value={donationItem.name} disabled />
        </div>
        <div className="donation-field">
          <label>Category</label>
          <input type="text" value={donationItem.category} disabled />
        </div>
        <div className="donation-field">
          <label>Quantity</label>
          <input type="text" value={donationItem.quantity} disabled />
        </div>
        <div className="donation-field">
          <label>Expiry</label>
          <input type="text" value={donationItem.expiry} disabled />
        </div>
        <div className="donation-field">
          <label>Storage</label>
          <input type="text" value={donationItem.storage} disabled />
        </div>
        <div className="donation-field">
          <label>Pickup Location</label>
          <input type="text" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} />
        </div>
        <div className="donation-field">
          <label>Availability</label>
          <select value={availability} onChange={(e) => setAvailability(e.target.value)}>
            <option value="Available">Available</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
        <div className="donation-field">
          <label>Donation Date</label>
          <input type="date" value={donationDate} onChange={(e) => setDonationDate(e.target.value)} />
        </div>
        <div className="donation-actions">
          <button className="btn-submit" onClick={handleSubmitDonation} disabled={loading}>
            {loading ? "Submitting..." : "Convert to Donation"}
          </button>
          <button className="btn-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DonationPopup;