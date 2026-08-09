"""Tests for GET /api/v1/posts/{post_id}."""

from fastapi.testclient import TestClient

from mock_social_media_platform.data.seed import list_comments, list_feed_posts
from mock_social_media_platform.main import app


def _post_id_with_min_comments(min_comments: int) -> str:
    for post in list_feed_posts():
        if len(list_comments(post.id)) >= min_comments:
            return post.id
    raise AssertionError(f"No seed post has at least {min_comments} comments")


class TestGetPostThread:
    """Tests for the post thread endpoint."""

    def test_get_post_thread_returns_post_and_direct_comments_oldest_first(
        self,
    ) -> None:
        """Thread payload includes the post and oldest-first direct comments."""

        client = TestClient(app)
        post_id = _post_id_with_min_comments(3)
        expected_comments = list_comments(post_id)

        result = client.get(f"/api/v1/posts/{post_id}")

        assert result.status_code == 200
        body = result.json()
        assert body["post"]["id"] == post_id
        assert len(body["comments"]) == len(expected_comments)
        assert [comment["id"] for comment in body["comments"]] == [
            comment.id for comment in expected_comments
        ]
        assert all(comment["parent_post_id"] == post_id for comment in body["comments"])
        created_ats = [comment["created_at"] for comment in body["comments"]]
        assert created_ats == sorted(created_ats)

    def test_get_post_unknown_id_returns_404(self) -> None:
        """Unknown post ids return HTTP 404."""

        client = TestClient(app)

        result = client.get("/api/v1/posts/does-not-exist")

        assert result.status_code == 404
