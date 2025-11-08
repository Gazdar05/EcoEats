// src/WebPage/PlanWeeklyMeals/PlanWeeklyMeals.tsx
import React, { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../../config";
import "./PlanWeeklyMeals.css";
import MealCalendar from "./MealCalendar";
import InventorySidebar from "./InventorySidebar";
import MealSlotModal from "./MealSlotModal";
import type { InventoryItem, WeekPlan, MealSlot, DayKey } from "./types";
import { sampleInventory, sampleRecipes } from "./mockData";
import { differenceInCalendarWeeks, format } from "date-fns";

const DAYS: DayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}
function dateForDay(weekStart: Date, day: DayKey) {
  const dayIndex = DAYS.indexOf(day); // 0 = Monday
  const date = new Date(weekStart);
  date.setDate(weekStart.getDate() + dayIndex);
  return date;
}

function formatWeekRange(start: Date) {
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  return `Week of ${start.toLocaleDateString(
    undefined,
    opts
  )} - ${end.toLocaleDateString(undefined, opts)}`;
}
function formatWeekLabel(weekStart: Date) {
  const now = startOfWeek(new Date());
  const diffWeeks = differenceInCalendarWeeks(weekStart, now);

  if (diffWeeks === 0) return `This Week (${formatWeekRange(weekStart)})`;
  if (diffWeeks === 1) return `Next Week (${formatWeekRange(weekStart)})`;
  if (diffWeeks === -1) return `Last Week (${formatWeekRange(weekStart)})`;

  // For any other week, just show "Week of ..."
  return formatWeekRange(weekStart);
}

const defaultEmptyPlan = (weekStartIso: string): WeekPlan => ({
  userId: "me",
  weekStart: weekStartIso,
  meals: DAYS.reduce((acc, day) => {
    acc[day] = {
      breakfast: null,
      lunch: null,
      dinner: null,
      snacks: null,
    };
    return acc;
  }, {} as WeekPlan["meals"]),
});

const PlanWeeklyMeals: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recipes, setRecipes] = useState<string[]>([]); // simple recipe names from mock/backend
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek());
  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [slotModal, setSlotModal] = useState<{
    open: boolean;
    day?: DayKey;
    slot?: keyof MealSlot;
    existing?: any;
  }>({ open: false });

  // load inventory + recipes + plan
  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        // inventory
        const invRes = await fetch(`${API_BASE_URL}/inventory`);
        if (invRes.ok) {
          const inv = await invRes.json();
          setInventory(inv);
        } else {
          // fallback to mock
          setInventory([...sampleInventory]);
        }

        // recipes suggestions endpoint (optional)
        const recRes = await fetch(`${API_BASE_URL}/mealplan/suggested/me`);

        if (recRes.ok) {
          const recs = await recRes.json();
          // Normalize backend data → simple name list
          const names = Array.isArray(recs)
            ? recs.map((r) => (typeof r === "string" ? r : r.name))
            : sampleRecipes;
          setRecipes(names);
        } else {
          setRecipes([...sampleRecipes]);
        }
        const genRes = await fetch(`${API_BASE_URL}/mealplan/generic`);
        if (genRes.ok) {
          const gens = await genRes.json();
          const genericNames = Array.isArray(gens)
            ? gens.map((r) => (typeof r === "string" ? r : r.name))
            : [];
          setRecipes((prev) => [...new Set([...prev, ...genericNames])]);
        }

        // meal plan for this week
        const iso = weekStart.toISOString();
        const planRes = await fetch(
          `${API_BASE_URL}/mealplan?weekStart=${encodeURIComponent(iso)}`
        );
        if (planRes.ok) {
          const wp = await planRes.json();
          setPlan(wp);
        } else {
          setPlan(defaultEmptyPlan(iso));
        }
      } catch (err) {
        console.error("Failed to load plan/inventory:", err);
        setInventory([...sampleInventory]);
        setRecipes([...sampleRecipes]);
        setPlan(defaultEmptyPlan(weekStart.toISOString()));
      } finally {
        setLoading(false);
      }
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  // helpers
  const weekLabel = useMemo(() => formatWeekRange(weekStart), [weekStart]);

  function gotoPrevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(startOfWeek(d));
  }
  function gotoNextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(startOfWeek(d));
  }

  function openSlot(day: DayKey, slot: keyof MealSlot, existing?: any) {
    setSlotModal({ open: true, day, slot, existing });
  }
  function closeSlot() {
    setSlotModal({ open: false });
  }
  const [activeDay, setActiveDay] = useState<DayKey>("monday");

  // assign meal to slot (called from modal)
  async function assignMeal(
    day: DayKey,
    slot: keyof MealSlot,
    mealData: {
      name: string;
      type: "recipe" | "generic" | "custom";
      ingredients: InventoryItem[]; // items used (may be empty)
      nutrition?: any;
    }
  ) {
    if (!plan) return;
    const newPlan = structuredClone(plan);
    newPlan.meals[day][slot] = {
      name: mealData.name,
      type: mealData.type,
      ingredients: mealData.ingredients.map((i) => ({
        id: i._id ?? i.id,
        name: i.name,
        quantity: i.quantity,
      })),
      nutrition: mealData.nutrition ?? null,
    };

    // mark reserved locally for used items (optimistic)
    const reservedIds = mealData.ingredients.map((i) => i._id ?? i.id);
    setInventory((prev) =>
      prev.map((it) =>
        reservedIds.includes(it._id ?? it.id) ? { ...it, reserved: true } : it
      )
    );

    setPlan(newPlan);

    // call backend to save plan and reserve items
    try {
      const res = await fetch(`${API_BASE_URL}/mealplan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlan),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      // optionally reserve items
      if (reservedIds.length) {
        await fetch(`${API_BASE_URL}/inventory/reserve`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: reservedIds, weekStart: plan.weekStart }),
        });
      }
      alert("Meal added to plan.");
    } catch (err) {
      console.error("Failed to save plan / reserve:", err);
      alert("Failed to save meal. Rolling back reservation.");
      // rollback reservation
      setInventory((prev) =>
        prev.map((it) =>
          reservedIds.includes(it._id ?? it.id)
            ? { ...it, reserved: false }
            : it
        )
      );
      // reload plan from backend (best-effort)
      try {
        const iso = weekStart.toISOString();
        const planRes = await fetch(
          `${API_BASE_URL}/mealplan?weekStart=${encodeURIComponent(iso)}`
        );
        if (planRes.ok) {
          const wp = await planRes.json();
          setPlan(wp);
        }
      } catch (e) {}
    } finally {
      closeSlot();
    }
  }

  // remove meal from slot
  async function removeMeal(day: DayKey, slot: keyof MealSlot) {
    if (!plan) return;
    const existing = plan.meals[day][slot];
    if (!existing) return;
    if (
      !window.confirm(
        "Remove this meal from the plan? Reserved items will be released."
      )
    )
      return;

    const newPlan = structuredClone(plan);
    newPlan.meals[day][slot] = null;
    setPlan(newPlan);

    // release reserved items locally
    const reservedIds = (existing.ingredients || []).map((i: any) => i.id);
    setInventory((prev) =>
      prev.map((it) =>
        reservedIds.includes(it._id ?? it.id) ? { ...it, reserved: false } : it
      )
    );

    try {
      const res = await fetch(`${API_BASE_URL}/mealplan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlan),
      });
      if (!res.ok) throw new Error(await res.text());
      if (reservedIds.length) {
        await fetch(`${API_BASE_URL}/inventory/release`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: reservedIds, weekStart: plan.weekStart }),
        });
      }
      alert("Meal removed and inventory released.");
    } catch (err) {
      console.error("Failed to remove meal / release items:", err);
      alert("Failed to update server. Please refresh.");
    }
  }

  // copy last week plan (simple)
  async function copyLastWeek() {
    if (!plan) return;
    if (
      !window.confirm(
        "Are you sure you want to copy last week's plan into this week? This will overwrite current plan."
      )
    )
      return;
    try {
      const res = await fetch(`${API_BASE_URL}/mealplan/copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromWeekStart: new Date(weekStart).toISOString(),
          toWeekStart: new Date(weekStart).toISOString(),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      setPlan(updated);
      alert("Copied last week's plan.");
    } catch (err) {
      console.warn("Copy endpoint not available, fallback to local copy.");
      // local naive copy: mark existing as from previous week (not ideal)
      const localCopy = defaultEmptyPlan(weekStart.toISOString());
      setPlan(localCopy);
      alert(
        "No server copy available — created an empty plan (please reassign meals)."
      );
    }
  }

  if (!plan) {
    return (
      <div className="meal-wrap">
        <div className="no-items">Loading planner...</div>
      </div>
    );
  }

  return (
    <div className="meal-wrap">
      {/* TOP BAR */}
      <div className="main-top">
        <h2>Meal Planner</h2>

        <div className="week-controls">
          <button className="week-btn" onClick={gotoPrevWeek}>
            ◀
          </button>

          <div className="week-label">{formatWeekLabel(weekStart)}</div>

          <button className="week-btn" onClick={gotoNextWeek}>
            ▶
          </button>

          {differenceInCalendarWeeks(weekStart, startOfWeek(new Date())) !==
            0 && (
            <button
              className="week-today-btn"
              onClick={() => setWeekStart(startOfWeek())}
            >
              Back to Current Week
            </button>
          )}

          <input
            type="date"
            value={format(dateForDay(weekStart, activeDay), "yyyy-MM-dd")}
            onChange={(e) => {
              const value = e.target.value;
              if (!value) return; // ✅ Ignore if user tries to clear it
              const selected = new Date(value);
              setWeekStart(startOfWeek(selected));
              const jsDay = selected.getDay();
              const newDay: DayKey = DAYS[(jsDay + 6) % 7];
              setActiveDay(newDay);
            }}
            onClick={(e) => e.currentTarget.showPicker?.()} // keeps native picker behavior
            className="week-picker"
            required // ✅ Prevents clearing in most browsers
          />
        </div>

        <div className="main-controls">
          <button className="fp-clear" onClick={copyLastWeek}>
            Copy last week
          </button>
          <button
            className="fp-apply"
            onClick={async () => {
              try {
                const res = await fetch(`${API_BASE_URL}/mealplan`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(plan),
                });
                if (!res.ok) throw new Error(await res.text());
                alert("Plan saved successfully!");
              } catch (err) {
                console.error("Failed to save plan:", err);
                alert("Failed to save plan.");
              }
            }}
          >
            Save Plan
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA: white planner box + inventory sidebar */}
      <div className="main-content">
        <section className="meal-main">
          {/* ✅ NEW: Day switcher buttons */}
          <div className="day-tabs">
            {DAYS.map((d) => (
              <button
                key={d}
                className={`day-tab ${activeDay === d ? "active" : ""}`}
                onClick={() => setActiveDay(d)}
              >
                {d[0].toUpperCase() + d.slice(1, 3)}
              </button>
            ))}
          </div>

          <MealCalendar
            plan={plan}
            inventory={inventory}
            onOpenSlot={openSlot}
            onRemoveMeal={removeMeal}
            days={[activeDay]}
          />
        </section>

        <aside className="meal-right">
          <InventorySidebar inventory={inventory} recipes={recipes} />
        </aside>
      </div>

      {/* MODAL */}
      {slotModal.open && slotModal.day && slotModal.slot && (
        <MealSlotModal
          day={slotModal.day}
          slot={slotModal.slot}
          existing={slotModal.existing}
          onClose={closeSlot}
          inventory={inventory}
          recipes={recipes}
          onConfirm={assignMeal}
        />
      )}
    </div>
  );
};

export default PlanWeeklyMeals;
