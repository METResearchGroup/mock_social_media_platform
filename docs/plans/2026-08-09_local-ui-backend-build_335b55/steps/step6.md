# Step 6: Implement the home feed page

## Goal

Replace the feed shell with a Twitter-like home timeline: brand/title chrome, composer-less read-only feed rows, engagement counts visible, each row linking to `/post/{postId}`.

## Scope

- **Caller:** `frontend/src/app/page.tsx` (and components it composes).
- **Slice:** home feed UI only.
- **Out of scope:** post detail page polish, working like/retweet on the feed row (counts display only), screenshots of post detail (Step 7–8).

## Files to inspect

- `frontend/src/app/page.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/lib/types.ts`
- `strategy_planning/init_plan.md`

## Files allowed to change

- `frontend/src/app/page.tsx`
- `frontend/src/app/layout.tsx` (shared chrome only if needed)
- `frontend/src/app/globals.css`
- `frontend/src/components/feed/FeedTimeline.tsx` (create)
- `frontend/src/components/feed/FeedPostRow.tsx` (create)
- `frontend/src/components/chrome/AppHeader.tsx` (create)
- `docs/plans/2026-08-09_local-ui-backend-build_335b55/images/before/feed.png` (capture)
- `docs/plans/2026-08-09_local-ui-backend-build_335b55/images/after/feed.png` (capture)

## Files forbidden to change

- `src/mock_social_media_platform/**`
- `tests/**`
- Backend route paths
- `frontend/src/app/post/**` beyond leaving the Step 5 placeholder (detail polish is Step 7)

## UI requirements

1. **Before screenshot:** with Step 5 shell running, save a desktop screenshot to `docs/plans/2026-08-09_local-ui-backend-build_335b55/images/before/feed.png`.
2. Visual direction: light timeline inspired by Twitter/X home—left or top brand mark text `Mock Social`, primary column ~600px max width, avatar initials circle, `@handle`, relative or absolute timestamp, post text, row showing reply/retweet/like counts.
3. Each row is a link (or contains a clear link) to `/post/{id}`.
4. No cards-with-shadow stacks; prefer hairline separators between rows.
5. Avoid purple-on-white AI-default gradients; use neutral grays + one accent (Twitter-like blue `#1D9BF0` is acceptable).
6. Mobile: single column still readable at 390px width.
7. **After screenshot:** `docs/plans/2026-08-09_local-ui-backend-build_335b55/images/after/feed.png`.

## Data

- Load via `getFeed()` on the server component **or** a client fetch on mount. Prefer server component fetch to `NEXT_PUBLIC_API_BASE_URL` if it works in local `next dev`; if CORS/SSR base URL issues appear, use a client component with `useEffect`—document the choice in a one-line comment at the top of `page.tsx`.

## Commands

```bash
cd /workspace
uv run fastapi dev --host 127.0.0.1 --port 8000
cd /workspace/frontend && npm run dev -- --port 3000
```

Open `http://127.0.0.1:3000/`, verify >= 5 posts, click through one link to `/post/...` (destination may still be placeholder).

```bash
cd /workspace/frontend && npm run lint && npm run build
```

Expected: exit 0.

## Pass

- [ ] Before and after feed screenshots committed under this plan’s `images/` dirs.
- [ ] Feed shows author, text, engagement counts.
- [ ] Each post navigates to `/post/{postId}`.
- [ ] Lint/build green.

## Fail

- Feed hardcodes posts in JSX instead of calling the API.
- Post detail fully built here (do that in Step 7).
- Missing before/after screenshots.
