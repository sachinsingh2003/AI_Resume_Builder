"""FastAPI dependencies + shared helpers.

- `get_current_user`: strict — raises 401 if no valid cookie/bearer.
- `get_current_user_optional`: returns None instead of raising, used by
  the /auth/session endpoint (which powers the frontend AuthContext).
  This is how we silence 401 noise on public pages without changing the
  contract of /auth/me (which the test suite expects to 401).
- `require_admin`: enforces role.
"""
from datetime import datetime, timezone
from typing import Optional

import jwt
from bson import ObjectId
from fastapi import HTTPException, Request, Depends

from database import db
from security import decode_token


async def _load_user_from_token(token: str) -> Optional[dict]:
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        return await db.users.find_one({"_id": ObjectId(payload["sub"])})
    except (jwt.PyJWTError, Exception):
        return None


def _extract_token(request: Request) -> Optional[str]:
    tok = request.cookies.get("access_token")
    if tok:
        return tok
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return None


async def get_current_user(request: Request) -> dict:
    tok = _extract_token(request)
    if not tok:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = decode_token(tok)
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
    if payload.get("type") != "access":
        raise HTTPException(401, "Invalid token type")
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(401, "User not found")
    return user


async def get_current_user_optional(request: Request) -> Optional[dict]:
    tok = _extract_token(request)
    if not tok:
        return None
    return await _load_user_from_token(tok)


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    return user


def public_user(u: dict) -> dict:
    """Redact server-only fields (password_hash, _id ObjectId, …)
    before returning to the client."""
    created = u.get("created_at", datetime.now(timezone.utc))
    return {
        "id": str(u["_id"]),
        "email": u["email"],
        "name": u.get("name", ""),
        "role": u.get("role", "user"),
        "phone": u.get("phone", ""),
        "location": u.get("location", ""),
        "headline": u.get("headline", ""),
        "linkedin": u.get("linkedin", ""),
        "website": u.get("website", ""),
        "bio": u.get("bio", ""),
        "created_at": created.isoformat() if isinstance(created, datetime) else created,
    }
