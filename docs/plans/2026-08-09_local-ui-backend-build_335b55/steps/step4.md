# Step 4: Test-first implement like and retweet mutations

## Goal

Make `POST /api/v1/posts/{post_id}/like` and `POST /api/v1/posts/{post_id}/retweet` increment counters on the in-memory seed store and return the updated post.

## Scope

- **Caller:** HTTP `POST` to engagement routes.
- **Slice:** single-user, no-auth, idempotency-not-required increments on top-level posts (and allow on comments if the same store entry exists—tests only require top-level posts).
- **Out of scope:** auth, undo like, quote tweets, frontend, persistence to disk/DB.

## Files to inspect

- `src/mock_social_media_platform/data/seed.py`
- `src/mock_social_media_platform/api/routes_posts.py`
- `src/mock_social_media_platform/models.py`
- `tests/test_api_posts.py`

## Files allowed to change

- `src/mock_social_media_platform/data/seed.py` (add mutation helpers; keep existing read helpers’ signatures)
- `src/mock_social_media_platform/services/posts.py` (or create)
- `src/mock_social_media_platform/api/routes_posts.py`
- `tests/test_api_engagement.py` (create)

## Files forbidden to change

- `src/mock_social_media_platform/models.py` field names
- Feed read behavior from Step 3 (tests must remain green)
- `frontend/**`
- `.github/workflows/ci.yml`
- `strategy_planning/init_plan.md`

## Mutation helpers to add in seed/store layer

Exact signatures:

```python
def like_post(post_id: str) -> Post | None: ...
def retweet_post(post_id: str) -> Post | None: ...
```

Behavior:

- If `post_id` missing → return `None`.
- If present → increment `engagement.like_count` or `engagement.retweet_count` by 1 on the stored `Post`, return the updated `Post`.
- Mutations must be visible to subsequent `get_post` / `list_feed_posts` calls in the same process (in-memory update of `POSTS`).

Because tests share one process, reset or isolate state:

- Prefer copying seed into a mutable store at app startup **or**
- Provide `reset_store()` used from tests’ fixtures.

If introducing `reset_store()`, add it in `seed.py` and call it from a pytest fixture in `tests/conftest.py` (allowed to create `tests/conftest.py`).

## Phase 3 — Tests first (`tests/test_api_engagement.py`)

1. `test_like_post_increments_like_count`
   - **Given** a known top-level post id; record `like_count`
   - **When** `POST /api/v1/posts/{post_id}/like`
   - **Then** 200; body is `EngagementActionResponse`; `post.engagement.like_count == prior + 1`.

2. `test_retweet_post_increments_retweet_count`
   - Same pattern for retweet.

3. `test_like_unknown_post_returns_404`
   - `POST /api/v1/posts/does-not-exist/like` → 404.

4. `test_retweet_unknown_post_returns_404`
   - `POST /api/v1/posts/does-not-exist/retweet` → 404.

5. `test_like_then_feed_shows_updated_count`
   - Like a post; `GET /api/v1/feed`; that post’s `like_count` reflects the increment.

## Commands

```bash
cd /workspace
uv run pytest -q tests/test_api_engagement.py
```

Expected after tests-only: fail on `NotImplementedError`.

```bash
uv run pytest -q
uv run ruff check src/mock_social_media_platform tests
uv run ruff format --check src/mock_social_media_platform tests
uv run pyright
```

Expected after implementation: all tests green (including Steps 3 tests); lint/typecheck exit 0.

## Pass

- [ ] Five engagement tests pass.
- [ ] Full `uv run pytest -q` green.
- [ ] Unknown ids return 404.
- [ ] Feed reflects updated counts in-process.

## Fail

- Disk/database persistence.
- Auth or per-user like sets.
- Frontend work in this step.
- Changing response model field names.
