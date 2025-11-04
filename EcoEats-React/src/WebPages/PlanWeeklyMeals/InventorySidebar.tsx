// src/WebPage/PlanWeeklyMeals/InventorySidebar.tsx
import React from "react";
import type { InventoryItem } from "./types";

type Props = {
  inventory: InventoryItem[];
  recipes: string[];
};

function formatExpiry(d?: string) {
  if (!d) return "—";
  const dt = new Date(d);
  const today = new Date();
  const diff = Math.ceil(
    (dt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0) return `${Math.abs(diff)} days ago (expired)`;
  if (diff === 0) return "today";
  return `${diff} days`;
}

const InventorySidebar: React.FC<Props> = ({ inventory, recipes }) => {
  return (
    <div className="fp-panel" role="region" aria-label="Inventory sidebar">
      <h3 className="fp-title">Available Inventory</h3>

      <div className="inventory-list">
        {inventory.map((it) => (
          <div key={it._id ?? it.id} className="inventory-item">
            <div className="inventory-item-left">
              <div className="inventory-item-name">{it.name}</div>
              <div className="inventory-item-meta">
                {it.quantity} • {it.storage}
              </div>
            </div>
            <div className="inventory-item-right">
              <div
                className={`inventory-expiry ${
                  new Date(it.expiry || "").getTime() < Date.now()
                    ? "expired"
                    : ""
                }`}
              >
                {formatExpiry(it.expiry)}
              </div>
              {it.reserved && (
                <div className="inventory-reserved">Reserved</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <button className="fp-apply" style={{ width: "100%" }}>
          Explore All Recipes
        </button>
      </div>
    </div>
  );
};

export default InventorySidebar;
