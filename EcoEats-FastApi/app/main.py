from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import db
from app.routers import auth, inventory, browse, donation, mealplan, analytics, notifications
from app.routers.mealplan_templates import router as mealplan_templates_router
 
app = FastAPI(title="EcoEats Backend")
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# KEEP ALL WORKING ROUTES
app.include_router(auth.router)
app.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
app.include_router(browse.router, prefix="/browse", tags=["Browse"])
app.include_router(donation.router, prefix="/donations", tags=["Donations"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
app.include_router(mealplan.router)
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])