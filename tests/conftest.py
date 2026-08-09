"""Shared pytest fixtures for API tests."""

import pytest

from mock_social_media_platform.data.seed import reset_store


@pytest.fixture(autouse=True)
def _reset_seed_store() -> None:
    """Restore the in-memory post store before every test."""

    reset_store()
