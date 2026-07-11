# Forge starter — convenience commands. These ONLY delegate to Docker / ./forge.
# No local Node, npm, or build tools are assumed.
#
# APP / HOST are the app-name and public-domain placeholders. Fill them in (edit
# below, or pass on the command line, e.g. `make provision APP=my-app HOST=my-app.example.com`).
APP  ?= <APP>
HOST ?= <DOMAIN>

.PHONY: up down logs shell ps restart pull new-app \
        provision productionize release deploy deploy-ps deploy-logs deploy-down

# --- Control plane (dev) ---------------------------------------------------
up:
	docker compose up -d --force-recreate
	@echo ""
	@echo "Forge is up. Provision a whole app in one command:"
	@echo "  ./new-app my-app                 # init->provision->install->build->test->lint"
	@echo "Or just tell Claude: \"build me a <thing>\" (see .claude/skills/provision-app)."

down:
	docker compose down

logs:
	docker compose logs -f api

shell:
	docker compose exec api sh

ps:
	docker compose ps

restart:
	docker compose restart api

# Refresh the control-plane image from the registry.
pull:
	docker compose pull

# One command to scaffold + validate a new app:  make new-app name=my-app
new-app:
	@test -n "$(name)" || (echo "usage: make new-app name=<kebab-name>"; exit 2)
	./new-app "$(name)"

# --- Production deployment (single-app layout) -----------------------------
# The prod stack lives under app/ — `forge productionize` GENERATES app/compose.prod.yaml
# (prod compose project `forge-<APP>-prod`, DB-aware data-plane sidecar + Traefik) and
# app/.env.prod.example. `forge release` runs the full pipeline (assess -> publish -> repin
# -> deploy -> verify) and is idempotent. See DEPLOY.md.
PROD := docker compose -f app/compose.prod.yaml --env-file app/.env.prod

provision:
	./forge provision --app $(APP) --platform-store postgres --secret AUTH_SESSION_SECRET

productionize:
	./forge productionize --app $(APP) --host $(HOST)

release deploy:
	./forge release --app $(APP) --host $(HOST)

deploy-ps:
	$(PROD) ps

deploy-logs:
	$(PROD) logs -f

# Stop the prod stack but KEEP the data volumes. Never `down -v` in prod (destroys the DB).
deploy-down:
	$(PROD) down
