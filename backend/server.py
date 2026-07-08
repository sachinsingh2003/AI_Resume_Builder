"""CareerForge API — thin app entrypoint.

Composition root:
  - Load env (via database.py which does load_dotenv on import)
  - Configure CORS
  - Include every /api router
  - Seed admin + test user on startup and ensure indexes

For adding new features:
  1. Define request/response schemas in schemas.py.
  2. Create routes/<feature>.py with an APIRouter(prefix="/feature").
  3. `include_router(...)` below.
"""
import os
import logging
from datetime import datetime, timezone

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

from database import db, mongo_client
from security import hash_pw, verify_pw

# Route modules — each owns a single feature area.
from routes.auth import router as auth_router
from routes.resumes import router as resumes_router
from routes.ats import router as ats_router
from routes.interview import router as interview_router
from routes.career import router as career_router
from routes.cover_letter import router as cover_letter_router
from routes.jobs import router as jobs_router
from routes.profile import router as profile_router
from routes.contact import router as contact_router
from routes.dashboard import router as dashboard_router

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

app = FastAPI(title="CareerForge API")

# All app routes live under /api (Kubernetes ingress rule).
api = APIRouter(prefix="/api")


@api.get("/")
async def root():
    return {"message": "CareerForge API", "status": "ok"}


api.include_router(auth_router)
api.include_router(resumes_router)
api.include_router(ats_router)
api.include_router(interview_router)
api.include_router(career_router)
api.include_router(cover_letter_router)
api.include_router(jobs_router)
api.include_router(profile_router)
api.include_router(contact_router)
api.include_router(dashboard_router)

app.include_router(api)

# CORS — env-driven; `*` for dev, comma-separated origins for prod.
_origins_env = os.environ.get("CORS_ORIGINS", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _origins_env == "*" else _origins_env.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    # Indexes (idempotent).
    await db.users.create_index("email", unique=True)
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.login_attempts.create_index("identifier")
    await db.resumes.create_index([("user_id", 1), ("updated_at", -1)])
    await db.jobs.create_index([("user_id", 1), ("created_at", -1)])
    await db.ats_reports.create_index([("user_id", 1), ("created_at", -1)])
    await db.interview_sessions.create_index([("user_id", 1), ("created_at", -1)])

    # Seed admin.
    email = os.environ.get("ADMIN_EMAIL", "admin@careerforge.ai")
    pw = os.environ.get("ADMIN_PASSWORD", "Admin@123")
    existing = await db.users.find_one({"email": email})
    if not existing:
        await db.users.insert_one({
            "email": email, "password_hash": hash_pw(pw),
            "name": "Admin", "role": "admin",
            "created_at": datetime.now(timezone.utc),
        })
        log.info("Seeded admin %s", email)
    elif not verify_pw(pw, existing["password_hash"]):
        await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_pw(pw)}})

    # Seed a demo test user so QA / testing agents can log in without registering.
    test_email = "test@careerforge.ai"
    test_pw = "Test@1234"
    if not await db.users.find_one({"email": test_email}):
        await db.users.insert_one({
            "email": test_email, "password_hash": hash_pw(test_pw),
            "name": "Test User", "role": "user",
            "created_at": datetime.now(timezone.utc),
        })


@app.on_event("shutdown")
async def on_shutdown():
    mongo_client.close()
