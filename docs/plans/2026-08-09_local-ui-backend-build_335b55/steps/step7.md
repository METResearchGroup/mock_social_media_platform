# Step 7: Implement the post thread and engagement controls

## Goal

Build the post detail page into a Twitter-like thread: parent post, ordered comments, like and retweet controls that call the backend and update visible counts.

## Scope

- **Caller:** `frontend/src/app/post/[postId]/page.tsx` and its components.
- **Slice:** thread view + like + retweet for the opened post.
- **Out of scope:** nested reply composer, follow graph, retweet-with-comment, production deploy.

## Files to inspect

- `frontend/src/app/post/[postId]/page.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/components/feed/FeedPostRow.tsx` (reuse patterns)
- `docs/plans/2026-08-09_local-ui-backend-build_335b55/steps/step4.md`

## Files allowed to change

- `frontend/src/app/post/[postId]/page.tsx`
- `frontend/src/components/post/PostThread.tsx` (create)
- `frontend/src/components/post/EngagementBar.tsx` (create)
- `frontend/src/components/post/CommentList.tsx` (create)
- `frontend/src/lib/api.ts` (only if client-side error handling needs tightening)
- `frontend/src/app/globals.css` (shared timeline styles)
- `docs/plans/2026-08-09_local-ui-backend-build_335b55/images/before/post-thread.png`
- `docs/plans/2026-08-09_local-ui-backend-build_335b55/images/after/post-thread.png`
- `docs/plans/2026-08-09_local-ui-backend-build_335b55/images/after/post-liked.png`
- `docs/plans/2026-08-09_local-ui-backend-build_335b55/images/after/post-retweeted.png`

## Files forbidden to change

- `src/mock_social_media_platform/**`
- `tests/**`
- API path strings away from `/api/v1/...` contract
- Feed page redesign unrelated to shared components

## UI / behavior requirements

1. **Before screenshot:** placeholder detail page → `images/before/post-thread.png`.
2. Load `getPostThread(postId)`.
3. Show parent post prominently; list comments below with separators.
4. `EngagementBar` on the parent post:
   - Like button calls `likePost(postId)` then updates displayed `like_count` from the response.
   - Retweet button calls `retweetPost(postId)` then updates `retweet_count` from the response.
5. Back control to `/` labeled `Home` or a ← affordance.
6. Unknown id: show a simple `Post not found` state (from 404).
7. **After screenshots:**
   - `post-thread.png` — thread with comments visible
   - `post-liked.png` — after clicking like (count increased)
   - `post-retweeted.png` — after clicking retweet (count increased)

## Commands

```bash
cd /workspace && uv run fastapi dev --host 127.0.0.1 --port 8000
cd /workspace/frontend && npm run dev -- --port 3000
```

Manual check:

1. From feed, open the seed post that has >= 3 comments.
2. Confirm comments render in oldest-first order matching the API.
3. Click like once; count +1 without full page error.
4. Click retweet once; count +1.
5. Refresh page; counts remain at incremented values (same backend process).

```bash
cd /workspace/frontend && npm run lint && npm run build
```

Expected: exit 0.

## Pass

- [ ] Before + after thread screenshots saved.
- [ ] Like and retweet after screenshots saved.
- [ ] Comments render for the rich seed thread.
- [ ] 404 path shows not-found UI.
- [ ] Lint/build green.

## Fail

- Buttons only toggle local state without calling the API.
- Missing screenshots.
- Implementing a full compose/reply editor.
