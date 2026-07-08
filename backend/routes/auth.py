"""Auth routes.

Endpoints:
  POST /register, /login, /logout, /refresh
  GET  /me            (401 when unauth — legacy, kept for test suite / external callers)
  GET  /session       (200 with {user: null|dict} — used by the SPA AuthContext to
                       silence 401 network noise on public pages)
  POST /forgot-password, /reset-password
"""
import os
import logging
import secrets
from datetime import datetime, timezone, timedelta

import jwt
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request, Response, Depends

from database import db
from deps import get_current_user, get_current_user_optional, public_user
from schemas import RegisterIn, LoginIn, ForgotIn, ResetIn
from security import (
    hash_pw, verify_pw, create_access_token, create_refresh_token,
    set_auth_cookies, decode_token, ACCESS_TTL_MIN,
)

log = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
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


@router.post("/login")
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.lower()
    ident = f"{request.client.host}:{email}"
    now = datetime.now(timezone.utc)

    # Brute-force check — 5 failed attempts within 15m locks the identifier.
    la = await db.login_attempts.find_one({"identifier": ident})
    if la and la.get("locked_until") and la["locked_until"] > now:
        raise HTTPException(429, "Too many attempts. Try again later.")

    user = await db.users.find_one({"email": email})
    if not user or not verify_pw(body.password, user["password_hash"]):
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


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    # Strict — 401 when unauthenticated. Kept for external callers/tests.
    return {"user": public_user(user)}


@router.get("/session")
async def session(user=Depends(get_current_user_optional)):
    """Public endpoint used by the SPA to hydrate auth state on mount.
    Always returns 200 so DevTools doesn't scream at anonymous visitors."""
    return {"user": public_user(user) if user else None}


@router.post("/refresh")
async def refresh(request: Request, response: Response):
    tok = request.cookies.get("refresh_token")
    if not tok:
        raise HTTPException(401, "No refresh token")
    try:
        payload = decode_token(tok)
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


@router.post("/forgot-password")
async def forgot_password(body: ForgotIn):
    user = await db.users.find_one({"email": body.email.lower()})
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one({
            "token": token,
            "user_id": str(user["_id"]),
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
            "used": False,
        })
        link = f"{os.environ.get('FRONTEND_URL', '')}/reset-password?token={token}"
        log.info("Password reset link for %s: %s", body.email, link)
        # Return token in dev so QA can proceed without an email provider.
        return {"ok": True, "reset_token_dev": token}
    # Do not reveal whether the email exists.
    return {"ok": True}


@router.post("/reset-password")
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
