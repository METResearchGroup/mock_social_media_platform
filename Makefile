.PHONY: help deploy-ui deploy-backend deploy-all smoke

API_URL ?= https://msmp-api.mind-technology-lab.workers.dev
UI_URL ?= https://msmp-ui.mind-technology-lab.workers.dev
PYTHON ?= python3

help:
	@printf '%s\n' 'make deploy-ui       Install dependencies and deploy the UI' \
		'make deploy-backend  Install dependencies, apply remote D1 migrations, and deploy the API' \
		'make deploy-all      Deploy the API, then the UI, then run the smoke test' \
		'make smoke           Run the smoke test (increments live post_5 counts)'

deploy-ui:
	cd frontend && npm ci
	cd frontend && NEXT_PUBLIC_API_BASE_URL="$(API_URL)" npm run deploy:vinext

deploy-backend:
	cd cloudflare/api && npm ci
	cd cloudflare/api && npx wrangler d1 migrations apply msmp --remote
	cd cloudflare/api && npx wrangler deploy

deploy-all:
	$(MAKE) deploy-backend
	$(MAKE) deploy-ui
	$(MAKE) smoke

smoke:
	$(PYTHON) scripts/cloudflare_smoke.py --api-url "$(API_URL)" --ui-url "$(UI_URL)"
