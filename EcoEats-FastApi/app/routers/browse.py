# app/routers/browse.py
from fastapi import APIRouter
from app.database import db

router = APIRouter()

# --- Browse inventory items (with optional filters) ---
@router.get("/inventory")
async def browse_inventory(category: str = None, expiry: str = None):
    query = {}
    if category:
        query["fc_cat_id"] = category
    # expiry filtering can be added later

    items = []
    async for i in db.food_items.find(query):
        i["_id"] = str(i["_id"])
        items.append(i)
    return items

# --- Browse donation listings ---
@router.get("/donations")
async def browse_donations():
    donations = []
    async for d in db.donation_listings.find({"don_status": "open"}):
        d["_id"] = str(d["_id"])
        donations.append(d)
    return donations
