# app/main.py
from fastapi import FastAPI
from app.routers import auth, inventory, browse
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import db

app = FastAPI()

origins = [
    "http://localhost:5173",  # if you're using Vite
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOW_ORIGINS,
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
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
app.include_router(browse.router, prefix="/browse", tags=["Browse"])
app.include_router(inventory.router)
