"""Smoke checks for the Cloudflare mock social media Workers.

Does not print secret values. workers.dev rejects the default Python user
agent, so every request sends a browser user agent.

Run from the repository root::

    python scripts/cloudflare_smoke.py \\
        --api-url https://msmp-api.mind-technology-lab.workers.dev \\
        --ui-url https://msmp-ui.mind-technology-lab.workers.dev
"""

from __future__ import annotations

import argparse
import json
import urllib.error
import urllib.request

USER_AGENT = (
    "Mozilla/5.0 (compatible; msmp-cloudflare-smoke/1.0; +https://github.com/"
    "METResearchGroup/mock_social_media_platform)"
)
TIMEOUT_SECONDS = 60


def request(
    url: str,
    *,
    method: str = "GET",
    headers: dict[str, str] | None = None,
    body: bytes | None = None,
) -> tuple[int, dict[str, str], bytes]:
    merged = {"User-Agent": USER_AGENT}
    if headers:
        merged.update(headers)
    req = urllib.request.Request(url, data=body, headers=merged, method=method)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as response:
            return response.status, dict(response.headers), response.read()
    except urllib.error.HTTPError as error:
        return error.code, dict(error.headers), error.read()


def as_json(payload: bytes) -> object | None:
    try:
        return json.loads(payload)
    except json.JSONDecodeError:
        return None


def note(failures: list[str], message: str | None) -> None:
    if message is not None:
        failures.append(message)


def check_health(api: str, failures: list[str]) -> None:
    status, _, body = request(f"{api}/health")
    print(f"GET /health -> {status} {body[:80]!r}")
    if status != 200 or as_json(body) != {"status": "ok"}:
        failures.append(f"/health returned {status}")


def check_feed(api: str, failures: list[str]) -> None:
    status, _, body = request(f"{api}/api/v1/feed")
    payload = as_json(body)
    posts = payload.get("posts") if isinstance(payload, dict) else None
    ids = [post.get("id") for post in posts] if isinstance(posts, list) else []
    print(f"GET /api/v1/feed -> {status} ids={ids}")
    if status != 200 or ids[:1] != ["post_1"] or len(ids) != 5:
        failures.append(f"/api/v1/feed returned {status} ids={ids}")
        return
    if not all(
        isinstance(post, dict) and post.get("parent_post_id") is None for post in posts
    ):
        failures.append("/api/v1/feed included a comment")


def check_thread(api: str, failures: list[str]) -> None:
    status, _, body = request(f"{api}/api/v1/posts/post_1")
    payload = as_json(body)
    comments = payload.get("comments") if isinstance(payload, dict) else None
    ids = (
        [comment.get("id") for comment in comments]
        if isinstance(comments, list)
        else []
    )
    print(f"GET /api/v1/posts/post_1 -> {status} comments={ids}")
    if status != 200 or ids != ["comment_1a", "comment_1b", "comment_1c"]:
        failures.append(f"/api/v1/posts/post_1 returned {status} comments={ids}")


def check_missing_post(api: str, failures: list[str]) -> None:
    status, _, body = request(f"{api}/api/v1/posts/does-not-exist")
    payload = as_json(body)
    detail = payload.get("detail") if isinstance(payload, dict) else None
    print(f"GET /api/v1/posts/does-not-exist -> {status} detail={detail!r}")
    if status != 404 or detail != "Post not found":
        failures.append(f"missing post returned {status} detail={detail!r}")


def engagement_count(post: object, field: str) -> int | None:
    if not isinstance(post, dict):
        return None
    engagement = post.get("engagement")
    if not isinstance(engagement, dict):
        return None
    value = engagement.get(field)
    if isinstance(value, int):
        return value
    return None


def check_engagement(api: str, failures: list[str], action: str, field: str) -> None:
    before_status, _, before_body = request(f"{api}/api/v1/posts/post_5")
    before_payload = as_json(before_body)
    before_post = (
        before_payload.get("post") if isinstance(before_payload, dict) else None
    )
    before = engagement_count(before_post, field)
    status, _, body = request(f"{api}/api/v1/posts/post_5/{action}", method="POST")
    payload = as_json(body)
    updated = payload.get("post") if isinstance(payload, dict) else None
    after = engagement_count(updated, field)
    print(f"POST /api/v1/posts/post_5/{action} -> {status} {field} {before} -> {after}")
    if before_status != 200 or before is None or status != 200 or after != before + 1:
        failures.append(f"{action} did not increment {field} ({before} -> {after})")


def check_cors(api: str, ui: str, failures: list[str]) -> None:
    status, headers, _ = request(
        f"{api}/api/v1/feed",
        method="OPTIONS",
        headers={
            "Origin": ui,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    allow_origin = headers.get("Access-Control-Allow-Origin") or headers.get(
        "access-control-allow-origin"
    )
    print(f"OPTIONS /api/v1/feed Origin={ui} -> {status} allow-origin={allow_origin}")
    if status != 204 or allow_origin != ui:
        failures.append(f"CORS preflight did not echo the UI origin (status {status})")


def post_json(url: str, payload: object) -> tuple[int, object | None]:
    status, _, body = request(
        url,
        method="POST",
        headers={"Content-Type": "application/json"},
        body=json.dumps(payload).encode(),
    )
    return status, as_json(body)


def require_dict(payload: object | None) -> dict[str, object] | None:
    if isinstance(payload, dict):
        return payload
    return None


def feed_summary(payload: object | None) -> dict[str, object] | None:
    body = require_dict(payload)
    if body is None:
        return None
    feed = body.get("feed")
    if isinstance(feed, dict):
        return feed
    return None


def check_page(
    url: str,
    label: str,
    needles: list[str],
    failures: list[str],
    *,
    expected_status: int = 200,
) -> None:
    status, _, body = request(url)
    text = body.decode("utf-8", errors="replace")
    missing = [needle for needle in needles if needle not in text]
    print(f"GET {label} -> {status} bytes={len(body)} missing={missing}")
    if status != expected_status or missing:
        failures.append(f"{label} returned {status} missing={missing}")


UNKNOWN_REF = "at://did:plc:example/app.bsky.feed.post/not-in-d1"


def check_hosted_feeds(api: str, ui: str, failures: list[str]) -> None:
    status, payload = post_json(
        f"{api}/api/v1/feeds",
        {
            "name": "smoke feed",
            "posts": ["post_1", "post_3", UNKNOWN_REF],
        },
    )
    feed = feed_summary(payload)
    feed_id = feed.get("id") if feed is not None else None
    print(f"POST /api/v1/feeds -> {status} id={feed_id}")
    if (
        status != 201
        or not isinstance(feed_id, str)
        or feed is None
        or feed.get("post_count") != 3
        or feed.get("load_count") != 0
    ):
        failures.append(f"create feed returned {status} id={feed_id}")
        return

    empty_status, _ = post_json(f"{api}/api/v1/feeds", {"name": "empty", "posts": []})
    print(f"POST /api/v1/feeds empty -> {empty_status}")
    if empty_status != 400:
        failures.append(f"empty feed returned {empty_status}")

    detail_status, _, detail_raw = request(f"{api}/api/v1/feeds/{feed_id}")
    detail = feed_summary(as_json(detail_raw))
    print(
        f"GET /api/v1/feeds/{feed_id} -> {detail_status} "
        f"loads={None if detail is None else detail.get('load_count')}"
    )
    if detail_status != 200 or detail is None or detail.get("load_count") != 0:
        failures.append("feed detail changed the load count before a page view")

    first_status, _, first_raw = request(
        f"{api}/xrpc/app.bsky.feed.getFeedSkeleton?feed={feed_id}&limit=1"
    )
    first = require_dict(as_json(first_raw))
    first_items = first.get("feed") if first is not None else None
    first_post = (
        first_items[0].get("post")
        if isinstance(first_items, list)
        and first_items
        and isinstance(first_items[0], dict)
        else None
    )
    print(
        f"GET getFeedSkeleton limit=1 -> {first_status} "
        f"post={first_post} cursor={None if first is None else first.get('cursor')}"
    )
    if (
        first_status != 200
        or first is None
        or first_post != "post_1"
        or first.get("cursor") != "1"
    ):
        failures.append("skeleton first page did not return post_1 and cursor 1")

    last_status, _, last_raw = request(
        f"{api}/xrpc/app.bsky.feed.getFeedSkeleton?feed={feed_id}&limit=1&cursor=2"
    )
    last = require_dict(as_json(last_raw))
    last_items = last.get("feed") if last is not None else None
    last_post = (
        last_items[0].get("post")
        if isinstance(last_items, list)
        and last_items
        and isinstance(last_items[0], dict)
        else None
    )
    print(f"GET getFeedSkeleton cursor=2 -> {last_status} post={last_post}")
    if (
        last_status != 200
        or last is None
        or last_post != UNKNOWN_REF
        or "cursor" in last
    ):
        failures.append("skeleton last page did not return the unknown identifier")

    past_status, _, past_raw = request(
        f"{api}/xrpc/app.bsky.feed.getFeedSkeleton?feed={feed_id}&cursor=99"
    )
    past = require_dict(as_json(past_raw))
    past_items = past.get("feed") if past is not None else None
    print(f"GET getFeedSkeleton cursor=99 -> {past_status} items={past_items}")
    if past_status != 200 or past is None or past_items != [] or "cursor" in past:
        failures.append("skeleton cursor past the end was not an empty page")

    missing_status, _, missing_raw = request(
        f"{api}/xrpc/app.bsky.feed.getFeedSkeleton?feed=feed_does_not_exist"
    )
    missing = require_dict(as_json(missing_raw))
    missing_detail = missing.get("detail") if missing is not None else None
    print(f"GET missing skeleton -> {missing_status} detail={missing_detail!r}")
    if missing_status != 404 or missing_detail != "Feed not found":
        failures.append(f"missing skeleton returned {missing_status}")

    bad_cursor_status, _, _ = request(
        f"{api}/xrpc/app.bsky.feed.getFeedSkeleton?feed={feed_id}&cursor=nope"
    )
    print(f"GET bad cursor -> {bad_cursor_status}")
    if bad_cursor_status != 400:
        failures.append(f"bad cursor returned {bad_cursor_status}")

    list_status, _, list_raw = request(f"{api}/api/v1/feeds")
    listed = require_dict(as_json(list_raw))
    listed_feeds = listed.get("feeds") if listed is not None else None
    listed_ids = (
        [item.get("id") for item in listed_feeds]
        if isinstance(listed_feeds, list)
        else []
    )
    print(f"GET /api/v1/feeds -> {list_status} contains={feed_id in listed_ids}")
    if list_status != 200 or feed_id not in listed_ids:
        failures.append("feed list did not include the new feed")

    check_page(
        f"{ui}/feed/{feed_id}",
        "ui public feed",
        [
            "smoke feed",
            "Loaded 1 time",
            "Notes from building the analytical engine.",
            UNKNOWN_REF,
            "Not in this app",
        ],
        failures,
    )
    after_page_status, _, after_page_raw = request(f"{api}/api/v1/feeds/{feed_id}")
    after_page = feed_summary(as_json(after_page_raw))
    after_loads = after_page.get("load_count") if after_page is not None else None
    print(f"GET detail after page -> {after_page_status} loads={after_loads}")
    if after_loads != 1:
        failures.append(f"public page did not record one load ({after_loads})")

    check_page(
        f"{ui}/admin/feeds/{feed_id}",
        "ui admin detail",
        ["smoke feed", "Page loads", "Loaded 1 time", UNKNOWN_REF],
        failures,
    )
    after_admin_status, _, after_admin_raw = request(f"{api}/api/v1/feeds/{feed_id}")
    after_admin = feed_summary(as_json(after_admin_raw))
    admin_loads = after_admin.get("load_count") if after_admin is not None else None
    print(f"GET detail after admin -> {after_admin_status} loads={admin_loads}")
    if admin_loads != 1:
        failures.append(f"admin detail changed the load count ({admin_loads})")

    check_page(
        f"{ui}/feed/{feed_id}",
        "ui public feed reloaded",
        ["Loaded 2 times"],
        failures,
    )
    check_page(
        f"{ui}/feed/feed_does_not_exist",
        "ui missing feed",
        ["Feed not found"],
        failures,
        expected_status=404,
    )
    check_page(
        f"{ui}/admin",
        "ui /admin",
        ["Create a feed", "smoke feed", feed_id],
        failures,
    )


def check_study_feeds(
    api: str,
    example_feed_id: str,
    unknown_feed_id: str,
    failures: list[str],
) -> None:
    """Check the Study 2 example feed and the unknown-refs feed.

    Prints ids and statuses. Does not print post text.
    """

    detail_status, _, detail_raw = request(f"{api}/api/v1/feeds/{example_feed_id}")
    detail = require_dict(as_json(detail_raw))
    posts = detail.get("posts") if detail is not None else None
    statuses = (
        [item.get("status") for item in posts if isinstance(item, dict)]
        if isinstance(posts, list)
        else []
    )
    refs = (
        [item.get("ref") for item in posts if isinstance(item, dict)]
        if isinstance(posts, list)
        else []
    )
    print(
        f"GET /api/v1/feeds/{example_feed_id} -> {detail_status} "
        f"count={len(statuses)} known={statuses.count('known')}"
    )
    if (
        detail_status != 200
        or len(statuses) != 100
        or any(item != "known" for item in statuses)
    ):
        failures.append(
            f"example feed returned {detail_status} count={len(statuses)} "
            f"known={statuses.count('known')}"
        )
        return

    skeleton_status, _, skeleton_raw = request(
        f"{api}/xrpc/app.bsky.feed.getFeedSkeleton?feed={example_feed_id}&limit=100"
    )
    skeleton = require_dict(as_json(skeleton_raw))
    items = skeleton.get("feed") if skeleton is not None else None
    skeleton_ids = (
        [item.get("post") for item in items if isinstance(item, dict)]
        if isinstance(items, list)
        else []
    )
    print(
        f"GET getFeedSkeleton example limit=100 -> {skeleton_status} "
        f"count={len(skeleton_ids)} cursor={None if skeleton is None else skeleton.get('cursor')}"
    )
    if (
        skeleton_status != 200
        or skeleton is None
        or skeleton_ids != refs
        or "cursor" in skeleton
        or len(skeleton_ids) != 100
    ):
        failures.append("example skeleton did not return the same 100 ids in order")
    else:
        print("example_skeleton_ids=" + ",".join(str(item) for item in skeleton_ids))

    unknown_status, _, unknown_raw = request(f"{api}/api/v1/feeds/{unknown_feed_id}")
    unknown = require_dict(as_json(unknown_raw))
    unknown_posts = unknown.get("posts") if unknown is not None else None
    unknown_rows = (
        [
            (item.get("ref"), item.get("status"))
            for item in unknown_posts
            if isinstance(item, dict)
        ]
        if isinstance(unknown_posts, list)
        else []
    )
    foreign = [ref for ref, status in unknown_rows if status == "unknown"]
    print(
        f"GET /api/v1/feeds/{unknown_feed_id} -> {unknown_status} "
        f"count={len(unknown_rows)} unknown={len(foreign)}"
    )
    if unknown_status != 200 or len(foreign) != 3 or len(unknown_rows) != 13:
        failures.append(
            f"unknown-refs feed returned {unknown_status} "
            f"count={len(unknown_rows)} unknown={len(foreign)}"
        )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-url", required=True)
    parser.add_argument("--ui-url", required=True)
    parser.add_argument("--example-feed-id", default="")
    parser.add_argument("--unknown-feed-id", default="")
    args = parser.parse_args()
    api = args.api_url.rstrip("/")
    ui = args.ui_url.rstrip("/")
    failures: list[str] = []
    check_health(api, failures)
    check_feed(api, failures)
    check_thread(api, failures)
    check_missing_post(api, failures)
    check_engagement(api, failures, "like", "like_count")
    check_engagement(api, failures, "retweet", "retweet_count")
    check_cors(api, ui, failures)
    check_page(
        f"{ui}/",
        "ui /",
        ["Feed host", "Open admin"],
        failures,
    )
    check_page(
        f"{ui}/post/post_1",
        "ui /post/post_1",
        [
            "Notes from building the analytical engine.",
            "Would love a walkthrough of the punched cards.",
        ],
        failures,
    )
    check_page(
        f"{ui}/post/does-not-exist",
        "ui missing post",
        ["Post not found"],
        failures,
    )
    check_hosted_feeds(api, ui, failures)
    if args.example_feed_id or args.unknown_feed_id:
        if not args.example_feed_id or not args.unknown_feed_id:
            failures.append("example and unknown feed ids must be passed together")
        else:
            check_study_feeds(api, args.example_feed_id, args.unknown_feed_id, failures)
    if failures:
        print("FAILED")
        for failure in failures:
            print(f"- {failure}")
        raise SystemExit(1)
    print("OK")


if __name__ == "__main__":
    main()
