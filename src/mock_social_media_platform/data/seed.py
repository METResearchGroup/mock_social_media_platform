"""In-memory dummy users and posts for the local mock API.

HTTP route contract (document only; routes live in ``api/``):

- ``GET /api/v1/feed``
- ``GET /api/v1/posts/{post_id}``
- ``POST /api/v1/posts/{post_id}/like``
- ``POST /api/v1/posts/{post_id}/retweet``

Run from the repository root::

    uv run python -c "from mock_social_media_platform.data.seed import list_feed_posts; print(len(list_feed_posts()))"
"""

from __future__ import annotations

from copy import deepcopy
from datetime import UTC, datetime

from mock_social_media_platform.models import EngagementMetrics, Post, UserSummary

USERS: dict[str, UserSummary] = {
    "user_ada": UserSummary(
        id="user_ada",
        handle="ada",
        display_name="Ada Lovelace",
    ),
    "user_grace": UserSummary(
        id="user_grace",
        handle="grace",
        display_name="Grace Hopper",
    ),
    "user_alan": UserSummary(
        id="user_alan",
        handle="alan",
        display_name="Alan Turing",
    ),
}

_SEED_POSTS: dict[str, Post] = {
    "post_1": Post(
        id="post_1",
        author=USERS["user_ada"],
        text="Notes from building the analytical engine.",
        created_at=datetime(2026, 8, 9, 12, 0, tzinfo=UTC),
        engagement=EngagementMetrics(like_count=12, retweet_count=3, reply_count=3),
        parent_post_id=None,
    ),
    "post_2": Post(
        id="post_2",
        author=USERS["user_grace"],
        text="Debugging is twice as hard as writing the code.",
        created_at=datetime(2026, 8, 9, 11, 30, tzinfo=UTC),
        engagement=EngagementMetrics(like_count=40, retweet_count=11, reply_count=0),
        parent_post_id=None,
    ),
    "post_3": Post(
        id="post_3",
        author=USERS["user_alan"],
        text="Machines can surprise their makers.",
        created_at=datetime(2026, 8, 9, 11, 0, tzinfo=UTC),
        engagement=EngagementMetrics(like_count=22, retweet_count=5, reply_count=1),
        parent_post_id=None,
    ),
    "post_4": Post(
        id="post_4",
        author=USERS["user_ada"],
        text="Poetry and mathematics share a love of pattern.",
        created_at=datetime(2026, 8, 9, 10, 15, tzinfo=UTC),
        engagement=EngagementMetrics(like_count=8, retweet_count=1, reply_count=0),
        parent_post_id=None,
    ),
    "post_5": Post(
        id="post_5",
        author=USERS["user_grace"],
        text="Ship the compiler, then teach the operators.",
        created_at=datetime(2026, 8, 9, 9, 45, tzinfo=UTC),
        engagement=EngagementMetrics(like_count=15, retweet_count=4, reply_count=0),
        parent_post_id=None,
    ),
    "comment_1a": Post(
        id="comment_1a",
        author=USERS["user_grace"],
        text="Would love a walkthrough of the punched cards.",
        created_at=datetime(2026, 8, 9, 12, 5, tzinfo=UTC),
        engagement=EngagementMetrics(like_count=2, retweet_count=0, reply_count=0),
        parent_post_id="post_1",
    ),
    "comment_1b": Post(
        id="comment_1b",
        author=USERS["user_alan"],
        text="The sequencing notes are especially clear.",
        created_at=datetime(2026, 8, 9, 12, 10, tzinfo=UTC),
        engagement=EngagementMetrics(like_count=1, retweet_count=0, reply_count=0),
        parent_post_id="post_1",
    ),
    "comment_1c": Post(
        id="comment_1c",
        author=USERS["user_ada"],
        text="Happy to share the next draft tomorrow.",
        created_at=datetime(2026, 8, 9, 12, 20, tzinfo=UTC),
        engagement=EngagementMetrics(like_count=4, retweet_count=1, reply_count=0),
        parent_post_id="post_1",
    ),
    "comment_3a": Post(
        id="comment_3a",
        author=USERS["user_ada"],
        text="Surprise is a useful research signal.",
        created_at=datetime(2026, 8, 9, 11, 10, tzinfo=UTC),
        engagement=EngagementMetrics(like_count=3, retweet_count=0, reply_count=0),
        parent_post_id="post_3",
    ),
}

POSTS: dict[str, Post] = deepcopy(_SEED_POSTS)


def reset_store() -> None:
    """Restore ``POSTS`` to the original seed values."""

    global POSTS
    POSTS = deepcopy(_SEED_POSTS)


def list_feed_posts() -> list[Post]:
    """Return top-level posts newest first.

    Returns
    -------
    list[Post]
        Posts whose ``parent_post_id`` is ``None``, sorted by ``created_at`` descending.
    """

    feed_posts = [post for post in POSTS.values() if post.parent_post_id is None]
    return sorted(feed_posts, key=lambda post: post.created_at, reverse=True)


def get_post(post_id: str) -> Post | None:
    """Return one post by id, or ``None`` when missing.

    Parameters
    ----------
    post_id
        Stable post identifier from the seed store.
    """

    return POSTS.get(post_id)


def list_comments(post_id: str) -> list[Post]:
    """Return direct child comments for a post, oldest first.

    Parameters
    ----------
    post_id
        Parent post id.
    """

    comments = [post for post in POSTS.values() if post.parent_post_id == post_id]
    return sorted(comments, key=lambda post: post.created_at)


def like_post(post_id: str) -> Post | None:
    """Increment ``like_count`` for a stored post.

    Parameters
    ----------
    post_id
        Target post id.

    Returns
    -------
    Post | None
        Updated post, or ``None`` when the id is unknown.

    Notes
    -----
    Mutates the in-memory ``POSTS`` store for the current process.
    """

    post = POSTS.get(post_id)
    if post is None:
        return None
    updated = post.model_copy(
        update={
            "engagement": post.engagement.model_copy(
                update={"like_count": post.engagement.like_count + 1}
            )
        }
    )
    POSTS[post_id] = updated
    return updated


def retweet_post(post_id: str) -> Post | None:
    """Increment ``retweet_count`` for a stored post.

    Parameters
    ----------
    post_id
        Target post id.

    Returns
    -------
    Post | None
        Updated post, or ``None`` when the id is unknown.

    Notes
    -----
    Mutates the in-memory ``POSTS`` store for the current process.
    """

    post = POSTS.get(post_id)
    if post is None:
        return None
    updated = post.model_copy(
        update={
            "engagement": post.engagement.model_copy(
                update={"retweet_count": post.engagement.retweet_count + 1}
            )
        }
    )
    POSTS[post_id] = updated
    return updated
