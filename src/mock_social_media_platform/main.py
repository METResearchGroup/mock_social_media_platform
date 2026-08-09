"""FastAPI application entrypoint for the mock social media platform.

Run from the repository root::

    uv run fastapi dev --host 127.0.0.1 --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mock_social_media_platform.api.router import api_router

LOCAL_UI_ORIGINS = (
    "http://localhost:3000",
    "http://127.0.0.1:3000",
)

app = FastAPI(title="Mock Social Media Platform")
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(LOCAL_UI_ORIGINS),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)
