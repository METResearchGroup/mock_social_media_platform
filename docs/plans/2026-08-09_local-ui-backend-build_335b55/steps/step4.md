# Implement like and retweet mutations with tests first

## Goal

Make `POST /api/v1/posts/{post_id}/like` and `POST /api/v1/posts/{post_id}/retweet` increment counters in the seed store in memory. Each route must return the updated post.

## Scope

- **Caller.** HTTP `POST` calls to engagement routes.
- **Slice.** Add increments for a single user, with no auth and no idempotency requirement, on top level posts. Comments may use the same behavior if the same store entry exists, but tests only require top level posts.
- **Out of scope.** Do not add auth, undo like, quote tweets, frontend work, or persistence to disk/DB.

## Files to inspect

- `src/mock_social_media_platform/data/seed.py`
- `src/mock_social_media_platform/api/routes_posts.py`
- `src/mock_social_media_platform/models.py`
- `tests/test_api_posts.py`

## Files allowed to change

- `src/mock_social_media_platform/data/seed.py` (add mutation helpers. Keep existing read helpers' signatures)
- `src/mock_social_media_platform/services/posts.py` (or create)
- `src/mock_social_media_platform/api/routes_posts.py`
- `tests/test_api_engagement.py` (create)

## Files forbidden to change

- `src/mock_social_media_platform/models.py` field names
- Feed read behavior from Step 3 (tests must remain green)
- `frontend/**`
- `.github/workflows/ci.yml`
- `strategy_planning/init_plan.md`

## Mutation helpers to add in the seed or store layer

Use these exact signatures:

```python
def like_post(post_id: str) -> Post | None: ...
def retweet_post(post_id: str) -> Post | None: ...
```

Behavior:

- If `post_id` is missing, return `None`.
- If `post_id` is present, increment `engagement.like_count` or `engagement.retweet_count` by 1 on the stored `Post`. Return the updated `Post`.
- Mutations must be visible to subsequent `get_post` / `list_feed_posts` calls in the same process. Update `POSTS` in memory.

Tests share one process, so reset or isolate state:

- Prefer copying seed into a mutable store at app startup **or**
- Provide `reset_store()` used from tests' fixtures.

If you introduce `reset_store()`, add it in `seed.py` and call it from a pytest fixture in `tests/conftest.py`. You may create `tests/conftest.py`.

## Phase 3. Tests first

Write these tests in `tests/test_api_engagement.py` before the implementation.

1. `test_like_post_increments_like_count`
   - **Given** a known top level post id. Record `like_count`.
   - **When** `POST /api/v1/posts/{post_id}/like` runs.
   - **Then** status is 200, body is `EngagementActionResponse`, and `post.engagement.like_count == prior + 1`.

2. `test_retweet_post_increments_retweet_count`
   - Use the same pattern for retweet.

3. `test_like_unknown_post_returns_404`
   - `POST /api/v1/posts/does-not-exist/like` returns 404.

4. `test_retweet_unknown_post_returns_404`
   - `POST /api/v1/posts/does-not-exist/retweet` returns 404.

5. `test_like_then_feed_shows_updated_count`
   - Like a post. Then call `GET /api/v1/feed`. The post's `like_count` reflects the increment.

## Commands

```bash
cd /workspace
uv run pytest -q tests/test_api_engagement.py
```

After tests only, the expected result is failure on `NotImplementedError`.

```bash
uv run pytest -q
uv run ruff check src/mock_social_media_platform tests
uv run ruff format --check src/mock_social_media_platform tests
uv run pyright
```

After implementation, the expected result is that all tests pass, including Step 3 tests. Lint and typecheck commands exit 0.

## Pass

- [ ] Five engagement tests pass.
- [ ] Full `uv run pytest -q` green.
- [ ] Unknown ids return 404.
- [ ] Feed reflects updated counts in the same process.

## Fail

- Disk/database persistence.
- Auth or like sets per user.
- Frontend work in this step.
- Changing response model field names.
