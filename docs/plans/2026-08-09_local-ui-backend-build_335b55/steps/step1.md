# Freeze API contracts and dummy dataset

## Goal

Freeze the public API contract and the dummy dataset in the repository before any FastAPI behavior or UI work starts. After this step, implementers can write tests and stubs against the same fixed shapes.

## Scope

- **Caller.** Future FastAPI route handlers under `src/mock_social_media_platform/api/` will return these models.
- **Slice.** Define only Pydantic models and seed data.
- **Out of scope.** Do not add a FastAPI app object, routers, HTTP tests, Next.js, like/retweet mutation logic, or persistence beyond a Python module of literals.

## Files to inspect

- `strategy_planning/init_plan.md`
- `src/mock_social_media_platform/__init__.py`
- `pyproject.toml`
- `tests/test_placeholder.py`

## Files allowed to change

- `src/mock_social_media_platform/models.py` (create)
- `src/mock_social_media_platform/data/seed.py` (create)
- `src/mock_social_media_platform/data/__init__.py` (create)
- `src/mock_social_media_platform/__init__.py` (export again only if needed for package clarity. Keep `hello()` until a later step removes the placeholder)
- `docs/plans/2026-08-09_local-ui-backend-build_335b55/steps/step1.md` (check off progress notes only if appending a completion note)

## Files forbidden to change

- `frontend/**` (must not exist yet, or leave untouched if created early)
- `tests/**` (no API tests yet)
- `.github/workflows/ci.yml`
- `strategy_planning/init_plan.md`
- Any Railway or Vercel config files

## Contract freeze

### Models in `src/mock_social_media_platform/models.py`

Define these Pydantic v2 models. The field names must match exactly.

| Model | Fields |
|-------|--------|
| `EngagementMetrics` | `like_count: int`, `retweet_count: int`, `reply_count: int` |
| `UserSummary` | `id: str`, `handle: str`, `display_name: str` |
| `Post` | `id: str`, `author: UserSummary`, `text: str`, `created_at: datetime`, `engagement: EngagementMetrics`, `parent_post_id: str \| None` |
| `FeedResponse` | `posts: list[Post]` |
| `PostThreadResponse` | `post: Post`, `comments: list[Post]` |
| `EngagementActionResponse` | `post: Post` |

Rules:

- Use `datetime` with UTC values that include timezone data in seed data.
- Do not use `...` / ellipsis defaults on required Pydantic fields.
- `parent_post_id` is `None` for top level posts. Comments reference their parent post id.
- Comments are also `Post` objects (same shape as posts).

### Seed data in `src/mock_social_media_platform/data/seed.py`

Provide constants at module level:

- `USERS: dict[str, UserSummary]` with at least 3 users.
- `POSTS: dict[str, Post]` with at least 5 top level posts suitable for a home feed.
- At least one top level post must have **3 or more** comments in `POSTS` (comments stored in the same dict, distinguished by non-`None` `parent_post_id`).
- Engagement counts on seed posts must be integers greater than or equal to zero, and `reply_count` must equal the number of direct child comments for that post id.
- Export helpers with these exact signatures. Bodies may be real data lookups, but they must not use FastAPI.

```python
def list_feed_posts() -> list[Post]: ...
def get_post(post_id: str) -> Post | None: ...
def list_comments(post_id: str) -> list[Post]: ...
```

`list_feed_posts()` returns only top level posts (`parent_post_id is None`), newest `created_at` first.
`list_comments(post_id)` returns direct children only, oldest `created_at` first.

### HTTP route contract

Document the HTTP route contract as a module docstring in `models.py` or as a short comment block at the top of `seed.py`. Do not implement routes in this step.

| Method | Path | Success body |
|--------|------|--------------|
| `GET` | `/api/v1/feed` | `FeedResponse` |
| `GET` | `/api/v1/posts/{post_id}` | `PostThreadResponse` |
| `POST` | `/api/v1/posts/{post_id}/like` | `EngagementActionResponse` |
| `POST` | `/api/v1/posts/{post_id}/retweet` | `EngagementActionResponse` |

Later steps return HTTP 404 for a missing post id. Do not implement that behavior here.

## Implementation phases for this step

Follow `/implement-from-spec` Phases 0 to 2 only:

1. Confirm caller and file tree (this document).
2. Create the files with models and seed literals.
3. Stop after the files with models and seed literals exist. Do not create FastAPI routes or tests in this step.

## Commands

```bash
cd /workspace
uv sync --extra test
uv run python -c "from mock_social_media_platform.models import FeedResponse, PostThreadResponse, EngagementActionResponse; from mock_social_media_platform.data.seed import list_feed_posts, get_post, list_comments; posts=list_feed_posts(); assert len(posts)>=5; p=posts[0]; kids=list_comments(p.id); print(len(posts), p.id, len(kids))"
```

The expected result is printed values for three counts and an id with no traceback. Feed length must be >= 5. At least one post in the seed set must satisfy `len(list_comments(post_id)) >= 3`. Verify that manually or extend the one line command.

```bash
uv run ruff check src/mock_social_media_platform/models.py src/mock_social_media_platform/data
uv run ruff format --check src/mock_social_media_platform/models.py src/mock_social_media_platform/data
uv run pyright src/mock_social_media_platform/models.py src/mock_social_media_platform/data
```

The expected result is that all commands exit 0.

## Pass

- [ ] All models and fields listed above exist with exact names.
- [ ] Seed has >= 3 users, >= 5 top level posts, >= 1 thread with >= 3 comments.
- [ ] Helpers `list_feed_posts`, `get_post`, `list_comments` work as specified.
- [ ] No FastAPI app, routers, or new tests added in this step.
- [ ] Ruff + pyright clean on the new modules.

## Fail

- Models diverge from the table (renamed fields, missing engagement block, comments as a different type).
- Seed only has posts with no comment threads.
- Business logic for like/retweet implemented here.
- Frontend files created in this step.
