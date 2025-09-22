// src/WebPage/BrowseFood/ItemDetailModal.tsx
import React, { useState } from "react";
import type { FoodItem } from "./mockData";

type Props = {
  item: FoodItem | null;
  onClose: () => void;
  onMarkUsed: (id: string) => void;
  onPlanMeal: (id: string) => void;
  onFlagDonation: (
    id: string,
    details: { location: string; availability: string; contact: string }
  ) => void;
};

function formatDate(d: string) {
  const dt = new Date(d);
  return dt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const ItemDetailModal: React.FC<Props> = ({
  item,
  onClose,
  onMarkUsed,
  onPlanMeal,
  onFlagDonation,
}) => {
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");

  if (!item) return null;

  const handleDonateSubmit = () => {
    setError("");
    if (!location.trim() || !availability.trim() || !contact.trim()) {
      setError("Please complete all fields for donation.");
      return;
    }
    onFlagDonation(item.id, { location, availability, contact });
    setShowDonationForm(false);
  };

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <h3>{item.name}</h3>
          <button className="close-x" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="detail-body">
          <p>
            <strong>Expiry:</strong> {formatDate(item.expiry)}
          </p>
          <p>
            <strong>Category:</strong> {item.category}
          </p>
          <p>
            <strong>Storage:</strong> {item.storage}
          </p>
          <p>
            <strong>Notes:</strong> {item.notes || "—"}
          </p>
          <p>
            <strong>Quantity:</strong> {item.quantity}
          </p>

          {item.source === "donation" && item.donationDetails && (
            <>
              <h4>Donation Info</h4>
              <p>
                <strong>Location:</strong> {item.donationDetails.location}
              </p>
              <p>
                <strong>Availability:</strong>{" "}
                {item.donationDetails.availability}
              </p>
              <p>
                <strong>Contact:</strong> {item.donationDetails.contact}
              </p>
            </>
          )}
        </div>

        <div className="detail-actions">
          <button onClick={() => onMarkUsed(item.id)}>Mark as Used</button>
          <button onClick={() => onPlanMeal(item.id)}>Plan for Meal</button>
          <button onClick={() => setShowDonationForm((s) => !s)}>
            Flag for Donation
          </button>
        </div>

        {showDonationForm && (
          <div className="donation-form">
            <h4>Donation Details</h4>
            <input
              placeholder="Pickup location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <input
              placeholder="Availability (e.g. Weekdays 9-5)"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            />
            <input
              placeholder="Contact phone/email"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
            {error && <div className="donation-error">{error}</div>}
            <div className="donation-actions">
              <button onClick={handleDonateSubmit}>Confirm Donation</button>
              <button
                className="fp-clear"
                onClick={() => {
                  setShowDonationForm(false);
                  setError("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemDetailModal;
