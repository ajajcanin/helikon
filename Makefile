# Shortcuts for the Helikon app. Everything real lives in setup.sh and package.json.
.PHONY: setup dev test fresh start

setup: ## First run or re-run (skips finished steps)
	./setup.sh

start: ## Setup, then pnpm dev
	./setup.sh --start

dev: ## Next.js dev server on http://localhost:3000
	docker compose up -d --wait
	pnpm dev

test: ## Tests against the local test database
	docker compose up -d --wait
	pnpm test

fresh: ## Delete the local database and uploads (asks first)
	./setup.sh --fresh
