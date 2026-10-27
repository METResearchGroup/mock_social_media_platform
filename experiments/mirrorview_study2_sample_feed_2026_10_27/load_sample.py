"""Load the v2 sample into D1 and rename the existing example feed.

A second run updates the same post ids and the same fake authors. ``--reset``
deletes only the ids listed in ``manifest.json`` before that upsert. Does not
print post text, author names, or secrets.

Run from the repository root::

    PYTHONPATH=. uv run python -m experiments.mirrorview_study2_sample_feed_2026_10_27.load_sample
"""

from __future__ import annotations

import argparse
import json
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from experiments.mirrorview_study2_sample_feed_2026_10_27.constants import (
    D1_DATABASE_ID,
    DEST_BUCKET,
    EXAMPLE_FEED_ID,
    EXAMPLE_FEED_NAME_V2,
    EXPECTED_AUTHORS,
    EXPECTED_POSTS,
    PREFIX_V2,
)
from shared.aws.s3 import DEFAULT_REGION_NAME, S3
from shared.data.dataloader import (
    _use_lab_credentials_when_unset,
    ensure_cloudflare_env,
)

USER_AGENT = (
    "Mozilla/5.0 (compatible; msmp-cloudflare-smoke/1.0; +https://github.com/"
    "METResearchGroup/mock_social_media_platform)"
)
ROWS_PER_STATEMENT = 8
STATEMENTS_PER_REQUEST = 20


def _download(name: str) -> bytes:
    _use_lab_credentials_when_unset()
    store = S3(DEST_BUCKET, region_name=DEFAULT_REGION_NAME)
    return store.get_bytes(f"{PREFIX_V2}{name}")


def _d1_one(sql: str, params: list[object]) -> None:
    account = ensure_account()
    token = ensure_token()
    url = (
        "https://api.cloudflare.com/client/v4/accounts/"
        f"{account}/d1/database/{D1_DATABASE_ID}/query"
    )
    request = urllib.request.Request(
        url,
        data=json.dumps({"sql": sql, "params": params}).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
        },
        method="POST",
    )
    last_error: Exception | None = None
    body: object | None = None
    for attempt in range(5):
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                body = json.loads(response.read().decode("utf-8"))
            last_error = None
            break
        except urllib.error.HTTPError as exc:
            if exc.code not in {429, 500, 502, 503, 504} or attempt == 4:
                raise RuntimeError(f"D1 query failed with HTTP {exc.code}.") from exc
            last_error = exc
        except urllib.error.URLError as exc:
            if attempt == 4:
                raise RuntimeError("D1 query failed before a response.") from exc
            last_error = exc
        time.sleep(2**attempt)
    if last_error is not None or body is None:
        raise RuntimeError("D1 query failed before a response.")
    if not isinstance(body, dict) or body.get("success") is not True:
        raise RuntimeError("D1 query did not succeed.")
    results = body.get("result")
    if isinstance(results, list):
        for item in results:
            if isinstance(item, dict) and item.get("success") is False:
                raise RuntimeError("D1 statement did not succeed.")


def _d1(statements: list[tuple[str, list[object]]]) -> None:
    if len(statements) == 1:
        sql, params = statements[0]
        _d1_one(sql, params)
        return
    workers = min(8, len(statements))
    with ThreadPoolExecutor(max_workers=workers) as pool:
        list(pool.map(lambda item: _d1_one(item[0], item[1]), statements))


_account: str | None = None
_token: str | None = None


def ensure_account() -> str:
    global _account
    if _account is None:
        ensure_cloudflare_env()
        import os

        _account = os.environ["CLOUDFLARE_ACCOUNT_ID"]
    return _account


def ensure_token() -> str:
    global _token
    if _token is None:
        ensure_cloudflare_env()
        import os

        _token = os.environ["CLOUDFLARE_API_TOKEN"]
    return _token


def _chunks(items: list[Any], size: int) -> list[list[Any]]:
    return [items[index : index + size] for index in range(0, len(items), size)]


def _upsert_users(users: list[dict[str, Any]]) -> None:
    statements: list[tuple[str, list[object]]] = []
    for group in _chunks(users, ROWS_PER_STATEMENT):
        placeholders = ", ".join(["(?, ?, ?)"] * len(group))
        params: list[object] = []
        for user in group:
            params.extend([user["id"], user["handle"], user["display_name"]])
        statements.append(
            (
                f"""
                INSERT INTO users (id, handle, display_name)
                VALUES {placeholders}
                ON CONFLICT(id) DO UPDATE SET
                  handle = excluded.handle,
                  display_name = excluded.display_name
                """,
                params,
            )
        )
    done = 0
    for batch in _chunks(statements, STATEMENTS_PER_REQUEST):
        _d1(batch)
        done += sum(sql.count("(?, ?, ?)") for sql, _ in batch)
        if done % (ROWS_PER_STATEMENT * STATEMENTS_PER_REQUEST * 5) == 0 or done >= len(
            users
        ):
            print(f"upserted_users={min(done, len(users))}")


def _upsert_posts(posts: list[dict[str, Any]]) -> None:
    statements: list[tuple[str, list[object]]] = []
    for group in _chunks(posts, ROWS_PER_STATEMENT):
        placeholders = ", ".join(["(?, ?, ?, ?, ?, ?, ?, ?)"] * len(group))
        params: list[object] = []
        for post in group:
            params.extend(
                [
                    post["id"],
                    post["author_id"],
                    post["text"],
                    post["created_at"],
                    post["like_count"],
                    post["retweet_count"],
                    post["reply_count"],
                    post["parent_post_id"],
                ]
            )
        statements.append(
            (
                f"""
                INSERT INTO posts (
                  id, author_id, text, created_at,
                  like_count, retweet_count, reply_count, parent_post_id
                ) VALUES {placeholders}
                ON CONFLICT(id) DO UPDATE SET
                  author_id = excluded.author_id,
                  text = excluded.text,
                  created_at = excluded.created_at,
                  like_count = excluded.like_count,
                  retweet_count = excluded.retweet_count,
                  reply_count = excluded.reply_count,
                  parent_post_id = excluded.parent_post_id
                """,
                params,
            )
        )
    done = 0
    for batch in _chunks(statements, STATEMENTS_PER_REQUEST):
        _d1(batch)
        done += sum(_placeholder_count(sql) for sql, _ in batch)
        if done % (ROWS_PER_STATEMENT * STATEMENTS_PER_REQUEST * 5) == 0 or done >= len(
            posts
        ):
            print(f"upserted_posts={min(done, len(posts))}")


def _placeholder_count(sql: str) -> int:
    return sql.count("(?, ?, ?, ?, ?, ?, ?, ?)")


def _delete_ids(post_ids: list[str]) -> None:
    for group in _chunks(post_ids, 50):
        marks = ", ".join(["?"] * len(group))
        _d1([(f"DELETE FROM posts WHERE id IN ({marks})", list(group))])
    print(f"reset_deleted={len(post_ids)}")


def _count(sql: str, params: list[object]) -> int:
    account = ensure_account()
    token = ensure_token()
    url = (
        "https://api.cloudflare.com/client/v4/accounts/"
        f"{account}/d1/database/{D1_DATABASE_ID}/query"
    )
    request = urllib.request.Request(
        url,
        data=json.dumps({"sql": sql, "params": params}).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        body = json.loads(response.read().decode("utf-8"))
    rows = body["result"][0]["results"]
    value = rows[0]["n"]
    if not isinstance(value, int):
        raise RuntimeError("D1 count was not an integer.")
    return value


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


def _rename_example_feed() -> None:
    _d1_one(
        "UPDATE feeds SET name = ? WHERE id = ?",
        [EXAMPLE_FEED_NAME_V2, EXAMPLE_FEED_ID],
    )
    name = _text(
        "SELECT name AS n FROM feeds WHERE id = ?",
        [EXAMPLE_FEED_ID],
    )
    if name != EXAMPLE_FEED_NAME_V2:
        raise RuntimeError("Example feed title was not updated.")
    print(f"example_feed_id={EXAMPLE_FEED_ID} example_feed_name={name}")


def _text(sql: str, params: list[object]) -> str:
    account = ensure_account()
    token = ensure_token()
    url = (
        "https://api.cloudflare.com/client/v4/accounts/"
        f"{account}/d1/database/{D1_DATABASE_ID}/query"
    )
    request = urllib.request.Request(
        url,
        data=json.dumps({"sql": sql, "params": params}).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        body = json.loads(response.read().decode("utf-8"))
    rows = body["result"][0]["results"]
    value = rows[0]["n"]
    if not isinstance(value, str):
        raise RuntimeError("D1 text value was not a string.")
    return value


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete only the post ids listed in manifest.json, then upsert.",
    )
    args = parser.parse_args()
    manifest = json.loads(_download("manifest.json"))
    users = _read_jsonl(_download("users.jsonl"))
    posts = _read_jsonl(_download("posts.jsonl"))
    example = json.loads(_download("feeds/example.json"))
    if example.get("name") != EXAMPLE_FEED_NAME_V2:
        raise ValueError("feeds/example.json name is not Mirrorview.")
    if len(users) != EXPECTED_AUTHORS:
        raise ValueError(f"users.jsonl has {len(users)} rows.")
    if len(posts) != EXPECTED_POSTS:
        raise ValueError(f"posts.jsonl has {len(posts)} rows.")
    for post in posts:
        if (
            not post.get("author")
            or not post.get("handle")
            or not post.get("author_id")
        ):
            raise ValueError("A post is missing author, handle, or author_id.")
    post_ids = manifest.get("post_ids")
    if not isinstance(post_ids, list) or len(post_ids) != EXPECTED_POSTS:
        raise ValueError("manifest.json post_ids does not list 40000 ids.")
    if args.reset:
        _delete_ids([str(item) for item in post_ids])
    _upsert_users(users)
    _upsert_posts(posts)
    fake_posts = _count(
        """
        SELECT COUNT(*) AS n FROM posts
        WHERE author_id NOT IN (
          'user_ada', 'user_grace', 'user_alan', 'user_mirrorview_study_2'
        )
        """,
        [],
    )
    total_posts = _count("SELECT COUNT(*) AS n FROM posts", [])
    total_users = _count("SELECT COUNT(*) AS n FROM users", [])
    print(
        f"d1_users={total_users} d1_posts={total_posts} d1_fake_author_posts={fake_posts}"
    )
    if fake_posts != EXPECTED_POSTS:
        raise RuntimeError(
            f"Fake-author post count is {fake_posts}, expected {EXPECTED_POSTS}."
        )
    _rename_example_feed()
    print(f"example_posts={len(example['posts'])}")


if __name__ == "__main__":
    main()
