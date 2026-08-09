"""Feed read endpoints.

Run from the repository root::

    uv run fastapi dev --host 127.0.0.1 --port 8000
"""

from fastapi import APIRouter

from mock_social_media_platform.data.seed import list_feed_posts
from mock_social_media_platform.models import FeedResponse

router = APIRouter(tags=["feed"])


@router.get("/feed")
def get_feed() -> FeedResponse:
    """Return the home timeline of top-level posts."""

    return FeedResponse(posts=list_feed_posts())
