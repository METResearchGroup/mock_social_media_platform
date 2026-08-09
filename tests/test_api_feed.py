"""Tests for GET /api/v1/feed."""

from fastapi.testclient import TestClient

from mock_social_media_platform.data.seed import list_feed_posts
from mock_social_media_platform.main import app


class TestGetFeed:
    """Tests for the home feed endpoint."""

    def test_get_feed_returns_top_level_posts_newest_first(self) -> None:
        """Feed returns only top-level posts sorted newest first."""

        client = TestClient(app)
        expected_ids = [post.id for post in list_feed_posts()]

        result = client.get("/api/v1/feed")

        assert result.status_code == 200
        body = result.json()
        assert [post["id"] for post in body["posts"]] == expected_ids
        assert all(post["parent_post_id"] is None for post in body["posts"])
        created_ats = [post["created_at"] for post in body["posts"]]
        assert created_ats == sorted(created_ats, reverse=True)
        assert len(body["posts"]) == len(expected_ids)

    def test_get_feed_post_payload_includes_engagement_and_author(self) -> None:
        """Each feed post includes author handle, text, and engagement counts."""

        client = TestClient(app)
        seed_post = list_feed_posts()[0]

        result = client.get("/api/v1/feed")

        assert result.status_code == 200
        first = result.json()["posts"][0]
        assert first["author"]["handle"] == seed_post.author.handle
        assert first["text"] == seed_post.text
        assert first["engagement"]["like_count"] == seed_post.engagement.like_count
        assert (
            first["engagement"]["retweet_count"] == seed_post.engagement.retweet_count
        )
        assert first["engagement"]["reply_count"] == seed_post.engagement.reply_count
