import asyncio
from datetime import datetime, timedelta
from app.database import db
from motor.motor_asyncio import AsyncIOMotorClient


# ----------------------------------------------------
# CREATE UNIQUE INDEX (safe for old MongoDB)
# Prevents duplicate reminders ONLY for meal reminders
# ----------------------------------------------------
async def ensure_unique_indexes():
    try:
        await db.notifications.drop_index("unique_meal_reminder")
    except Exception:
        pass

    await db.notifications.create_index(
        [
            ("meal_entry_id", 1),
            ("notif_label", 1),
            ("user_id", 1),
            ("type", 1),
        ],
        unique=True,
        name="unique_meal_reminder",
        partialFilterExpression={
            "meal_entry_id": {"$exists": True},
            "notif_label": {"$exists": True},
            "user_id": {"$exists": True},
            "type": "meal_reminder",
        }
    )


# ----------------------------------------------------
# REMINDER LISTENER
# Generates EXACTLY one "1 hour" and one "1 day" reminder
# ----------------------------------------------------
async def start_meal_notifications_listener(app=None):

    await ensure_unique_indexes()

    while True:
        try:
            now = datetime.utcnow()

            entries = await db.meal_entries.find({
                "date": {"$gte": now.strftime("%Y-%m-%d")}
            }).to_list(length=None)

            for entry in entries:
                meal = entry.get("meal")
                if not meal:
                    continue

                user_id = entry.get("user_id")
                slot = entry.get("slot")
                day = entry.get("day")
                meal_name = meal.get("name")
                meal_date_str = entry.get("date")

                meal_date = datetime.fromisoformat(meal_date_str)
                meal_time = meal.get("time") or "12:00"
                hour, minute = map(int, meal_time.split(":"))
                meal_datetime = meal_date.replace(hour=hour, minute=minute)

                reminder_times = [
                    (meal_datetime - timedelta(days=1), "1 day before"),
                    (meal_datetime - timedelta(hours=1), "1 hour before")
                ]

                for reminder_time, label in reminder_times:

                    if reminder_time <= now:
                        continue

                    exists = await db.notifications.find_one({
                        "meal_entry_id": entry["_id"],
                        "notif_label": label,
                        "user_id": user_id,
                        "type": "meal_reminder"
                    })

                    if exists:
                        continue

                    try:
                        await db.notifications.insert_one({
                            "user_id": user_id,
                            "type": "meal_reminder",
                            "title": f"Upcoming meal: {meal_name}",
                            "message": f"{slot.title()} on {day} is planned ({label})",
                            "created_at": datetime.utcnow(),
                            "meal_entry_id": entry["_id"],
                            "notif_label": label,
                            "is_read": False,
                            "show_action": False
                        })
                    except Exception:
                        pass

            # Cleanup orphan reminders
            notifs = await db.notifications.find({
                "type": "meal_reminder"
            }).to_list(length=None)

            for notif in notifs:
                entry_id = notif.get("meal_entry_id")
                exists = await db.meal_entries.find_one({"_id": entry_id})
                if not exists:
                    await db.notifications.delete_one({"_id": notif["_id"]})

        except Exception as e:
            print("Error in meal notifications listener:", e)

        await asyncio.sleep(300)