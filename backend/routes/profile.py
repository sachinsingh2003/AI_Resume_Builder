"""Profile and account-security routes."""
from fastapi import APIRouter, HTTPException, Depends

from database import db
from deps import get_current_user, public_user
from security import hash_pw, verify_pw

router = APIRouter(prefix="/profile", tags=["profile"])

_UPDATABLE = {"name", "phone", "location", "headline", "linkedin", "website", "bio"}


@router.put("")
async def update_profile(body: dict, user: dict = Depends(get_current_user)):
    updates = {k: body[k] for k in _UPDATABLE if k in body}
    if updates:
        await db.users.update_one({"_id": user["_id"]}, {"$set": updates})
    fresh = await db.users.find_one({"_id": user["_id"]})
    return public_user(fresh)


@router.post("/change-password")
async def change_password(body: dict, user: dict = Depends(get_current_user)):
    if not verify_pw(body.get("current_password", ""), user["password_hash"]):
        raise HTTPException(400, "Current password is incorrect")
    new_pw = body.get("new_password", "")
    if len(new_pw) < 6:
        raise HTTPException(400, "New password must be 6+ chars")
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"password_hash": hash_pw(new_pw)}})
    return {"ok": True}
