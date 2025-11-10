// src/WebPage/PlanWeeklyMeals/MealCalendar.tsx
import React from "react";
import type { WeekPlan, InventoryItem, DayKey } from "./types";

type Props = {
  plan: WeekPlan;
  inventory: InventoryItem[];
  days: DayKey[];
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
  const [pendingDelete, setPendingDelete] = React.useState<{
    day: DayKey;
    slot: keyof WeekPlan["meals"][DayKey];
  } | null>(null);

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

      <div className="meal-calendar-day-row">
        {dayKeys.map((day) => (
          <div key={`header-${day}`} className="grid-day-header">
            {day[0].toUpperCase() + day.slice(1)}
          </div>
        ))}
      </div>

      <div className="meal-calendar-grid">
        {slotLabels.map((slot) =>
          dayKeys.map((day) => {
            const meal = plan.meals[day]?.[slot];
            return (
              <div
                key={`${day}-${slot}`}
                className="meal-square"
                onClick={() => onOpenSlot(day, slot)}
              >
                <div className="meal-square-title">
                  {slot[0].toUpperCase() + slot.slice(1)}
                </div>

                {meal ? (
                  <>
                    {"image" in meal && (meal as any).image ? (
                      <img
                        src={(meal as any).image}
                        alt={meal.name}
                        className="meal-square-img"
                      />
                    ) : (
                      <div className="meal-square-img">🍽️</div>
                    )}

                    <div className="meal-square-name">
                      {formatName(meal.name)}
                    </div>

                    <div className="meal-square-meta">
                      {meal.ingredients?.length
                        ? `${meal.ingredients.length} ingredients`
                        : ""}
                    </div>

                    <div className="meal-square-actions">
                      <button
                        className="edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSlot(day, slot);
                        }}
                      >
                        ✏️
                      </button>

                      <button
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDelete({ day, slot });
                        }}
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

      {pendingDelete && (
        <div className="detail-overlay" onClick={() => setPendingDelete(null)}>
          <div
            className="detail-card"
            style={{ maxWidth: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 14 }}>Remove this meal?</h3>
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                className="fp-clear"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                className="fp-apply"
                onClick={() => {
                  onRemoveMeal(pendingDelete.day, pendingDelete.slot);
                  setPendingDelete(null);
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealCalendar;
