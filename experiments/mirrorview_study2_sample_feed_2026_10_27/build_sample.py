"""Build the Study 2 sample and upload it to the sample bucket.

Reads ``STUDY_2_STIMULI`` and writes ``users.jsonl``, ``posts.jsonl``,
``manifest.json``, ``feeds/example.json``, and ``feeds/unknown_refs.json``.
Does not print post text or secrets.

Run from the repository root::

    PYTHONPATH=. uv run python -m experiments.mirrorview_study2_sample_feed_2026_10_27.build_sample
"""

from __future__ import annotations

import csv
import hashlib
import json
from dataclasses import dataclass
from datetime import UTC, datetime
from io import StringIO

from experiments.mirrorview_study2_sample_feed_2026_10_27.constants import (
    AUTHOR_DISPLAY_NAME,
    AUTHOR_HANDLE,
    AUTHOR_ID,
    CREATED_AT,
    DEST_BUCKET,
    EXAMPLE_FEED_NAME,
    EXAMPLE_SOURCE_ROWS,
    EXPECTED_POSTS,
    EXPECTED_SOURCE_ROWS,
    KNOWN_COLUMNS,
    PREFIX,
    REGISTRY_NAME,
    SCHEMA_VERSION,
    SOURCE_BUCKET,
    SOURCE_KEY,
    STUDY,
    UNKNOWN_FEED_NAME,
    UNKNOWN_FOREIGN_IDS,
    UNKNOWN_KNOWN_COUNT,
)
from shared.aws.s3 import DEFAULT_REGION_NAME, S3
from shared.data.dataloader import load_dataset


@dataclass(frozen=True)
class Study2VariantPost:
    """One original post or one mirror post."""

    id: str
    post_primary_key: str
    variant: str
    study: str
    text: str
    platform: str
    sampled_stance: str
    sample_toxicity_type: str
    author_id: str
    created_at: str
    like_count: int
    retweet_count: int
    reply_count: int
    parent_post_id: None
    extra: dict[str, str]

    def to_json(self) -> dict[str, object]:
        return {
            "id": self.id,
            "post_primary_key": self.post_primary_key,
            "variant": self.variant,
            "study": self.study,
            "text": self.text,
            "platform": self.platform,
            "sampled_stance": self.sampled_stance,
            "sample_toxicity_type": self.sample_toxicity_type,
            "author_id": self.author_id,
            "created_at": self.created_at,
            "like_count": self.like_count,
            "retweet_count": self.retweet_count,
            "reply_count": self.reply_count,
            "parent_post_id": self.parent_post_id,
            "extra": self.extra,
        }


def _json_line(payload: object) -> bytes:
    return (
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n"
    ).encode("utf-8")


def _sha256(body: bytes) -> str:
    return hashlib.sha256(body).hexdigest()


def _platform(post_primary_key: str) -> str:
    return post_primary_key.split("_", 1)[0]


def _variant(
    *,
    post_primary_key: str,
    variant: str,
    text: str,
    sampled_stance: str,
    sample_toxicity_type: str,
    extra: dict[str, str],
) -> Study2VariantPost:
    return Study2VariantPost(
        id=f"{post_primary_key}:{variant}",
        post_primary_key=post_primary_key,
        variant=variant,
        study=STUDY,
        text=text,
        platform=_platform(post_primary_key),
        sampled_stance=sampled_stance,
        sample_toxicity_type=sample_toxicity_type,
        author_id=AUTHOR_ID,
        created_at=CREATED_AT,
        like_count=0,
        retweet_count=0,
        reply_count=0,
        parent_post_id=None,
        extra=extra,
    )


def posts_from_csv(body: bytes) -> tuple[list[Study2VariantPost], list[str]]:
    """Return variant posts and any header names outside the five known columns."""

    text = body.decode("utf-8-sig")
    reader = csv.DictReader(StringIO(text))
    if reader.fieldnames is None:
        raise ValueError("STUDY_2_STIMULI has no header.")
    header = list(reader.fieldnames)
    missing = [name for name in KNOWN_COLUMNS if name not in header]
    if missing:
        raise ValueError(f"STUDY_2_STIMULI is missing columns: {', '.join(missing)}")
    extra_columns = [name for name in header if name not in KNOWN_COLUMNS]
    posts: list[Study2VariantPost] = []
    seen: set[str] = set()
    for index, row in enumerate(reader, start=1):
        key = (row.get("post_primary_key") or "").strip()
        if not key:
            raise ValueError(f"Row {index} has an empty post_primary_key.")
        if key in seen:
            raise ValueError(f"Row {index} repeats a post_primary_key.")
        seen.add(key)
        if len(f"{key}:original") > 400:
            raise ValueError(f"Row {index} post id is longer than 400 characters.")
        extra = {name: row.get(name) or "" for name in extra_columns}
        stance = row.get("sampled_stance") or ""
        toxicity = row.get("sample_toxicity_type") or ""
        posts.append(
            _variant(
                post_primary_key=key,
                variant="original",
                text=row.get("original_text") or "",
                sampled_stance=stance,
                sample_toxicity_type=toxicity,
                extra=extra,
            )
        )
        posts.append(
            _variant(
                post_primary_key=key,
                variant="mirror",
                text=row.get("mirrored_text") or "",
                sampled_stance=stance,
                sample_toxicity_type=toxicity,
                extra=extra,
            )
        )
    source_rows = len(seen)
    if source_rows != EXPECTED_SOURCE_ROWS or len(posts) != EXPECTED_POSTS:
        raise ValueError(
            f"Expected {EXPECTED_SOURCE_ROWS} source rows and {EXPECTED_POSTS} posts, "
            f"found {source_rows} source rows and {len(posts)} posts."
        )
    return posts, extra_columns


def example_feed_ids(posts: list[Study2VariantPost]) -> list[str]:
    """First 50 source rows, original then mirror."""

    return [post.id for post in posts[: EXAMPLE_SOURCE_ROWS * 2]]


def unknown_feed_ids(example_ids: list[str]) -> list[str]:
    return list(example_ids[:UNKNOWN_KNOWN_COUNT]) + list(UNKNOWN_FOREIGN_IDS)


def build_bodies(
    posts: list[Study2VariantPost], extra_columns: list[str]
) -> dict[str, bytes]:
    """JSON and JSONL bodies keyed by the object name under the v1 prefix."""

    user_line = _json_line(
        {
            "id": AUTHOR_ID,
            "handle": AUTHOR_HANDLE,
            "display_name": AUTHOR_DISPLAY_NAME,
        }
    )
    post_lines = b"".join(_json_line(post.to_json()) for post in posts)
    example_ids = example_feed_ids(posts)
    example_body = json.dumps(
        {"name": EXAMPLE_FEED_NAME, "posts": example_ids},
        ensure_ascii=False,
        separators=(",", ":"),
    ).encode("utf-8")
    unknown_body = json.dumps(
        {"name": UNKNOWN_FEED_NAME, "posts": unknown_feed_ids(example_ids)},
        ensure_ascii=False,
        separators=(",", ":"),
    ).encode("utf-8")
    manifest = {
        "study": STUDY,
        "registry_name": REGISTRY_NAME,
        "source_bucket": SOURCE_BUCKET,
        "source_key": SOURCE_KEY,
        "destination_bucket": DEST_BUCKET,
        "destination_prefix": PREFIX,
        "schema_version": SCHEMA_VERSION,
        "built_at": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "sha256": {
            "users.jsonl": _sha256(user_line),
            "posts.jsonl": _sha256(post_lines),
        },
        "source_row_count": EXPECTED_SOURCE_ROWS,
        "post_count": EXPECTED_POSTS,
        "known_columns": list(KNOWN_COLUMNS),
        "extra_columns": extra_columns,
        "author_id": AUTHOR_ID,
        "post_ids": [post.id for post in posts],
    }
    manifest_body = json.dumps(
        manifest, ensure_ascii=False, separators=(",", ":")
    ).encode("utf-8")
    return {
        "users.jsonl": user_line,
        "posts.jsonl": post_lines,
        "manifest.json": manifest_body,
        "feeds/example.json": example_body,
        "feeds/unknown_refs.json": unknown_body,
    }


def upload(bodies: dict[str, bytes]) -> None:
    store = S3(DEST_BUCKET, region_name=DEFAULT_REGION_NAME)
    content_types = {
        "users.jsonl": "application/x-ndjson",
        "posts.jsonl": "application/x-ndjson",
        "manifest.json": "application/json",
        "feeds/example.json": "application/json",
        "feeds/unknown_refs.json": "application/json",
    }
    for name, body in bodies.items():
        store.put_bytes(f"{PREFIX}{name}", body, content_type=content_types[name])
        print(f"uploaded {name} bytes={len(body)}")


def main() -> None:
    raw = load_dataset(REGISTRY_NAME)
    posts, extra_columns = posts_from_csv(raw)
    bodies = build_bodies(posts, extra_columns)
    upload(bodies)
    print(
        f"source_rows={EXPECTED_SOURCE_ROWS} posts={len(posts)} "
        f"extra_columns={len(extra_columns)} prefix={PREFIX}"
    )


if __name__ == "__main__":
    main()
