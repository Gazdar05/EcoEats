# app/routers/analytics.py
from fastapi import APIRouter, HTTPException, Query
from app.database import db
from datetime import datetime, timedelta, time
from typing import Optional, Union, List
from collections import defaultdict

try:
    from dateutil.parser import parse
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


def build_aggregation_pipeline(start_date: Optional[str], end_date: Optional[str], category: Optional[str]) -> List[dict]:
    match_criteria = {}
    pipeline = []

    if category:
        match_criteria["category"] = category

    add_fields_stage = {
        "$addFields": {
            "created_at_date": {
                "$cond": {
                    "if": {"$eq": [{"$type": "$created_at"}, "string"]},
                    "then": {"$dateFromString": {"dateString": "$created_at"}},
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
            raise HTTPException(status_code=400, detail=f"Invalid date format: {e}. Use YYYY-MM-DD")

    if match_criteria:
        pipeline.append({"$match": match_criteria})
    return pipeline


@router.get("/summary")
async def get_analytics_summary(start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None), category: Optional[str] = Query(None)):
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

    total_items = 0
    total_donations = 0
    total_inventory = 0
    category_stats = defaultdict(lambda: {"total": 0, "donated": 0, "used": 0})

    for item in all_items:
        qty_raw = item.get("quantity", 1)
        try:
            quantity = int(float(qty_raw))  # convert string or float to int
        except (TypeError, ValueError):
            quantity = 1

        cat = item.get("category", "Unknown")

        if item.get("source") == "donation":
            category_stats[cat]["donated"] += quantity
            total_donations += quantity
        else:
            category_stats[cat]["used"] += quantity
            total_inventory += quantity

        category_stats[cat]["total"] += quantity
        total_items += quantity

    trend_data = defaultdict(lambda: {"inventory": 0, "donations": 0})
    for item in all_items:
        qty_raw = item.get("quantity", 1)
        try:
            quantity = int(float(qty_raw))
        except (TypeError, ValueError):
            quantity = 1

        created = item.get("created_at_date")
        if created:
            month_key = created.strftime("%Y-%m")
            if item.get("source") == "donation":
                trend_data[month_key]["donations"] += quantity
            else:
                trend_data[month_key]["inventory"] += quantity

    monthly_trend = [
        {"date": month, "inventory": data["inventory"], "donations": data["donations"]}
        for month, data in sorted(trend_data.items())
    ]

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
async def get_category_breakdown(start_date: Optional[str] = Query(None), end_date: Optional[str] = Query(None), category: Optional[str] = Query(None)):
    pipeline = build_aggregation_pipeline(start_date, end_date, category)
    try:
        all_items = await collection.aggregate(pipeline).to_list(length=None)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database aggregation failed: {e}")

    if not all_items:
        return {"hasData": False, "categoriesBreakdown": {}}

    category_stats = defaultdict(lambda: {"total": 0, "donated": 0, "used": 0})
    for item in all_items:
        qty_raw = item.get("quantity", 1)
        try:
            quantity = int(float(qty_raw))
        except (TypeError, ValueError):
            quantity = 1

        cat = item.get("category", "Unknown")

        if item.get("source") == "donation":
            category_stats[cat]["donated"] += quantity
        else:
            category_stats[cat]["used"] += quantity
        category_stats[cat]["total"] += quantity

    return {"hasData": True, "categoriesBreakdown": dict(category_stats)}

@router.get("/trends")
async def get_trends(period: str = Query("monthly")):
    """Return trend data grouped by the selected period (weekly, monthly, or yearly)."""
    all_items = await collection.find().to_list(length=None)

    if not all_items:
        return {"hasData": False, "trend": []}

    trend_data = defaultdict(lambda: {"saved": 0, "donated": 0})

    for item in all_items:
        qty_raw = item.get("quantity", 1)
        try:
            quantity = int(float(qty_raw))
        except (TypeError, ValueError):
            quantity = 1

        created = item.get("created_at")
        if isinstance(created, str):
            try:
                created = parse(created)
            except Exception:
                continue
        if not created:
            continue

        if period == "weekly":
            key = created.strftime("%Y-W%U")  # e.g. "2025-W45"
        elif period == "yearly":
            key = created.strftime("%Y")
        else:  # monthly default
            key = created.strftime("%Y-%m")

        if item.get("source") == "donation":
            trend_data[key]["donated"] += quantity
        else:
            trend_data[key]["saved"] += quantity

    trend_list = [
        {"period": k, "saved": v["saved"], "donated": v["donated"]}
        for k, v in sorted(trend_data.items())
    ]

    return {"hasData": True, "trend": trend_list}
