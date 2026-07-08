"""Job Tracker routes."""
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends

from database import db
from deps import get_current_user
from schemas import JobIn

router = APIRouter(prefix="/jobs", tags=["jobs"])

_KEYS = ["company", "role", "status", "location", "salary", "notes", "link", "reminder_at"]


@router.get("")
async def list_jobs(user: dict = Depends(get_current_user)):
    docs = await db.jobs.find({"user_id": str(user["_id"])}).sort("created_at", -1).to_list(500)
    return [{
        "id": str(d["_id"]),
        **{k: d.get(k, "") for k in _KEYS},
        "created_at": d["created_at"].isoformat() if isinstance(d.get("created_at"), datetime) else d.get("created_at"),
    } for d in docs]


@router.post("")
async def create_job(body: JobIn, user: dict = Depends(get_current_user)):
    doc = {"user_id": str(user["_id"]), **body.model_dump(),
           "created_at": datetime.now(timezone.utc)}
    r = await db.jobs.insert_one(doc)
    return {"id": str(r.inserted_id), **body.model_dump(), "created_at": doc["created_at"].isoformat()}


@router.put("/{jid}")
async def update_job(jid: str, body: JobIn, user: dict = Depends(get_current_user)):
    r = await db.jobs.update_one(
        {"_id": ObjectId(jid), "user_id": str(user["_id"])},
        {"$set": body.model_dump()},
    )
    if r.matched_count == 0:
        raise HTTPException(404, "Not found")
    return {"id": jid, **body.model_dump()}


@router.delete("/{jid}")
async def delete_job(jid: str, user: dict = Depends(get_current_user)):
    r = await db.jobs.delete_one({"_id": ObjectId(jid), "user_id": str(user["_id"])})
    if r.deleted_count == 0:
        raise HTTPException(404, "Not found")
    return {"ok": True}
