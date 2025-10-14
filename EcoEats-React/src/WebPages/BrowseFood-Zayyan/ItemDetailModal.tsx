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
  onRemoveDonation: (id: string) => void;
  onMarkDonated: (id: string) => void;
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
  onRemoveDonation,
  onMarkDonated,
}) => {
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");

  // ✅ confirmation modal state
  const [confirmAction, setConfirmAction] = useState<{
    type: "used" | "remove" | "donated" | null;
    id?: string;
  }>({ type: null });

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
      <div className="detail-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="detail-header">
          <h3>{item.name}</h3>
          <button className="close-x" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="detail-content">
          {/* Left = image */}
          <div className="detail-thumb">
            {item.image ? (
              <img src={item.image} alt={item.name} className="detail-image" />
            ) : (
              <div className="thumb-placeholder-lg" />
            )}
          </div>

          {/* Right = info */}
          <div className="detail-info">
            <p>📅 Expiry: {formatDate(item.expiry)}</p>
            <p>🍴 Category: {item.category}</p>
            <p>📦 Storage: {item.storage}</p>
            <p>📝 Notes: {item.notes || "—"}</p>
            <p>🔢 Quantity: {item.quantity}</p>

            {/* Donation info section */}
            {item.source === "donation" && item.donationDetails && (
              <div className="donation-details">
                <h4>Donation Info</h4>
                <p>📍 Location: {item.donationDetails.location}</p>
                <p>⏰ Availability: {item.donationDetails.availability}</p>
                <p>📞 Contact: {item.donationDetails.contact}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="detail-actions">
          {item.donated ? (
            <div className="donated-status">
              <p className="text-green-700 font-semibold">
                ✅ This item has been donated
              </p>
            </div>
          ) : (
            <>
              {item.source === "inventory" ? (
                <>
                  <button
                    onClick={() =>
                      setConfirmAction({ type: "used", id: item.id })
                    }
                  >
                    Mark as Used
                  </button>
                  <button onClick={() => onPlanMeal(item.id)}>
                    Plan for Meal
                  </button>
                  <button onClick={() => setShowDonationForm((s) => !s)}>
                    Flag for Donation
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() =>
                      setConfirmAction({ type: "remove", id: item.id })
                    }
                  >
                    Remove from Donation
                  </button>
                  <button onClick={() => setShowDonationForm((s) => !s)}>
                    Edit Donation Details
                  </button>
                  <button
                    onClick={() =>
                      setConfirmAction({ type: "donated", id: item.id })
                    }
                  >
                    Mark as Donated
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Donation form */}
        {showDonationForm && (
          <div className="donation-form">
            <h4>
              {item.source === "donation" ? "Edit" : "Add"} Donation Details
            </h4>
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
              <button onClick={handleDonateSubmit}>
                {item.source === "donation"
                  ? "Save Changes"
                  : "Confirm Donation"}
              </button>
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

      {/* ✅ Confirmation Modal */}
      {confirmAction.type && (
        <div
          className="confirm-overlay"
          onClick={() => setConfirmAction({ type: null })}
        >
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <p>
              {confirmAction.type === "used" &&
                "Are you sure you want to mark this item as used?"}
              {confirmAction.type === "remove" &&
                "Are you sure you want to remove this item from donations?"}
              {confirmAction.type === "donated" &&
                "Are you sure you want to mark this item as donated?"}
            </p>
            <div className="confirm-actions">
              <button
                className="confirm-yes"
                onClick={() => {
                  if (confirmAction.type === "used" && confirmAction.id)
                    onMarkUsed(confirmAction.id);
                  if (confirmAction.type === "remove" && confirmAction.id)
                    onRemoveDonation(confirmAction.id);
                  if (confirmAction.type === "donated" && confirmAction.id)
                    onMarkDonated(confirmAction.id);
                  setConfirmAction({ type: null });
                }}
              >
                Confirm
              </button>
              <button
                className="confirm-no"
                onClick={() => setConfirmAction({ type: null })}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetailModal;
