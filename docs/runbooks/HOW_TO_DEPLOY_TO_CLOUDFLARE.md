# How to deploy to Cloudflare

The feed API is Worker `msmp-api`. The Next.js UI is Worker `msmp-ui`, built
with vinext. Counts live in D1 database `msmp`. There is no Cloudflare
Container and no Access gate. Both hosts are public on `workers.dev`.

| | |
|---|---|
| API config | `cloudflare/api/wrangler.jsonc` |
| API Worker | `msmp-api` |
| API URL | `https://msmp-api.mind-technology-lab.workers.dev` |
| UI config | `frontend/wrangler.jsonc` |
| UI Worker | `msmp-ui` |
| UI URL | `https://msmp-ui.mind-technology-lab.workers.dev` |
| Account | `CLOUDFLARE_ACCOUNT_ID`. Do not commit it. |
| Subdomain | `mind-technology-lab.workers.dev` |

The FastAPI app in `src/mock_social_media_platform/` stays the local process.
It keeps the original post routes. Hosted feeds live on the Worker. The
local FastAPI process does not store feeds.
A Worker fits this API: each call is a short JSON read or a single D1
update. Nothing needs a long-lived Python process.

The UI Worker fetches the API host during server rendering. Both Workers
share the `workers.dev` zone, so that fetch needs
`global_fetch_strictly_public` on `msmp-ui`. Without the flag, Cloudflare
returns error 1042 and the page shows the local API error. The browser
still calls the public API for like and retweet.

## Credentials

Export `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the shell.
The lab copies are in Secrets Manager `cloudflare-api-token` in `us-east-2`.
Do not print the token. Do not put it in `wrangler.jsonc` or in a Worker var.
This deploy has no Worker secrets. `wrangler secret put` is the path if a
later change needs one.

`workers.dev` rejects the default Python user agent (error 1010). The smoke
script sends a browser user agent.

## API

From `cloudflare/api/`:

```bash
npm ci
npx wrangler d1 migrations apply msmp --remote
npx wrangler deploy
```

The first `migrations apply` creates the tables and the seed posts. Later
deploys apply only new files in `migrations/`. Do not edit `0001_init.sql`
after it has been applied. Add a new migration instead.

## UI

`NEXT_PUBLIC_API_BASE_URL` is inlined into the browser bundle at build time
and copied into `process.env` for server components. It has to be the API
host above. From `frontend/`:

```bash
npm ci
export NEXT_PUBLIC_API_BASE_URL=https://msmp-api.mind-technology-lab.workers.dev
npm run deploy:vinext
```

`npm run build` stays `next build`. `npm run dev` stays the local Next.js
server.

## Smoke

From the repository root, after both deploys:

```bash
python scripts/cloudflare_smoke.py \
  --api-url https://msmp-api.mind-technology-lab.workers.dev \
  --ui-url https://msmp-ui.mind-technology-lab.workers.dev
```

Expected last line: `OK`. The like and retweet checks increment `post_5` on
the live database. That is the point of the check.

## Feeds

A feed is a name plus an ordered list of post identifiers. Callers send
identifiers. This app renders the page.

Create a feed:

```bash
curl -sS -X POST https://msmp-api.mind-technology-lab.workers.dev/api/v1/feeds \
  -H 'content-type: application/json' \
  -d '{"name":"Morning notes","posts":["post_1","post_3","at://did:plc:example/app.bsky.feed.post/not-in-d1"]}'
```

Read one page of identifiers. `limit` defaults to 30 and must be from 1 to
100. `cursor` is the next offset, as a decimal string. The last page omits
`cursor`. This route does not change the load count.

```bash
curl -sS "https://msmp-api.mind-technology-lab.workers.dev/xrpc/app.bsky.feed.getFeedSkeleton?feed=feed_0123456789abcdef&limit=30"
```

```json
{
  "feed": [
    { "post": "post_1" },
    { "post": "at://did:plc:example/app.bsky.feed.post/not-in-d1" }
  ],
  "cursor": "30"
}
```

`GET /api/v1/feeds` lists feeds. `GET /api/v1/feeds/{id}` returns the feed
and the rendered posts. It does not change the load count.
`POST /api/v1/feeds/{id}/loads` adds one to the load count and returns the
same body. The public page calls that route.

An identifier that matches `posts.id` renders as that post, including a
comment id. Any other identifier is stored and returned unchanged. The
public page shows a placeholder card with the identifier. The skeleton
still includes it. An `at://` URI that is not in D1 takes that path. This
app does not fetch it from anywhere else.

A feed holds 1 to 500 identifiers. Each identifier is a non-empty string of
at most 400 characters. The name is required and at most 80 characters.
Duplicate identifiers stay in the order the caller sent.

There is no sign-in. Anyone who can reach the host can create a feed and
open it.

Pages on `msmp-ui`:

| Page | Behavior |
| --- | --- |
| `/` | Explains the service and links to admin |
| `/admin` | Create a feed, copy `/feed/<id>`, list every feed |
| `/admin/feeds/<id>` | Load count, last loaded time, and a preview |
| `/feed/<id>` | Public feed. Each load adds one to the load count |

Migration `0002_feeds.sql` creates `feeds` and `feed_items`. The same
`wrangler d1 migrations apply` command applies it. Do not edit
`0001_init.sql`.

Each public page view reads the feed items and writes one update to
`feeds.load_count`. Timestamps are UTC.

## Why this is not a Container

A Container fits a process that stays up between requests. This API answers
and returns.
D1 holds the like and retweet counts, so the next request sees them even
when Cloudflare starts a new isolate. A Container would bill an instance
for a job a Worker already does.
