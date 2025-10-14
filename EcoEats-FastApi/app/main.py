from fastapi import FastAPI
from app.routers import auth, inventory, browse, donation
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import db

app = FastAPI()

# ✅ Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
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

# Attach routers
app.include_router(auth.router)
app.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
app.include_router(browse.router, prefix="/browse", tags=["Browse"])
app.include_router(donation.router, prefix="/donations", tags=["Donations"])