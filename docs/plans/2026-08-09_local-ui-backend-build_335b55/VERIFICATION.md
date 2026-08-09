# Local verification

## Processes
- Backend: `uv run uvicorn mock_social_media_platform.main:app --host 127.0.0.1 --port 8000 --reload` → OK
- Frontend: `cd frontend && npm run dev -- --port 3000` → OK

## Commands
- `uv run pytest -q` → 10 passed
- `cd frontend && npm run build` → OK

## Journey
1. Feed loads posts → OK (screenshot 01-feed.png)
2. Open post URL → OK (02-post-thread.png)
3. Like → OK (03-like.png)
4. Retweet → OK (04-retweet.png)
5. Feed shows updated counts → OK (05-feed-after-engagement.png)

## Notes
- Post id used: post_1
- Prior like count → after: 12 → 13
- Prior retweet count → after: 3 → 4
