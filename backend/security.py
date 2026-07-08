"""Auth primitives — password hashing + JWT token creation/verification.

Isolated from route handlers so it can be unit-tested and reused. Cookie
settings live here too so we set consistent flags everywhere.
"""
import os
from datetime import datetime, timezone, timedelta

import bcrypt
import jwt
from fastapi import Response

JWT_ALGO = "HS256"
ACCESS_TTL_MIN = 60 * 24  # 1 day
REFRESH_TTL_DAYS = 7


def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_access_token(uid: str, email: str, role: str) -> str:
    payload = {
        "sub": uid, "email": email, "role": role, "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TTL_MIN),
    }
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGO)


def create_refresh_token(uid: str) -> str:
    payload = {
        "sub": uid, "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TTL_DAYS),
    }
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGO)


def decode_token(token: str) -> dict:
    """Raises jwt.PyJWTError variants; callers translate to HTTPException."""
    return jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGO])


def set_auth_cookies(resp: Response, access: str, refresh: str) -> None:
    """Set httpOnly cookies for both tokens. `secure=False` because dev
    ingress terminates TLS then talks to us over http — flipping to True
    would drop the cookie. Production reverse-proxies with end-to-end TLS
    should read the setting from env and toggle this."""
    resp.set_cookie("access_token", access, httponly=True, secure=False,
                    samesite="lax", max_age=ACCESS_TTL_MIN * 60, path="/")
    resp.set_cookie("refresh_token", refresh, httponly=True, secure=False,
                    samesite="lax", max_age=REFRESH_TTL_DAYS * 86400, path="/")
