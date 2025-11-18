// src/WebPage/PlanWeeklyMeals/MealSlotModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import type { InventoryItem, DayKey } from "./types";
import { useNotify } from "./Toast";

type RecipeLite = {
  name: string;
  ingredients: { name: string; quantity?: string }[];
};

type Props = {
  day: DayKey;
  slot: "breakfast" | "lunch" | "dinner" | "snacks";
  existing?: any;
  inventory: InventoryItem[];
  suggestedRecipes: RecipeLite[];
  genericRecipes: RecipeLite[];
  onClose: () => void;
  onConfirm: (
    day: DayKey,
    slot: "breakfast" | "lunch" | "dinner" | "snacks",
    mealData: {
      name: string;
      type: "recipe" | "generic" | "custom";
      ingredients: any[];
      nutrition?: any;
    }
  ) => void;
};

function getItemId(it: InventoryItem): string {
  return String((it as any)._id ?? (it as any).id ?? "");
}

function getAvailableQty(it: InventoryItem): number {
  const q = Number((it as any).quantity ?? 0);
  return isNaN(q) || q < 0 ? 0 : q;
}

const MealSlotModal: React.FC<Props> = ({
  day,
  slot,
  existing,
  inventory,
  suggestedRecipes,
  genericRecipes,
  onClose,
  onConfirm,
}) => {
  const notify = useNotify();

  const [tab, setTab] = useState<"suggested" | "generic" | "custom">(
    "suggested"
  );

  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(
    existing?.name ?? null
  );
  const [customName, setCustomName] = useState(existing?.name ?? "");

  const [usedQty, setUsedQty] = useState<Record<string, number>>({});
  const [initializedFromExisting, setInitializedFromExisting] = useState(false);

  const invNames = useMemo(
    () => inventory.map((i) => (i.name || "").toLowerCase()),
    [inventory]
  );

  function score(rec: RecipeLite) {
    const ingNames = (rec.ingredients || []).map((i) =>
      (i.name || "").toLowerCase()
    );

    const available: string[] = [];
    const missing: string[] = [];

    for (const ing of ingNames) {
      const match = inventory.find((i) => {
        const invName = (i.name || "").toLowerCase();
        return invName.includes(ing) || ing.includes(invName);
      });

      if (match && Number(match.quantity) > 0) {
        available.push(match.name);
      } else {
        missing.push(ing);
      }
    }

    const match = ingNames.length
      ? Math.round((available.length / ingNames.length) * 100)
      : 0;

    return { name: rec.name, match, available, missing, _full: rec };
  }

  const suggested = useMemo(
    () =>
      suggestedRecipes
        .map(score)
        .filter((r) => r.match >= 80)
        .sort((a, b) => b.match - a.match),
    [suggestedRecipes, inventory]
  );

  const genericList = useMemo(
    () => genericRecipes.map(score).sort((a, b) => b.match - a.match),
    [genericRecipes, inventory]
  );

  function mapRecipeToInventory(recipeName: string | null): InventoryItem[] {
    if (!recipeName) return [];
    const rec =
      suggestedRecipes.find((r) => r.name === recipeName) ||
      genericRecipes.find((r) => r.name === recipeName);
    if (!rec) return [];

    const ingNames = (rec.ingredients || []).map((i) =>
      (i.name || "").toLowerCase()
    );

    const hits: InventoryItem[] = [];
    const seen = new Set<string>();

    for (const it of inventory) {
      const name = (it.name || "").toLowerCase();
      const matched = ingNames.some(
        (w) => name.includes(w) || w.includes(name)
      );
      if (matched) {
        const id = getItemId(it);
        if (id && !seen.has(id)) {
          seen.add(id);
          hits.push(it);
        }
      }
    }
    return hits;
  }

  // Prefill existing meal (edit mode)
  useEffect(() => {
    if (!existing || initializedFromExisting) return;

    const init: Record<string, number> = {};
    for (const ing of existing.ingredients || []) {
      if (!ing.id) continue;
      init[ing.id] = Number(ing.used_qty ?? 0);
    }
    setUsedQty(init);

    if (existing.type === "custom") {
      setTab("custom");
      setCustomName(existing.name ?? "");
    } else if (existing.type === "generic") {
      setTab("generic");
      setSelectedRecipe(existing.name ?? null);
    } else {
      setTab("suggested");
      setSelectedRecipe(existing.name ?? null);
    }

    setInitializedFromExisting(true);
  }, [existing, initializedFromExisting]);

  // Default mapping for new meals
  useEffect(() => {
    if (existing) return;

    if (tab === "custom") {
      const init: Record<string, number> = {};
      for (const it of inventory) {
        init[getItemId(it)] = 0;
      }
      setUsedQty(init);
      return;
    }

    const targets = mapRecipeToInventory(selectedRecipe);
    const init: Record<string, number> = {};
    for (const it of targets) {
      const id = getItemId(it);
      const max = getAvailableQty(it);
      init[id] = Math.min(1, max);
    }
    setUsedQty(init);
  }, [tab, selectedRecipe, inventory, existing]);

  // Clean scroll-safe qty setter
  function setQty(id: string, next: number, max: number) {
    if (!id) return;
    const v = Math.max(0, Math.min(Math.floor(next || 0), max));
    setUsedQty((s) => ({ ...s, [id]: v }));
  }

  function confirm() {
    if (tab === "custom") {
      if (!customName.trim()) return notify.error("Enter a meal name.");

      const chosen = inventory
        .map((it) => {
          const id = getItemId(it);
          const want = usedQty[id] || 0;
          return want > 0 ? { id, name: it.name, used_qty: want } : null;
        })
        .filter(Boolean) as any[];

      if (chosen.length === 0)
        return notify.error(
          "Select at least one ingredient with quantity > 0."
        );

      return onConfirm(day, slot, {
        name: customName.trim(),
        type: "custom",
        ingredients: chosen as any,
      });
    }

    const all = [...suggested, ...genericList];
    const selected = all.find((x) => x.name === selectedRecipe)?._full;
    if (!selected) return notify.error("Select a recipe.");

    const targets = mapRecipeToInventory(selected.name);
    const chosen = targets
      .map((it) => {
        const id = getItemId(it);
        const want = usedQty[id] || 0;
        return want > 0 ? { id, name: it.name, used_qty: want } : null;
      })
      .filter(Boolean) as any[];

    if (chosen.length === 0)
      return notify.error("Set at least one ingredient quantity > 0.");

    onConfirm(day, slot, {
      name: selected.name,
      type: tab === "generic" ? "generic" : "recipe",
      ingredients: chosen as any,
    });
  }

  // Memoized quantity row
  const QtyRow = React.memo(function QtyRow({ it }: { it: InventoryItem }) {
    const id = getItemId(it);
    const max = getAvailableQty(it);
    const val = usedQty[id] ?? 0;

    return (
      <div className="qty-row">
        <div className="qty-left">
          <div className="qty-name">{it.name}</div>
          <div className="qty-meta">
            Available: {max}{" "}
            {max === 0 && <span className="tag-gray">out</span>}
          </div>
        </div>

        <div className="qty-right">
          <button
            className="qty-btn"
            onClick={() => setQty(id, val - 1, max)}
            disabled={val <= 0}
          >
            −
          </button>

          <div className="qty-display">{val}</div>

          <button
            className="qty-btn"
            onClick={() => setQty(id, val + 1, max)}
            disabled={val >= max}
          >
            +
          </button>
        </div>
      </div>
    );
  });

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-card" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <h3>Add or Edit Meal</h3>
          <button className="close-x" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="meal-modal-tabs">
          <button
            className={tab === "suggested" ? "active" : ""}
            onClick={() => setTab("suggested")}
          >
            Suggested Recipes
          </button>
          <button
            className={tab === "generic" ? "active" : ""}
            onClick={() => setTab("generic")}
          >
            Generic Recipes
          </button>
          <button
            className={tab === "custom" ? "active" : ""}
            onClick={() => setTab("custom")}
          >
            Custom Meal
          </button>
        </div>

        <div className="meal-modal-body">
          {tab === "suggested" && (
            <div className="suggested-list">
              {suggested.map((r) => (
                <label key={r.name} className="fp-recipe-card">
                  <input
                    type="radio"
                    name="suggested"
                    checked={selectedRecipe === r.name}
                    onChange={() => setSelectedRecipe(r.name)}
                  />
                  <div className="recipe-info">
                    <div className="recipe-title">
                      {r.name} <span className="match">{r.match}% match</span>
                    </div>
                    <div className="recipe-detail">
                      {r.available.length
                        ? `✅ Have: ${r.available.join(", ")}`
                        : "No ingredients available"}
                      {r.missing.length > 0 && (
                        <div className="missing">
                          ❌ Missing: {r.missing.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {tab === "generic" && (
            <div className="suggested-list">
              {genericList.map((r) => (
                <label key={r.name} className="fp-recipe-card">
                  <input
                    type="radio"
                    name="generic"
                    checked={selectedRecipe === r.name}
                    onChange={() => setSelectedRecipe(r.name)}
                  />
                  <div className="recipe-info">
                    <div className="recipe-title">
                      {r.name} <span className="match">{r.match}% match</span>
                    </div>
                    <div className="recipe-detail">
                      {r.available.length
                        ? `✅ Have: ${r.available.join(", ")}`
                        : "No ingredients available"}
                      {r.missing.length > 0 && (
                        <div className="missing">
                          ❌ Missing: {r.missing.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {tab === "custom" && (
            <div className="custom-area">
              <input
                placeholder="Enter custom meal name..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />

              <div className="custom-subtitle">
                Pick items & quantities (virtual reservation)
              </div>

              <div
                className="qty-panel"
                style={{ maxHeight: 260, overflow: "auto" }}
              >
                {inventory
                  .filter((it) => Number(it.quantity) > 0)
                  .map((it) => (
                    <QtyRow key={getItemId(it)} it={it} />
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="detail-actions">
          <div />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="fp-clear" onClick={onClose}>
              Cancel
            </button>
            <button onClick={confirm}>Confirm</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealSlotModal;
