// src/WebPage/PlanWeeklyMeals/InventorySidebar.tsx
import React from "react";
import type { InventoryItem } from "./types";

type Props = {
  inventory: InventoryItem[];
  weeklyUsage: Record<string, number>; // ✅ added
};

function formatExpiry(d?: string) {
  if (!d) return "—";
  const dt = new Date(d);
  const today = new Date();
  const diff = Math.ceil(
    (dt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diff < 0) return `Expired ${Math.abs(diff)} days ago`;
  if (diff === 0) return `Expires today`;
  return `Expires in ${diff} days`;
}

const InventorySidebar: React.FC<Props> = ({ inventory, weeklyUsage }) => {
  return (
    <div className="fp-panel" role="region" aria-label="Inventory sidebar">
      <h3 className="fp-title">Available Inventory</h3>

      <div className="inventory-list">
        {inventory.map((it) => {
          const id = (it as any)._id ?? (it as any).id;
          const used = weeklyUsage[id] ?? 0;

          return (
            <div key={id} className="inventory-item">
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

                {/* ✅ show used qty */}
                {used > 0 && (
                  <div className="inventory-reserved-used">
                    Used this week: {used}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 12 }}>
        <button className="fp-apply" style={{ width: "100%" }}>
          Browse Inventory Items
        </button>
      </div>
    </div>
  );
};

export default InventorySidebar;
