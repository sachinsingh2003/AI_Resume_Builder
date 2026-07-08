"""CareerForge API — FastAPI backend.

All routes are grouped under a single `/api` router (Kubernetes ingress rule).
Auth uses JWT httpOnly cookies + Authorization header fallback (see auth
playbook). AI features delegate to ai_service.py.

Structure:
- Models (Pydantic) at top
- Auth helpers and endpoints
- Feature endpoints (resumes, ATS, interview, career, cover letters, jobs, profile)
- Startup: seed admin, ensure indexes
"""
import os
import io
import json
import uuid
import logging
import secrets
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import List, Optional, Dict, Any

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

import bcrypt
import jwt
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

import ai_service

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# ---------- DB ----------
mongo_client = AsyncIOMotorClient(os.environ["MONGO_URL"], tz_aware=True)
db = mongo_client[os.environ["DB_NAME"]]

app = FastAPI(title="CareerForge API")
api = APIRouter(prefix="/api")

JWT_ALGO = "HS256"
ACCESS_TTL_MIN = 60 * 24  # 1 day for smoother UX in dev
REFRESH_TTL_DAYS = 7


# ---------- Auth helpers ----------
def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_access_token(uid: str, email: str, role: str) -> str:
    payload = {
        "sub": uid,
        "email": email,
        "role": role,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TTL_MIN),
    }
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGO)


def create_refresh_token(uid: str) -> str:
    payload = {
        "sub": uid,
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TTL_DAYS),
    }
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGO)


def set_auth_cookies(resp: Response, access: str, refresh: str):
    resp.set_cookie("access_token", access, httponly=True, secure=False,
                    samesite="lax", max_age=ACCESS_TTL_MIN * 60, path="/")
    resp.set_cookie("refresh_token", refresh, httponly=True, secure=False,
                    samesite="lax", max_age=REFRESH_TTL_DAYS * 86400, path="/")


def public_user(u: dict) -> dict:
    return {
        "id": str(u["_id"]),
        "email": u["email"],
        "name": u.get("name", ""),
        "role": u.get("role", "user"),
        "created_at": u.get("created_at", datetime.now(timezone.utc)).isoformat()
                       if isinstance(u.get("created_at"), datetime) else u.get("created_at"),
    }


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGO])
        if payload.get("type") != "access":
            raise HTTPException(401, "Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(401, "User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    return user


# ---------- Pydantic schemas ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ForgotIn(BaseModel):
    email: EmailStr


class ResetIn(BaseModel):
    token: str
    password: str = Field(min_length=6)


class ResumeIn(BaseModel):
    title: str
    template: str = "modern"
    data: Dict[str, Any] = {}


class ATSIn(BaseModel):
    resume_text: str
    job_description: Optional[str] = ""


class InterviewIn(BaseModel):
    role: str
    experience: str = "mid"
    category: str = "HR"  # HR | Technical | Behavioral | Coding
    resume_text: Optional[str] = ""


class CareerIn(BaseModel):
    current_role: str = ""
    target_role: str = ""
    skills: List[str] = []
    years_experience: float = 0
    education: str = ""
    location: str = ""


class CoverLetterIn(BaseModel):
    resume_text: str
    job_description: str
    company: str
    role: str


class JobIn(BaseModel):
    company: str
    role: str
    status: str = "Applied"  # Applied|OA|Interview|HR|Offer|Rejected|Joined
    location: str = ""
    salary: str = ""
    notes: str = ""
    link: str = ""
    reminder_at: Optional[str] = None


class ContactIn(BaseModel):
    name: str
    email: EmailStr
    message: str


# ---------- Auth endpoints ----------
@api.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already registered")
    doc = {
        "email": email,
        "password_hash": hash_pw(body.password),
        "name": body.name,
        "role": "user",
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    access = create_access_token(str(result.inserted_id), email, "user")
    refresh = create_refresh_token(str(result.inserted_id))
    set_auth_cookies(response, access, refresh)
    return {"user": public_user(doc), "access_token": access}


@api.post("/auth/login")
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.lower()
    ident = f"{request.client.host}:{email}"
    now = datetime.now(timezone.utc)
    # brute force check
    la = await db.login_attempts.find_one({"identifier": ident})
    if la and la.get("locked_until") and la["locked_until"] > now:
        raise HTTPException(429, "Too many attempts. Try again later.")

    user = await db.users.find_one({"email": email})
    if not user or not verify_pw(body.password, user["password_hash"]):
        # increment attempts
        attempts = (la or {}).get("count", 0) + 1
        upd = {"count": attempts, "identifier": ident, "updated_at": now}
        if attempts >= 5:
            upd["locked_until"] = now + timedelta(minutes=15)
            upd["count"] = 0
        await db.login_attempts.update_one({"identifier": ident}, {"$set": upd}, upsert=True)
        raise HTTPException(401, "Invalid credentials")

    await db.login_attempts.delete_one({"identifier": ident})
    access = create_access_token(str(user["_id"]), email, user.get("role", "user"))
    refresh = create_refresh_token(str(user["_id"]))
    set_auth_cookies(response, access, refresh)
    return {"user": public_user(user), "access_token": access}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"user": public_user(user)}


@api.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    tok = request.cookies.get("refresh_token")
    if not tok:
        raise HTTPException(401, "No refresh token")
    try:
        payload = jwt.decode(tok, os.environ["JWT_SECRET"], algorithms=[JWT_ALGO])
        if payload.get("type") != "refresh":
            raise HTTPException(401, "Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(401, "User not found")
        access = create_access_token(str(user["_id"]), user["email"], user.get("role", "user"))
        response.set_cookie("access_token", access, httponly=True, secure=False,
                            samesite="lax", max_age=ACCESS_TTL_MIN * 60, path="/")
        return {"access_token": access}
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid refresh token")


@api.post("/auth/forgot-password")
async def forgot_password(body: ForgotIn):
    user = await db.users.find_one({"email": body.email.lower()})
    # Do not reveal existence
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one({
            "token": token,
            "user_id": str(user["_id"]),
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
            "used": False,
        })
        reset_link = f"{os.environ.get('FRONTEND_URL', '')}/reset-password?token={token}"
        logger.info("Password reset link for %s: %s", body.email, reset_link)
        # In production, send email. For dev return token for testing.
        return {"ok": True, "reset_token_dev": token}
    return {"ok": True}


@api.post("/auth/reset-password")
async def reset_password(body: ResetIn):
    rec = await db.password_reset_tokens.find_one({"token": body.token})
    if not rec or rec.get("used") or rec["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(400, "Invalid or expired token")
    await db.users.update_one(
        {"_id": ObjectId(rec["user_id"])},
        {"$set": {"password_hash": hash_pw(body.password)}}
    )
    await db.password_reset_tokens.update_one({"token": body.token}, {"$set": {"used": True}})
    return {"ok": True}


# ---------- Resume Builder ----------
@api.get("/resumes")
async def list_resumes(user: dict = Depends(get_current_user)):
    docs = await db.resumes.find({"user_id": str(user["_id"])}).sort("updated_at", -1).to_list(200)
    return [{
        "id": str(d["_id"]), "title": d["title"], "template": d.get("template", "modern"),
        "data": d.get("data", {}),
        "updated_at": d["updated_at"].isoformat() if isinstance(d.get("updated_at"), datetime) else d.get("updated_at")
    } for d in docs]


@api.post("/resumes")
async def create_resume(body: ResumeIn, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    doc = {
        "user_id": str(user["_id"]), "title": body.title, "template": body.template,
        "data": body.data, "created_at": now, "updated_at": now,
    }
    r = await db.resumes.insert_one(doc)
    return {"id": str(r.inserted_id), **body.model_dump(), "updated_at": now.isoformat()}


@api.get("/resumes/{rid}")
async def get_resume(rid: str, user: dict = Depends(get_current_user)):
    d = await db.resumes.find_one({"_id": ObjectId(rid), "user_id": str(user["_id"])})
    if not d:
        raise HTTPException(404, "Not found")
    return {"id": str(d["_id"]), "title": d["title"], "template": d.get("template"),
            "data": d.get("data", {}),
            "updated_at": d["updated_at"].isoformat() if isinstance(d.get("updated_at"), datetime) else d.get("updated_at")}


@api.put("/resumes/{rid}")
async def update_resume(rid: str, body: ResumeIn, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    r = await db.resumes.update_one(
        {"_id": ObjectId(rid), "user_id": str(user["_id"])},
        {"$set": {"title": body.title, "template": body.template, "data": body.data, "updated_at": now}}
    )
    if r.matched_count == 0:
        raise HTTPException(404, "Not found")
    return {"id": rid, **body.model_dump(), "updated_at": now.isoformat()}


@api.delete("/resumes/{rid}")
async def delete_resume(rid: str, user: dict = Depends(get_current_user)):
    r = await db.resumes.delete_one({"_id": ObjectId(rid), "user_id": str(user["_id"])})
    if r.deleted_count == 0:
        raise HTTPException(404, "Not found")
    return {"ok": True}


@api.post("/resumes/improve")
async def improve_resume_endpoint(body: dict, user: dict = Depends(get_current_user)):
    text = body.get("resume_text", "")
    role = body.get("target_role", "")
    result = await ai_service.improve_resume(text, role)
    return result


# ---------- ATS Checker ----------
@api.post("/ats/analyze")
async def ats_analyze(body: ATSIn, user: dict = Depends(get_current_user)):
    result = await ai_service.analyze_ats(body.resume_text, body.job_description or "")
    # persist
    await db.ats_reports.insert_one({
        "user_id": str(user["_id"]),
        "resume_text": body.resume_text[:20000],
        "job_description": (body.job_description or "")[:10000],
        "result": result,
        "created_at": datetime.now(timezone.utc),
    })
    return result


@api.post("/ats/upload")
async def ats_upload(file: UploadFile = File(...), job_description: str = Form(""),
                    user: dict = Depends(get_current_user)):
    """Accept a text/plain or PDF-extracted text upload. For robust PDF parsing
    the frontend extracts text client-side and posts to /ats/analyze."""
    content = (await file.read()).decode("utf-8", errors="ignore")
    result = await ai_service.analyze_ats(content, job_description or "")
    await db.ats_reports.insert_one({
        "user_id": str(user["_id"]),
        "resume_text": content[:20000],
        "job_description": (job_description or "")[:10000],
        "result": result,
        "filename": file.filename,
        "created_at": datetime.now(timezone.utc),
    })
    return result


@api.get("/ats/history")
async def ats_history(user: dict = Depends(get_current_user)):
    docs = await db.ats_reports.find({"user_id": str(user["_id"])}).sort("created_at", -1).limit(50).to_list(50)
    return [{
        "id": str(d["_id"]),
        "score": (d.get("result", {}) or {}).get("score", 0),
        "filename": d.get("filename"),
        "created_at": d["created_at"].isoformat(),
    } for d in docs]


# ---------- Interview Prep ----------
@api.post("/interview/generate")
async def interview_generate(body: InterviewIn, user: dict = Depends(get_current_user)):
    result = await ai_service.generate_interview_questions(
        body.role, body.experience, body.category, body.resume_text or ""
    )
    session_doc = {
        "user_id": str(user["_id"]),
        "role": body.role, "experience": body.experience, "category": body.category,
        "result": result,
        "created_at": datetime.now(timezone.utc),
    }
    r = await db.interview_sessions.insert_one(session_doc)
    return {"id": str(r.inserted_id), **result}


@api.get("/interview/history")
async def interview_history(user: dict = Depends(get_current_user)):
    docs = await db.interview_sessions.find({"user_id": str(user["_id"])}).sort("created_at", -1).limit(50).to_list(50)
    return [{
        "id": str(d["_id"]), "role": d["role"], "category": d["category"],
        "experience": d.get("experience", ""),
        "question_count": len((d.get("result", {}) or {}).get("questions", []) or []),
        "created_at": d["created_at"].isoformat(),
    } for d in docs]


@api.get("/interview/{sid}")
async def interview_get(sid: str, user: dict = Depends(get_current_user)):
    d = await db.interview_sessions.find_one({"_id": ObjectId(sid), "user_id": str(user["_id"])})
    if not d:
        raise HTTPException(404, "Not found")
    return {"id": str(d["_id"]), "role": d["role"], "category": d["category"],
            "experience": d.get("experience", ""), "result": d.get("result", {}),
            "created_at": d["created_at"].isoformat()}


# ---------- Career Advisor ----------
@api.post("/career/advice")
async def career_advice_endpoint(body: CareerIn, user: dict = Depends(get_current_user)):
    result = await ai_service.career_advice(body.model_dump())
    await db.career_advice.insert_one({
        "user_id": str(user["_id"]),
        "input": body.model_dump(),
        "result": result,
        "created_at": datetime.now(timezone.utc),
    })
    return result


# ---------- Cover Letter ----------
@api.post("/cover-letter/generate")
async def cover_letter_endpoint(body: CoverLetterIn, user: dict = Depends(get_current_user)):
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


# ---------- Job Tracker ----------
@api.get("/jobs")
async def list_jobs(user: dict = Depends(get_current_user)):
    docs = await db.jobs.find({"user_id": str(user["_id"])}).sort("created_at", -1).to_list(500)
    return [{
        "id": str(d["_id"]),
        **{k: d.get(k, "") for k in ["company", "role", "status", "location", "salary", "notes", "link", "reminder_at"]},
        "created_at": d["created_at"].isoformat() if isinstance(d.get("created_at"), datetime) else d.get("created_at"),
    } for d in docs]


@api.post("/jobs")
async def create_job(body: JobIn, user: dict = Depends(get_current_user)):
    doc = {"user_id": str(user["_id"]), **body.model_dump(),
           "created_at": datetime.now(timezone.utc)}
    r = await db.jobs.insert_one(doc)
    return {"id": str(r.inserted_id), **body.model_dump(),
            "created_at": doc["created_at"].isoformat()}


@api.put("/jobs/{jid}")
async def update_job(jid: str, body: JobIn, user: dict = Depends(get_current_user)):
    r = await db.jobs.update_one(
        {"_id": ObjectId(jid), "user_id": str(user["_id"])},
        {"$set": body.model_dump()}
    )
    if r.matched_count == 0:
        raise HTTPException(404, "Not found")
    return {"id": jid, **body.model_dump()}


@api.delete("/jobs/{jid}")
async def delete_job(jid: str, user: dict = Depends(get_current_user)):
    r = await db.jobs.delete_one({"_id": ObjectId(jid), "user_id": str(user["_id"])})
    if r.deleted_count == 0:
        raise HTTPException(404, "Not found")
    return {"ok": True}


# ---------- Profile / Settings ----------
@api.put("/profile")
async def update_profile(body: dict, user: dict = Depends(get_current_user)):
    updatable = {k: body[k] for k in ["name", "phone", "location", "headline", "linkedin", "website", "bio"] if k in body}
    if updatable:
        await db.users.update_one({"_id": user["_id"]}, {"$set": updatable})
    fresh = await db.users.find_one({"_id": user["_id"]})
    return public_user(fresh)


@api.post("/profile/change-password")
async def change_password(body: dict, user: dict = Depends(get_current_user)):
    if not verify_pw(body.get("current_password", ""), user["password_hash"]):
        raise HTTPException(400, "Current password is incorrect")
    new_pw = body.get("new_password", "")
    if len(new_pw) < 6:
        raise HTTPException(400, "New password must be 6+ chars")
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"password_hash": hash_pw(new_pw)}})
    return {"ok": True}


# ---------- Contact / Newsletter (public) ----------
@api.post("/contact")
async def contact(body: ContactIn):
    await db.contact_messages.insert_one({
        **body.model_dump(),
        "created_at": datetime.now(timezone.utc),
    })
    return {"ok": True}


# ---------- Dashboard summary ----------
@api.get("/dashboard/summary")
async def dashboard_summary(user: dict = Depends(get_current_user)):
    uid = str(user["_id"])
    resume_count = await db.resumes.count_documents({"user_id": uid})
    ats_count = await db.ats_reports.count_documents({"user_id": uid})
    interview_count = await db.interview_sessions.count_documents({"user_id": uid})
    job_count = await db.jobs.count_documents({"user_id": uid})
    # ats avg
    latest_ats = await db.ats_reports.find({"user_id": uid}).sort("created_at", -1).limit(5).to_list(5)
    avg_score = 0
    if latest_ats:
        scores = [(a.get("result", {}) or {}).get("score", 0) for a in latest_ats]
        avg_score = round(sum(scores) / max(len(scores), 1))
    # job stage distribution
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


# ---------- Root ----------
@api.get("/")
async def root():
    return {"message": "CareerForge API", "status": "ok"}


app.include_router(api)

# CORS — using explicit env origins works with credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if os.environ.get("CORS_ORIGINS", "*") == "*" else os.environ["CORS_ORIGINS"].split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Startup ----------
@app.on_event("startup")
async def on_startup():
    # indexes
    await db.users.create_index("email", unique=True)
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.login_attempts.create_index("identifier")
    await db.resumes.create_index([("user_id", 1), ("updated_at", -1)])
    await db.jobs.create_index([("user_id", 1), ("created_at", -1)])
    await db.ats_reports.create_index([("user_id", 1), ("created_at", -1)])
    await db.interview_sessions.create_index([("user_id", 1), ("created_at", -1)])

    # seed admin
    email = os.environ.get("ADMIN_EMAIL", "admin@careerforge.ai")
    pw = os.environ.get("ADMIN_PASSWORD", "Admin@123")
    existing = await db.users.find_one({"email": email})
    if not existing:
        await db.users.insert_one({
            "email": email, "password_hash": hash_pw(pw),
            "name": "Admin", "role": "admin",
            "created_at": datetime.now(timezone.utc),
        })
        logger.info("Seeded admin %s", email)
    elif not verify_pw(pw, existing["password_hash"]):
        await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_pw(pw)}})

    # ensure a demo test user exists so testing agent can log in without registering
    test_email = "test@careerforge.ai"
    test_pw = "Test@1234"
    tex = await db.users.find_one({"email": test_email})
    if not tex:
        await db.users.insert_one({
            "email": test_email, "password_hash": hash_pw(test_pw),
            "name": "Test User", "role": "user",
            "created_at": datetime.now(timezone.utc),
        })


@app.on_event("shutdown")
async def on_shutdown():
    mongo_client.close()
