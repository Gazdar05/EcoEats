from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import db
from app.routers import auth, inventory, browse, donation, notifications

app = FastAPI(title="EcoEats Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Backend running successfully"}

@app.get("/test-db")
async def test_db():
    collections = await db.list_collection_names()
    return {"collections": collections}

app.include_router(auth.router)
app.include_router(inventory.router, prefix="/inventory")
app.include_router(browse.router, prefix="/browse")
app.include_router(donation.router, prefix="/donations")
app.include_router(notifications.router, prefix="/notifications")