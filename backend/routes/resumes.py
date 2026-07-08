"""Resume Builder routes + one AI-improve helper."""
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends

import ai_service
from database import db
from deps import get_current_user
from schemas import ResumeIn

router = APIRouter(prefix="/resumes", tags=["resumes"])


def _serialize(d: dict) -> dict:
    return {
        "id": str(d["_id"]),
        "title": d["title"],
        "template": d.get("template", "modern"),
        "data": d.get("data", {}),
        "updated_at": d["updated_at"].isoformat() if isinstance(d.get("updated_at"), datetime) else d.get("updated_at"),
    }


@router.get("")
async def list_resumes(user: dict = Depends(get_current_user)):
    docs = await db.resumes.find({"user_id": str(user["_id"])}).sort("updated_at", -1).to_list(200)
    return [_serialize(d) for d in docs]


@router.post("")
async def create_resume(body: ResumeIn, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    doc = {"user_id": str(user["_id"]), **body.model_dump(),
           "created_at": now, "updated_at": now}
    r = await db.resumes.insert_one(doc)
    return {"id": str(r.inserted_id), **body.model_dump(), "updated_at": now.isoformat()}


@router.get("/{rid}")
async def get_resume(rid: str, user: dict = Depends(get_current_user)):
    d = await db.resumes.find_one({"_id": ObjectId(rid), "user_id": str(user["_id"])})
    if not d:
        raise HTTPException(404, "Not found")
    return _serialize(d)


@router.put("/{rid}")
async def update_resume(rid: str, body: ResumeIn, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    r = await db.resumes.update_one(
        {"_id": ObjectId(rid), "user_id": str(user["_id"])},
        {"$set": {**body.model_dump(), "updated_at": now}},
    )
    if r.matched_count == 0:
        raise HTTPException(404, "Not found")
    return {"id": rid, **body.model_dump(), "updated_at": now.isoformat()}


@router.delete("/{rid}")
async def delete_resume(rid: str, user: dict = Depends(get_current_user)):
    r = await db.resumes.delete_one({"_id": ObjectId(rid), "user_id": str(user["_id"])})
    if r.deleted_count == 0:
        raise HTTPException(404, "Not found")
    return {"ok": True}


@router.post("/improve")
async def improve_resume(body: dict, user: dict = Depends(get_current_user)):
    """AI-rewrite pass. Body: {resume_text: str, target_role?: str}. The
    frontend serializes the resume JSON into resume_text before calling."""
    return await ai_service.improve_resume(body.get("resume_text", ""), body.get("target_role", ""))
