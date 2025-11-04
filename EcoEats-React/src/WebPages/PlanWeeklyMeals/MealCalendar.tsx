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
  return (
    <div className="meal-calendar">
      <div className="calendar-top">
        <div className="empty-cell" />
        {days.map((d) => (
          <div key={d} className="calendar-day">
            {d[0].toUpperCase() + d.slice(1, 3)}
          </div>
        ))}
      </div>

      <div className="calendar-body">
        {slotLabels.map((slot) => (
          <div key={slot} className="calendar-row">
            <div className="calendar-slot-label">
              {slot[0].toUpperCase() + slot.slice(1)}
            </div>
            {days.map((day) => {
              const meal = plan.meals[day][slot];
              return (
                <div key={day + slot} className="calendar-cell">
                  {meal ? (
                    <div className="meal-card">
                      <div className="meal-name">{formatName(meal.name)}</div>
                      <div className="meal-meta">
                        {meal.ingredients?.length
                          ? `${meal.ingredients.length} items`
                          : "No items"}
                      </div>
                      <div className="meal-actions">
                        <button onClick={() => onOpenSlot(day, slot)}>
                          Edit
                        </button>
                        <button
                          className="fp-clear"
                          onClick={() => onRemoveMeal(day, slot)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="add-meal-btn"
                      onClick={() => onOpenSlot(day, slot)}
                    >
                      + Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MealCalendar;
