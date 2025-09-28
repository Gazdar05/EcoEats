# your own feature file, work on this only on your own branch
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def auth_root():
    return {"message": "Auth router is working!"}
