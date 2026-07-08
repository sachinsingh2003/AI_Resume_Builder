"""Pydantic request schemas shared across routers."""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field


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
