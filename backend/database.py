"""MongoDB client bootstrap.

Kept in its own module so every router can import the shared client/db
without depending on server.py (which would create circular imports).

`tz_aware=True` is critical — several endpoints compare stored datetimes
against `datetime.now(timezone.utc)` (e.g. login-attempt lockouts, password
reset expiry). Without it those comparisons raise "can't compare offset-naive
and offset-aware datetimes". Do not remove.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load env once at import time (before Mongo client is constructed).
load_dotenv(Path(__file__).parent / ".env")

from motor.motor_asyncio import AsyncIOMotorClient

mongo_client = AsyncIOMotorClient(os.environ["MONGO_URL"], tz_aware=True)
db = mongo_client[os.environ["DB_NAME"]]
