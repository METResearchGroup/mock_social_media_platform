import { decodePathPart, jsonResponse, NO_STORE } from "./http";
import { toPost, type PostJson, type PostRow } from "./posts";

const FEED_ID = /^feed_[0-9a-f]{16}$/;
const MAX_POSTS = 500;
const MAX_NAME_LENGTH = 80;
const MAX_REF_LENGTH = 400;
// 500 identifiers of 400 characters, plus the JSON wrapper.
const MAX_BODY_BYTES = 256_000;
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

export type FeedSummary = {
  id: string;
  name: string;
  created_at: string;
  load_count: number;
  last_loaded_at: string | null;
  post_count: number;
};

type FeedItemJson = {
  ref: string;
  status: "known" | "unknown";
  post: PostJson | null;
};

type FeedRow = {
  id: string;
  name: string;
  created_at: string;
  load_count: number;
  last_loaded_at: string | null;
  post_count: number;
};

type HydratedRow = {
  post_ref: string;
  id: string | null;
  text: string | null;
  created_at: string | null;
  like_count: number | null;
  retweet_count: number | null;
  reply_count: number | null;
  parent_post_id: string | null;
  author_id: string | null;
  handle: string | null;
  display_name: string | null;
};

function timestamp(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function newFeedId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let hex = "";
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return `feed_${hex}`;
}

function badRequest(request: Request, env: Env, detail: string): Response {
  return jsonResponse(request, env, 400, { detail }, NO_STORE);
}

function feedNotFound(request: Request, env: Env): Response {
  return jsonResponse(request, env, 404, { detail: "Feed not found" }, NO_STORE);
}

function toSummary(row: FeedRow): FeedSummary {
  return {
    id: row.id,
    name: row.name,
    created_at: row.created_at,
    load_count: row.load_count,
    last_loaded_at: row.last_loaded_at,
    post_count: row.post_count,
  };
}

const FEED_SUMMARY_SQL = `
  SELECT
    f.id,
    f.name,
    f.created_at,
    f.load_count,
    f.last_loaded_at,
    (SELECT COUNT(*) FROM feed_items i WHERE i.feed_id = f.id) AS post_count
  FROM feeds f
`;

async function readFeed(env: Env, feedId: string): Promise<FeedSummary | null> {
  const row = await env.DB.prepare(`${FEED_SUMMARY_SQL} WHERE f.id = ?`)
    .bind(feedId)
    .first<FeedRow>();
  return row === null ? null : toSummary(row);
}

function hydratedItem(row: HydratedRow): FeedItemJson {
  if (
    row.id === null ||
    row.text === null ||
    row.created_at === null ||
    row.like_count === null ||
    row.retweet_count === null ||
    row.reply_count === null ||
    row.author_id === null ||
    row.handle === null ||
    row.display_name === null
  ) {
    return { ref: row.post_ref, status: "unknown", post: null };
  }
  const postRow: PostRow = {
    id: row.id,
    text: row.text,
    created_at: row.created_at,
    like_count: row.like_count,
    retweet_count: row.retweet_count,
    reply_count: row.reply_count,
    parent_post_id: row.parent_post_id,
    author_id: row.author_id,
    handle: row.handle,
    display_name: row.display_name,
  };
  return { ref: row.post_ref, status: "known", post: toPost(postRow) };
}

async function listItems(env: Env, feedId: string): Promise<FeedItemJson[]> {
  const result = await env.DB.prepare(
    `SELECT
       i.post_ref,
       p.id,
       p.text,
       p.created_at,
       p.like_count,
       p.retweet_count,
       p.reply_count,
       p.parent_post_id,
       u.id AS author_id,
       u.handle,
       u.display_name
     FROM feed_items i
     LEFT JOIN posts p ON p.id = i.post_ref
     LEFT JOIN users u ON u.id = p.author_id
     WHERE i.feed_id = ?
     ORDER BY i.position ASC`,
  )
    .bind(feedId)
    .all<HydratedRow>();
  return (result.results ?? []).map(hydratedItem);
}

function feedIdFrom(match: RegExpMatchArray): string | null {
  const raw = decodePathPart(match[1] ?? "");
  if (raw === null || !FEED_ID.test(raw)) {
    return null;
  }
  return raw;
}

async function readJson(request: Request): Promise<
  | { ok: true; value: unknown }
  | { ok: false; detail: string }
> {
  const declared = request.headers.get("Content-Length");
  if (declared !== null && Number(declared) > MAX_BODY_BYTES) {
    return { ok: false, detail: "Request body is too large" };
  }
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return { ok: false, detail: "Request body is too large" };
  }
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, detail: "Request body must be JSON" };
  }
}

function parseCreateBody(
  value: unknown,
): { ok: true; name: string; posts: string[] } | { ok: false; detail: string } {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, detail: "Request body must be a JSON object" };
  }
  const record = value as { name?: unknown; posts?: unknown };
  if (typeof record.name !== "string") {
    return { ok: false, detail: "name is required" };
  }
  const name = record.name.trim();
  if (name.length === 0) {
    return { ok: false, detail: "name is required" };
  }
  if (name.length > MAX_NAME_LENGTH) {
    return { ok: false, detail: "name must be 80 characters or fewer" };
  }
  if (!Array.isArray(record.posts)) {
    return {
      ok: false,
      detail: "posts must be a list of 1 to 500 identifiers",
    };
  }
  if (record.posts.length < 1 || record.posts.length > MAX_POSTS) {
    return {
      ok: false,
      detail: "posts must be a list of 1 to 500 identifiers",
    };
  }
  const posts: string[] = [];
  for (const entry of record.posts) {
    if (typeof entry !== "string") {
      return {
        ok: false,
        detail:
          "each post identifier must be a non-empty string of at most 400 characters",
      };
    }
    const ref = entry.trim();
    if (ref.length === 0 || ref.length > MAX_REF_LENGTH) {
      return {
        ok: false,
        detail:
          "each post identifier must be a non-empty string of at most 400 characters",
      };
    }
    posts.push(ref);
  }
  return { ok: true, name, posts };
}

export async function handleListFeeds(request: Request, env: Env): Promise<Response> {
  const result = await env.DB.prepare(
    `${FEED_SUMMARY_SQL} ORDER BY f.created_at DESC, f.id DESC`,
  ).all<FeedRow>();
  const feeds = (result.results ?? []).map(toSummary);
  return jsonResponse(request, env, 200, { feeds }, NO_STORE);
}

export async function handleCreateFeed(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  if (!body.ok) {
    return badRequest(request, env, body.detail);
  }
  const parsed = parseCreateBody(body.value);
  if (!parsed.ok) {
    return badRequest(request, env, parsed.detail);
  }
  const id = newFeedId();
  const createdAt = timestamp();
  const statements = [
    env.DB.prepare(
      `INSERT INTO feeds (id, name, created_at, load_count, last_loaded_at)
       VALUES (?, ?, ?, 0, NULL)`,
    ).bind(id, parsed.name, createdAt),
    ...parsed.posts.map((postRef, position) =>
      env.DB.prepare(
        `INSERT INTO feed_items (feed_id, position, post_ref) VALUES (?, ?, ?)`,
      ).bind(id, position, postRef),
    ),
  ];
  await env.DB.batch(statements);
  const feed: FeedSummary = {
    id,
    name: parsed.name,
    created_at: createdAt,
    load_count: 0,
    last_loaded_at: null,
    post_count: parsed.posts.length,
  };
  return jsonResponse(request, env, 201, { feed }, NO_STORE);
}

export async function handleGetFeed(request: Request, env: Env): Promise<Response> {
  const match = new URL(request.url).pathname.match(/^\/api\/v1\/feeds\/([^/]+)$/);
  if (match === null) {
    return feedNotFound(request, env);
  }
  const feedId = feedIdFrom(match);
  if (feedId === null) {
    return feedNotFound(request, env);
  }
  const feed = await readFeed(env, feedId);
  if (feed === null) {
    return feedNotFound(request, env);
  }
  const posts = await listItems(env, feedId);
  return jsonResponse(request, env, 200, { feed, posts }, NO_STORE);
}

export async function handleRecordLoad(request: Request, env: Env): Promise<Response> {
  const match = new URL(request.url).pathname.match(
    /^\/api\/v1\/feeds\/([^/]+)\/loads$/,
  );
  if (match === null) {
    return feedNotFound(request, env);
  }
  const feedId = feedIdFrom(match);
  if (feedId === null) {
    return feedNotFound(request, env);
  }
  const loadedAt = timestamp();
  const updated = await env.DB.prepare(
    `UPDATE feeds
     SET load_count = load_count + 1, last_loaded_at = ?
     WHERE id = ?`,
  )
    .bind(loadedAt, feedId)
    .run();
  if ((updated.meta.changes ?? 0) === 0) {
    return feedNotFound(request, env);
  }
  const feed = await readFeed(env, feedId);
  if (feed === null) {
    return feedNotFound(request, env);
  }
  const posts = await listItems(env, feedId);
  return jsonResponse(request, env, 200, { feed, posts }, NO_STORE);
}

function parseLimit(raw: string | null): { ok: true; limit: number } | { ok: false } {
  if (raw === null) {
    return { ok: true, limit: DEFAULT_LIMIT };
  }
  if (!/^\d+$/.test(raw)) {
    return { ok: false };
  }
  const limit = Number(raw);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return { ok: false };
  }
  return { ok: true, limit };
}

function parseCursor(raw: string | null): { ok: true; offset: number } | { ok: false } {
  if (raw === null || raw.length === 0) {
    return { ok: true, offset: 0 };
  }
  if (!/^\d+$/.test(raw)) {
    return { ok: false };
  }
  const offset = Number(raw);
  if (!Number.isSafeInteger(offset) || offset < 0) {
    return { ok: false };
  }
  return { ok: true, offset };
}

export async function handleGetFeedSkeleton(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const feedParam = url.searchParams.get("feed");
  if (feedParam === null || feedParam.length === 0) {
    return badRequest(request, env, "feed is required");
  }
  if (!FEED_ID.test(feedParam)) {
    return feedNotFound(request, env);
  }
  const limitResult = parseLimit(url.searchParams.get("limit"));
  if (!limitResult.ok) {
    return badRequest(request, env, "limit must be an integer from 1 to 100");
  }
  const cursorResult = parseCursor(url.searchParams.get("cursor"));
  if (!cursorResult.ok) {
    return badRequest(request, env, "cursor must be a non-negative integer");
  }
  const feed = await readFeed(env, feedParam);
  if (feed === null) {
    return feedNotFound(request, env);
  }
  const result = await env.DB.prepare(
    `SELECT post_ref
     FROM feed_items
     WHERE feed_id = ?
     ORDER BY position ASC
     LIMIT ? OFFSET ?`,
  )
    .bind(feedParam, limitResult.limit + 1, cursorResult.offset)
    .all<{ post_ref: string }>();
  const rows = result.results ?? [];
  const page = rows.slice(0, limitResult.limit);
  const body: { feed: { post: string }[]; cursor?: string } = {
    feed: page.map((row) => ({ post: row.post_ref })),
  };
  if (rows.length > limitResult.limit) {
    body.cursor = String(cursorResult.offset + limitResult.limit);
  }
  return jsonResponse(request, env, 200, body, NO_STORE);
}
