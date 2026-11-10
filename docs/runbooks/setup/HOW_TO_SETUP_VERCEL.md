# How to set up Vercel (Next.js frontend)

Deploy the Next.js UI in `frontend/` to Vercel. The FastAPI backend stays on Railway; see [HOW_TO_SETUP_RAILWAY.md](./HOW_TO_SETUP_RAILWAY.md).

## What gets deployed

| Item | Value |
|------|--------|
| App | Next.js 16 App Router (`frontend/`) |
| Framework | Next.js (auto-detected from `frontend/package.json`) |
| Required env | `NEXT_PUBLIC_API_BASE_URL` → Railway public API base (no trailing slash) |
| Local default | `http://127.0.0.1:3000` calling `http://127.0.0.1:8000` |
| Git remote | `https://github.com/METResearchGroup/mock_social_media_platform.git` |

The frontend reads the API base at runtime/build via `frontend/src/lib/api.ts` and `frontend/.env.example`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

`NEXT_PUBLIC_*` values are baked into the client bundle. Changing the Railway URL requires updating the Vercel env var **and** redeploying.

## Current investigated state (2026-08-09)

| Check | Result |
|-------|--------|
| Vercel CLI | Installed (`vercel 48.1.6` at `/opt/homebrew/bin/vercel`) |
| Auth | **Not authenticated** (`vercel whoami` → no credentials / invalid token) |
| Local link | **Not linked** (no `.vercel/project.json` or `.vercel/repo.json` at repo or `frontend/`) |
| Root directory for this app | Must be `frontend` (monorepo-style: UI is not at repo root) |

Authenticate before any deploy:

```bash
vercel login
vercel whoami
```

Token-based CI/agent auth (prefer env, never `--token` on the CLI argv):

```bash
export VERCEL_TOKEN="…"   # from https://vercel.com/account/tokens
# Optional if targeting a known project without linking:
# export VERCEL_ORG_ID="…"
# export VERCEL_PROJECT_ID="…"
vercel whoami
```

## Prerequisites

1. Railway API is deployed and has a **public** HTTPS domain (see Railway runbook).
2. Backend CORS allows your Vercel origin(s). Today the API only allows localhost:3000 — fix that before expecting browser traffic from Vercel to succeed.
3. Vercel CLI authenticated, or dashboard access to import the GitHub repo.
4. Deploy order: **Railway → set env on Vercel → deploy frontend**.

## Recommended Vercel project settings

Create one Vercel project for the UI (suggested name: `mock-social-media-platform` or `mock-social-media-platform-web`).

| Setting | Value |
|---------|--------|
| Framework Preset | Next.js |
| Root Directory | `frontend` |
| Build Command | `npm run build` (default from `frontend/package.json`) |
| Install Command | `npm install` (lockfile: `frontend/package-lock.json`) |
| Output | Next.js default (no custom output dir) |
| Node | Leave default unless builds fail; Next 16 wants a current Node LTS |

Do **not** set Root Directory to `.` — the repo root is the Python/uv project, not a Next app.

Optional `frontend/vercel.json` is unnecessary for a stock Next app. If you later add one, keep it under `frontend/` when Root Directory is `frontend`.

## Path A — Dashboard (Git) import

Preferred long-term: push to GitHub → Vercel builds.

1. Open [vercel.com/new](https://vercel.com/new).
2. Import `METResearchGroup/mock_social_media_platform`.
3. Set **Root Directory** to `frontend` (Edit → select `frontend`).
4. Add Environment Variable (Production, and Preview if you want previews to hit the same API):

   | Name | Value |
   |------|--------|
   | `NEXT_PUBLIC_API_BASE_URL` | `https://<your-railway-service>.up.railway.app` |

5. Deploy.
6. Copy the deployment URL (e.g. `https://mock-social-media-platform.vercel.app`).
7. Add that origin to Railway CORS / `CORS_ORIGINS`, then redeploy or restart the API if needed.

Production branch is usually `main`. Non-production branches get Preview deployments automatically once the Git integration is connected.

## Path B — CLI link + deploy

Use after `vercel login`. Prefer linking from the **repository root** with an explicit project + root directory, or link from `frontend/` so the directory matches the Next app.

### Option B1 — Link from `frontend/` (simple)

```bash
cd /path/to/mock_social_media_platform/frontend
vercel link --yes
# Follow prompts / defaults: create project, link to this directory

# Set API base for production (and preview if desired)
printf '%s' 'https://<your-railway-service>.up.railway.app' \
  | vercel env add NEXT_PUBLIC_API_BASE_URL production
printf '%s' 'https://<your-railway-service>.up.railway.app' \
  | vercel env add NEXT_PUBLIC_API_BASE_URL preview

# Preview deploy (default). Use --prod only when you explicitly want production.
vercel deploy -y --no-wait
vercel inspect <deployment-url>
```

### Option B2 — Repo-based link from monorepo root

```bash
cd /path/to/mock_social_media_platform
vercel link --repo --yes
```

Then in the Vercel project **Build & Deployment** settings, set Root Directory to `frontend` if the import did not already.

With Git connected, the durable workflow is: commit → push → Vercel builds. Ask before pushing; do not force-push production branches.

### Production promote (explicit only)

```bash
vercel deploy --prod -y --no-wait
```

## Environment variables

| Variable | Environments | Notes |
|----------|--------------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | Production (required), Preview (recommended), Development (optional) | Railway public origin, **no trailing slash** |

Commands:

```bash
vercel env ls
vercel env pull .env.local   # from frontend/ when linked there
```

Local development still uses `frontend/.env.local` from `.env.example` pointing at `http://127.0.0.1:8000`.

## Verify

1. Open the Vercel URL — feed should load.
2. Open a post thread URL (`/post/<id>`).
3. Like / retweet — network tab should hit `NEXT_PUBLIC_API_BASE_URL` under `/api/v1/...`.
4. If the UI loads but mutations/fetches fail in the browser console with CORS errors, fix Railway CORS (not the Vercel build).
5. If the UI shows a missing-env style failure, confirm `NEXT_PUBLIC_API_BASE_URL` is set and redeploy.

CLI inspection:

```bash
vercel ls
vercel inspect <deployment-url>
vercel inspect <deployment-url> --logs
vercel logs <deployment-url>
```

Do not rely on curling the Vercel URL from a sandbox as the sole proof of success; use the deployment URL in a browser and the Network panel against the Railway host.

## Preview vs production API wiring

| Vercel env | Typical `NEXT_PUBLIC_API_BASE_URL` |
|------------|-------------------------------------|
| Production | Railway production public URL |
| Preview | Same Railway URL, **or** a Railway staging service if you create one |
| Development | `http://127.0.0.1:8000` via `.env.local` |

Preview deployments use unique `*.vercel.app` hostnames. If CORS is an allowlist, either:

- add each production hostname explicitly, or
- teach the API to accept a configurable list / pattern of Vercel origins.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Build fails detecting Next | Root Directory wrong | Set Root Directory to `frontend` |
| Runtime “NEXT_PUBLIC_API_BASE_URL is not set” | Env missing at build | `vercel env add` + redeploy |
| Feed empty / fetch failed, CORS in console | API origin allowlist | Update Railway CORS |
| Feed empty, network 404/502 to API | Wrong base URL or API down | Check Railway domain + `railway logs` |
| CLI: No existing credentials | Not logged in | `vercel login` or export `VERCEL_TOKEN` |
| Linked wrong team/project | Scope mismatch | `vercel link` again; pass `--scope <team>` if needed |

## Handoff checklist

- [ ] Railway `api` service is `SUCCESS` with a public HTTPS domain
- [ ] CORS allows the Vercel origin(s)
- [ ] Vercel project Root Directory = `frontend`
- [ ] `NEXT_PUBLIC_API_BASE_URL` set (no trailing slash)
- [ ] Production (or preview) deployment completed
- [ ] Browser smoke: feed → post thread → like → retweet

Backend details: [HOW_TO_SETUP_RAILWAY.md](./HOW_TO_SETUP_RAILWAY.md).
