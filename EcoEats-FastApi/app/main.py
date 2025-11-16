from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import db
from app.routers import auth, inventory, browse, donation, mealplan, analytics, notifications
from app.routers.mealplan_templates import router as mealplan_templates_router

# Listeners
import asyncio
from app.listeners.user_events import user_event_listener
from app.listeners.meal_notifications import start_meal_notifications_listener

app = FastAPI(title="EcoEats Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------
# Routes
# ----------------------
app.include_router(auth.router)
app.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
app.include_router(browse.router, prefix="/browse", tags=["Browse"])
app.include_router(donation.router, prefix="/donations", tags=["Donations"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
app.include_router(mealplan.router)
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
app.include_router(mealplan_templates_router, prefix="/mealplan-templates", tags=["Mealplan Templates"])

# ----------------------
# Startup Event: Run Listeners
# ----------------------
@app.on_event("startup")
async def startup_listeners():
    """
    Run both background listeners:
    1. user_event_listener -> handles signup/login notifications
    2. start_meal_notifications_listener -> handles meal reminders
    """
    asyncio.create_task(user_event_listener())
    asyncio.create_task(start_meal_notifications_listener(app))