# your own feature file, work on this only on your own branch
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def browse_root():
    return {"message": "Browse router is working!"}
