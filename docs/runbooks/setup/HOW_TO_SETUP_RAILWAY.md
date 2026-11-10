# How to set up Railway (FastAPI backend)

Deploy the FastAPI API in this repo to Railway. The Next.js UI stays on Vercel; see [HOW_TO_SETUP_VERCEL.md](./HOW_TO_SETUP_VERCEL.md).

## What gets deployed

| Item | Value |
|------|--------|
| App | FastAPI (`mock_social_media_platform.main:app`) |
| Source root | Repository root (`pyproject.toml`, `uv.lock`, `src/`) |
| Runtime | Python ≥ 3.12 (repo pins `.python-version` → `3.12`) |
| Package manager | `uv` (`uv.lock` present; Railpack detects it) |
| Public API prefix | `/api/v1` |
| Local default | `http://127.0.0.1:8000` |

This is a **shared-root** layout, not an isolated `/backend` subdirectory. Do **not** set Railway `rootDirectory` to `frontend/` or any subfolder — the Python package lives under `src/` and depends on root `pyproject.toml` / `uv.lock`.

## Current investigated state (2026-08-09)

| Check | Result |
|-------|--------|
| Railway CLI | Installed (`railway 5.26.3` at `/opt/homebrew/bin/railway`) |
| Auth | Signed in as `markptorres1@gmail.com` |
| Workspace | `mark-torres10's Projects` (`61641dae-cbc7-4d85-8273-aff26263f8a8`) |
| Local link | **Not linked** (`railway status` → no project) |
| Existing project named for this repo | **None** among listed workspace projects |
| Git remote | `https://github.com/METResearchGroup/mock_social_media_platform.git` |

Re-check anytime:

```bash
railway whoami --json
railway status --json
railway list --json
```

## Prerequisites

1. Railway CLI authenticated (`railway whoami --json` succeeds).
2. GitHub connected to Railway if you want git-triggered deploys (Dashboard → Account → GitHub).
3. **CORS for the Vercel origin** — today `src/mock_social_media_platform/main.py` only allows:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`

   Browser calls from a `*.vercel.app` origin will fail until CORS includes that origin (preferably via a `CORS_ORIGINS` env var on Railway). Do that code change before treating the UI↔API path as production-ready.
4. Decide deploy order: **Railway first**, then set `NEXT_PUBLIC_API_BASE_URL` on Vercel to the Railway public URL.

## Why the start command must be explicit

Railpack’s FastAPI default start is effectively:

```bash
uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
```

This repo’s app module is **`mock_social_media_platform.main:app`** (src-layout package), not `main:app` at the repo root. Relying on auto-detect will fail or start the wrong thing. Always set:

```bash
uvicorn mock_social_media_platform.main:app --host 0.0.0.0 --port $PORT
```

Railway injects `PORT`. The process must listen on `0.0.0.0:$PORT`.

## Recommended architecture on Railway

```
Project: mock-social-media-platform
└── Environment: production
    └── Service: api   ← FastAPI only (no DB required for the dummy seed)
```

No managed database is required for the current in-memory/seed backend.

Optional config-as-code at the **repo root** (Railway config files are absolute from the repo root, not under a service rootDirectory):

```toml
# railway.toml (optional but recommended)
[build]
builder = "RAILPACK"

[deploy]
startCommand = "uvicorn mock_social_media_platform.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/openapi.json"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
```

`/openapi.json` is served by FastAPI by default and returns HTTP 200 — usable until you add a dedicated `/health`.

## Path A — CLI first deploy (fastest to a public URL)

Use this when you want a running API without wiring GitHub yet.

```bash
cd /path/to/mock_social_media_platform

# Create + link a new project in the current workspace
railway init --name mock-social-media-platform --json

# Ensure a named empty service exists (init may already create one)
railway service list --json
# If needed:
railway add --service api --json
railway service link api

# Pin Python and set start command (also fine if you use railway.toml)
railway variable set RAILPACK_PYTHON_VERSION=3.12 --service api
railway environment edit --service-config api deploy.startCommand \
  "uvicorn mock_social_media_platform.main:app --host 0.0.0.0 --port \$PORT"
railway environment edit --service-config api deploy.healthcheckPath "/openapi.json"

# Limit rebuilds to backend paths (frontend-only pushes should not redeploy API)
railway environment edit --service-config api build.watchPatterns \
  '["src/**","pyproject.toml","uv.lock",".python-version","railway.toml","railway.json"]'

# Deploy current directory
railway up --service api --detach -m "Initial FastAPI deploy"

# Poll until SUCCESS (detached up only means QUEUED)
railway deployment list --service api --json
```

Generate a public domain:

```bash
railway domain --service api --json
# or
railway domain list --service api --json
```

Record the URL, e.g. `https://api-production-xxxx.up.railway.app`. That becomes Vercel’s `NEXT_PUBLIC_API_BASE_URL` (no trailing slash).

### Verify the API

```bash
curl -sS "$RAILWAY_PUBLIC_URL/openapi.json" | head
curl -sS "$RAILWAY_PUBLIC_URL/api/v1/feed"
curl -sS -X POST "$RAILWAY_PUBLIC_URL/api/v1/posts/<post_id>/like"
```

Expect JSON from `/api/v1/feed` and OpenAPI JSON from `/openapi.json`.

## Path B — GitHub-connected service (preferred long-term)

1. Create an empty project + empty `api` service (same as above), **or** create the project in the dashboard as Empty Project.
2. In the `api` service settings (or via CLI):
   - Connect repo `METResearchGroup/mock_social_media_platform`
   - Branch: usually `main`
   - **Root Directory:** leave empty / `/` (repo root)
   - Start command: `uvicorn mock_social_media_platform.main:app --host 0.0.0.0 --port $PORT`
   - Watch paths: `src/**`, `pyproject.toml`, `uv.lock`, `.python-version`, `railway.toml`
3. Generate a public domain.
4. Push to the connected branch (or `railway up` for a one-off upload).

CLI equivalents when the service already exists:

```bash
railway link --project mock-social-media-platform
railway service link api
# Source repo/branch are often set in the dashboard; start command / watch paths via:
railway environment edit --service-config api deploy.startCommand \
  "uvicorn mock_social_media_platform.main:app --host 0.0.0.0 --port \$PORT"
```

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `PORT` | Auto | Injected by Railway; do not hardcode |
| `RAILPACK_PYTHON_VERSION` | Recommended | Set to `3.12` to match `.python-version` |
| `CORS_ORIGINS` | Recommended after code support | Comma-separated browser origins (Vercel prod + local) |

Example once CORS is env-driven:

```bash
railway variable set CORS_ORIGINS="https://your-app.vercel.app,http://localhost:3000,http://127.0.0.1:3000" \
  --service api
```

List / inspect:

```bash
railway variable list --service api --json
```

## Networking notes

- **Browser → API** must use the **public** Railway domain. Frontends cannot call `RAILWAY_PRIVATE_DOMAIN`.
- Private networking is only for Railway service ↔ service (not applicable to Vercel-hosted Next.js).
- After generating a domain, Railway exposes `RAILWAY_PUBLIC_DOMAIN` on the service.

## Operations cheat sheet

```bash
railway status --json
railway logs --service api --lines 200 --json
railway logs --service api --build --lines 200 --json
railway metrics --service api --since 1h --json
railway redeploy --service api --yes
railway restart --service api --yes
```

Never treat `railway up --detach` as success. Poll `railway deployment list --service api --json` until `status` is `SUCCESS`, or triage `FAILED` / `CRASHED` with build/runtime logs.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Build OK, crash on boot | Wrong start module (`main:app`) | Use `mock_social_media_platform.main:app` |
| Healthcheck timeout | Not listening on `$PORT` / wrong path | Bind `0.0.0.0:$PORT`; use `/openapi.json` |
| UI gets CORS errors | Origins still localhost-only | Expand CORS / set `CORS_ORIGINS` |
| Every frontend commit redeploys API | Missing watch paths | Set watch patterns to `src/**` + lockfiles |
| Wrong Python | Railpack defaulted elsewhere | Set `RAILPACK_PYTHON_VERSION=3.12` |
| `Not signed in` | No CLI session | `railway login` (or `railway up` which can auth as part of deploy) |

## Handoff to Vercel

1. Copy the Railway public base URL (no trailing slash).
2. On Vercel, set `NEXT_PUBLIC_API_BASE_URL` to that URL for Production (and Preview if desired).
3. Redeploy the frontend so the Next.js build inlines the public env var.
4. Confirm CORS allows the Vercel origin(s).

Details: [HOW_TO_SETUP_VERCEL.md](./HOW_TO_SETUP_VERCEL.md).
