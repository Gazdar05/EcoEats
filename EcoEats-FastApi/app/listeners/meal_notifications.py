import asyncio
from datetime import datetime, timedelta
from app.database import db

async def start_meal_notifications_listener(app=None):
    """
    Continuously monitors upcoming meals and creates notifications:
    - 1 day before meal
    - 1 hour before meal
    Ensures only **one notification per meal per reminder type**.
    Also deletes reminders for removed meals.
    """
    while True:
        try:
            now = datetime.utcnow()

            # Fetch all meal entries that are in the future (date + time)
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
                meal_date_str = entry.get("date")  # YYYY-MM-DD
                meal_date = datetime.fromisoformat(meal_date_str)

                # Default: 12:00 noon if no time provided
                meal_time = meal.get("time") or "12:00"
                hour, minute = map(int, meal_time.split(":"))
                meal_datetime = meal_date.replace(hour=hour, minute=minute)

                # Calculate 1 day and 1 hour before
                notif_times = [
                    (meal_datetime - timedelta(days=1), "1 day before"),
                    (meal_datetime - timedelta(hours=1), "1 hour before")
                ]

                for notif_time, label in notif_times:
                    # Only create notifications that haven't passed yet
                    if notif_time > now:
                        # Ensure **one notification per meal per reminder type**
                        exists = await db.notifications.find_one({
                            "user_id": user_id,
                            "type": "meal_reminder",
                            "meal_entry_id": entry["_id"],
                            "notif_label": label
                        })
                        if not exists:
                            await db.notifications.insert_one({
                                "user_id": user_id,
                                "type": "meal_reminder",
                                "title": f"Upcoming meal: {meal_name}",
                                "message": f"{slot.title()} on {day} is planned ({label})",
                                "created_at": datetime.utcnow(),
                                "meal_entry_id": entry["_id"],
                                "notif_label": label,
                                "is_read": False,
                                "show_action": False,
                                "action_label": None,
                                "action_link": None
                            })

            # Delete notifications for meals that were removed
            all_notifs = await db.notifications.find({"type": "meal_reminder"}).to_list(length=None)
            for notif in all_notifs:
                meal_entry_id = notif.get("meal_entry_id")
                exists = await db.meal_entries.find_one({"_id": meal_entry_id})
                if not exists:
                    await db.notifications.delete_one({"_id": notif["_id"]})

        except Exception as e:
            print("Error in meal notifications listener:", e)

        # Run every 5 minutes
        await asyncio.sleep(300)