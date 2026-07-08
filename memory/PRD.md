# CareerForge — AI Resume & Interview Prep SaaS

## Original Problem Statement
Build a production-ready AI Resume & Interview Preparation SaaS with:
- Landing (hero/features/pricing/FAQ/testimonials/contact/footer + Privacy/Terms)
- Auth (email/password JWT, forgot/reset password, role-based)
- Dashboard modules: Resume Builder, ATS Checker, AI Resume Improvement, Cover Letter, Interview Prep, AI Career Advisor, Job Tracker, Profile, Settings
- Admin panel, Razorpay subscriptions, email notifications (deferred to v2)

## Tech Stack (final)
- Frontend: React (JS, not TS) + Tailwind + shadcn/ui + framer-motion + sonner
- Backend: FastAPI + Motor (MongoDB) + PyJWT + bcrypt
- LLM: OpenAI GPT-5.2 via Emergent LLM key (emergentintegrations)
- Auth: httpOnly cookie JWT (access + refresh) + brute-force lockout
- Payments: Razorpay — deferred to v2

## User Personas
- Active job seeker (primary): needs resume + ATS + interview prep
- Career switcher: needs advisor + roadmap
- Bootcamp coach (v2): team plan

## Architecture
- `/app/backend/server.py` — all API routes (`/api/*`), auth, admin seeding, indexes
- `/app/backend/ai_service.py` — modular prompt templates for LLM
- `/app/backend/tests/backend_test.py` — pytest suite (18/18 passing)
- `/app/frontend/src/App.js` — routes + providers
- `/app/frontend/src/pages/*` — one file per screen
- `/app/frontend/src/components/layout/DashboardLayout.js` — sidebar shell
- `/app/frontend/src/context/AuthContext.js` — cookie-session driven auth

## What's Implemented (2026-02)
- Full landing page (hero, bento features, pricing tiers with monthly/annual toggle, testimonials, FAQ accordion, footer, CTA)
- Terms, Privacy, Contact pages with contact form persisted to MongoDB
- Auth: register / login / logout / me / refresh / forgot / reset-password + brute-force lockout + admin seeding
- Dashboard with sidebar and stats
- Resume Builder: CRUD, live preview, 3 templates (modern/classic/compact), autosave, PDF via `window.print()`, AI Improve
- ATS Checker: paste-or-upload + optional JD, AI-scored, keyword arrays, formatting issues, history
- Interview Prep: 4 categories, 8 questions with sample answers + evaluation, session history
- Cover Letter Generator: tailored letter + key matches + copy
- Career Advisor: roadmap (0-3/3-6/6-12), skill gaps, cert list, learning resources, salary bands, target companies
- Job Tracker: 7-stage kanban with drag-via-dropdown, notes/link/reminders, CRUD
- Profile: name/phone/location/headline/socials/bio
- Settings: change password + subscription placeholder
- Design: dark-mode-default, Cabinet Grotesk display + Inter body, glassmorphism nav, grain/grid textures, hover-lift animations, testids on every interactive element

## Prioritized Backlog

### P0 (v1 wrap-up polish — quick wins)
- Silence /api/auth/me 401 console noise on public pages
- DOCX export (docx generation via python-docx or js-side)

### P1 (Deferred from v1 scope)
- Razorpay subscription integration (needs API keys)
- Admin panel: user list, subscription mgmt, analytics, blog, FAQ mgmt, feedback, coupons, system settings
- Google Login (Emergent Google Auth) as alt to email/pw
- Email delivery via Resend/SendGrid (forgot-password link is currently console + returned as reset_token_dev)
- Google Analytics + sitemap + robots.txt + Open Graph
- SEO polish (per-page meta), server-side sitemap

### P2 (Nice-to-have)
- Drag-and-drop reorder inside resume editor
- Resume version history / branches
- Interview recording + AI scoring
- Job Tracker calendar view for reminders
- Bulk import job applications from LinkedIn

## Credentials (see /app/memory/test_credentials.md)
- Admin: `admin@careerforge.ai` / `Admin@123`
- Test user: `test@careerforge.ai` / `Test@1234`

## Environment variables
Backend `.env`:
- `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS` (protected)
- `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `FRONTEND_URL`
- `EMERGENT_LLM_KEY`

Frontend `.env`:
- `REACT_APP_BACKEND_URL` (protected)

## Testing
`pytest /app/backend/tests/backend_test.py -v` — 18/18 green.
Frontend: `yarn start` (already supervised).
