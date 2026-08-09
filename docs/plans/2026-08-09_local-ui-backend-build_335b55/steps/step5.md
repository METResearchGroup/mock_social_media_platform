# Scaffold the Next.js UI against the local API

## Goal

Create a Next.js App Router frontend under `frontend/` that can call the local FastAPI base URL. Add page shells for the feed route and post route with minimal placeholder UI. Do not add Twitter polish yet.

## Scope

- **Caller.** Browser navigation to `http://localhost:3000/` and `http://localhost:3000/post/[postId]`.
- **Slice.** Create the project scaffold, typed API client stubs, and empty page shells.
- **Out of scope.** Do not add polished Twitter styling, working like/retweet buttons, screenshots, or Railway/Vercel production deploy. Screenshots belong in Steps 6 to 8.

## Files to inspect

- `docs/plans/2026-08-09_local-ui-backend-build_335b55/steps/step1.md` (API paths and JSON shapes)
- `src/mock_social_media_platform/models.py`
- `strategy_planning/init_plan.md`

## Files allowed to change

- `frontend/**` (create entire Next.js app here)
- Root `.gitignore` only if needed to ignore `frontend/node_modules`, `frontend/.next`
- Root `README.md` only to add "Frontend" local run commands (keep existing Python section)

## Files forbidden to change

- `src/mock_social_media_platform/**` (backend is done for local reads/mutations)
- `tests/**`
- `docs/plans/2026-08-09_local-ui-backend-build_335b55/plan.md` (unless fixing a factual error)
- `.github/workflows/ci.yml` (do not fail CI on frontend yet unless you add a separate optional job. Default behavior is to leave CI for Python only)

## Scaffold requirements

1. Create the app with:

```bash
cd /workspace
npx create-next-app@latest frontend --typescript --eslint --app --src-dir --tailwind --import-alias "@/*" --turbopack --yes
```

If the CLI flags differ on the installed version, match the intent. Use TypeScript, App Router, `src/`, Tailwind, and ESLint.

2. Add env file `frontend/.env.local`. Do not commit secrets. The value is local only.

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Add `frontend/.env.example` with the same key and value for documentation (safe to commit).

3. Create `frontend/src/lib/api.ts` with these exported async functions. The functions may throw or return empty values until later steps finish wiring. Prefer real `fetch` calls to the backend paths even if pages do not render rich UI yet.

| Function | HTTP |
|----------|------|
| `getFeed()` | `GET {BASE}/api/v1/feed` |
| `getPostThread(postId: string)` | `GET {BASE}/api/v1/posts/{postId}` |
| `likePost(postId: string)` | `POST {BASE}/api/v1/posts/{postId}/like` |
| `retweetPost(postId: string)` | `POST {BASE}/api/v1/posts/{postId}/retweet` |

Mirror TypeScript types to the Pydantic JSON shapes from Step 1 in `frontend/src/lib/types.ts`. Include `Post`, `FeedResponse`, `PostThreadResponse`, `EngagementActionResponse`, etc.

4. Routes:

| File | Behavior this step |
|------|--------------------|
| `frontend/src/app/page.tsx` | Renders heading `Home` and a plain list of post ids/texts from `getFeed()` (unstyled ok) or a visible error string if API down |
| `frontend/src/app/post/[postId]/page.tsx` | Renders heading `Post` and post id param. May fetch thread or show placeholder text `Post thread placeholder` |
| `frontend/src/app/layout.tsx` | Sets metadata title `Mock Social Media` |

5. Do not add auth, dark mode marketing chrome, or purple gradient AI default themes. Keep the shell neutral. Visual work similar to Twitter belongs in Steps 6 to 7.

## Commands

```bash
cd /workspace/frontend
npm install
npm run lint
npm run build
```

The expected result is that lint and build exit 0.

Local smoke check with backend and frontend processes:

```bash
# terminal A
cd /workspace && uv run fastapi dev --host 127.0.0.1 --port 8000
# terminal B
cd /workspace/frontend && npm run dev -- --port 3000
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/
```

The expected result is `200`.

## Pass

- [ ] `frontend/` Next.js App Router project exists.
- [ ] `NEXT_PUBLIC_API_BASE_URL` documented in `.env.example`.
- [ ] API client module and TS types exist for the four endpoints.
- [ ] `/` and `/post/[postId]` routes render.
- [ ] `npm run build` succeeds.

## Fail

- Putting the Next app at repo root over the Python package.
- Hardcoding production Railway URLs as the only option.
- Polishing full Twitter UI in this step (belongs in Steps 6 to 7).
- Changing backend contracts.
