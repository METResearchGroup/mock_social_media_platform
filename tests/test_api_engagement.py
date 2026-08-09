"""Tests for like and retweet endpoints."""

from fastapi.testclient import TestClient

from mock_social_media_platform.data.seed import get_post, list_feed_posts
from mock_social_media_platform.main import app


class TestLikePost:
    """Tests for POST /api/v1/posts/{post_id}/like."""

    def test_like_post_increments_like_count(self) -> None:
        """Like increments like_count by one."""

        client = TestClient(app)
        post_id = list_feed_posts()[0].id
        prior = get_post(post_id)
        assert prior is not None

        result = client.post(f"/api/v1/posts/{post_id}/like")

        assert result.status_code == 200
        body = result.json()
        assert (
            body["post"]["engagement"]["like_count"] == prior.engagement.like_count + 1
        )

    def test_like_unknown_post_returns_404(self) -> None:
        """Like on an unknown id returns HTTP 404."""

        client = TestClient(app)

        result = client.post("/api/v1/posts/does-not-exist/like")

        assert result.status_code == 404

    def test_like_then_feed_shows_updated_count(self) -> None:
        """Feed reflects like_count after a like in the same process."""

        client = TestClient(app)
        post_id = list_feed_posts()[0].id
        prior = get_post(post_id)
        assert prior is not None

        client.post(f"/api/v1/posts/{post_id}/like")
        feed = client.get("/api/v1/feed")

        matched = next(post for post in feed.json()["posts"] if post["id"] == post_id)
        assert matched["engagement"]["like_count"] == prior.engagement.like_count + 1


class TestRetweetPost:
    """Tests for POST /api/v1/posts/{post_id}/retweet."""

    def test_retweet_post_increments_retweet_count(self) -> None:
        """Retweet increments retweet_count by one."""

        client = TestClient(app)
        post_id = list_feed_posts()[0].id
        prior = get_post(post_id)
        assert prior is not None

        result = client.post(f"/api/v1/posts/{post_id}/retweet")

        assert result.status_code == 200
        body = result.json()
        assert (
            body["post"]["engagement"]["retweet_count"]
            == prior.engagement.retweet_count + 1
        )

    def test_retweet_unknown_post_returns_404(self) -> None:
        """Retweet on an unknown id returns HTTP 404."""

        client = TestClient(app)

        result = client.post("/api/v1/posts/does-not-exist/retweet")

        assert result.status_code == 404
