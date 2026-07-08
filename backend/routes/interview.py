"""Interview Prep routes."""
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends

import ai_service
from database import db
from deps import get_current_user
from schemas import InterviewIn

router = APIRouter(prefix="/interview", tags=["interview"])


@router.post("/generate")
async def generate(body: InterviewIn, user: dict = Depends(get_current_user)):
    result = await ai_service.generate_interview_questions(
        body.role, body.experience, body.category, body.resume_text or ""
    )
    session = {
        "user_id": str(user["_id"]),
        "role": body.role, "experience": body.experience, "category": body.category,
        "result": result,
        "created_at": datetime.now(timezone.utc),
    }
    r = await db.interview_sessions.insert_one(session)
    return {"id": str(r.inserted_id), **result}


@router.get("/history")
async def history(user: dict = Depends(get_current_user)):
    docs = await db.interview_sessions.find(
        {"user_id": str(user["_id"])}
    ).sort("created_at", -1).limit(50).to_list(50)
    return [{
        "id": str(d["_id"]),
        "role": d["role"],
        "category": d["category"],
        "experience": d.get("experience", ""),
        "question_count": len((d.get("result", {}) or {}).get("questions", []) or []),
        "created_at": d["created_at"].isoformat(),
    } for d in docs]


@router.get("/{sid}")
async def get_session(sid: str, user: dict = Depends(get_current_user)):
    d = await db.interview_sessions.find_one({"_id": ObjectId(sid), "user_id": str(user["_id"])})
    if not d:
        raise HTTPException(404, "Not found")
    return {
        "id": str(d["_id"]),
        "role": d["role"], "category": d["category"],
        "experience": d.get("experience", ""),
        "result": d.get("result", {}),
        "created_at": d["created_at"].isoformat(),
    }
