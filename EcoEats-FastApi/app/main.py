# app/main.py
from fastapi import FastAPI
from app.routers import auth, inventory, browse

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Backend running with routers!"}

# Attach routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
app.include_router(browse.router, prefix="/browse", tags=["Browse"])
