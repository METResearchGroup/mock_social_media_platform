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
It keeps the same routes. The Worker is the hosted copy of that contract.
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

## Why this is not a Container

A Container is the right shape for a process that stays up between requests
(the lab API's background query, Jetstream). This API answers and returns.
D1 holds the like and retweet counts, so the next request sees them even
when Cloudflare starts a new isolate. A Container would bill an instance
for a job a Worker already does.
