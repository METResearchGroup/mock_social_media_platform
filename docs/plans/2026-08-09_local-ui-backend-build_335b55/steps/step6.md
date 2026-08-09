# Implement the home feed page

## Goal

Replace the feed shell with a home timeline similar to Twitter. The page needs brand or title chrome, feed rows that are read only and have no composer, visible engagement counts, and a link from each row to `/post/{postId}`.

## Scope

- **Caller.** `frontend/src/app/page.tsx` and the components it composes.
- **Slice.** Add only the home feed UI.
- **Out of scope.** Do not polish the post detail page, add working like/retweet on the feed row, or capture post detail screenshots. Feed rows display counts only. Post detail screenshots belong in Steps 7 to 8.

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

1. **Before screenshot.** With Step 5 shell running, save a desktop screenshot to `docs/plans/2026-08-09_local-ui-backend-build_335b55/images/before/feed.png`.
2. Use a light timeline inspired by Twitter/X home. Include left or top brand mark text `Mock Social`, a primary column with ~600px max width, an avatar initials circle, `@handle`, a relative or absolute timestamp, post text, and a row showing reply/retweet/like counts.
3. Each row is a link (or contains a clear link) to `/post/{id}`.
4. Do not use card stacks with shadows. Prefer hairline separators between rows.
5. Avoid purple on white AI default gradients. Use neutral grays and one accent. Blue similar to Twitter `#1D9BF0` is acceptable.
6. Mobile layout must use one column and remain readable at 390px width.
7. **After screenshot.** Save `docs/plans/2026-08-09_local-ui-backend-build_335b55/images/after/feed.png`.

## Data

- Load via `getFeed()` on the server component **or** a client fetch on mount. Prefer server component fetch to `NEXT_PUBLIC_API_BASE_URL` if it works in local `next dev`. If CORS or SSR base URL issues appear, use a client component with `useEffect`. Document the choice in a one line comment at the top of `page.tsx`.

## Commands

```bash
cd /workspace
uv run fastapi dev --host 127.0.0.1 --port 8000
cd /workspace/frontend && npm run dev -- --port 3000
```

Open `http://127.0.0.1:3000/`, verify >= 5 posts, and click through one link to `/post/...`. The destination may still be a placeholder.

```bash
cd /workspace/frontend && npm run lint && npm run build
```

The expected result is exit 0.

## Pass

- [ ] Before and after feed screenshots committed under this plan's `images/` dirs.
- [ ] Feed shows author, text, engagement counts.
- [ ] Each post navigates to `/post/{postId}`.
- [ ] Lint/build green.

## Fail

- Feed hardcodes posts in JSX instead of calling the API.
- Post detail fully built here (do that in Step 7).
- Missing before/after screenshots.
