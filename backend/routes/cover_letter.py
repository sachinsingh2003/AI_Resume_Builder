"""Cover-Letter Generator routes."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends

import ai_service
from database import db
from deps import get_current_user
from schemas import CoverLetterIn

router = APIRouter(prefix="/cover-letter", tags=["cover-letter"])


@router.post("/generate")
async def generate(body: CoverLetterIn, user: dict = Depends(get_current_user)):
    result = await ai_service.generate_cover_letter(
        body.resume_text, body.job_description, body.company, body.role
    )
    await db.cover_letters.insert_one({
        "user_id": str(user["_id"]),
        "input": body.model_dump(),
        "result": result,
        "created_at": datetime.now(timezone.utc),
    })
    return result
