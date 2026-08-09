# Scaffold the FastAPI app

## Goal

Create the FastAPI application skeleton that registers routers with stub handlers. Imports must resolve, and `fastapi dev` must start. Handlers should raise `NotImplementedError`. Return empty placeholders only if OpenAPI generation requires them.

## Scope

- **Caller.** `src/mock_social_media_platform/main.py` exposes `app` as the FastAPI instance.
- **Slice.** Scaffold the package and register routes for the four endpoints frozen in Step 1.
- **Out of scope.** Do not add real handler logic, tests beyond an import smoke check, Next.js, or changes to seed data.

## Files to inspect

- `docs/plans/2026-08-09_local-ui-backend-build_335b55/steps/step1.md`
- `src/mock_social_media_platform/models.py`
- `src/mock_social_media_platform/data/seed.py`
- `pyproject.toml`

## Files allowed to change

- `src/mock_social_media_platform/main.py` (create)
- `src/mock_social_media_platform/api/__init__.py` (create)
- `src/mock_social_media_platform/api/router.py` (create)
- `src/mock_social_media_platform/api/routes_feed.py` (create)
- `src/mock_social_media_platform/api/routes_posts.py` (create)
- `pyproject.toml` (add runtime deps `fastapi`, `uvicorn`. Add `[tool.fastapi] entrypoint = "mock_social_media_platform.main:app"`. Run `uv lock` after)
- `uv.lock` (regenerate via `uv lock` / `uv sync`)

## Files forbidden to change

- `src/mock_social_media_platform/models.py` (contract frozen)
- `src/mock_social_media_platform/data/seed.py` (dataset frozen except if Step 1 left a documented bug. Fix only with an explicit commit message)
- `frontend/**`
- `tests/test_api_*.py` (created in Steps 3 to 4, not here)
- `.github/workflows/ci.yml`
- `strategy_planning/init_plan.md`

## Scaffold requirements

1. `app = FastAPI(title="Mock Social Media Platform")` in `main.py`.
2. Enable CORS for local UI origins exactly:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
3. Include an `APIRouter` with prefix `/api/v1`.
4. Register these path operations. Names may vary, but paths must match.

| Method | Path | Return annotation | Body |
|--------|------|-------------------|------|
| GET | `/feed` | `FeedResponse` | `raise NotImplementedError` |
| GET | `/posts/{post_id}` | `PostThreadResponse` | `raise NotImplementedError` |
| POST | `/posts/{post_id}/like` | `EngagementActionResponse` | `raise NotImplementedError` |
| POST | `/posts/{post_id}/retweet` | `EngagementActionResponse` | `raise NotImplementedError` |

5. Use `Annotated` for path params. Use `post_id: Annotated[str, Path(...)]` without ellipsis defaults on required fields. Use `Path(min_length=1)`.
6. Do not implement store lookups.

## Commands

```bash
cd /workspace
uv add fastapi uvicorn
# ensure pyproject has:
# [tool.fastapi]
# entrypoint = "mock_social_media_platform.main:app"
uv sync --extra test
uv run python -c "from mock_social_media_platform.main import app; print(app.title); print(sorted({getattr(r,'path',None) for r in app.routes}))"
```

The expected result is that the title prints and the route set includes `/api/v1/feed`, `/api/v1/posts/{post_id}`, `/api/v1/posts/{post_id}/like`, `/api/v1/posts/{post_id}/retweet`.

```bash
uv run fastapi dev --host 127.0.0.1 --port 8000
```

The expected result is that the server starts. `GET http://127.0.0.1:8000/docs` loads the OpenAPI UI. Hitting `/api/v1/feed` returns 500 with `NotImplementedError`, which is acceptable for this step.

```bash
uv run ruff check src/mock_social_media_platform
uv run ruff format --check src/mock_social_media_platform
uv run pyright
uv run pytest -q
```

The expected result is that lint and typecheck commands exit 0. Existing `tests/test_placeholder.py` still passes.

## Pass

- [ ] FastAPI app imports and lists the four `/api/v1/...` routes.
- [ ] CORS allows the two localhost:3000 origins.
- [ ] Handlers are stubs only.
- [ ] Dependencies locked in `pyproject.toml` + `uv.lock`.
- [ ] Placeholder test still green.

## Fail

- Implementing feed/thread/like/retweet behavior in this step.
- Changing model field names.
- Skipping CORS.
- Adding Next.js in this step.
