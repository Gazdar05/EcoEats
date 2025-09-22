// src/WebPage/BrowseFood/ItemCard.tsx
import React from "react";
import type { FoodItem } from "./mockData";

type Props = {
  item: FoodItem;
  onView: (item: FoodItem) => void;
};

function formatDate(d: string) {
  const dt = new Date(d);
  return dt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const ItemCard: React.FC<Props> = ({ item, onView }) => {
  const isExpired = new Date(item.expiry) < new Date();

  return (
    <div className="card">
      <button
        className="card-eye"
        aria-label={`View ${item.name}`}
        onClick={(e) => {
          e.stopPropagation();
          onView(item);
        }}
      >
        {/* eye SVG */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            fill="currentColor"
            d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7zm0 12a5 5 0 110-10 5 5 0 010 10z"
          />
        </svg>
      </button>

      <div className="card-thumb" aria-hidden="true">
        {/* placeholder square image */}
        <div className="thumb-placeholder" />
      </div>

      <div className="card-body">
        <div className="card-title">{item.name}</div>
        <div className="card-qty">
          {item.quantity} {item.quantity === 1 ? "unit" : "count"}
        </div>
        <div className={`card-expiry ${isExpired ? "expired" : ""}`}>
          {isExpired
            ? `Expired (${formatDate(item.expiry)})`
            : `Expires on ${formatDate(item.expiry)}`}
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
