# CareerForge

AI-native career workspace: resume builder, ATS checker, interview prep, career advisor, cover letters, and a job tracker — one deliberate UI.

## Stack
- **Frontend**: React 19 + Tailwind + shadcn/ui + framer-motion
- **Backend**: FastAPI + Motor (MongoDB)
- **AI**: OpenAI GPT-5.2 via Emergent Universal LLM key
- **Auth**: httpOnly cookie JWT (access + refresh) + bcrypt + brute-force lockout

## Project structure
```
/app
├── backend/
│   ├── server.py          # All /api routes, auth, admin seed, indexes
│   ├── ai_service.py      # LLM prompt templates (ATS, interview, career, cover, improve)
│   ├── tests/backend_test.py
│   └── .env
└── frontend/
    ├── src/
    │   ├── App.js         # Routes + providers
    │   ├── context/       # AuthContext
    │   ├── lib/           # api client, routes constants
    │   ├── components/
    │   │   ├── layout/    # DashboardLayout, PageHeader
    │   │   ├── marketing/ # MarketingNav, MarketingFooter
    │   │   └── ui/        # shadcn primitives
    │   └── pages/         # Landing, Login, Register, Dashboard*, etc.
    └── .env
```

## Environment variables

### Backend (`/app/backend/.env`)
| Key | Purpose |
| --- | --- |
| `MONGO_URL` | MongoDB connection |
| `DB_NAME` | Database name |
| `CORS_ORIGINS` | Comma-separated origins (or `*`) |
| `JWT_SECRET` | Signing secret for JWTs |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeded admin account |
| `FRONTEND_URL` | Used in password-reset links |
| `EMERGENT_LLM_KEY` | Universal LLM key |

### Frontend (`/app/frontend/.env`)
| Key | Purpose |
| --- | --- |
| `REACT_APP_BACKEND_URL` | External ingress URL for the backend |

## Local development
Both services are supervised. Restart on `.env` or dependency changes:
```
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

Backend hot-reloads on Python changes; frontend hot-reloads on React changes.

## Running tests
```
pytest /app/backend/tests/backend_test.py -v
```

## Default credentials
- Admin: `admin@careerforge.ai / Admin@123`
- Test user: `test@careerforge.ai / Test@1234`

## Where to extend

- **New AI feature**: add a prompt template in `ai_service.py`, then a route in `server.py` that calls it.
- **New dashboard page**: add a file in `pages/`, add a route in `App.js`, add a sidebar entry in `DashboardLayout.js`.
- **New MongoDB collection**: define an index in the `on_startup` hook (`server.py`), add typed Pydantic models above the router.
- **Auth changes** (add OAuth, 2FA, etc.): touch `AuthContext.js` on the frontend and the `/api/auth/*` group in `server.py`.

## Deferred
- Razorpay subscriptions
- Admin panel (users, subscriptions, blog, FAQ, coupons, analytics)
- Email delivery for password resets
- DOCX export (PDF works today via browser print)
- Google Analytics, sitemap, robots.txt

## Troubleshooting
- **Auth loops / redirects**: check the browser has cookies enabled and the `access_token` cookie is set (DevTools → Application → Cookies).
- **AI endpoints return `{ "error": ... }`**: usually LLM budget/rate-limit — retry.
- **Datetime errors**: motor client is initialized with `tz_aware=True`; do not remove.
