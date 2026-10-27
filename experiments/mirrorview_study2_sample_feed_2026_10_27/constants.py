"""Bucket, prefix, author, and feed names for the Study 2 sample."""

from __future__ import annotations

SOURCE_BUCKET = "mirrorview-experimental-artifacts"
SOURCE_KEY = "shared/data/raw/study_2/stimuli/flips.csv"
DEST_BUCKET = "mock-social-media-platform"
PREFIX = "experiments/mirrorview_study2_sample_feed_2026_10_27/v1/"

STUDY = "mirrorview_study_2"
REGISTRY_NAME = "STUDY_2_STIMULI"
SCHEMA_VERSION = 1

AUTHOR_ID = "user_mirrorview_study_2"
AUTHOR_HANDLE = "study2"
AUTHOR_DISPLAY_NAME = "MirrorView Study 2"
CREATED_AT = "2026-10-27T00:00:00Z"

EXAMPLE_FEED_NAME = "MirrorView Study 2 sample"
UNKNOWN_FEED_NAME = "MirrorView Study 2 unknown refs"
EXAMPLE_SOURCE_ROWS = 50
UNKNOWN_KNOWN_COUNT = 10
UNKNOWN_FOREIGN_IDS = (
    "at://did:plc:msmp/app.bsky.feed.post/missing-1",
    "at://did:plc:msmp/app.bsky.feed.post/missing-2",
    "at://did:plc:msmp/app.bsky.feed.post/missing-3",
)

KNOWN_COLUMNS = (
    "post_primary_key",
    "original_text",
    "mirrored_text",
    "sampled_stance",
    "sample_toxicity_type",
)
EXPECTED_SOURCE_ROWS = 20_000
EXPECTED_POSTS = 40_000

API_URL = "https://msmp-api.mind-technology-lab.workers.dev"
D1_DATABASE_ID = "8200b725-ead2-4b7c-a195-457fe5b93bce"
D1_DATABASE_NAME = "msmp"
