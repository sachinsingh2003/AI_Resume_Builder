"""AI service layer using Emergent LLM key.

Wraps the emergentintegrations LlmChat client with modular prompt templates
for resume improvement, ATS scoring, interview question generation,
career advice, and cover letter drafting.

All prompts return JSON that FastAPI endpoints deserialize and forward to
the frontend. Kept intentionally small and configurable so future prompts
can be added by extending PROMPTS + build_chat().
"""
import os
import json
import re
import uuid
import logging

from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

# Default model: user chose GPT-5.2. Configurable via env for future tuning.
LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "openai")
LLM_MODEL = os.environ.get("LLM_MODEL", "gpt-5.2")


def _client(system_message: str) -> LlmChat:
    """Instantiate a per-request LlmChat client. Fresh session id keeps
    responses stateless (we store our own history in Mongo per-user)."""
    return LlmChat(
        api_key=os.environ["EMERGENT_LLM_KEY"],
        session_id=str(uuid.uuid4()),
        system_message=system_message,
    ).with_model(LLM_PROVIDER, LLM_MODEL)


def _extract_json(raw: str) -> dict:
    """LLMs occasionally wrap JSON in markdown fences. Strip and parse."""
    if not raw:
        return {}
    m = re.search(r"\{[\s\S]*\}", raw)
    if not m:
        return {"raw": raw}
    try:
        return json.loads(m.group(0))
    except json.JSONDecodeError:
        return {"raw": raw}


async def _ask(system: str, user: str) -> dict:
    chat = _client(system)
    try:
        response = await chat.send_message(UserMessage(text=user))
        return _extract_json(response)
    except Exception as e:
        logger.exception("LLM call failed")
        return {"error": str(e)}


# ---------- Prompt templates ----------

async def analyze_ats(resume_text: str, job_description: str = "") -> dict:
    """Return ATS score + issues + missing keywords for a resume/JD pair."""
    system = (
        "You are an expert ATS (Applicant Tracking System) analyzer. "
        "Return STRICT JSON only, no prose."
    )
    prompt = f"""Analyze this resume against the target role.

RESUME:
\"\"\"{resume_text[:6000]}\"\"\"

JOB DESCRIPTION (optional):
\"\"\"{job_description[:3000]}\"\"\"

Return JSON with this exact shape:
{{
  "score": <0-100 integer>,
  "summary": "<one paragraph>",
  "matched_keywords": [<string>, ...],
  "missing_keywords": [<string>, ...],
  "formatting_issues": [<string>, ...],
  "improvement_suggestions": [<string>, ...],
  "section_scores": {{
     "contact": <0-100>, "experience": <0-100>,
     "skills": <0-100>, "education": <0-100>, "formatting": <0-100>
  }}
}}"""
    return await _ask(system, prompt)


async def improve_resume(resume_text: str, target_role: str = "") -> dict:
    system = "You are an elite resume writer. Return STRICT JSON only."
    prompt = f"""Rewrite and improve the following resume for the target role.

TARGET ROLE: {target_role or "General"}
RESUME:
\"\"\"{resume_text[:6000]}\"\"\"

Return JSON:
{{
  "rewritten_summary": "<3-4 line professional summary>",
  "bullet_improvements": [
     {{"original": "<orig bullet>", "improved": "<improved bullet with metrics>"}}
  ],
  "recommended_skills": [<string>, ...],
  "tone_notes": "<one paragraph>"
}}"""
    return await _ask(system, prompt)


async def generate_interview_questions(
    role: str, experience: str, category: str, resume_text: str = ""
) -> dict:
    system = (
        "You are a senior interviewer creating tailored interview prep. "
        "Return STRICT JSON only."
    )
    prompt = f"""Generate 8 {category} interview questions for a {role} candidate.

Experience level: {experience}
Resume context (optional):
\"\"\"{resume_text[:3000]}\"\"\"

Return JSON:
{{
  "questions": [
     {{
       "question": "<question>",
       "difficulty": "easy|medium|hard",
       "sample_answer": "<concise ideal answer>",
       "evaluation_criteria": [<string>, ...]
     }}
  ]
}}"""
    return await _ask(system, prompt)


async def career_advice(profile: dict) -> dict:
    system = "You are a top career coach. Return STRICT JSON only."
    prompt = f"""Given this professional profile, produce a career plan.

PROFILE (JSON):
{json.dumps(profile)[:4000]}

Return JSON:
{{
  "current_role_snapshot": "<paragraph>",
  "target_roles": [<string>, ...],
  "roadmap": [
     {{"stage": "0-3 months", "actions": [<string>, ...]}},
     {{"stage": "3-6 months", "actions": [<string>, ...]}},
     {{"stage": "6-12 months", "actions": [<string>, ...]}}
  ],
  "skill_gaps": [<string>, ...],
  "recommended_certifications": [<string>, ...],
  "learning_resources": [{{"title": "<title>", "url_or_source": "<>"}}],
  "salary_estimate_usd": {{"junior": "<range>", "mid": "<range>", "senior": "<range>"}},
  "suitable_companies": [<string>, ...]
}}"""
    return await _ask(system, prompt)


async def generate_cover_letter(
    resume_text: str, job_description: str, company: str, role: str
) -> dict:
    system = "You are a professional cover letter writer. Return STRICT JSON only."
    prompt = f"""Write a tailored cover letter.

ROLE: {role}
COMPANY: {company}
RESUME:
\"\"\"{resume_text[:4000]}\"\"\"
JOB DESCRIPTION:
\"\"\"{job_description[:3000]}\"\"\"

Return JSON:
{{
  "cover_letter": "<full cover letter with paragraphs separated by \\n\\n>",
  "tone": "<one line>",
  "key_matches": [<string>, ...]
}}"""
    return await _ask(system, prompt)
