# app/main.py
from fastapi import FastAPI
from app.routers import auth, inventory, browse
from app.database import db
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os

app = FastAPI()
# ✅ Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify ["http://localhost:5173"]
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

# ✅ Directory where you keep images
IMAGE_DIR = "images"  # relative to your backend root folder

@app.get("/images/{filename}")
async def get_image(filename: str):
    file_path = os.path.join(IMAGE_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return {"error": "Image not found"}

# ✅ Only include router without extra prefix
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
app.include_router(browse.router)  
