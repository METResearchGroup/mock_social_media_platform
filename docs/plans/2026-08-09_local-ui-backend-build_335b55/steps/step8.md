# Step 8: Capture key-journey screenshots and local smoke proof

## Goal

Prove the single-user happy path end-to-end on local processes and store a complete screenshot set for PR review.

## Scope

- **Caller:** a human or agent walking the UI with backend + frontend running locally.
- **Slice:** verification + screenshot packaging only (bugfixes allowed if the journey is broken).
- **Out of scope:** Railway deploy, Vercel deploy, CI frontend job, new features.

## Files to inspect

- `docs/plans/2026-08-09_local-ui-backend-build_335b55/plan.md`
- `docs/plans/2026-08-09_local-ui-backend-build_335b55/steps/step6.md`
- `docs/plans/2026-08-09_local-ui-backend-build_335b55/steps/step7.md`
- `strategy_planning/init_plan.md`

## Files allowed to change

- `docs/plans/2026-08-09_local-ui-backend-build_335b55/images/after/**` (journey screenshots)
- `docs/plans/2026-08-09_local-ui-backend-build_335b55/images/before/**` (only if Steps 6–7 missed a before shot)
- `docs/plans/2026-08-09_local-ui-backend-build_335b55/VERIFICATION.md` (create)
- Bugfix files under `frontend/**` or `src/mock_social_media_platform/**` **only** if a journey step fails; keep fixes minimal and covered by existing tests where backend-related

## Files forbidden to change

- `docs/plans/2026-08-09_local-ui-backend-build_335b55/plan.md` structure (no silent scope expansion into deploy)
- `.github/workflows/ci.yml` unless a tiny fix is required for Python CI breakage caused by this work
- Adding production deploy configs as a requirement of “done”

## Required journey screenshots

All paths under `docs/plans/2026-08-09_local-ui-backend-build_335b55/images/after/`:

| File | Journey moment |
|------|----------------|
| `01-feed.png` | Home feed with multiple hydrated posts |
| `02-post-thread.png` | Post unique URL showing parent + comments |
| `03-like.png` | Same post after like; like count visibly higher than in `02` (or annotate prior count in `VERIFICATION.md`) |
| `04-retweet.png` | Same post after retweet; retweet count visibly higher |
| `05-feed-after-engagement.png` | Return to home feed; engagement counts for that post reflect mutations |

Also retain Step 6–7 before/after pairs if already captured (`feed.png`, `post-thread.png`, etc.).

Desktop width >= 1280px for these five journey shots. Optionally add `*-mobile.png` at 390px width for `01` and `02` only.

## `VERIFICATION.md` checklist (create and fill)

```markdown
# Local verification

## Processes
- Backend: `uv run fastapi dev --host 127.0.0.1 --port 8000` → OK / FAIL
- Frontend: `cd frontend && npm run dev -- --port 3000` → OK / FAIL

## Commands
- `uv run pytest -q` → paste summary line
- `cd frontend && npm run build` → OK / FAIL

## Journey
1. Feed loads posts → OK / FAIL (screenshot 01-feed.png)
2. Open post URL → OK / FAIL (02-post-thread.png)
3. Like → OK / FAIL (03-like.png)
4. Retweet → OK / FAIL (04-retweet.png)
5. Feed shows updated counts → OK / FAIL (05-feed-after-engagement.png)

## Notes
- Post id used: ...
- Prior like count → after:
- Prior retweet count → after:
```

## Commands

```bash
cd /workspace
uv run pytest -q
cd /workspace/frontend && npm run lint && npm run build
uv run fastapi dev --host 127.0.0.1 --port 8000
# other terminal
cd /workspace/frontend && npm run dev -- --port 3000
```

Walk the five journey moments; save PNGs to the `images/after/` paths above; complete `VERIFICATION.md`.

## Pass

- [ ] All five journey screenshots exist and are non-empty PNGs.
- [ ] `VERIFICATION.md` filled with OK on every journey row.
- [ ] `uv run pytest -q` green.
- [ ] `npm run build` green.
- [ ] No deploy to Railway/Vercel claimed as part of this plan’s completion.

## Fail

- Screenshots of code or terminal instead of the UI journey.
- Skipping feed-after-engagement proof.
- Marking done while like/retweet only change client state without backend.
