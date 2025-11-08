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

// ✅ Helper to ensure every item has a definite string ID
function getItemId(it: InventoryItem): string {
  return String(it._id ?? it.id ?? "");
}

// ✅ Helper to simulate recipe ingredient breakdown (for now static keywords)
const RECIPE_INGREDIENT_MAP: Record<string, string[]> = {
  "Green Goddess Salad": ["lettuce", "spinach", "olive oil", "lemon"],
  "Spicy Chickpea Bowl": ["chickpeas", "rice", "tomato", "onion"],
  "Mediterranean Quinoa": ["quinoa", "cucumber", "feta", "olive oil"],
  "Creamy Tomato Pasta": ["pasta", "tomato", "cream", "cheese"],
  "Chicken Stir Fry": ["chicken", "broccoli", "soy sauce", "garlic"],
  "Omelette with Veggies": ["eggs", "broccoli", "onion", "tomato"],
  "Pasta Primavera": ["pasta", "carrot", "broccoli", "olive oil"],
  "Stir Fry Veggies": ["broccoli", "carrot", "onion", "soy sauce"],
  "Rice & Beans": ["rice", "beans", "onion", "tomato"],
  Omelette: ["eggs", "milk", "salt"],
  "Grilled Cheese Sandwich": ["bread", "cheese", "butter"],
  "Avocado Toast": ["bread", "avocado", "salt", "pepper"],
};

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

  const invNames = useMemo(
    () => inventory.map((i) => i.name.toLowerCase()),
    [inventory]
  );

  // ✅ Smart Suggested Recipes — based on ingredient overlap
  const suggested = useMemo(() => {
    const calcMatch = (recipe: string) => {
      const ingredients = RECIPE_INGREDIENT_MAP[recipe] || [];
      if (!ingredients.length) return { match: 0, available: [], missing: [] };

      const available = ingredients.filter((ing) =>
        invNames.some((n) => n.includes(ing))
      );
      const missing = ingredients.filter(
        (ing) => !invNames.some((n) => n.includes(ing))
      );
      const match = Math.round((available.length / ingredients.length) * 100);
      return { match, available, missing };
    };
    // Use the dynamically fetched recipes here (from MongoDB backend)
    const withScores = recipes.map((r) => ({
      name: r,
      ...calcMatch(r),
    }));

    // show only recipes that have at least some match (or fallback)
    const filtered = withScores.filter((r) => r.match > 20);
    return (filtered.length ? filtered : withScores).sort(
      (a, b) => b.match - a.match
    );
  }, [inventory, recipes, invNames]);

  // ✅ Generic recipes — also with match analysis
  const genericList = useMemo(() => {
    return recipes.map((r) => {
      const ingredients = RECIPE_INGREDIENT_MAP[r] || [];
      const available = ingredients.filter((ing) =>
        invNames.some((n) => n.includes(ing))
      );
      const missing = ingredients.filter(
        (ing) => !invNames.some((n) => n.includes(ing))
      );
      const match = ingredients.length
        ? Math.round((available.length / ingredients.length) * 100)
        : 0;
      return { name: r, match, available, missing };
    });
  }, [inventory, recipes, invNames]);

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
      if (!selectedRecipe) return alert("Select a suggested recipe.");

      const matched = RECIPE_INGREDIENT_MAP[selectedRecipe] || [];
      const ingredients = inventory.filter((it) =>
        matched.some((m) => it.name.toLowerCase().includes(m))
      );

      onConfirm(day, slot, {
        name: selectedRecipe,
        type: "recipe",
        ingredients,
      });
      return;
    }

    if (tab === "generic") {
      if (!selectedRecipe) return alert("Select a generic recipe.");

      const matched = RECIPE_INGREDIENT_MAP[selectedRecipe] || [];
      const ingredients = inventory.filter((it) =>
        matched.some((m) => it.name.toLowerCase().includes(m))
      );

      onConfirm(day, slot, {
        name: selectedRecipe,
        type: "generic",
        ingredients,
      });
      return;
    }

    if (tab === "custom") {
      if (!customName.trim()) return alert("Enter a meal name.");
      const ingredients = buildIngredients();
      onConfirm(day, slot, {
        name: customName.trim(),
        type: "custom",
        ingredients,
      });
    }
  }

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
          {/* Suggested */}
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

          {/* Generic */}
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

          {/* Custom Meal */}
          {tab === "custom" && (
            <div className="custom-area">
              <input
                placeholder="Enter custom meal name..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
              <div className="custom-subtitle">
                Select ingredients from inventory (
                {
                  Object.keys(selectedItems).filter((k) => selectedItems[k])
                    .length
                }{" "}
                selected)
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
