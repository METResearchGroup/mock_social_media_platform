# Step 3: Test-first implement feed and post-thread reads

## Goal

Make `GET /api/v1/feed` and `GET /api/v1/posts/{post_id}` work against the dummy seed using TDD.

## Scope

- **Caller:** HTTP clients hitting the FastAPI app (tests use `httpx.AsyncClient` or Starlette `TestClient`).
- **Slice:** read-only feed + post thread hydration.
- **Out of scope:** like/retweet, frontend, auth, pagination beyond returning the full seed feed.

## Files to inspect

- `src/mock_social_media_platform/main.py`
- `src/mock_social_media_platform/api/routes_feed.py`
- `src/mock_social_media_platform/api/routes_posts.py`
- `src/mock_social_media_platform/data/seed.py`
- `src/mock_social_media_platform/models.py`
- `docs/plans/2026-08-09_local-ui-backend-build_335b55/steps/step1.md`

## Files allowed to change

- `tests/test_api_feed.py` (create)
- `tests/test_api_posts.py` (create)
- `src/mock_social_media_platform/api/routes_feed.py`
- `src/mock_social_media_platform/api/routes_posts.py`
- `src/mock_social_media_platform/services/feed.py` (create if needed)
- `src/mock_social_media_platform/services/posts.py` (create if needed)
- `src/mock_social_media_platform/services/__init__.py` (create if needed)
- `pyproject.toml` / `uv.lock` only if adding `httpx` for tests (prefer Starlette `TestClient` from `fastapi.testclient` to avoid new deps)

## Files forbidden to change

- `src/mock_social_media_platform/models.py`
- Seed **shape** in `src/mock_social_media_platform/data/seed.py` (helper bugfixes allowed; do not redesign models)
- `frontend/**`
- Like/retweet route bodies beyond leaving them as `NotImplementedError`
- `.github/workflows/ci.yml`

## Phase 3 — Test design (write these tests first; they must fail)

### `tests/test_api_feed.py`

1. `test_get_feed_returns_top_level_posts_newest_first`
   - **Given** the app with seed data
   - **When** `GET /api/v1/feed`
   - **Then** status 200; body matches `FeedResponse`; every post has `parent_post_id is None`; timestamps are non-increasing; length equals number of top-level seed posts.

2. `test_get_feed_post_payload_includes_engagement_and_author`
   - **Given** feed response
   - **When** inspecting the first post
   - **Then** `author.handle`, `text`, `engagement.like_count`, `engagement.retweet_count`, `engagement.reply_count` are present and correctly typed.

### `tests/test_api_posts.py`

1. `test_get_post_thread_returns_post_and_direct_comments_oldest_first`
   - **Given** a known seed post id that has >= 3 comments (read that id from seed helpers in the test)
   - **When** `GET /api/v1/posts/{post_id}`
   - **Then** status 200; `post.id` matches; `comments` length matches `list_comments(post_id)`; comment order ascending by `created_at`; each comment’s `parent_post_id == post_id`.

2. `test_get_post_unknown_id_returns_404`
   - **Given** id `does-not-exist`
   - **When** `GET /api/v1/posts/does-not-exist`
   - **Then** status 404.

## Phase 4 — Implement

Dependency order:

1. Feed handler calls `list_feed_posts()` → `FeedResponse`.
2. Post handler calls `get_post` / `list_comments` → `PostThreadResponse` or 404 via `fastapi.HTTPException`.

## Commands

```bash
cd /workspace
uv run pytest -q tests/test_api_feed.py tests/test_api_posts.py
```

After writing tests only, expected: failures from `NotImplementedError` or wrong status (not ImportError).

After implementation:

```bash
uv run pytest -q tests/test_api_feed.py tests/test_api_posts.py
uv run ruff check src/mock_social_media_platform tests
uv run ruff format --check src/mock_social_media_platform tests
uv run pyright
```

Expected: all exit 0; both test modules green.

Manual smoke:

```bash
uv run fastapi dev --host 127.0.0.1 --port 8000
curl -s http://127.0.0.1:8000/api/v1/feed | head -c 200
```

Expected: JSON starting with `{"posts":[...]`.

## Pass

- [ ] Four tests above exist and pass.
- [ ] Like/retweet still unimplemented.
- [ ] 404 for unknown post id.
- [ ] Lint/typecheck clean.

## Fail

- Implementing mutations in this step.
- Returning nested comment trees deeper than one level.
- Changing the public JSON field names.
