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

      <div style={{ maxHeight: 420, overflow: "auto" }}>
        {inventory.map((it) => (
          <div
            key={it._id ?? it.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 6px",
              borderBottom: "1px solid #f1f1f1",
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{it.name}</div>
              <div style={{ fontSize: "0.85rem", color: "#666" }}>
                {it.quantity} • {it.storage}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  color:
                    new Date(it.expiry || "").getTime() < Date.now()
                      ? "#d60000"
                      : "var(--eco-green)",
                  fontWeight: 600,
                }}
              >
                {formatExpiry(it.expiry)}
              </div>
              {it.reserved && (
                <div style={{ fontSize: "0.8rem", color: "#666" }}>
                  Reserved
                </div>
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
