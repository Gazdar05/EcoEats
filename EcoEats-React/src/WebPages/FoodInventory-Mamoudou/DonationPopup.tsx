// src/pages/Inventory/DonationPopup.tsx
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

const DonationPopup: React.FC<DonationPopupProps> = ({ donationItem, onClose, onDonationAdded }) => {
  const [pickupLocation, setPickupLocation] = useState("Main Storage");
  const [donationDate, setDonationDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.classList.add("popup-open");
    return () => document.body.classList.remove("popup-open");
  }, []);

  if (!donationItem) return null;

  const handleSubmitDonation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/donations/${donationItem.id}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickupDate: donationDate, pickupLocation }),
      });

      if (!res.ok) {
        let message = "Failed to create donation";
        try {
          const err = await res.json();
          if (err?.detail) message = err.detail;
        } catch {}
        alert(message);
        setLoading(false);
        return;
      }

      const createdDonation = await res.json();
      const newId = String(createdDonation.id ?? createdDonation._id ?? "");
      if (onDonationAdded) onDonationAdded(newId);
      alert(`"${donationItem.name}" has been converted to a donation.`);
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "An unexpected error occurred while creating donation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="donation-popup-backdrop">
      <div className="donation-popup">
        <h2>Convert to Donation</h2>
        <div className="donation-field"><label>Name</label><input type="text" value={donationItem.name} disabled /></div>
        <div className="donation-field"><label>Category</label><input type="text" value={donationItem.category} disabled /></div>
        <div className="donation-field"><label>Quantity</label><input type="text" value={donationItem.quantity} disabled /></div>
        <div className="donation-field"><label>Expiry</label><input type="text" value={donationItem.expiry} disabled /></div>
        <div className="donation-field"><label>Storage</label><input type="text" value={donationItem.storage} disabled /></div>
        <div className="donation-field"><label>Pickup Location</label><input type="text" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} /></div>
        <div className="donation-field"><label>Donation Date</label><input type="date" value={donationDate} onChange={(e) => setDonationDate(e.target.value)} /></div>

        <div className="donation-actions">
          <button className="btn-submit" onClick={handleSubmitDonation} disabled={loading}>{loading ? "Submitting..." : "Convert to Donation"}</button>
          <button className="btn-cancel" onClick={onClose} disabled={loading}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default DonationPopup;