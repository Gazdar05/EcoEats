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
type RecipeLite = {
  name: string;
  ingredients: { name: string; quantity?: string }[];
};

const PlanWeeklyMeals: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [suggestedRecipes, setSuggestedRecipes] = useState<RecipeLite[]>([]);
  const [genericRecipes, setGenericRecipes] = useState<RecipeLite[]>([]);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek());
  const [saveTemplateModal, setSaveTemplateModal] = useState(false);
  const [loadTemplateModal, setLoadTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

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

        // suggested recipes
        // suggested
        const recRes = await fetch(`${API_BASE_URL}/mealplan/suggested/me`);
        if (recRes.ok) {
          const recs = await recRes.json();
          // expect array of objects with .name and .ingredients
          const cleaned = Array.isArray(recs)
            ? recs.map((r: any) => ({
                name: r.name,
                ingredients: (r.ingredients || []).map((i: any) => ({
                  name: i.name,
                  quantity: i.quantity,
                })),
              }))
            : [];
          setSuggestedRecipes(cleaned);
        } else {
          setSuggestedRecipes([]);
        }

        // generic
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
  // ✅ LIVE weekly usage total
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

  // assign meal to slot (called from modal)
  async function assignMeal(
    day: DayKey,
    slot: keyof MealSlot,
    mealData: {
      name: string;
      type: "recipe" | "generic" | "custom";
      ingredients: {
        id: string;
        name: string;
        used_qty: number;
      }[];
      nutrition?: any;
    }
  ) {
    if (!plan) return;

    const newPlan = structuredClone(plan);

    newPlan.meals[day][slot] = {
      name: mealData.name,
      type: mealData.type,
      ingredients: mealData.ingredients, // store with used_qty
      nutrition: mealData.nutrition ?? null,
    };

    // ✅ reduce inventory quantities here
    setInventory((prev) =>
      prev.map((it) => {
        const id = (it as any)._id ?? (it as any).id;
        const hit = mealData.ingredients.find((u) => u.id === id);
        if (!hit) return it;
        const used = Number(hit.used_qty || 0);
        return {
          ...it,
          quantity: Math.max(0, Number(it.quantity || 0) - used),
        };
      })
    );

    setPlan(newPlan);

    try {
      const res = await fetch(`${API_BASE_URL}/mealplan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlan),
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Meal saved.");
    } catch (err) {
      console.error("Failed to save plan:", err);
      alert("Failed to save meal.");
    } finally {
      closeSlot();
    }
  }

  // remove meal from slot
  async function removeMeal(day: DayKey, slot: keyof MealSlot) {
    if (!plan) return;

    const currentMeal = plan.meals[day][slot];
    if (!currentMeal) return;

    // return virtual usage back into inventory
    const used = currentMeal.ingredients || [];

    setInventory((prev) =>
      prev.map((it) => {
        const id = (it as any)._id ?? (it as any).id;
        const hit = used.find((u: any) => u.id === id);
        if (!hit) return it;
        const addBack = Number(hit.used_qty || 0);
        return {
          ...it,
          quantity: Number(it.quantity || 0) + addBack,
        };
      })
    );

    // remove from plan
    const newPlan = structuredClone(plan);
    newPlan.meals[day][slot] = null;
    setPlan(newPlan);

    try {
      const res = await fetch(`${API_BASE_URL}/mealplan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlan),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (err) {
      console.error("Failed to save updated plan:", err);
    }
  }

  // ✅ FIXED copyLastWeek()
  async function copyLastWeek() {
    if (!plan) return;
    if (
      !window.confirm(
        "Are you sure you want to copy last week's plan into this week? This will overwrite current plan."
      )
    )
      return;

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

      if (!res.ok) throw new Error(await res.text());

      const updated = await res.json();

      // 🧠 Normalize backend response for frontend
      const normalized = {
        userId: updated.user_id ?? updated.userId ?? "me",
        weekStart:
          updated.week_start ?? updated.weekStart ?? weekStart.toISOString(),
        meals: updated.meals ?? {},
        id: updated.id ?? updated._id ?? null,
      };

      if (Object.keys(normalized.meals || {}).length > 0) {
        setPlan(normalized);
        alert("Copied last week's plan successfully!");
      } else {
        console.warn("Backend returned no meals — refetching plan.");
        const planRes = await fetch(
          `${API_BASE_URL}/mealplan?weekStart=${encodeURIComponent(
            weekStart.toISOString()
          )}`
        );
        if (planRes.ok) {
          const planData = await planRes.json();
          setPlan(planData);
          alert("Copied and reloaded last week's plan.");
        } else {
          const empty = defaultEmptyPlan(weekStart.toISOString());
          setPlan(empty);
          alert("No data found — created empty plan.");
        }
      }
    } catch (err) {
      console.error("Copy failed:", err);
      alert("Failed to copy last week's plan. Creating empty plan instead.");
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

  async function saveTemplate(name: string) {
    if (!plan) return;
    await fetch(`${API_BASE_URL}/mealplan/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        meals: plan.meals,
        userId: "me",
      }),
    });
    alert("Template saved!");
    setSaveTemplateModal(false);
  }

  async function openLoadTemplates() {
    const res = await fetch(`${API_BASE_URL}/mealplan/templates`);
    const data = await res.json();
    setTemplates(data);
    setLoadTemplateModal(true);
  }

  async function applyTemplate(templateId: string, weekStart: string) {
    await fetch(`${API_BASE_URL}/mealplan/templates/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId, userId: "me", weekStart }),
    });
    alert("Template applied!");
    setLoadTemplateModal(false);
    setWeekStart(startOfWeek(new Date(weekStart)));
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
            Copy Last Week
          </button>

          <button
            className="fp-apply"
            onClick={() => setSaveTemplateModal(true)}
          >
            Save as Template
          </button>

          <button className="fp-clear" onClick={() => openLoadTemplates()}>
            Templates Library
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
          <InventorySidebar inventory={inventory} />
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
          suggestedRecipes={suggestedRecipes}
          genericRecipes={genericRecipes}
          onConfirm={assignMeal}
        />
      )}
      {saveTemplateModal && (
        <div
          className="detail-overlay"
          onClick={() => setSaveTemplateModal(false)}
        >
          <div className="detail-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="template-close-x"
              onClick={() => setSaveTemplateModal(false)}
            >
              ×
            </button>

            <h3>Name this Weekly Plan</h3>
            <input
              id="tplNameInput"
              placeholder="e.g. High Protein Week"
              className="fp-input"
            />
            <button
              className="fp-apply"
              onClick={() =>
                saveTemplate(
                  (document.getElementById("tplNameInput") as HTMLInputElement)
                    .value || "My Week Plan"
                )
              }
            >
              Save Template
            </button>
          </div>
        </div>
      )}

      {loadTemplateModal && (
        <div
          className="template-overlay"
          onClick={() => setLoadTemplateModal(false)}
        >
          <div className="template-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="template-close-x"
              onClick={() => setLoadTemplateModal(false)}
            >
              ×
            </button>

            <h3>Saved Templates</h3>
            {templates.length === 0 && <p>No templates found.</p>}
            {templates.map((t) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <span>{t.name}</span>
                <input
                  type="date"
                  onChange={(e) => applyTemplate(t.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanWeeklyMeals;
