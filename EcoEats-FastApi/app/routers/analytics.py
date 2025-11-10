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
    if isinstance(date_value, datetime):
        return date_value
    elif isinstance(date_value, str):
        try:
            return parse(date_value)
        except ValueError:
            return None
    return None

# --- [FIXED] ---
# Helper function to build the aggregation pipeline.
# This correctly handles date string conversion AND filtering.
def build_aggregation_pipeline(
    start_date: Optional[str],
    end_date: Optional[str],
    category: Optional[str]
) -> List[dict]:
    
    match_criteria = {}
    pipeline = []

    # Add category filter (this can be matched directly)
    if category:
        match_criteria["category"] = category

    # --- [THIS IS THE FIX] ---
    # We need to handle mixed types (string and date) for 'created_at'.
    # We use $cond to check the type before trying to convert.
    add_fields_stage = {
        "$addFields": {
            "created_at_date": {
                "$cond": {
                    "if": { "$eq": [{ "$type": "$created_at" }, "string"] },
                    "then": { "$dateFromString": { "dateString": "$created_at" } },
                    "else": "$created_at"  # If it's not a string, assume it's already a date
                }
            }
        }
    }
    pipeline.append(add_fields_stage)
    # --- [END OF FIX] ---

    # Add date filter
    if start_date and end_date:
        try:
            # Use min/max time to be inclusive of the full start/end days
            start_dt = datetime.combine(parse(start_date).date(), time.min)
            end_dt = datetime.combine(parse(end_date).date(), time.max)
            
            # Add this to the match criteria for the *converted* date field
            match_criteria["created_at_date"] = {"$gte": start_dt, "$lte": end_dt}
            
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid date format: {e}. Use YYYY-MM-DD")
    
    # Add the final $match stage to the pipeline
    if match_criteria:
        pipeline.append({"$match": match_criteria})
    
    return pipeline


@router.get("/summary")
async def get_analytics_summary(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    category: Optional[str] = Query(None)
):
    today = datetime.utcnow()
    
    # [FIX] Use the aggregation pipeline
    pipeline = build_aggregation_pipeline(start_date, end_date, category)
    
    try:
        all_items = await collection.aggregate(pipeline).to_list(length=None)
    except Exception as e:
        # Catch potential aggregation errors
        raise HTTPException(status_code=500, detail=f"Database aggregation failed: {e}")

    if not all_items:
        return {
            "hasData": False,
            "message": "No data found for the selected filters.",
            "totalItems": 0, "totalDonations": 0, "totalUsed": 0,
            "categoriesBreakdown": {}, "monthlyTrend": [],
            "impactMetrics": {"foodSavedKg": 0.0, "co2SavedKg": 0.0, "moneySaved": 0}
        }

    total_items = sum(item.get("quantity", 1) for item in all_items)
    donations = [item for item in all_items if item.get("source") == "donation"]
    total_donations = sum(item.get("quantity", 1) for item in donations)
    inventory_items = [item for item in all_items if item.get("source") == "inventory"]
    total_inventory = sum(item.get("quantity", 1) for item in inventory_items)

    # Category breakdown
    category_stats = defaultdict(lambda: {"total": 0, "donated": 0, "used": 0, "wasted": 0})
    for item in all_items:
        cat = item.get("category", "Unknown")
        quantity = item.get("quantity", 1)
        expiry_date = ensure_datetime(item.get("expiry_date"))

        if expiry_date and expiry_date < today:
            category_stats[cat]["wasted"] += quantity
        elif item.get("source") == "donation":
            category_stats[cat]["donated"] += quantity
        else:
            category_stats[cat]["used"] += quantity
        category_stats[cat]["total"] += quantity

    # Monthly trend
    # We'll include a "wasted" series. Inventory/donations are counted by created_at_date month,
    # while wasted is counted by expiry_date month (when the item became wasted).
    trend_data = defaultdict(lambda: {"inventory": 0, "donations": 0, "wasted": 0})
    for item in all_items:
        # Use the converted date
        created = item.get("created_at_date")
        if created:
            month_key = created.strftime("%Y-%m")
            quantity = item.get("quantity", 1)
            if item.get("source") == "donation":
                trend_data[month_key]["donations"] += quantity
            else:
                trend_data[month_key]["inventory"] += quantity

        # Also count wasted items by their expiry month (if expired)
        expiry = ensure_datetime(item.get("expiry_date"))
        if expiry and expiry < today:
            expiry_month = expiry.strftime("%Y-%m")
            trend_data[expiry_month]["wasted"] += item.get("quantity", 1)

    monthly_trend = [
        {"date": month, "inventory": data["inventory"], "donations": data["donations"], "wasted": data.get("wasted", 0)}
        for month, data in sorted(trend_data.items())
    ]

    # Only slice to last 6 months if NO date filter is applied.
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


@router.get("/categories")
async def get_category_breakdown(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    category: Optional[str] = Query(None)
):
    today = datetime.utcnow()
    
    # [FIX] Use the aggregation pipeline
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
        quantity = item.get("quantity", 1)
        expiry_date = ensure_datetime(item.get("expiry_date"))

        if expiry_date and expiry_date < today:
            category_stats[cat]["wasted"] += quantity
        elif item.get("source") == "donation":
            category_stats[cat]["donated"] += quantity
        else:
            category_stats[cat]["used"] += quantity
        category_stats[cat]["total"] += quantity

    return {"hasData": True, "categoriesBreakdown": dict(category_stats)}


@router.get("/trends")
async def get_trend_data(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    category: Optional[str] = Query(None)
):
    # [FIX] Use the aggregation pipeline
    pipeline = build_aggregation_pipeline(start_date, end_date, category)
    try:
        all_items = await collection.aggregate(pipeline).to_list(length=None)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database aggregation failed: {e}")

    if not all_items:
        return {"hasData": False, "monthlyTrend": []}


    # Include wasted count in trends (wasted by expiry month)
    trend_data = defaultdict(lambda: {"inventory": 0, "donations": 0, "wasted": 0})

    for item in all_items:
        # Use the converted date for inventory/donations
        created = item.get("created_at_date")
        if created:
            month_key = created.strftime("%Y-%m")
            quantity = item.get("quantity", 1)
            if item.get("source") == "donation":
                trend_data[month_key]["donations"] += quantity
            else:
                trend_data[month_key]["inventory"] += quantity

        # Count wasted by expiry month when expired
        expiry = ensure_datetime(item.get("expiry_date"))
        if expiry and expiry < datetime.utcnow():
            expiry_month = expiry.strftime("%Y-%m")
            trend_data[expiry_month]["wasted"] += item.get("quantity", 1)

    monthly_trend = [
        {"date": month, "inventory": data["inventory"], "donations": data["donations"], "wasted": data.get("wasted", 0)}
        for month, data in sorted(trend_data.items())
    ]

    # Only slice to last 6 months if NO date filter is applied.
    if not start_date and not end_date:
        monthly_trend = monthly_trend[-6:]

    return {"hasData": True, "monthlyTrend": monthly_trend}