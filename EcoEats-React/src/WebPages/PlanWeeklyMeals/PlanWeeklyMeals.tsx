// src/WebPage/PlanWeeklyMeals/PlanWeeklyMeals.tsx
import React, { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../../config";
import "./PlanWeeklyMeals.css";
import MealCalendar from "./MealCalendar";
import InventorySidebar from "./InventorySidebar";
import MealSlotModal from "./MealSlotModal";
import type { InventoryItem, WeekPlan, MealSlot, DayKey } from "./types";
import { sampleInventory } from "./mockData";
import { differenceInCalendarWeeks, format, startOfWeek } from "date-fns";

// ✅ NEW
import { NotifierProvider, useNotify } from "./Toast";

const EMPTY_SLOT: MealSlot = {
  breakfast: null,
  lunch: null,
  dinner: null,
  snacks: null,
};

const fallbackRecipe: RecipeLite = {
  name: "Sample Meal",
  ingredients: [],
};

const DAYS: DayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function dateForDay(weekStart: Date, day: DayKey) {
  const dayIndex = DAYS.indexOf(day);
  const date = new Date(weekStart);
  date.setDate(weekStart.getDate() + dayIndex);
  return date;
}

function formatWeekRange(start: Date) {
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `Week of ${start.toLocaleDateString(
    undefined,
    opts
  )} - ${end.toLocaleDateString(undefined, opts)}`;
}

function formatWeekLabel(weekStart: Date) {
  const now = startOfWeek(new Date(), { weekStartsOn: 1 });
  const diffWeeks = differenceInCalendarWeeks(weekStart, now);

  if (diffWeeks === 0) return `This Week (${formatWeekRange(weekStart)})`;
  if (diffWeeks === 1) return `Next Week (${formatWeekRange(weekStart)})`;
  if (diffWeeks === -1) return `Last Week (${formatWeekRange(weekStart)})`;
  return formatWeekRange(weekStart);
}

const defaultEmptyPlan = (weekStartIso: string): WeekPlan => ({
  userId: "me",
  weekStart: weekStartIso,
  meals: DAYS.reduce((acc, day) => {
    acc[day] = { breakfast: null, lunch: null, dinner: null, snacks: null };
    return acc;
  }, {} as WeekPlan["meals"]),
});

type RecipeLite = {
  name: string;
  ingredients: { name: string; quantity?: string }[];
};

// ✅ NEW inner component
const PlannerInner: React.FC = () => {
  const notify = useNotify(); // <-- new notifier hook

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [suggestedRecipes, setSuggestedRecipes] = useState<RecipeLite[]>([]);
  const [genericRecipes, setGenericRecipes] = useState<RecipeLite[]>([]);
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [slotModal, setSlotModal] = useState<{
    open: boolean;
    day?: DayKey;
    slot?: keyof MealSlot;
    existing?: any;
  }>({ open: false });

  // load inventory + recipes + plan
  // load inventory + recipes + plan
  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const invRes = await fetch(`${API_BASE_URL}/inventory`);
        if (invRes.ok) {
          const inv = await invRes.json();

          // 👇 ADD THIS LINE HERE
          console.log("🧩 Raw inventory from backend", inv);

          // ✅ Normalize IDs immediately after fetching
          const normalized = inv.map((item: any) => ({
            ...item,
            id: String(item.id || item._id || ""),
          }));

          setInventory(normalized);
          console.log("✅ Loaded and normalized inventory", normalized);
        } else {
          setInventory([...sampleInventory]);
        }

        const recRes = await fetch(`${API_BASE_URL}/mealplan/suggested/me`);
        if (recRes.ok) {
          const recs = await recRes.json();
          const cleaned = Array.isArray(recs)
            ? recs.map((r: any) => ({
                id: r.id,
                name: r.name,
                match_pct: r.match_pct,
                ingredients: (r.ingredients || []).map((i: any) => ({
                  name: i.name,
                  quantity: i.quantity,
                })),
                matched_items: r.matched_items ?? [],
                missing_items: r.missing_items ?? [],
              }))
            : [];
          setSuggestedRecipes(cleaned);
        } else {
          setSuggestedRecipes([]);
        }

        const genRes = await fetch(`${API_BASE_URL}/mealplan/generic`);
        if (genRes.ok) {
          const gens = await genRes.json();
          const cleaned = Array.isArray(gens)
            ? gens.map((r: any) => ({
                name: r.name,
                ingredients: (r.ingredients || []).map((i: any) => ({
                  name: i.name,
                  quantity: i.quantity,
                })),
              }))
            : [];
          setGenericRecipes(cleaned);
        } else {
          setGenericRecipes([]);
        }

        const iso = weekStart.toISOString();
        const planRes = await fetch(
          `${API_BASE_URL}/mealplan?weekStart=${encodeURIComponent(iso)}`
        );
        if (planRes.ok) {
          const wp = await planRes.json();
          const normalized = {
            userId: wp.user_id ?? wp.userId ?? "me",
            weekStart: wp.week_start ?? wp.weekStart ?? iso,
            meals: wp.meals ?? {},
            id: wp.id ?? wp._id ?? null,
          };
          setPlan(normalized);
        } else {
          setPlan(defaultEmptyPlan(iso));
        }
      } catch (err) {
        console.error("Failed to load plan/inventory:", err);
        setInventory([...sampleInventory]);
        const fallbackRecipe: RecipeLite = {
          name: "Sample Meal",
          ingredients: [],
        };
        setSuggestedRecipes([fallbackRecipe]);
        setGenericRecipes([fallbackRecipe]);
        setPlan(defaultEmptyPlan(weekStart.toISOString()));
      } finally {
        setLoading(false);
      }
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  const weekLabel = useMemo(() => formatWeekRange(weekStart), [weekStart]);

  function gotoPrevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(startOfWeek(d, { weekStartsOn: 1 }));
  }
  function gotoNextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(startOfWeek(d, { weekStartsOn: 1 }));
  }

  function openSlot(day: DayKey, slot: keyof MealSlot, existing?: any) {
    setSlotModal({ open: true, day, slot, existing });
  }
  function closeSlot() {
    setSlotModal({ open: false });
  }

  const [activeDay, setActiveDay] = useState<DayKey>("monday");

  const weeklyUsage = useMemo(() => {
    if (!plan) return {};
    const usage: Record<string, number> = {};
    for (const day of DAYS) {
      const slots = plan.meals[day];
      if (!slots) continue;
      for (const slot of ["breakfast", "lunch", "dinner", "snacks"] as const) {
        const meal = slots[slot];
        if (!meal || !meal.ingredients) continue;
        for (const ing of meal.ingredients) {
          if (!ing.id) continue;
          const used = Number(ing.used_qty ?? 0);
          usage[ing.id] = (usage[ing.id] ?? 0) + used;
        }
      }
    }
    return usage;
  }, [plan]);

  async function assignMeal(
    day: DayKey,
    slot: keyof MealSlot,
    mealData: {
      name: string;
      type: "recipe" | "generic" | "custom";
      ingredients: { id: string; name: string; used_qty: number }[];
      nutrition?: any;
    }
  ) {
    if (!plan) return;

    const prev = plan.meals[day][slot]; // previous meal (if any)
    const isEdit = !!prev;

    // 1️⃣ Start with a fresh clone
    const newPlan = structuredClone(plan);

    // 2️⃣ Restore OLD ingredient quantities if editing
    let restoredInv = inventory.map((it) => {
      const id = it.id;
      if (!prev) return it;

      const oldHit = prev.ingredients?.find((u: any) => u.id === id);
      if (!oldHit) return it;

      const restoreAmount = Number(oldHit.used_qty || 0);
      return { ...it, quantity: Number(it.quantity || 0) + restoreAmount };
    });

    // 3️⃣ Now apply NEW ingredient usage
    const updatedInv = restoredInv.map((it) => {
      const id = it.id;
      const hit = mealData.ingredients.find((u) => u.id === id);
      if (!hit) return it;

      const used = Number(hit.used_qty || 0);
      return { ...it, quantity: Math.max(0, Number(it.quantity || 0) - used) };
    });

    // 4️⃣ Update UI state
    setInventory(updatedInv);

    newPlan.meals[day][slot] = {
      name: mealData.name,
      type: mealData.type,
      ingredients: mealData.ingredients,
      nutrition: mealData.nutrition ?? null,
    };
    setPlan(newPlan);

    // 5️⃣ Prepare clean payload for DB
    const normalizedInv = updatedInv
      .filter((it) => it.id)
      .map((it) => ({
        id: it.id,
        quantity: Number(it.quantity),
      }));

    // 6️⃣ Save inventory to backend
    await fetch(`${API_BASE_URL}/inventory/bulk-update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizedInv),
    });

    await refreshInventoryFromDB();

    // 7️⃣ Save weekly meal plan
    try {
      const res = await fetch(`${API_BASE_URL}/mealplan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlan),
      });

      if (!res.ok) throw new Error(await res.text());

      notify.success(isEdit ? "Meal updated." : "Meal saved.");
    } catch (err) {
      notify.error("Failed saving meal.");
    } finally {
      closeSlot();
    }
  }

  async function removeMeal(day: DayKey, slot: keyof MealSlot) {
    if (!plan) return;
    const currentMeal = plan.meals[day][slot];
    if (!currentMeal) return;

    const used = currentMeal.ingredients || [];

    // restore inventory locally
    const updatedInv = inventory.map((it) => {
      const id = it.id;
      const hit = used.find((u: any) => u.id === id);
      if (!hit) return it;
      const addBack = Number(hit.used_qty || 0);
      return { ...it, quantity: Number(it.quantity || 0) + addBack };
    });

    setInventory(updatedInv);

    const newPlan = structuredClone(plan);
    newPlan.meals[day][slot] = null;
    setPlan(newPlan);

    // ✅ normalize BEFORE sending to backend
    const normalizedInv = updatedInv
      .filter((it) => {
        const rawId = it.id || (it as any)._id;
        return rawId && /^[0-9a-fA-F]{24}$/.test(String(rawId)); // only valid Mongo IDs
      })
      .map((it) => ({
        ...it,
        id: String(it.id || (it as any)._id),
        quantity: Number(it.quantity ?? 0),
      }));

    console.log("🧾 Sending bulk update", normalizedInv);

    // ✅ persist inventory to DB
    await fetch(`${API_BASE_URL}/inventory/bulk-update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizedInv),
    });
    await refreshInventoryFromDB();

    try {
      const res = await fetch(`${API_BASE_URL}/mealplan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlan),
      });
      if (!res.ok) throw new Error(await res.text());
      notify.info("Meal removed.");
    } catch (err) {
      console.error("Failed to save updated plan:", err);
      notify.error("Failed removing meal.");
    }
  }
  async function refreshInventoryFromDB() {
    try {
      const res = await fetch(`${API_BASE_URL}/inventory`);
      if (res.ok) {
        const data = await res.json();
        console.log("🔁 refreshed raw inventory", data);
        const normalized = data.map((item: any) => {
          const clean: any = { ...item };
          clean.id = String(item.id); // always use normalized id only
          delete clean._id; // 🚀 remove _id forever
          return clean;
        });
        setInventory(normalized);
        console.log("✅ refreshed and normalized inventory", normalized);
      } else {
        console.warn("⚠️ failed to refresh inventory:", res.status);
      }
    } catch (err) {
      console.error("Failed to reload inventory:", err);
    }
  }

  async function copyLastWeek() {
    if (!plan) return;

    if (
      !window.confirm(
        "Are you sure you want to copy last week's plan into this week? This will overwrite current plan."
      )
    ) {
      return;
    }

    // 0️⃣ Compute how much THIS week’s existing plan has already used
    const existingUsed: Record<string, number> = {};
    const slotNames = ["breakfast", "lunch", "dinner", "snacks"] as const;

    for (const day of DAYS) {
      const slots = plan.meals[day];
      if (!slots) continue;

      for (const slot of slotNames) {
        const meal = (slots as any)[slot];
        if (!meal || !meal.ingredients) continue;

        for (const ing of meal.ingredients) {
          if (!ing.id) continue;
          const qty = Number(ing.used_qty ?? 0);
          if (!qty) continue;
          existingUsed[ing.id] = (existingUsed[ing.id] ?? 0) + qty;
        }
      }
    }

    try {
      const prevWeek = new Date(weekStart);
      prevWeek.setDate(prevWeek.getDate() - 7);

      const res = await fetch(`${API_BASE_URL}/mealplan/copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "me",
          fromWeekStart: prevWeek.toISOString(),
          toWeekStart: weekStart.toISOString(),
        }),
      });

      if (!res.ok) {
        let message = "Failed to copy last week.";
        try {
          const err = await res.json();
          if (typeof err?.detail === "string") {
            message = err.detail;
          }
        } catch {}
        notify.error(message);
        return;
      }

      const updated = await res.json();

      const normalized: WeekPlan = {
        userId: updated.user_id ?? updated.userId ?? "me",
        weekStart:
          updated.week_start ?? updated.weekStart ?? weekStart.toISOString(),
        meals: updated.meals ?? {},
        id: updated.id ?? updated._id ?? null,
      };

      // 1️⃣ Count meals and warn if empty
      const mealCount = Object.values(normalized.meals || {}).reduce(
        (count: number, day: any) => {
          const vals = Object.values(day || {}) as any[];
          const slotCount = vals.filter((slot) => slot && slot.name).length;
          return count + slotCount;
        },
        0
      );

      if (mealCount === 0) {
        notify.info("Source week was empty — nothing to copy.");
        return;
      }

      // 2️⃣ Build total usage list for the NEW copied week
      const usedList: Record<string, number> = {};

      const dayKeys = Object.keys(normalized.meals) as DayKey[];

      for (const day of dayKeys) {
        const slots: MealSlot = normalized.meals[day] ?? EMPTY_SLOT;

        for (const slot of slotNames) {
          const meal = (slots as any)[slot];
          if (!meal || !meal.ingredients) continue;

          for (const ing of meal.ingredients) {
            const id = ing.id;
            if (!id) continue;

            const qty = Number(ing.used_qty ?? 0);
            usedList[id] = (usedList[id] ?? 0) + qty;
          }
        }
      }

      // 3️⃣ Adjust inventory:
      //    - FIRST restore quantities from old plan (existingUsed)
      //    - THEN deduct for the new copied plan (usedList)
      const updatedInv = inventory.map((it) => {
        const id = it.id!;
        const restore = existingUsed[id] ?? 0;
        const newlyUsed = usedList[id] ?? 0;

        return {
          ...it,
          quantity: Math.max(0, Number(it.quantity) + restore - newlyUsed),
        };
      });

      setInventory(updatedInv);

      // 4️⃣ Persist inventory to backend
      await fetch(`${API_BASE_URL}/inventory/bulk-update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          updatedInv
            .filter((it) => it.id)
            .map((it) => ({
              id: it.id,
              quantity: Number(it.quantity),
            }))
        ),
      });

      // Reload DB
      await refreshInventoryFromDB();

      // 5️⃣ Update UI with new copied plan
      setPlan(normalized);
      notify.success("Copied last week's plan into this week.");
    } catch (err) {
      console.error("Copy failed:", err);
      notify.error("Copy failed. Started a fresh empty week.");
      const empty = defaultEmptyPlan(weekStart.toISOString());
      setPlan(empty);
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

          {differenceInCalendarWeeks(
            weekStart,
            startOfWeek(new Date(), { weekStartsOn: 1 })
          ) !== 0 && (
            <button
              className="week-today-btn"
              onClick={() =>
                setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
              }
            >
              Back to Current Week
            </button>
          )}

          <input
            type="date"
            value={format(dateForDay(weekStart, activeDay), "yyyy-MM-dd")}
            onChange={(e) => {
              const value = e.target.value;
              if (!value) return;
              const selected = new Date(value);
              setWeekStart(startOfWeek(selected, { weekStartsOn: 1 }));
              const jsDay = selected.getDay();
              const newDay: DayKey = DAYS[(jsDay + 6) % 7];
              setActiveDay(newDay);
            }}
            onClick={(e) => e.currentTarget.showPicker?.()}
            className="week-picker"
            required
          />
        </div>

        <div className="main-controls">
          <button className="fp-clear" onClick={copyLastWeek}>
            Copy Last Week
          </button>
        </div>
      </div>

      <div className="main-content">
        <section className="meal-main">
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
          <InventorySidebar inventory={inventory} weeklyUsage={weeklyUsage} />
        </aside>
      </div>

      {slotModal.open && slotModal.day && slotModal.slot && (
        <MealSlotModal
          day={slotModal.day}
          slot={slotModal.slot}
          existing={slotModal.existing}
          onClose={closeSlot}
          inventory={inventory}
          suggestedRecipes={suggestedRecipes}
          genericRecipes={genericRecipes}
          onConfirm={assignMeal}
        />
      )}
    </div>
  );
};
const PlanWeeklyMeals: React.FC = () => (
  <NotifierProvider>
    <PlannerInner />
  </NotifierProvider>
);
export default PlanWeeklyMeals;
