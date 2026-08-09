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
