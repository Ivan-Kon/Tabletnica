from fastapi import APIRouter, HTTPException
from backend.src.session import SessionDep
from backend.src.pillboxes.crud import get_pillboxes, get_pillbox
from backend.src.pillboxes.schemas import PillboxesOutSchema

router = APIRouter(prefix="/pillboxes", tags=["pillboxes"])

@router.get("/get_all", response_model=list[PillboxesOutSchema])
async def get_all(session: SessionDep):
    return await get_pillboxes(session)

@router.get("/get/{pillbox_id}", response_model=PillboxesOutSchema)
async def get_one(pillbox_id: int, session: SessionDep):
    box = await get_pillbox(session, pillbox_id)
    if box is None:
        raise HTTPException(404, "Pillbox not found")
    return box
