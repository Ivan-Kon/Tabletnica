from fastapi import APIRouter

from backend.src.session import SessionDep
from backend.src.pillboxes.crud import get_pillboxes

router = APIRouter(
    prefix="/pillboxes",
    tags=["pillboxes"],
)

@router.get("/get_all")
async def get_all(session: SessionDep):

    pillboxes = await get_pillboxes(session)
    return pillboxes