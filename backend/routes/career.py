"""AI Career Advisor routes."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends

import ai_service
from database import db
from deps import get_current_user
from schemas import CareerIn

router = APIRouter(prefix="/career", tags=["career"])


@router.post("/advice")
async def advice(body: CareerIn, user: dict = Depends(get_current_user)):
    result = await ai_service.career_advice(body.model_dump())
    await db.career_advice.insert_one({
        "user_id": str(user["_id"]),
        "input": body.model_dump(),
        "result": result,
        "created_at": datetime.now(timezone.utc),
    })
    return result
