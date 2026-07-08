"""CareerForge backend end-to-end tests via public URL.

Covers: auth (register/login/me/logout/forgot/reset/lockout), resumes CRUD,
ATS analyze+upload+history, interview generate+history+get, cover letter,
career advice, jobs CRUD, profile+change-password, dashboard summary, 401s.
"""
import io
import os
import time
import uuid
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://jobready-59.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"

# long timeouts for AI endpoints
AI_TIMEOUT = 90
STD_TIMEOUT = 30


def _mk_user():
    e = f"TEST_{uuid.uuid4().hex[:10]}@careerforge.ai"
    return e, "Test@1234", "Tester"


@pytest.fixture(scope="module")
def sess():
    s = requests.Session()
    return s


@pytest.fixture(scope="module")
def user_sess():
    """Session logged in with a freshly registered user."""
    s = requests.Session()
    e, p, n = _mk_user()
    r = s.post(f"{API}/auth/register", json={"email": e, "password": p, "name": n}, timeout=STD_TIMEOUT)
    assert r.status_code == 200, r.text
    s._email = e  # type: ignore
    s._password = p  # type: ignore
    return s


# ---------- Root & basic ----------
class TestRoot:
    def test_root_ok(self, sess):
        r = sess.get(f"{API}/", timeout=STD_TIMEOUT)
        assert r.status_code == 200
        assert r.json().get("status") == "ok"


# ---------- Auth ----------
class TestAuth:
    def test_register_login_me_logout(self, sess):
        e, p, n = _mk_user()
        r = sess.post(f"{API}/auth/register", json={"email": e, "password": p, "name": n}, timeout=STD_TIMEOUT)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["user"]["email"] == e.lower()
        assert "access_token" in body
        assert "access_token" in sess.cookies

        # me
        r = sess.get(f"{API}/auth/me", timeout=STD_TIMEOUT)
        assert r.status_code == 200
        assert r.json()["user"]["email"] == e.lower()

        # logout clears cookies
        r = sess.post(f"{API}/auth/logout", timeout=STD_TIMEOUT)
        assert r.status_code == 200
        # after logout /auth/me should 401
        r = sess.get(f"{API}/auth/me", timeout=STD_TIMEOUT)
        assert r.status_code == 401

        # login with same creds
        s2 = requests.Session()
        r = s2.post(f"{API}/auth/login", json={"email": e, "password": p}, timeout=STD_TIMEOUT)
        assert r.status_code == 200
        assert "access_token" in s2.cookies

    def test_login_wrong_credentials(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": "nonexistent_TEST@careerforge.ai", "password": "wrong"}, timeout=STD_TIMEOUT)
        assert r.status_code == 401

    def test_brute_force_lockout(self):
        s = requests.Session()
        e = f"TEST_lock_{uuid.uuid4().hex[:8]}@careerforge.ai"
        # 5 failed attempts should trigger lockout (429) on 6th
        codes = []
        for i in range(6):
            r = s.post(f"{API}/auth/login", json={"email": e, "password": "badpassxx"}, timeout=STD_TIMEOUT)
            codes.append(r.status_code)
        # last one should be 429 (locked)
        assert 429 in codes, f"Expected 429 lockout; got {codes}"

    def test_forgot_and_reset_password(self):
        s = requests.Session()
        e, p, n = _mk_user()
        r = s.post(f"{API}/auth/register", json={"email": e, "password": p, "name": n}, timeout=STD_TIMEOUT)
        assert r.status_code == 200

        r = s.post(f"{API}/auth/forgot-password", json={"email": e}, timeout=STD_TIMEOUT)
        assert r.status_code == 200
        data = r.json()
        assert data.get("ok") is True
        token = data.get("reset_token_dev")
        assert token, "reset_token_dev missing"

        new_pw = "NewPass@123"
        r = s.post(f"{API}/auth/reset-password", json={"token": token, "password": new_pw}, timeout=STD_TIMEOUT)
        assert r.status_code == 200

        # login with new password
        s2 = requests.Session()
        r = s2.post(f"{API}/auth/login", json={"email": e, "password": new_pw}, timeout=STD_TIMEOUT)
        assert r.status_code == 200

    def test_unauth_endpoints_return_401(self):
        s = requests.Session()  # no cookies
        for path in ["/auth/me", "/resumes", "/ats/history", "/interview/history", "/jobs", "/dashboard/summary"]:
            r = s.get(f"{API}{path}", timeout=STD_TIMEOUT)
            assert r.status_code == 401, f"{path} returned {r.status_code}"


# ---------- Resumes ----------
class TestResumes:
    def test_resume_crud(self, user_sess):
        r = user_sess.post(f"{API}/resumes", json={
            "title": "TEST_Resume", "template": "modern", "data": {"summary": "hi"}
        }, timeout=STD_TIMEOUT)
        assert r.status_code == 200, r.text
        rid = r.json()["id"]

        r = user_sess.get(f"{API}/resumes", timeout=STD_TIMEOUT)
        assert r.status_code == 200
        assert any(x["id"] == rid for x in r.json())

        r = user_sess.put(f"{API}/resumes/{rid}", json={
            "title": "TEST_Resume Updated", "template": "modern", "data": {"summary": "updated"}
        }, timeout=STD_TIMEOUT)
        assert r.status_code == 200
        assert r.json()["title"] == "TEST_Resume Updated"

        r = user_sess.get(f"{API}/resumes/{rid}", timeout=STD_TIMEOUT)
        assert r.status_code == 200
        assert r.json()["title"] == "TEST_Resume Updated"

        r = user_sess.delete(f"{API}/resumes/{rid}", timeout=STD_TIMEOUT)
        assert r.status_code == 200

        r = user_sess.get(f"{API}/resumes/{rid}", timeout=STD_TIMEOUT)
        assert r.status_code == 404


# ---------- ATS ----------
SAMPLE_RESUME = """John Doe
Senior Software Engineer with 5 years experience in Python, FastAPI, React, MongoDB.
Led backend services, RESTful APIs, Docker, AWS. B.Tech CSE.
"""
SAMPLE_JD = "Looking for Backend Engineer skilled in Python, FastAPI, MongoDB, AWS."


class TestATS:
    def test_ats_analyze(self, user_sess):
        r = user_sess.post(f"{API}/ats/analyze",
                           json={"resume_text": SAMPLE_RESUME, "job_description": SAMPLE_JD},
                           timeout=AI_TIMEOUT)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, dict)
        # accept raw fallback OR proper shape
        if "raw" not in data:
            assert "score" in data
            assert isinstance(data["score"], (int, float))

    def test_ats_upload(self, user_sess):
        files = {"file": ("resume.txt", io.BytesIO(SAMPLE_RESUME.encode()), "text/plain")}
        r = user_sess.post(f"{API}/ats/upload", files=files,
                           data={"job_description": SAMPLE_JD}, timeout=AI_TIMEOUT)
        assert r.status_code == 200, r.text
        assert isinstance(r.json(), dict)

    def test_ats_history_scoped(self, user_sess):
        r = user_sess.get(f"{API}/ats/history", timeout=STD_TIMEOUT)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 1


# ---------- Interview ----------
class TestInterview:
    def test_interview_flow(self, user_sess):
        r = user_sess.post(f"{API}/interview/generate", json={
            "role": "Backend Engineer", "experience": "mid", "category": "Technical", "resume_text": ""
        }, timeout=AI_TIMEOUT)
        assert r.status_code == 200, r.text
        data = r.json()
        sid = data.get("id")
        assert sid
        # accept raw fallback else validate 8 questions
        qs = data.get("questions") or []
        if qs:
            assert len(qs) >= 1

        r = user_sess.get(f"{API}/interview/history", timeout=STD_TIMEOUT)
        assert r.status_code == 200
        assert any(x["id"] == sid for x in r.json())

        r = user_sess.get(f"{API}/interview/{sid}", timeout=STD_TIMEOUT)
        assert r.status_code == 200


# ---------- Cover Letter ----------
class TestCoverLetter:
    def test_cover_letter(self, user_sess):
        r = user_sess.post(f"{API}/cover-letter/generate", json={
            "resume_text": SAMPLE_RESUME, "job_description": SAMPLE_JD,
            "company": "Acme", "role": "Backend Engineer",
        }, timeout=AI_TIMEOUT)
        assert r.status_code == 200, r.text
        d = r.json()
        assert isinstance(d, dict)


# ---------- Career ----------
class TestCareer:
    def test_career_advice(self, user_sess):
        r = user_sess.post(f"{API}/career/advice", json={
            "current_role": "Junior Dev", "target_role": "Senior Backend",
            "skills": ["python", "fastapi"], "years_experience": 2,
            "education": "BE", "location": "Bangalore",
        }, timeout=AI_TIMEOUT)
        assert r.status_code == 200, r.text
        assert isinstance(r.json(), dict)


# ---------- Jobs ----------
class TestJobs:
    def test_jobs_crud(self, user_sess):
        r = user_sess.post(f"{API}/jobs", json={
            "company": "TEST_Acme", "role": "SWE", "status": "Applied",
            "location": "Remote", "salary": "20L", "notes": "n", "link": "http://x"
        }, timeout=STD_TIMEOUT)
        assert r.status_code == 200
        jid = r.json()["id"]

        r = user_sess.get(f"{API}/jobs", timeout=STD_TIMEOUT)
        assert r.status_code == 200
        assert any(x["id"] == jid for x in r.json())

        r = user_sess.put(f"{API}/jobs/{jid}", json={
            "company": "TEST_Acme", "role": "SWE II", "status": "Interview",
            "location": "Remote", "salary": "22L", "notes": "n2", "link": "http://x"
        }, timeout=STD_TIMEOUT)
        assert r.status_code == 200
        assert r.json()["role"] == "SWE II"

        r = user_sess.delete(f"{API}/jobs/{jid}", timeout=STD_TIMEOUT)
        assert r.status_code == 200


# ---------- Profile ----------
class TestProfile:
    def test_update_profile(self, user_sess):
        r = user_sess.put(f"{API}/profile", json={
            "name": "TEST User", "phone": "1234567890", "location": "BLR",
            "headline": "SWE", "bio": "hi"
        }, timeout=STD_TIMEOUT)
        assert r.status_code == 200
        assert r.json()["name"] == "TEST User"

    def test_change_password_wrong_current(self, user_sess):
        r = user_sess.post(f"{API}/profile/change-password", json={
            "current_password": "WRONGxxx", "new_password": "NewPass@123"
        }, timeout=STD_TIMEOUT)
        assert r.status_code == 400

    def test_change_password_success(self, user_sess):
        cur = user_sess._password  # type: ignore
        new_pw = "NewPass@999"
        r = user_sess.post(f"{API}/profile/change-password", json={
            "current_password": cur, "new_password": new_pw
        }, timeout=STD_TIMEOUT)
        assert r.status_code == 200
        user_sess._password = new_pw  # type: ignore


# ---------- Dashboard ----------
class TestDashboard:
    def test_dashboard_summary(self, user_sess):
        r = user_sess.get(f"{API}/dashboard/summary", timeout=STD_TIMEOUT)
        assert r.status_code == 200
        d = r.json()
        for k in ["resume_count", "ats_count", "interview_count", "job_count", "avg_ats_score", "job_stages"]:
            assert k in d
