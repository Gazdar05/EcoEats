# app/utils.py
from datetime import date, datetime
from bson import ObjectId
from typing import Any

def to_objectid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except Exception:
        raise ValueError("Invalid ObjectId")

def food_status_from_date(expiry_date: str | date | None) -> str:
    """
    Matches front-end logic:
    - if expiry in past -> "Expired"
    - if <=3 days -> "Expiring Soon"
    - else -> "Fresh"
    expiry_date can be ISO 'YYYY-MM-DD' or date object or None.
    """
    if not expiry_date:
        return "Fresh"
    if isinstance(expiry_date, str):
        # parse YYYY-MM-DD
        try:
            expiry = datetime.strptime(expiry_date, "%Y-%m-%d").date()
        except Exception:
            try:
                expiry = datetime.fromisoformat(expiry_date).date()
            except Exception:
                return "Fresh"
    elif isinstance(expiry_date, date):
        expiry = expiry_date
    else:
        return "Fresh"

    today = date.today()
    diff_days = (expiry - today).days
    if diff_days < 0:
        return "Expired"
    elif diff_days <= 3:
        return "Expiring Soon"
    else:
        return "Fresh"