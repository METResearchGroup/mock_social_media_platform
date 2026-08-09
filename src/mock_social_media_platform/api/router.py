"""Aggregate API routers under ``/api/v1``.

Run from the repository root::

    uv run python -c "from mock_social_media_platform.api.router import api_router"
"""

from fastapi import APIRouter

from mock_social_media_platform.api.routes_feed import router as feed_router
from mock_social_media_platform.api.routes_posts import router as posts_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(feed_router)
api_router.include_router(posts_router)
