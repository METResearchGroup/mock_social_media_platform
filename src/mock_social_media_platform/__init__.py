"""Public package exports for the mock social media platform.

Run from the repository root::

    uv run python -c "from mock_social_media_platform import hello; print(hello())"
"""


def hello() -> str:
    """Return the package smoke-check greeting string.

    Returns
    -------
    str
        Fixed greeting used by the placeholder unit test.
    """

    return "Hello from mock-social-media-platform!"
