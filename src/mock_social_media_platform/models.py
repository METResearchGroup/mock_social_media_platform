"""Pydantic response models for the mock social media HTTP API.

HTTP route contract (implemented by FastAPI routers):

- ``GET /api/v1/feed`` -> ``FeedResponse``
- ``GET /api/v1/posts/{post_id}`` -> ``PostThreadResponse``
- ``POST /api/v1/posts/{post_id}/like`` -> ``EngagementActionResponse``
- ``POST /api/v1/posts/{post_id}/retweet`` -> ``EngagementActionResponse``

Run from the repository root::

    uv run python -c "from mock_social_media_platform.models import Post"
"""

from datetime import datetime

from pydantic import BaseModel, Field


class EngagementMetrics(BaseModel):
    """Counts of likes, retweets, and replies on a post."""

    like_count: int = Field(ge=0)
    retweet_count: int = Field(ge=0)
    reply_count: int = Field(ge=0)


class UserSummary(BaseModel):
    """Public identity fields shown next to a post."""

    id: str
    handle: str
    display_name: str


class Post(BaseModel):
    """A top-level post or a comment that shares the same shape."""

    id: str
    author: UserSummary
    text: str
    created_at: datetime
    engagement: EngagementMetrics
    parent_post_id: str | None


class FeedResponse(BaseModel):
    """Home timeline payload."""

    posts: list[Post]


class PostThreadResponse(BaseModel):
    """One post plus its direct comments."""

    post: Post
    comments: list[Post]


class EngagementActionResponse(BaseModel):
    """Updated post after a like or retweet."""

    post: Post
