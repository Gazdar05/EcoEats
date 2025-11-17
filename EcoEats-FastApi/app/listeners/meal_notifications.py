import asyncio
from datetime import datetime, timedelta
from app.database import db

# ----------------------------------------------------
# CREATE UNIQUE INDEXES (run on startup)
# ----------------------------------------------------
async def ensure_unique_indexes():
    try:
        await db.notifications.drop_index("unique_meal_reminder")
    except Exception:
        pass

    try:
        await db.notifications.drop_index("unique_meal_activity")
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

    await db.notifications.create_index(
        [
            ("meal_entry_id", 1),
            ("user_id", 1),
            ("type", 1),
        ],
        unique=True,
        name="unique_meal_activity",
        partialFilterExpression={
            "meal_entry_id": {"$exists": True},
            "user_id": {"$exists": True},
            "type": "meal_activity",
        }
    )


# ----------------------------------------------------
# LISTENER: create reminders for future meal_entries
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
                # -----------------------------------------------------------------
                # FIX #1: STOP processing if the meal entry was deleted meanwhile
                # -----------------------------------------------------------------
                entry_exists = await db.meal_entries.find_one({"_id": entry["_id"]})
                if not entry_exists:
                    continue

                meal = entry.get("meal")
                if not meal:
                    continue

                user_id = entry.get("user_id")
                slot = entry.get("slot")
                day = entry.get("day")
                meal_name = meal.get("name")

                meal_date_str = entry.get("date")
                try:
                    meal_date = datetime.fromisoformat(meal_date_str)
                except Exception:
                    continue

                meal_time = meal.get("time") or "12:00"
                try:
                    hour, minute = map(int, meal_time.split(":"))
                except Exception:
                    hour, minute = 12, 0

                meal_datetime = meal_date.replace(hour=hour, minute=minute)

                reminders = [
                    (meal_datetime - timedelta(days=1), "1 day before"),
                    (meal_datetime - timedelta(hours=1), "1 hour before")
                ]

                for send_at, label in reminders:
                    if send_at <= now:
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
                            "title": f"Meal reminder: {meal_name}",
                            "message": f"{slot.title()} on {day} ({label})",
                            "created_at": datetime.utcnow(),
                            "send_at": send_at,
                            "meal_entry_id": entry["_id"],
                            "notif_label": label,
                            "is_read": False,
                            "show_action": False
                        })
                    except Exception:
                        pass

            # ---------------------------------------------------------------
            # FIX #2: Cleanup ALL old notifications for deleted meals
            # ---------------------------------------------------------------
            reminders = await db.notifications.find({
                "meal_entry_id": {"$exists": True}
            }).to_list(length=None)

            for notif in reminders:
                entry_id = notif.get("meal_entry_id")
                if not entry_id:
                    continue

                entry_exists = await db.meal_entries.find_one({"_id": entry_id})
                if not entry_exists:
                    await db.notifications.delete_one({"_id": notif["_id"]})

        except Exception as e:
            print("Error in meal notifications listener:", e)

        await asyncio.sleep(60)