# app/routers/analytics.py
from fastapi import APIRouter, HTTPException, Query
from app.database import db
from datetime import datetime, timedelta
from typing import Optional
from collections import defaultdict

router = APIRouter(tags=["Analytics"])
collection = db["food_items"]


def _parse_datetime(value: Optional[object]) -> Optional[datetime]:
    """Try to coerce a value from the database into a datetime.

    Accepts datetime objects and ISO-like strings (with or without Z timezone).
    Returns None if parsing fails.
    """
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        s = value
        # handle trailing Z (UTC) which datetime.fromisoformat doesn't accept
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        try:
            return datetime.fromisoformat(s)
        except Exception:
            # Try some common fallback formats
            for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"):
                try:
                    return datetime.strptime(value, fmt)
                except Exception:
                    continue
    return None

@router.get("/summary")
async def get_analytics_summary(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    category: Optional[str] = Query(None)
):
    """Get summary statistics for food saved and donated"""
    
    # Build query filter
    query = {}
    
    # Date range filter
    if start_date and end_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            query["created_at"] = {"$gte": start, "$lt": end}
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Category filter
    if category:
        query["category"] = category
    
    # Get all items (inventory + donations)
    all_items = await collection.find(query).to_list(length=None)
    
    if not all_items:
        return {
            "hasData": False,
            "message": "No data found. Start logging items to see your impact!",
            "totalItems": 0,
            "totalDonations": 0,
            "totalUsed": 0,
            "categoriesBreakdown": {},
            "monthlyTrend": [],
            "impactMetrics": {
                "foodSavedKg": 0.0,
                "co2SavedKg": 0.0,
                "moneySaved": 0
            }
        }
    
    # Calculate statistics
    total_items = len(all_items)
    donations = [item for item in all_items if item.get("source") == "donation"]
    inventory_items = [item for item in all_items if item.get("source") == "inventory"]
    
    # Category breakdown
    category_stats = defaultdict(lambda: {"total": 0, "donated": 0, "used": 0})
    for item in all_items:
        cat = item.get("category", "Unknown")
        category_stats[cat]["total"] += 1
        if item.get("source") == "donation":
            category_stats[cat]["donated"] += 1
        else:
            category_stats[cat]["used"] += 1
    
    # Monthly trend (last 6 months)
    monthly_data = defaultdict(lambda: {"saved": 0, "donated": 0})
    for item in all_items:
        created = _parse_datetime(item.get("created_at"))
        if created:
            month_key = created.strftime("%Y-%m")
            if item.get("source") == "donation":
                monthly_data[month_key]["donated"] += 1
            else:
                monthly_data[month_key]["saved"] += 1
    
    # Convert to sorted list
    monthly_trend = [
        {"month": month, "saved": data["saved"], "donated": data["donated"]}
        for month, data in sorted(monthly_data.items())
    ]
    
    return {
        "hasData": True,
        "totalItems": total_items,
        "totalDonations": len(donations),
        "totalUsed": len(inventory_items),
        "categoriesBreakdown": dict(category_stats),
        "monthlyTrend": monthly_trend[-6:],  # Last 6 months
        "impactMetrics": {
            "foodSavedKg": total_items * 0.5,  # Assume 0.5kg per item
            "co2SavedKg": total_items * 2.5,   # CO2 equivalent
            "moneySaved": total_items * 5      # Assume $5 per item
        }
    }


@router.get("/categories")
async def get_category_analytics(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """Get analytics by category"""
    
    query = {}
    if start_date and end_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            query["created_at"] = {"$gte": start, "$lt": end}
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format")
    
    items = await collection.find(query).to_list(length=None)
    
    category_breakdown = defaultdict(lambda: {"count": 0, "donated": 0, "wasted": 0})
    
    for item in items:
        cat = item.get("category", "Unknown")
        category_breakdown[cat]["count"] += 1
        
        if item.get("source") == "donation":
            category_breakdown[cat]["donated"] += 1
        
        # Check if expired (support both datetime and string timestamps)
        expiry = item.get("expiry_date")
        expiry_dt = _parse_datetime(expiry)
        if expiry_dt and expiry_dt < datetime.utcnow():
            category_breakdown[cat]["wasted"] += 1
    
    return {
        "categories": [
            {
                "name": cat,
                "total": data["count"],
                "donated": data["donated"],
                "wasted": data["wasted"],
                "used": data["count"] - data["donated"] - data["wasted"]
            }
            for cat, data in category_breakdown.items()
        ]
    }


@router.get("/trends")
async def get_trends(period: str = Query("weekly", regex="^(weekly|monthly|yearly)$")):
    """Get trend data for charts"""
    
    now = datetime.utcnow()
    
    if period == "weekly":
        start_date = now - timedelta(days=7)
        group_format = "%Y-%m-%d"
    elif period == "monthly":
        start_date = now - timedelta(days=30)
        group_format = "%Y-%m-%d"
    else:  # yearly
        start_date = now - timedelta(days=365)
        group_format = "%Y-%m"
    
    items = await collection.find({
        "created_at": {"$gte": start_date}
    }).to_list(length=None)
    
    trend_data = defaultdict(lambda: {"inventory": 0, "donations": 0})
    
    for item in items:
        created = _parse_datetime(item.get("created_at"))
        if created:
            date_key = created.strftime(group_format)
            if item.get("source") == "donation":
                trend_data[date_key]["donations"] += 1
            else:
                trend_data[date_key]["inventory"] += 1
    
    return {
        "period": period,
        "data": [
            {"date": date, "inventory": counts["inventory"], "donations": counts["donations"]}
            for date, counts in sorted(trend_data.items())
        ]
    }