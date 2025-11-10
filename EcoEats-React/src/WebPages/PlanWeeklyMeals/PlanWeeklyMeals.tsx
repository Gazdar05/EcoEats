// src/WebPage/PlanWeeklyMeals/PlanWeeklyMeals.tsx
import React, { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../../config";
import "./PlanWeeklyMeals.css";
import MealCalendar from "./MealCalendar";
import InventorySidebar from "./InventorySidebar";
import MealSlotModal from "./MealSlotModal";
import type { InventoryItem, WeekPlan, MealSlot, DayKey } from "./types";
import { sampleInventory } from "./mockData";
import { differenceInCalendarWeeks, format } from "date-fns";

// ✅ NEW
import { NotifierProvider, useNotify } from "./Toast";

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
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}
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
  const now = startOfWeek(new Date());
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
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek());
  const [saveTemplateModal, setSaveTemplateModal] = useState(false);
  const [loadTemplateModal, setLoadTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [tplName, setTplName] = useState("");
  const [tplErr, setTplErr] = useState<string | null>(null);
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
          setInventory(inv);
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
    const newPlan = structuredClone(plan);
    newPlan.meals[day][slot] = {
      name: mealData.name,
      type: mealData.type,
      ingredients: mealData.ingredients,
      nutrition: mealData.nutrition ?? null,
    };
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
      notify.success("Meal saved to this week.");
    } catch (err) {
      console.error("Failed to save plan:", err);
      notify.error("Failed to save meal. Please try again.");
    } finally {
      closeSlot();
    }
  }

  async function removeMeal(day: DayKey, slot: keyof MealSlot) {
    if (!plan) return;
    const currentMeal = plan.meals[day][slot];
    if (!currentMeal) return;

    const used = currentMeal.ingredients || [];
    setInventory((prev) =>
      prev.map((it) => {
        const id = (it as any)._id ?? (it as any).id;
        const hit = used.find((u: any) => u.id === id);
        if (!hit) return it;
        const addBack = Number(hit.used_qty || 0);
        return { ...it, quantity: Number(it.quantity || 0) + addBack };
      })
    );

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

      notify.info("Meal removed."); // ✅ added here
    } catch (err) {
      console.error("Failed to save updated plan:", err);
      notify.error("Failed removing meal.");
    }
  }

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
      const normalized = {
        userId: updated.user_id ?? updated.userId ?? "me",
        weekStart:
          updated.week_start ?? updated.weekStart ?? weekStart.toISOString(),
        meals: updated.meals ?? {},
        id: updated.id ?? updated._id ?? null,
      };

      if (Object.keys(normalized.meals || {}).length > 0) {
        setPlan(normalized);
        notify.success("Copied last week's plan into this week.");
      } else {
        const planRes = await fetch(
          `${API_BASE_URL}/mealplan?weekStart=${encodeURIComponent(
            weekStart.toISOString()
          )}`
        );
        if (planRes.ok) {
          const planData = await planRes.json();
          setPlan(planData);
          notify.success("Copied last week's plan and refreshed.");
        } else {
          const empty = defaultEmptyPlan(weekStart.toISOString());
          setPlan(empty);
          notify.info("No data to copy — created an empty plan.");
        }
      }
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

  async function saveTemplate(name: string) {
    if (!plan) return;
    const trimmed = (name || "").trim();
    if (!trimmed) {
      setTplErr("Please enter a template name.");
      return;
    }
    const mealCount = countMeals(plan.meals);
    if (mealCount === 0) {
      setTplErr(
        "This week is empty. Add at least 1 meal to save as a template."
      );
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/mealplan/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          meals: plan.meals,
          userId: "me",
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      notify.success("Template saved!");
      setTplName("");
      setTplErr(null);
      setSaveTemplateModal(false);
    } catch (e) {
      console.error(e);
      notify.error("Failed to save template.");
    }
  }

  async function openLoadTemplates() {
    const res = await fetch(`${API_BASE_URL}/mealplan/templates`);
    const data = await res.json();
    setTemplates(data);
    setLoadTemplateModal(true);
    await refreshTemplates();
    setLoadTemplateModal(true);
  }

  async function applyTemplate(templateId: string, weekStartISO: string) {
    if (!templateId || !weekStartISO) return;

    weekStartISO = new Date(weekStartISO).toISOString();

    try {
      const res = await fetch(`${API_BASE_URL}/mealplan/templates/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          userId: "me",
          weekStart: weekStartISO,
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      setWeekStart(startOfWeek(new Date(weekStartISO)));

      const planRes = await fetch(
        `${API_BASE_URL}/mealplan?weekStart=${encodeURIComponent(weekStartISO)}`
      );

      if (planRes.ok) {
        const updated = await planRes.json();
        const normalized = {
          userId: updated.user_id ?? updated.userId ?? "me",
          weekStart: updated.week_start ?? updated.weekStart ?? weekStartISO,
          meals: updated.meals ?? {},
          id: updated.id ?? updated._id ?? null,
        };
        setPlan(normalized);
      }

      setLoadTemplateModal(false);
      notify.success("Template applied!");
    } catch (e) {
      console.error(e);
      notify.error("Failed to apply template.");
    }
  }

  async function refreshTemplates() {
    const res = await fetch(`${API_BASE_URL}/mealplan/templates`);
    const data = await res.json();
    setTemplates(data);
  }

  async function deleteTemplate(id: string) {
    if (!window.confirm("Delete this template? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/mealplan/templates/id/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      await refreshTemplates();
    } catch (e) {
      console.error(e);
      notify.error("Failed to delete template.");
    }
  }

  function countMeals(meals: WeekPlan["meals"]) {
    let c = 0;
    for (const d of DAYS) {
      const slots = meals[d];
      if (!slots) continue;
      if (slots.breakfast) c++;
      if (slots.lunch) c++;
      if (slots.dinner) c++;
      if (slots.snacks) c++;
    }
    return c;
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
              if (!value) return;
              const selected = new Date(value);
              setWeekStart(startOfWeek(selected));
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
          <InventorySidebar inventory={inventory} />
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
              value={tplName}
              onChange={(e) => {
                setTplName(e.target.value);
                if (tplErr) setTplErr(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTemplate(tplName);
              }}
            />
            {tplErr && (
              <div
                style={{ color: "#b24b4b", fontSize: ".9rem", marginBottom: 8 }}
              >
                {tplErr}
              </div>
            )}

            <button
              className="fp-apply"
              disabled={!tplName.trim()}
              onClick={() => saveTemplate(tplName)}
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
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto auto",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 0",
                  borderBottom: "1px solid #f1f1f1",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{t.name}</div>
                  {t.created_at && (
                    <div style={{ fontSize: ".8rem", color: "#777" }}>
                      {new Date(t.created_at).toLocaleString()}
                    </div>
                  )}
                </div>

                <input
                  type="date"
                  onChange={(e) => (e.currentTarget.dataset.tid = t.id)}
                  data-tid={t.id}
                  id={`date-${t.id}`}
                  style={{
                    padding: "6px 8px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                  }}
                />

                <button
                  className="fp-apply"
                  onClick={() => {
                    const el = document.getElementById(
                      `date-${t.id}`
                    ) as HTMLInputElement | null;
                    const v = el?.value;
                    if (!v) {
                      notify.error("Pick a week start date first.");
                      return;
                    }
                    applyTemplate(t.id, v);
                  }}
                >
                  Apply to Week
                </button>

                <button
                  className="fp-clear"
                  onClick={() => deleteTemplate(t.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
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
