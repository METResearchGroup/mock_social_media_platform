# mock-social-media-platform

Mock social media platform for agent-based experiments.

## Development

### Backend

```bash
uv sync --extra test
uv run pre-commit install
uv run pytest -q
uv run fastapi dev --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev -- --port 3000
```

Open `http://127.0.0.1:3000/` with the FastAPI server running on port 8000.

## Cloudflare

The hosted feed is Worker `msmp-api` (D1) and the UI is Worker `msmp-ui` (vinext).
Deploy steps are in `docs/runbooks/HOW_TO_DEPLOY_TO_CLOUDFLARE.md`.

The Worker also hosts named lists of post identifiers. Admin creates a
feed. `/feed/<id>` renders it. Programs read the same list from
`GET /xrpc/app.bsky.feed.getFeedSkeleton`. There is no sign-in.

- UI: `https://msmp-ui.mind-technology-lab.workers.dev`
- Admin: `https://msmp-ui.mind-technology-lab.workers.dev/admin`
- API: `https://msmp-api.mind-technology-lab.workers.dev`
