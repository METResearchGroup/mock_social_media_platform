from mock_social_media_platform import hello


def test_hello() -> None:
    assert hello() == "Hello from mock-social-media-platform!"
