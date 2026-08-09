# Step 5: Scaffold the Next.js UI against the local API

## Goal

Create a Next.js App Router frontend under `frontend/` that can call the local FastAPI base URL. Page shells exist for feed and post routes with minimal placeholder UI (no Twitter polish yet).

## Scope

- **Caller:** browser navigation to `http://localhost:3000/` and `http://localhost:3000/post/[postId]`.
- **Slice:** project scaffold + typed API client stubs + empty page shells.
- **Out of scope:** polished Twitter styling, like/retweet buttons that work, screenshots (those are Steps 6–8), Railway/Vercel production deploy.

## Files to inspect

- `docs/plans/2026-08-09_local-ui-backend-build_335b55/steps/step1.md` (API paths and JSON shapes)
- `src/mock_social_media_platform/models.py`
- `strategy_planning/init_plan.md`

## Files allowed to change

- `frontend/**` (create entire Next.js app here)
- Root `.gitignore` only if needed to ignore `frontend/node_modules`, `frontend/.next`
- Root `README.md` only to add “Frontend” local run commands (keep existing Python section)

## Files forbidden to change

- `src/mock_social_media_platform/**` (backend is done for local reads/mutations)
- `tests/**`
- `docs/plans/2026-08-09_local-ui-backend-build_335b55/plan.md` (unless fixing a factual error)
- `.github/workflows/ci.yml` (do not fail CI on frontend yet unless you add a separate optional job—default: leave CI Python-only)

## Scaffold requirements

1. Create the app with:

```bash
cd /workspace
npx create-next-app@latest frontend --typescript --eslint --app --src-dir --tailwind --import-alias "@/*" --turbopack --yes
```

If the CLI flags differ on the installed version, match the intent: TypeScript, App Router, `src/`, Tailwind, ESLint.

2. Env file `frontend/.env.local` (do not commit secrets; this value is local-only):

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Add `frontend/.env.example` with the same key and value for documentation (safe to commit).

3. Create `frontend/src/lib/api.ts` with these exported async functions (may throw or return empty until later steps finish wiring—prefer real `fetch` to the backend paths even if pages do not render rich UI yet):

| Function | HTTP |
|----------|------|
| `getFeed()` | `GET {BASE}/api/v1/feed` |
| `getPostThread(postId: string)` | `GET {BASE}/api/v1/posts/{postId}` |
| `likePost(postId: string)` | `POST {BASE}/api/v1/posts/{postId}/like` |
| `retweetPost(postId: string)` | `POST {BASE}/api/v1/posts/{postId}/retweet` |

Mirror TypeScript types to the Pydantic JSON shapes from Step 1 (`Post`, `FeedResponse`, `PostThreadResponse`, `EngagementActionResponse`, etc.) in `frontend/src/lib/types.ts`.

4. Routes:

| File | Behavior this step |
|------|--------------------|
| `frontend/src/app/page.tsx` | Renders heading `Home` and a plain list of post ids/texts from `getFeed()` (unstyled ok) or a visible error string if API down |
| `frontend/src/app/post/[postId]/page.tsx` | Renders heading `Post` and post id param; may fetch thread or show placeholder text `Post thread placeholder` |
| `frontend/src/app/layout.tsx` | Sets metadata title `Mock Social Media` |

5. Do not add auth, dark-mode marketing chrome, or purple gradient AI-default themes. Keep the shell neutral; visual Twitter likeness is Step 6–7.

## Commands

```bash
cd /workspace/frontend
npm install
npm run lint
npm run build
```

Expected: lint and build exit 0.

Local dual-process smoke (manual):

```bash
# terminal A
cd /workspace && uv run fastapi dev --host 127.0.0.1 --port 8000
# terminal B
cd /workspace/frontend && npm run dev -- --port 3000
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/
```

Expected: `200`.

## Pass

- [ ] `frontend/` Next.js App Router project exists.
- [ ] `NEXT_PUBLIC_API_BASE_URL` documented in `.env.example`.
- [ ] API client module and TS types exist for the four endpoints.
- [ ] `/` and `/post/[postId]` routes render.
- [ ] `npm run build` succeeds.

## Fail

- Putting the Next app at repo root over the Python package.
- Hardcoding production Railway URLs as the only option.
- Polishing full Twitter UI in this step (belongs in 6–7).
- Changing backend contracts.
