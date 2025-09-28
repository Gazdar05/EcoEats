# your own feature file, work on this only on your own branch
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def inventory_root():
    return {"message": "Inventory router is working!"}
