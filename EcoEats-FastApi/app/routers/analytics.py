# app/routers/analytics.py
from fastapi import APIRouter, HTTPException, Query
from app.database import db
from datetime import datetime, timedelta, time
from typing import Optional, Union, List
from collections import defaultdict

# Flexible date parsing
try:
    from dateutil.parser import parse  # type: ignore
except Exception:
    def parse(date_str: str) -> datetime:
        if not date_str:
            raise ValueError("Empty date string")
        try:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except Exception:
            pass
        try:
            return datetime.strptime(date_str, "%Y-%m-%d")
        except Exception:
            raise ValueError(f"Unrecognized date format: {date_str}")

router = APIRouter(tags=["Analytics"])
collection = db["food_items"]

def ensure_datetime(date_value: Union[str, datetime, None]) -> Optional[datetime]:
    """Ensure a datetime object from string or datetime."""
    if isinstance(date_value, datetime):
        return date_value
    elif isinstance(date_value, str):
        try:
            return parse(date_value)
        except ValueError:
            return None
    return None


# --- Aggregation Pipeline Builder ---
def build_aggregation_pipeline(
    start_date: Optional[str],
    end_date: Optional[str],
    category: Optional[str]
) -> List[dict]:
    match_criteria = {}
    pipeline = []

    if category:
        match_criteria["category"] = category

    # Convert string date field properly
    add_fields_stage = {
        "$addFields": {
            "created_at_date": {
                "$cond": {
                    "if": { "$eq": [{ "$type": "$created_at" }, "string"] },
                    "then": { "$dateFromString": { "dateString": "$created_at" } },
                    "else": "$created_at"
                }
            }
        }
    }
    pipeline.append(add_fields_stage)

    if start_date and end_date:
        try:
            start_dt = datetime.combine(parse(start_date).date(), time.min)
            end_dt = datetime.combine(parse(end_date).date(), time.max)
            match_criteria["created_at_date"] = {"$gte": start_dt, "$lte": end_dt}
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid date format: {e}")

    if match_criteria:
        pipeline.append({"$match": match_criteria})

    return pipeline


# --- SUMMARY ROUTE ---
@router.get("/summary")
async def get_analytics_summary(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    period: Optional[str] = Query("monthly")
):
    today = datetime.utcnow()
    pipeline = build_aggregation_pipeline(start_date, end_date, category)

    try:
        all_items = await collection.aggregate(pipeline).to_list(length=None)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database aggregation failed: {e}")

    if not all_items:
        return {
            "hasData": False,
            "message": "No data found for the selected filters.",
            "totalItems": 0, "totalDonations": 0, "totalUsed": 0,
            "categoriesBreakdown": {}, "monthlyTrend": [],
            "impactMetrics": {"foodSavedKg": 0.0, "co2SavedKg": 0.0, "moneySaved": 0}
        }

    # Totals
    total_items = sum(item.get("quantity", 1) for item in all_items)
    donations = [i for i in all_items if i.get("source") == "donation"]
    total_donations = sum(i.get("quantity", 1) for i in donations)
    inventory_items = [i for i in all_items if i.get("source") == "inventory"]
    total_inventory = sum(i.get("quantity", 1) for i in inventory_items)

    # Category breakdown
    category_stats = defaultdict(lambda: {"total": 0, "donated": 0, "used": 0, "wasted": 0})
    for item in all_items:
        cat = item.get("category", "Unknown")
        qty = item.get("quantity", 1)
        expiry = ensure_datetime(item.get("expiry_date"))
        if expiry and expiry < today:
            category_stats[cat]["wasted"] += qty
        elif item.get("source") == "donation":
            category_stats[cat]["donated"] += qty
        else:
            category_stats[cat]["used"] += qty
        category_stats[cat]["total"] += qty

    # --- Trend Data with Period Filter ---
    trend_data = defaultdict(lambda: {"inventory": 0, "donations": 0, "wasted": 0})
    for item in all_items:
        created = item.get("created_at_date")
        qty = item.get("quantity", 1)

        # Determine grouping key based on selected period
        if created:
            if period == "weekly":
                key = created.strftime("%Y-W%U")
            elif period == "yearly":
                key = created.strftime("%Y")
            else:  # monthly default
                key = created.strftime("%Y-%m")

            if item.get("source") == "donation":
                trend_data[key]["donations"] += qty
            else:
                trend_data[key]["inventory"] += qty

        # Add wasted item count by expiry period
        expiry = ensure_datetime(item.get("expiry_date"))
        if expiry and expiry < today:
            if period == "weekly":
                key = expiry.strftime("%Y-W%U")
            elif period == "yearly":
                key = expiry.strftime("%Y")
            else:
                key = expiry.strftime("%Y-%m")
            trend_data[key]["wasted"] += qty

    monthly_trend = [
        {"date": key, "inventory": v["inventory"], "donations": v["donations"], "wasted": v["wasted"]}
        for key, v in sorted(trend_data.items())
    ]

    # Show only recent periods if no filters applied
    if not start_date and not end_date:
        monthly_trend = monthly_trend[-6:]

    return {
        "hasData": True,
        "totalItems": total_items,
        "totalDonations": total_donations,
        "totalUsed": total_inventory,
        "categoriesBreakdown": dict(category_stats),
        "monthlyTrend": monthly_trend,
        "impactMetrics": {
            "foodSavedKg": total_items * 0.5,
            "co2SavedKg": total_items * 2.5,
            "moneySaved": total_items * 5
        }
    }


# --- CATEGORY ROUTE ---
@router.get("/categories")
async def get_category_breakdown(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    category: Optional[str] = Query(None)
):
    today = datetime.utcnow()
    pipeline = build_aggregation_pipeline(start_date, end_date, category)

    try:
        all_items = await collection.aggregate(pipeline).to_list(length=None)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database aggregation failed: {e}")

    if not all_items:
        return {"hasData": False, "categoriesBreakdown": {}}

    category_stats = defaultdict(lambda: {"total": 0, "donated": 0, "used": 0, "wasted": 0})
    for item in all_items:
        cat = item.get("category", "Unknown")
        qty = item.get("quantity", 1)
        expiry = ensure_datetime(item.get("expiry_date"))
        if expiry and expiry < today:
            category_stats[cat]["wasted"] += qty
        elif item.get("source") == "donation":
            category_stats[cat]["donated"] += qty
        else:
            category_stats[cat]["used"] += qty
        category_stats[cat]["total"] += qty

    return {"hasData": True, "categoriesBreakdown": dict(category_stats)}


# --- TREND ROUTE ---
@router.get("/trends")
async def get_trend_data(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    period: Optional[str] = Query("monthly")
):
    pipeline = build_aggregation_pipeline(start_date, end_date, category)
    today = datetime.utcnow()

    try:
        all_items = await collection.aggregate(pipeline).to_list(length=None)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database aggregation failed: {e}")

    if not all_items:
        return {"hasData": False, "monthlyTrend": []}

    trend_data = defaultdict(lambda: {"inventory": 0, "donations": 0, "wasted": 0})
    for item in all_items:
        created = item.get("created_at_date")
        qty = item.get("quantity", 1)

        # Period grouping
        if created:
            if period == "weekly":
                key = created.strftime("%Y-W%U")
            elif period == "yearly":
                key = created.strftime("%Y")
            else:
                key = created.strftime("%Y-%m")

            if item.get("source") == "donation":
                trend_data[key]["donations"] += qty
            else:
                trend_data[key]["inventory"] += qty

        expiry = ensure_datetime(item.get("expiry_date"))
        if expiry and expiry < today:
            if period == "weekly":
                key = expiry.strftime("%Y-W%U")
            elif period == "yearly":
                key = expiry.strftime("%Y")
            else:
                key = expiry.strftime("%Y-%m")
            trend_data[key]["wasted"] += qty

    monthly_trend = [
        {"date": key, "inventory": v["inventory"], "donations": v["donations"], "wasted": v["wasted"]}
        for key, v in sorted(trend_data.items())
    ]

    if not start_date and not end_date:
        monthly_trend = monthly_trend[-6:]

    return {"hasData": True, "monthlyTrend": monthly_trend}
