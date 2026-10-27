"""Add a fake author and handle to each v1 post and write v2.

v1 stays in place. Original and mirror rows that share a ``post_primary_key``
get the same display name, handle, and user id. The Faker seed is fixed, and
each key mixes into its own seed, so a later run writes the same names.

Run from the repository root::

    PYTHONPATH=. uv run python -m experiments.mirrorview_study2_sample_feed_2026_10_27.assign_authors
"""

from __future__ import annotations

import hashlib
import json
from datetime import UTC, datetime
from typing import Any

from faker import Faker

from experiments.mirrorview_study2_sample_feed_2026_10_27.constants import (
    DEST_BUCKET,
    EXAMPLE_FEED_ID,
    EXAMPLE_FEED_NAME_V2,
    EXPECTED_AUTHORS,
    EXPECTED_POSTS,
    EXPECTED_SOURCE_ROWS,
    FAKER_LOCALE,
    FAKER_SEED,
    PREFIX_V1,
    PREFIX_V2,
    SCHEMA_VERSION_V2,
)
from shared.aws.s3 import DEFAULT_REGION_NAME, S3
from shared.data.dataloader import _use_lab_credentials_when_unset


def _json_line(payload: object) -> bytes:
    return (
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n"
    ).encode("utf-8")


def _sha256(body: bytes) -> str:
    return hashlib.sha256(body).hexdigest()


def _read_jsonl(body: bytes) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for line_number, line in enumerate(body.splitlines(), start=1):
        if not line.strip():
            continue
        item = json.loads(line)
        if not isinstance(item, dict):
            raise ValueError(f"JSONL line {line_number} is not an object.")
        rows.append(item)
    return rows


def author_for(post_primary_key: str, faker: Faker) -> dict[str, str]:
    """Return a stable user id, handle, and display name for one source post.

    The digest mixes ``FAKER_SEED`` with the source key. Original and mirror
    ids are not part of the digest, so both variants share this result.
    """

    digest = hashlib.sha256(f"{FAKER_SEED}\n{post_primary_key}".encode()).digest()
    faker.seed_instance(int.from_bytes(digest[:8], "big"))
    display_name = faker.name().strip()
    if not display_name:
        raise ValueError("Faker returned an empty display name.")
    slug = "".join(ch for ch in faker.user_name().lower() if ch.isalnum())
    if not slug:
        slug = "member"
    user_id = "user_" + digest[8:16].hex()
    handle = f"{slug}_{digest[16:20].hex()}"
    return {
        "id": user_id,
        "handle": handle,
        "display_name": display_name,
        "author": display_name,
    }


def assign(
    posts: list[dict[str, Any]], faker: Faker
) -> tuple[list[dict[str, Any]], list[dict[str, str]]]:
    """Attach ``author`` and ``handle`` and return posts plus one user per source key."""

    if len(posts) != EXPECTED_POSTS:
        raise ValueError(f"v1 posts.jsonl has {len(posts)} rows.")
    authors: dict[str, dict[str, str]] = {}
    assigned: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    seen_handles: set[str] = set()
    for index, post in enumerate(posts, start=1):
        key = post.get("post_primary_key")
        variant = post.get("variant")
        if not isinstance(key, str) or not key:
            raise ValueError(f"Post row {index} has no post_primary_key.")
        if variant not in {"original", "mirror"}:
            raise ValueError(f"Post row {index} has an unknown variant.")
        identity = authors.get(key)
        if identity is None:
            identity = author_for(key, faker)
            if identity["id"] in seen_ids or identity["handle"] in seen_handles:
                raise ValueError("Generated author id or handle collided.")
            seen_ids.add(identity["id"])
            seen_handles.add(identity["handle"])
            authors[key] = identity
        elif author_for(key, faker) != identity:
            raise ValueError("Author generation was not stable for a repeated key.")
        updated = dict(post)
        updated["author_id"] = identity["id"]
        updated["author"] = identity["author"]
        updated["handle"] = identity["handle"]
        assigned.append(updated)
    if len(authors) != EXPECTED_AUTHORS:
        raise ValueError(f"Expected {EXPECTED_AUTHORS} authors, found {len(authors)}.")
    _check_pairs(assigned, authors)
    users = [
        {
            "id": item["id"],
            "handle": item["handle"],
            "display_name": item["display_name"],
        }
        for item in authors.values()
    ]
    return assigned, users


def _check_pairs(
    posts: list[dict[str, Any]], authors: dict[str, dict[str, str]]
) -> None:
    seen: dict[str, set[str]] = {}
    for post in posts:
        key = str(post["post_primary_key"])
        seen.setdefault(key, set()).add(str(post["variant"]))
        identity = authors[key]
        if post["author_id"] != identity["id"] or post["handle"] != identity["handle"]:
            raise ValueError("Original and mirror do not share an author.")
        if post["author"] != identity["display_name"]:
            raise ValueError("Original and mirror do not share an author.")
    incomplete = [
        key for key, variants in seen.items() if variants != {"original", "mirror"}
    ]
    if incomplete or len(seen) != EXPECTED_SOURCE_ROWS:
        raise ValueError("Each source key must have one original and one mirror.")


def build_bodies(
    posts: list[dict[str, Any]],
    users: list[dict[str, str]],
    example: dict[str, Any],
    unknown: dict[str, Any],
) -> dict[str, bytes]:
    user_lines = b"".join(_json_line(user) for user in users)
    post_lines = b"".join(_json_line(post) for post in posts)
    example_body = json.dumps(
        {"name": EXAMPLE_FEED_NAME_V2, "posts": example["posts"]},
        ensure_ascii=False,
        separators=(",", ":"),
    ).encode("utf-8")
    unknown_body = json.dumps(
        unknown, ensure_ascii=False, separators=(",", ":")
    ).encode("utf-8")
    manifest = {
        "study": "mirrorview_study_2",
        "destination_bucket": DEST_BUCKET,
        "destination_prefix": PREFIX_V2,
        "source_prefix": PREFIX_V1,
        "schema_version": SCHEMA_VERSION_V2,
        "built_at": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "faker_seed": FAKER_SEED,
        "faker_locale": FAKER_LOCALE,
        "author_rule": (
            "One display name and handle per post_primary_key. "
            "The original and the mirror share that author. "
            "The seed is FAKER_SEED mixed with the key, so row order does not matter."
        ),
        "sha256": {
            "users.jsonl": _sha256(user_lines),
            "posts.jsonl": _sha256(post_lines),
        },
        "source_row_count": EXPECTED_SOURCE_ROWS,
        "post_count": EXPECTED_POSTS,
        "author_count": EXPECTED_AUTHORS,
        "example_feed_id": EXAMPLE_FEED_ID,
        "example_feed_name": EXAMPLE_FEED_NAME_V2,
        "post_ids": [post["id"] for post in posts],
    }
    return {
        "users.jsonl": user_lines,
        "posts.jsonl": post_lines,
        "manifest.json": json.dumps(
            manifest, ensure_ascii=False, separators=(",", ":")
        ).encode("utf-8"),
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
        store.put_bytes(f"{PREFIX_V2}{name}", body, content_type=content_types[name])
        print(f"uploaded {name} bytes={len(body)}")


def main() -> None:
    _use_lab_credentials_when_unset()
    store = S3(DEST_BUCKET, region_name=DEFAULT_REGION_NAME)
    posts = _read_jsonl(store.get_bytes(f"{PREFIX_V1}posts.jsonl"))
    example = json.loads(store.get_bytes(f"{PREFIX_V1}feeds/example.json"))
    unknown = json.loads(store.get_bytes(f"{PREFIX_V1}feeds/unknown_refs.json"))
    if not isinstance(example, dict) or not isinstance(example.get("posts"), list):
        raise ValueError("v1 feeds/example.json has no posts list.")
    if not isinstance(unknown, dict) or not isinstance(unknown.get("posts"), list):
        raise ValueError("v1 feeds/unknown_refs.json has no posts list.")
    faker = Faker(FAKER_LOCALE)
    assigned, users = assign(posts, faker)
    first_key = str(assigned[0]["post_primary_key"])
    if author_for(first_key, faker)["id"] != assigned[0]["author_id"]:
        raise ValueError("Recomputing the first author did not match.")
    bodies = build_bodies(assigned, users, example, unknown)
    upload(bodies)
    print(
        f"authors={len(users)} posts={len(assigned)} "
        f"prefix={PREFIX_V2} example_feed_name={EXAMPLE_FEED_NAME_V2}"
    )


if __name__ == "__main__":
    main()
