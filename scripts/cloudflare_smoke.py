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
) -> tuple[int, dict[str, str], bytes]:
    merged = {"User-Agent": USER_AGENT}
    if headers:
        merged.update(headers)
    req = urllib.request.Request(url, headers=merged, method=method)
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


def check_page(url: str, label: str, needles: list[str], failures: list[str]) -> None:
    status, _, body = request(url)
    text = body.decode("utf-8", errors="replace")
    missing = [needle for needle in needles if needle not in text]
    print(f"GET {label} -> {status} bytes={len(body)} missing={missing}")
    if status != 200 or missing:
        failures.append(f"{label} returned {status} missing={missing}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-url", required=True)
    parser.add_argument("--ui-url", required=True)
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
        ["Home", "Notes from building the analytical engine."],
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
    if failures:
        print("FAILED")
        for failure in failures:
            print(f"- {failure}")
        raise SystemExit(1)
    print("OK")


if __name__ == "__main__":
    main()
