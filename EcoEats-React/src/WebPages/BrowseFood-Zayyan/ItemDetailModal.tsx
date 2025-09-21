import React from "react";
import type { FoodItem } from "./mockData";

type Props = {
  item: FoodItem | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
};

const ItemDetailModal: React.FC<Props> = ({
  item,
  onClose,
  onUpdateStatus,
}) => {
  if (!item) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{item.name}</h2>
        <p>Expiry: {item.expiry}</p>
        <p>Category: {item.category}</p>
        <p>Storage: {item.storage}</p>
        <p>Notes: {item.notes || "None"}</p>
        <p>Quantity: {item.quantity}</p>

        {item.source === "donation" && item.donationDetails && (
          <>
            <h4>Donation Details</h4>
            <p>Location: {item.donationDetails.location}</p>
            <p>Availability: {item.donationDetails.availability}</p>
            <p>Contact: {item.donationDetails.contact}</p>
          </>
        )}

        <div className="actions">
          <button onClick={() => onUpdateStatus(item.id, "used")}>
            Mark as Used
          </button>
          <button onClick={() => onUpdateStatus(item.id, "meal")}>
            Plan for Meal
          </button>
          <button onClick={() => onUpdateStatus(item.id, "donation")}>
            Flag for Donation
          </button>
        </div>

        <button className="close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default ItemDetailModal;
