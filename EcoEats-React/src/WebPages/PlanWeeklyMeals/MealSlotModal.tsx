// src/WebPage/PlanWeeklyMeals/MealSlotModal.tsx
import React, { useMemo, useState } from "react";
import type { InventoryItem, DayKey } from "./types";

type Props = {
  day: DayKey;
  slot: "breakfast" | "lunch" | "dinner" | "snacks";
  existing?: any;
  inventory: InventoryItem[];
  recipes: string[];
  onClose: () => void;
  onConfirm: (
    day: DayKey,
    slot: "breakfast" | "lunch" | "dinner" | "snacks",
    mealData: {
      name: string;
      type: "recipe" | "generic" | "custom";
      ingredients: InventoryItem[];
      nutrition?: any;
    }
  ) => void;
};

const GENERIC_RECIPES = [
  "Pasta Primavera",
  "Stir Fry Veggies",
  "Rice & Beans",
  "Omelette",
];

// ✅ Helper to ensure every item has a definite string ID
function getItemId(it: InventoryItem): string {
  return String(it._id ?? it.id ?? "");
}

const MealSlotModal: React.FC<Props> = ({
  day,
  slot,
  existing,
  inventory,
  recipes,
  onClose,
  onConfirm,
}) => {
  const [tab, setTab] = useState<"suggested" | "generic" | "custom">(
    "suggested"
  );
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(
    existing?.name ?? null
  );
  const [customName, setCustomName] = useState(existing?.name ?? "");
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(
    {}
  );

  // suggested recipes: simple heuristic — recipes that mention inventory item names
  const suggested = useMemo(() => {
    const suggestions: string[] = [];
    const names = inventory.map((i) => i.name.toLowerCase());
    recipes.forEach((r) => {
      const lower = r.toLowerCase();
      if (names.some((n) => lower.includes(n))) suggestions.push(r);
    });
    // fallback to top recipes
    return suggestions.length ? suggestions : recipes.slice(0, 6);
  }, [inventory, recipes]);

  function toggleItem(id: string) {
    setSelectedItems((s) => ({ ...s, [id]: !s[id] }));
  }

  function buildIngredients(): InventoryItem[] {
    const ids = Object.entries(selectedItems)
      .filter(([, v]) => v)
      .map(([k]) => k);
    return inventory.filter((it) => ids.includes(getItemId(it)));
  }

  function confirm() {
    if (tab === "suggested") {
      if (!selectedRecipe) {
        alert("Select a suggested recipe.");
        return;
      }
      // attempt to infer ingredients (simple: match words)
      const matchedIngredients = inventory.filter((it) =>
        selectedRecipe
          .toLowerCase()
          .includes(it.name.toLowerCase().split(" ")[0])
      );
      onConfirm(day, slot, {
        name: selectedRecipe,
        type: "recipe",
        ingredients: matchedIngredients,
      });
      return;
    }

    if (tab === "generic") {
      if (!selectedRecipe) {
        alert("Select a generic recipe.");
        return;
      }
      onConfirm(day, slot, {
        name: selectedRecipe,
        type: "generic",
        ingredients: [],
      });
      return;
    }

    // custom
    if (!customName.trim()) {
      alert("Enter a custom meal name.");
      return;
    }
    const ingredients = buildIngredients();
    onConfirm(day, slot, {
      name: customName.trim(),
      type: "custom",
      ingredients,
    });
  }

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-card" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <h3>Add/Edit Meal</h3>
          <button className="close-x" onClick={onClose}>
            ✕
          </button>
        </div>

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
                <label key={r} className="fp-checkbox">
                  <input
                    type="radio"
                    name="suggested"
                    checked={selectedRecipe === r}
                    onChange={() => setSelectedRecipe(r)}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          )}

          {tab === "generic" && (
            <div className="suggested-list">
              {GENERIC_RECIPES.map((r) => (
                <label key={r} className="fp-checkbox">
                  <input
                    type="radio"
                    name="generic"
                    checked={selectedRecipe === r}
                    onChange={() => setSelectedRecipe(r)}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          )}

          {tab === "custom" && (
            <div className="custom-area">
              <input
                placeholder="Meal name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
              <div style={{ marginTop: 8, marginBottom: 6, fontWeight: 600 }}>
                Select ingredients from inventory
              </div>
              <div className="fp-cats" style={{ maxHeight: 220 }}>
                {inventory.map((it) => {
                  const id = getItemId(it);
                  return (
                    <label key={id} className="fp-checkbox">
                      <input
                        type="checkbox"
                        checked={!!selectedItems[id]}
                        onChange={() => toggleItem(id)}
                        disabled={!!it.reserved}
                      />
                      <span>
                        {it.name}{" "}
                        {it.reserved ? "(reserved)" : `- ${it.quantity}`}
                      </span>
                    </label>
                  );
                })}
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
