"""Post thread and engagement endpoints.

Run from the repository root::

    uv run fastapi dev --host 127.0.0.1 --port 8000
"""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Path

from mock_social_media_platform.data.seed import (
    get_post,
    like_post,
    list_comments,
    retweet_post,
)
from mock_social_media_platform.models import (
    EngagementActionResponse,
    PostThreadResponse,
)

router = APIRouter(tags=["posts"])

PostIdPath = Annotated[str, Path(min_length=1)]


@router.get("/posts/{post_id}")
def get_post_thread(post_id: PostIdPath) -> PostThreadResponse:
    """Return one post and its direct comments."""

    post = get_post(post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return PostThreadResponse(post=post, comments=list_comments(post_id))


@router.post("/posts/{post_id}/like")
def like_post_endpoint(post_id: PostIdPath) -> EngagementActionResponse:
    """Increment like count for a post."""

    updated = like_post(post_id)
    if updated is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return EngagementActionResponse(post=updated)


@router.post("/posts/{post_id}/retweet")
def retweet_post_endpoint(post_id: PostIdPath) -> EngagementActionResponse:
    """Increment retweet count for a post."""

    updated = retweet_post(post_id)
    if updated is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return EngagementActionResponse(post=updated)
