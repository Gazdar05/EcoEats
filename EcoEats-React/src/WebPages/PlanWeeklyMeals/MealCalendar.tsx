import React from "react";
import type { WeekPlan, InventoryItem, DayKey } from "./types";

type Props = {
  plan: WeekPlan;
  inventory: InventoryItem[];
  days: DayKey[]; // one or more days (used to display weekly/daily view)
  onOpenSlot: (day: DayKey, slot: keyof WeekPlan["meals"][DayKey]) => void;
  onRemoveMeal: (day: DayKey, slot: keyof WeekPlan["meals"][DayKey]) => void;
};

const slotLabels: (keyof WeekPlan["meals"][DayKey])[] = [
  "breakfast",
  "lunch",
  "dinner",
  "snacks",
];

function formatName(name: string) {
  if (!name) return "";
  return name.length > 22 ? name.slice(0, 22) + "…" : name;
}

const MealCalendar: React.FC<Props> = ({
  plan,
  days,
  onOpenSlot,
  onRemoveMeal,
}) => {
  // Fallback if no day array provided (safety)
  const dayKeys: DayKey[] =
    Array.isArray(days) && days.length > 0
      ? days
      : (Object.keys(plan.meals || {}) as DayKey[]);

  if (!plan || !plan.meals) {
    return (
      <div className="meal-calendar-grid-wrapper">No plan data available.</div>
    );
  }

  return (
    <div className="meal-calendar-grid-wrapper">
      <h3 className="meal-grid-title">Weekly Meal Planner</h3>

      {/* === Top row: Day headers === */}
      <div className="meal-calendar-day-row">
        {dayKeys.map((day) => (
          <div key={`header-${day}`} className="grid-day-header">
            {day[0].toUpperCase() + day.slice(1)}
          </div>
        ))}
      </div>

      {/* === Main meal grid === */}
      {/* === Main meal grid === */}
      <div className="meal-calendar-grid">
        {slotLabels.map((slot) =>
          dayKeys.map((day) => {
            const meal = plan.meals[day]?.[slot];
            return (
              <div
                key={`${day}-${slot}`}
                className="meal-square"
                onClick={() => onOpenSlot(day, slot)} // ✅ whole square clickable
              >
                <div className="meal-square-title">
                  {slot[0].toUpperCase() + slot.slice(1)}
                </div>

                {meal ? (
                  <>
                    {/* Optional image */}
                    {"image" in meal && (meal as any).image ? (
                      <img
                        src={(meal as any).image}
                        alt={meal.name}
                        className="meal-square-img"
                      />
                    ) : (
                      <div className="meal-square-placeholder">🍽️</div>
                    )}

                    <div className="meal-square-name">
                      {formatName(meal.name)}
                    </div>

                    <div className="meal-square-meta">
                      {meal.ingredients?.length
                        ? `${meal.ingredients.length} items`
                        : "No ingredients"}
                    </div>

                    <div className="meal-square-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering onOpenSlot
                          onOpenSlot(day, slot);
                        }}
                        title="Edit meal"
                        className="edit-btn"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering onOpenSlot
                          onRemoveMeal(day, slot);
                        }}
                        title="Remove meal"
                        className="delete-btn"
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="meal-square-placeholder">
                    + Add {slot[0].toUpperCase() + slot.slice(1)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MealCalendar;
