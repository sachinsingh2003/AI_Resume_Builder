"""Dashboard-summary route — aggregates for the /dashboard home page."""
from fastapi import APIRouter, Depends

from database import db
from deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
async def summary(user: dict = Depends(get_current_user)):
    uid = str(user["_id"])

    resume_count = await db.resumes.count_documents({"user_id": uid})
    ats_count = await db.ats_reports.count_documents({"user_id": uid})
    interview_count = await db.interview_sessions.count_documents({"user_id": uid})
    job_count = await db.jobs.count_documents({"user_id": uid})

    # Median-ish ATS score over the last 5 scans (rolling recent momentum).
    latest_ats = await db.ats_reports.find({"user_id": uid}).sort("created_at", -1).limit(5).to_list(5)
    avg_score = 0
    if latest_ats:
        scores = [(a.get("result", {}) or {}).get("score", 0) for a in latest_ats]
        avg_score = round(sum(scores) / max(len(scores), 1))

    pipeline = [{"$match": {"user_id": uid}}, {"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    stages = {row["_id"]: row["count"] async for row in db.jobs.aggregate(pipeline)}

    return {
        "resume_count": resume_count,
        "ats_count": ats_count,
        "interview_count": interview_count,
        "job_count": job_count,
        "avg_ats_score": avg_score,
        "job_stages": stages,
    }
