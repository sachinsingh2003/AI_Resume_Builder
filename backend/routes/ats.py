"""ATS Checker routes."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, UploadFile, File, Form

import ai_service
from database import db
from deps import get_current_user
from schemas import ATSIn

router = APIRouter(prefix="/ats", tags=["ats"])


async def _persist_report(user_id: str, resume_text: str, jd: str, result: dict, filename: str = None):
    await db.ats_reports.insert_one({
        "user_id": user_id,
        "resume_text": resume_text[:20000],
        "job_description": (jd or "")[:10000],
        "result": result,
        "filename": filename,
        "created_at": datetime.now(timezone.utc),
    })


@router.post("/analyze")
async def analyze(body: ATSIn, user: dict = Depends(get_current_user)):
    result = await ai_service.analyze_ats(body.resume_text, body.job_description or "")
    await _persist_report(str(user["_id"]), body.resume_text, body.job_description or "", result)
    return result


@router.post("/upload")
async def upload(
    file: UploadFile = File(...),
    job_description: str = Form(""),
    user: dict = Depends(get_current_user),
):
    """Accept text/PDF-extracted-as-text uploads. For robust PDF parsing,
    the frontend can strip text client-side and POST /analyze instead."""
    content = (await file.read()).decode("utf-8", errors="ignore")
    result = await ai_service.analyze_ats(content, job_description or "")
    await _persist_report(str(user["_id"]), content, job_description or "", result, file.filename)
    return result


@router.get("/history")
async def history(user: dict = Depends(get_current_user)):
    docs = await db.ats_reports.find({"user_id": str(user["_id"])}).sort("created_at", -1).limit(50).to_list(50)
    return [{
        "id": str(d["_id"]),
        "score": (d.get("result", {}) or {}).get("score", 0),
        "filename": d.get("filename"),
        "created_at": d["created_at"].isoformat(),
    } for d in docs]
