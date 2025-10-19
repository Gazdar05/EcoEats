from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, inventory, browse, donation
from app.config import settings
from app.database import db

app = FastAPI(title="EcoEats FastAPI Backend")

# ✅ Proper CORS setup using .env origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,  # Loaded from .env
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Backend running with routers!"}

@app.get("/test-db")
async def test_db():
    collections = await db.list_collection_names()
    return {"collections": collections}

# ✅ Register routers
app.include_router(auth.router)
app.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
app.include_router(browse.router, prefix="/browse", tags=["Browse"])
app.include_router(donation.router, prefix="/donations", tags=["Donations"])