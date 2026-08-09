# Step 1: Freeze API contracts and dummy dataset

## Goal

Freeze the public API contract and the in-repo dummy dataset before any FastAPI behavior or UI work. After this step, implementers can write tests and stubs against fixed shapes.

## Scope

- **Caller:** future FastAPI route handlers under `src/mock_social_media_platform/api/` that will return these models.
- **Slice:** define Pydantic models + seed data only.
- **Out of scope:** FastAPI app object, routers, HTTP tests, Next.js, like/retweet mutation logic, persistence beyond a Python module of literals.

## Files to inspect

- `strategy_planning/init_plan.md`
- `src/mock_social_media_platform/__init__.py`
- `pyproject.toml`
- `tests/test_placeholder.py`

## Files allowed to change

- `src/mock_social_media_platform/models.py` (create)
- `src/mock_social_media_platform/data/seed.py` (create)
- `src/mock_social_media_platform/data/__init__.py` (create)
- `src/mock_social_media_platform/__init__.py` (re-export only if needed for package clarity; keep `hello()` until a later step removes the placeholder)
- `docs/plans/2026-08-09_local-ui-backend-build_335b55/steps/step1.md` (check off progress notes only if appending a completion note)

## Files forbidden to change

- `frontend/**` (must not exist yet, or leave untouched if created early)
- `tests/**` (no API tests yet)
- `.github/workflows/ci.yml`
- `strategy_planning/init_plan.md`
- Any Railway or Vercel config files

## Contract freeze (must match exactly)

### Models in `src/mock_social_media_platform/models.py`

Define these Pydantic v2 models (field names exact):

| Model | Fields |
|-------|--------|
| `EngagementMetrics` | `like_count: int`, `retweet_count: int`, `reply_count: int` |
| `UserSummary` | `id: str`, `handle: str`, `display_name: str` |
| `Post` | `id: str`, `author: UserSummary`, `text: str`, `created_at: datetime`, `engagement: EngagementMetrics`, `parent_post_id: str \| None` |
| `FeedResponse` | `posts: list[Post]` |
| `PostThreadResponse` | `post: Post`, `comments: list[Post]` |
| `EngagementActionResponse` | `post: Post` |

Rules:

- Use `datetime` with timezone-aware UTC values in seed data.
- Do not use `...` / ellipsis defaults on required Pydantic fields.
- `parent_post_id` is `None` for top-level posts; comments reference their parent post id.
- Comments are also `Post` objects (same shape as posts).

### Seed data in `src/mock_social_media_platform/data/seed.py`

Provide module-level constants:

- `USERS: dict[str, UserSummary]` with at least 3 users.
- `POSTS: dict[str, Post]` with at least 5 top-level posts suitable for a home feed.
- At least one top-level post must have **3 or more** comments in `POSTS` (comments stored in the same dict, distinguished by non-`None` `parent_post_id`).
- Engagement counts on seed posts must be non-negative integers and internally consistent with `reply_count` equaling the number of direct child comments for that post id.
- Export helpers with these exact signatures (bodies may be real data lookups; no FastAPI):

```python
def list_feed_posts() -> list[Post]: ...
def get_post(post_id: str) -> Post | None: ...
def list_comments(post_id: str) -> list[Post]: ...
```

`list_feed_posts()` returns only top-level posts (`parent_post_id is None`), newest `created_at` first.
`list_comments(post_id)` returns direct children only, oldest `created_at` first.

### HTTP route contract (document as module docstring in `models.py` or a short comment block at top of `seed.py`; do not implement routes here)

| Method | Path | Success body |
|--------|------|--------------|
| `GET` | `/api/v1/feed` | `FeedResponse` |
| `GET` | `/api/v1/posts/{post_id}` | `PostThreadResponse` |
| `POST` | `/api/v1/posts/{post_id}/like` | `EngagementActionResponse` |
| `POST` | `/api/v1/posts/{post_id}/retweet` | `EngagementActionResponse` |

Missing post id → HTTP 404 in later steps (not implemented here).

## Implementation phases for this step

Follow `/implement-from-spec` Phases 0–2 only:

1. Confirm caller and file tree (this document).
2. Create the files with models and seed literals.
3. Stop. Do not create FastAPI routes or tests in this step.

## Commands

```bash
cd /workspace
uv sync --extra test
uv run python -c "from mock_social_media_platform.models import FeedResponse, PostThreadResponse, EngagementActionResponse; from mock_social_media_platform.data.seed import list_feed_posts, get_post, list_comments; posts=list_feed_posts(); assert len(posts)>=5; p=posts[0]; kids=list_comments(p.id); print(len(posts), p.id, len(kids))"
```

Expected: prints three integers / an id with no traceback. Feed length >= 5. At least one post in the seed set must satisfy `len(list_comments(post_id)) >= 3` (verify manually or extend the one-liner).

```bash
uv run ruff check src/mock_social_media_platform/models.py src/mock_social_media_platform/data
uv run ruff format --check src/mock_social_media_platform/models.py src/mock_social_media_platform/data
uv run pyright src/mock_social_media_platform/models.py src/mock_social_media_platform/data
```

Expected: all exit 0.

## Pass

- [ ] All models and fields listed above exist with exact names.
- [ ] Seed has >= 3 users, >= 5 top-level posts, >= 1 thread with >= 3 comments.
- [ ] Helpers `list_feed_posts`, `get_post`, `list_comments` work as specified.
- [ ] No FastAPI app, routers, or new tests added in this step.
- [ ] Ruff + pyright clean on the new modules.

## Fail

- Models diverge from the table (renamed fields, missing engagement block, comments as a different type).
- Seed only has posts with no comment threads.
- Business logic for like/retweet implemented here.
- Frontend files created in this step.
