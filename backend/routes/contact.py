"""Public contact-form route."""
from datetime import datetime, timezone
from fastapi import APIRouter

from database import db
from schemas import ContactIn

router = APIRouter(tags=["contact"])


@router.post("/contact")
async def contact(body: ContactIn):
    await db.contact_messages.insert_one({
        **body.model_dump(),
        "created_at": datetime.now(timezone.utc),
    })
    return {"ok": True}
