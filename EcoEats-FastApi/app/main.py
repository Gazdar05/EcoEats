from fastapi import FastAPI
from .routers import browse, inventory, auth

app = FastAPI(title="EcoEats API")

# include routers (placeholders for now)
app.include_router(browse.router, prefix="/browse", tags=["Browse"])
app.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])

@app.get("/")
def root():
    return {"message": "Backend is running!"}
