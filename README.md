# abr-p3-gatekeeper — Visa Readiness Report

Encodes published, citable official visa criteria into a rules engine and
computes funding sufficiency against real cost data. **Never predicts an
outcome.** Every flag = what we noticed + the official rule (linked) +
severity + a concrete fix.

This zip is a working, runnable scaffold that implements the full pipeline
from the handbook (research → schema → intake → rules → funding → severity →
remediation → report). Two integration points are stubbed with clearly
labeled mocks because they belong to sibling projects you don't have access
to from here:

| Stub | Real thing | Where |
|---|---|---|
| P1 Atlas tuition/living-cost API | `src/gatekeeper/atlas_client.py` — swap `AtlasClient.get_cost_estimate` for a real HTTP call once P1 ships its endpoint. Mock data is clearly labeled `is_mock=True` and surfaced in every report. |
| P5 Anchor fact-checking service | `src/gatekeeper/anchor.py` — a local guard enforcing the same contract (every flag has a source URL, no outcome-predicting language) is fully functional today; swap `call_p5_anchor_service()` for the real SDK call when available. |

Everything else — schema, rules engine, funding math, severity ordering,
report assembly, PDF export, tests, intake UI — is real, tested code.

---

## 1. File map

```
abr-p3-gatekeeper/
├── README.md                     <- you are here
├── requirements.txt              <- backend Python deps
├── pyproject.toml                <- pytest config + package metadata
├── Dockerfile                    <- backend container image
├── .env.example                  <- P1 Atlas API config (optional)
│
├── research/                     <- Stage 1: criteria notes, every claim linked
│   ├── country-a-notes.md        <- United States (F-1)
│   ├── country-b-notes.md        <- United Kingdom (Student visa)
│   └── country-c-notes.md        <- Canada (Study permit)
│
├── rules/                        <- Stage 4: declarative YAML rules (source-cited)
│   ├── country-a.yaml
│   ├── country-b.yaml
│   └── country-c.yaml
│
├── src/gatekeeper/                <- Python package
│   ├── schema.py                 <- Stage 2: Pydantic v2 input schema + flatten()
│   ├── atlas_client.py           <- P1 Atlas client (mocked, swap-in-one-file)
│   ├── funding.py                <- Stage 5: sufficiency calc, buffer stated openly
│   ├── engine.py                 <- Stage 4: sandboxed YAML rule evaluator
│   ├── anchor.py                 <- P5 Anchor guard (mocked, swap-in-one-file)
│   ├── report.py                 <- Stages 6-8: assemble, verify, HTML + PDF export
│   └── main.py                   <- FastAPI app: /intake, /report/{id}, /report/{id}/pdf
│
├── tests/
│   ├── make_profiles.py          <- generates the constructed profiles below
│   ├── profiles/*.json           <- 24 constructed applicant profiles
│   ├── test_engine.py            <- profile -> expected-flags assertions
│   └── test_rule_sandbox.py      <- rule-condition sandbox security tests
│
└── app/                          <- Next.js frontend (intake form + report view)
    ├── package.json
    ├── next.config.js
    ├── tsconfig.json
    ├── .env.local.example
    ├── lib/api.ts                <- typed fetch client for the FastAPI backend
    └── app/
        ├── layout.tsx
        ├── page.tsx               <- intake form
        └── report/[id]/page.tsx   <- report view + PDF download
```

## 2. Tools & tech (as specified in the handbook, §5.5)

| Layer | Tool | Notes |
|---|---|---|
| Rules | Declarative YAML + small evaluator | `rules/*.yaml` + `engine.py`; readable/auditable by a non-engineer |
| Validation | Pydantic v2 | `schema.py`; invalid input fails loudly (422), never silently |
| Cost data | P1 Atlas API (mocked here) | `atlas_client.py` |
| Fact-checking | P5 Anchor (mocked here) | `anchor.py` |
| Frontend | Next.js | `app/` — App Router, TypeScript |
| Backend | FastAPI on Python | `src/gatekeeper/main.py` |
| PDF export | WeasyPrint, falls back to ReportLab | `report.py::render_report_pdf` — tries WeasyPrint (needs system `pango`/`cairo`, see Dockerfile); if unavailable, automatically falls back to a ReportLab render so the pipeline works in *any* environment, including this sandbox where WeasyPrint's system libs aren't installed |
| Testing | pytest with constructed profiles | `tests/` — 24 profiles now; `make_profiles.py` makes it trivial to add the rest to reach the 30+ target in §5.7 |

## 3. Step-by-step execution

### A. Backend

```bash
cd abr-p3-gatekeeper
python3 -m venv .venv && source .venv/bin/activate      # optional but recommended
pip install -r requirements.txt

# If WeasyPrint fails to install/import on your machine (needs system
# pango/cairo libs), remove it from requirements.txt — report.py already
# falls back to ReportLab automatically, no code change needed.

# Run the test suite (33 tests: 24 constructed profiles + sandbox + guard checks)
pytest -q

# Start the API
uvicorn gatekeeper.main:app --reload --port 8000
# with PYTHONPATH set if you didn't `pip install -e .`:
# PYTHONPATH=src uvicorn gatekeeper.main:app --reload --port 8000
```

Smoke-test it:

```bash
curl -X POST http://localhost:8000/intake \
  -H "Content-Type: application/json" \
  -d @tests/profiles/funding_shortfall_country_a.json
```

### B. Frontend

```bash
cd app
npm install
cp .env.local.example .env.local     # points at http://localhost:8000
npm run dev
# open http://localhost:3000
```

### C. Docker (backend only)

```bash
docker build -t abr-p3-gatekeeper .
docker run -p 8000:8000 --env-file .env abr-p3-gatekeeper
```

### D. Wiring in the real P1 Atlas and P5 Anchor

1. Set `ATLAS_API_BASE` / `ATLAS_API_KEY` in `.env` once P1 exposes its
   endpoint — `atlas_client.py` will use the real API automatically and only
   fall back to mock data if the call fails, and every report visibly flags
   `cost_data_is_mock: true` when that happens so it's never silent.
2. Replace the body of `call_p5_anchor_service()` in `anchor.py` with the
   real SDK/API call. The rest of the guard logic (source-URL presence,
   outcome-language ban) stays as an extra local safety net even after the
   real service is wired in.

### E. Reaching the "30+ constructed profiles" target (§5.7)

`tests/make_profiles.py` currently emits 24 profiles across all three
countries and every rule. To add more: add entries to the `profiles` dict
(base + overrides), re-run `python tests/make_profiles.py`, then add the
matching expected-flag set to `EXPECTED_FLAGS` in `tests/test_engine.py`.

## 4. Auth, database, and admin (added on top of the original pipeline)

| Feature | Where |
|---|---|
| Email + password signup/login (JWT) | `src/gatekeeper/auth_router.py` |
| Forgot / reset password | Same file — reset emails print to the console in dev (no SMTP needed); set `SMTP_*` env vars for real email |
| Sign in with Google | `src/gatekeeper/google_oauth.py` + `auth_router.py` (`/auth/google/login`, `/auth/google/callback`) |
| Persistent database (users, reports, reset tokens) | `src/gatekeeper/db.py`, `models.py` — SQLite by default, swap to Postgres by setting `DATABASE_URL` |
| Admin dashboard (stats, users, reports) | Backend: `admin_router.py` (`/admin/*`, admin-only). Frontend: `app/app/admin/page.tsx` |
| Frontend auth pages | `app/app/signin`, `signup`, `forgot-password`, `reset-password`, `auth/callback` |

**Making the first admin account:** sign up normally through the site, then run:
```bash
PYTHONPATH=src python scripts/make_admin.py you@example.com
```
This flips `is_admin=True` on that account. Log out and back in, and an "Admin" link appears in the header.

**Google OAuth setup** (only needed if you want the "Continue with Google" button to work):
1. Go to https://console.cloud.google.com/apis/credentials, create an OAuth 2.0 Client ID (type: Web application).
2. Add an authorized redirect URI: `http://localhost:8000/auth/google/callback` for local dev, and your real backend URL + `/auth/google/callback` for production (e.g. `https://your-api.onrender.com/auth/google/callback`).
3. Copy the Client ID/Secret into `.env` as `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, and set `GOOGLE_REDIRECT_URI` to match exactly what you registered.

## 5. Deployment — GitHub, Render (backend), Vercel (frontend)

**Why two hosts:** Vercel is built for the Next.js frontend (and serverless functions) — it isn't a good fit for a long-running Python/FastAPI service with a database connection. Render runs Python natively and is the simpler home for the backend. This is the standard pairing for this kind of stack.

### A. Push to GitHub

```bash
cd abr-p3-gatekeeper
git init
git add .
git commit -m "Initial commit: P3 Gatekeeper with auth, admin, themed UI"
gh repo create abr-p3-gatekeeper --public --source=. --push
# no GitHub CLI? create a repo on github.com manually, then:
# git remote add origin https://github.com/<you>/abr-p3-gatekeeper.git
# git branch -M main && git push -u origin main
```

### B. Deploy the backend on Render

1. Go to https://render.com → New → Web Service → connect your GitHub repo.
2. Render should detect `render.yaml` automatically and pre-fill settings (Python runtime, build/start commands). If not, set manually:
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `PYTHONPATH=src uvicorn gatekeeper.main:app --host 0.0.0.0 --port $PORT`
3. Add a **Postgres database** (Render → New → PostgreSQL, free tier is fine) and copy its connection string into the web service's `DATABASE_URL` env var.
4. Set the remaining env vars from `.env.example` in Render's dashboard (`JWT_SECRET_KEY` — generate a real random one, `FRONTEND_URL`, `FRONTEND_ORIGINS`, Google OAuth vars if using them, SMTP vars if using real email).
5. Deploy. Note your backend URL, e.g. `https://abr-p3-gatekeeper-api.onrender.com`.
6. Test it: `curl https://<your-backend>.onrender.com/healthz`

### C. Deploy the frontend on Vercel

1. Go to https://vercel.com → Add New Project → import the same GitHub repo.
2. **Root directory:** set to `app` (important — the Next.js project lives in the `app/` subfolder, not the repo root).
3. Add an environment variable: `NEXT_PUBLIC_API_BASE` = your Render backend URL from step B.5.
4. Deploy. Vercel gives you a URL like `https://abr-p3-gatekeeper.vercel.app`.

### D. Wire the two together (final step — do this after both are deployed)

Go back to Render and update these env vars on the backend, then redeploy:
- `FRONTEND_URL` = your Vercel URL (used for password reset links and Google OAuth redirect)
- `FRONTEND_ORIGINS` = your Vercel URL (used for CORS)
- If using Google OAuth: `GOOGLE_REDIRECT_URI` = `https://<your-backend>.onrender.com/auth/google/callback`, and add that same URL to the Google Cloud Console's authorized redirect URIs.

Then create your admin account against the production database:
```bash
DATABASE_URL="<your Render Postgres URL>" PYTHONPATH=src python scripts/make_admin.py you@example.com
```

### E. Custom domain (optional)

Both Vercel and Render support adding a custom domain in their dashboards (Vercel → Project → Settings → Domains; Render → Service → Settings → Custom Domain). Point your DNS at each per their instructions, then update `FRONTEND_URL`/`FRONTEND_ORIGINS`/`NEXT_PUBLIC_API_BASE` to the final domains.

## 6. What still needs a human before this is real (per the handbook's own §5.8)

- **Re-verify every rule** in `rules/*.yaml` against the live official page —
  the URLs are correct; the exact wording/figures can drift. Each rule
  should get a `last_verified` date once you start that process.
- **Wire P1 Atlas and P5 Anchor** for real (see §D above).
- **Founder review of legal framing** before anything goes live, per the
  handbook's dependency table.
- The disclaimer/report copy in `report.py::DISCLAIMER` should get a legal
  pass alongside the founder review.

## 7. AI tools that will make this faster to finish

- **Claude Code** (terminal, VS Code, or JetBrains) — best fit for the rest
  of this repo: wiring the real P1 Atlas client, writing the remaining
  constructed profiles, and iterating on the rules engine directly against
  your test suite. It can run `pytest` in a loop while it edits.
- **Claude for Excel** — useful if you want to draft/track the "official
  criteria per country, every claim linked" research table (§5.1/5.2) as a
  spreadsheet before encoding it into YAML — good for the founder/legal
  review pass since non-engineers can read it directly.
- **Claude in Chrome** — handy for the research stage itself: having it
  browse each country's official immigration page and pull out the current
  wording/figures to compare against what's in `research/*.md`.
- Regular web search (built into Claude.ai) is enough to re-verify the rule
  citations in `research/*.md` — no special tool needed there, just budget
  time for it since it's the thing this whole project is graded on being
  right about.
