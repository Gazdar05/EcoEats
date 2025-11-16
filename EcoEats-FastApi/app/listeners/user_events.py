import asyncio
from datetime import datetime
from bson import ObjectId
from app.database import db
from app.routers.notifications import create_system_notification

async def user_event_listener():
    """
    Listen for inserts and updates in household_users and create notifications.
    """

    pipeline = [{"$match": {"operationType": {"$in": ["insert", "update"]}}}]

    while True:
        try:
            # Use full_document="updateLookup" so we can access full document on update
            async with db.household_users.watch(pipeline, full_document="updateLookup") as stream:
                async for change in stream:
                    # ---------------------------
                    # NEW USER REGISTERED
                    # ---------------------------
                    if change["operationType"] == "insert":
                        full_name = change["fullDocument"].get("full_name", "New User")
                        await create_system_notification(
                            title="New User Signup",
                            message=f"{full_name} has registered an account."
                        )

                    # ---------------------------
                    # USER LOGGED IN
                    # ---------------------------
                    if change["operationType"] == "update":
                        updated_fields = change.get("updateDescription", {}).get("updatedFields", {})

                        if "last_login_at" in updated_fields:
                            user_doc = change.get("fullDocument")
                            if user_doc:
                                email = user_doc.get("email", "Unknown user")
                                await create_system_notification(
                                    title="User Login",
                                    message=f"{email} logged in."
                                )

        except Exception as e:
            print("User event listener stopped:", e)
            # Sleep before restarting to prevent infinite rapid restart loop
            await asyncio.sleep(5)