# Forge starter — convenience commands. These ONLY delegate to Docker.
# No local Node, npm, or build tools are assumed.

.PHONY: up down logs shell ps restart pull new-app \
        deploy deploy-ps deploy-logs deploy-config deploy-down

up:
	docker compose up -d
	@echo ""
	@echo "Forge is up. Provision a whole app in one command:"
	@echo "  ./new-app my-app                 # init->provision->install->build->test->lint"
	@echo "Or step by step: ./forge init app --name my-app  (then provision/install/build/…)"
	@echo "Or just tell Claude: \"build me a <thing>\" (see .claude/skills/provision-app)."

# One command to scaffold + validate a new app:  make new-app name=my-app
new-app:
	@test -n "$(name)" || (echo "usage: make new-app name=<kebab-name>"; exit 2)
	./new-app "$(name)"

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

# Refresh the platform image from the registry.
pull:
	docker compose pull

# --- Production deployment (compose.prod.yaml) -----------------------------
# Zero-downtime is a PLATFORM capability — `forge deploy` (C7). `make deploy` ensures the control
# plane is up, then rolls the public `web` service start-first (new replica up + healthy before
# the old drains out of Traefik). Configure `app/.env.prod` from `.env.prod.example` first; see
# DEPLOY.md. (`forge deploy` loads `app/.env.prod` by default; these plain-compose helpers pass it
# via --env-file so they resolve the same APP_NAME/host/pins.)
PROD := docker compose -f compose.prod.yaml --env-file app/.env.prod
APP  ?= $(APP_NAME)

deploy:
	@test -n "$(APP)" || (echo "set APP=<app-name> (or APP_NAME in .env)"; exit 2)
	$(MAKE) up          # ensure the control plane is running (idempotent; pulls its image if missing)
	./forge deploy --app "$(APP)" --proxy-net proxy
	@$(PROD) ps
	@echo ""
	@echo "Deployed $(APP) (zero-downtime roll via forge deploy)."

deploy-ps:
	$(PROD) ps

deploy-logs:
	$(PROD) logs -f

# Validate compose.prod.yaml + the resolved app/.env.prod without touching anything.
deploy-config:
	$(PROD) config

# Stop the stack but KEEP the data volumes (postgres_data, forge_state).
# (Never `down -v` in prod — that destroys the database.)
deploy-down:
	$(PROD) down
