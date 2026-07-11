# Medicote - raccourcis de développement
# Tout l'environnement tourne via docker compose.

COMPOSE := docker compose
COMPOSE_E2E := docker compose -f docker-compose.e2e.yml

.DEFAULT_GOAL := help

.PHONY: help up down restart build logs ps seed migrate generate \
        db-push db-reset studio backend-sh frontend-sh psql redis-cli clean \
        e2e-up e2e-down e2e-ps e2e-logs e2e-test e2e-test-ui e2e-install

help: ## Affiche cette aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

## --- Docker ---

up: ## Démarre toute la stack (détaché)
	$(COMPOSE) up -d

down: ## Arrête et supprime les conteneurs
	$(COMPOSE) down

restart: ## Redémarre la stack
	$(COMPOSE) restart

build: ## (Re)build les images
	$(COMPOSE) build

logs: ## Suit les logs (make logs s=backend pour un service)
	$(COMPOSE) logs -f $(s)

ps: ## Liste les conteneurs et leur état
	$(COMPOSE) ps

## --- Base de données / Prisma (exécuté dans le conteneur backend) ---

seed: ## Lance le seed de dev
	$(COMPOSE) exec backend npm run seed:dev

migrate: ## Crée/applique une migration (make migrate name=ma_migration)
	$(COMPOSE) exec backend npx prisma migrate dev --name $(name)

generate: ## Régénère le client Prisma
	$(COMPOSE) exec backend npx prisma generate

db-push: ## Synchronise le schéma sans migration
	$(COMPOSE) exec backend npx prisma db push

db-reset: ## Réinitialise la base puis relance le seed
	$(COMPOSE) exec backend npx prisma migrate reset --force

studio: ## Ouvre Prisma Studio (port 5555)
	$(COMPOSE) exec backend npx prisma studio

## --- Shells ---

backend-sh: ## Ouvre un shell dans le conteneur backend
	$(COMPOSE) exec backend sh

frontend-sh: ## Ouvre un shell dans le conteneur frontend
	$(COMPOSE) exec frontend sh

psql: ## Ouvre psql sur la base medicote
	$(COMPOSE) exec postgres-db psql -U admin -d medicote

redis-cli: ## Ouvre redis-cli
	$(COMPOSE) exec redis-db redis-cli

## --- Nettoyage ---

clean: ## Arrête tout et supprime les volumes (DONNÉES PERDUES)
	$(COMPOSE) down -v

## --- E2E (Playwright) ---

e2e-up: ## Démarre la stack E2E (postgres, redis, backend, frontend)
	bash scripts/prepare-e2e-env.sh
	$(COMPOSE_E2E) --env-file .env.e2e up -d --wait

e2e-down: ## Arrête la stack E2E
	$(COMPOSE_E2E) --env-file .env.e2e down -v

e2e-ps: ## État des conteneurs E2E
	$(COMPOSE_E2E) --env-file .env.e2e ps

e2e-logs: ## Logs E2E (make e2e-logs s=backend-e2e)
	$(COMPOSE_E2E) --env-file .env.e2e logs -f $(s)

e2e-install: ## Installe Playwright dans e2e/ (sans npm install racine)
	cd e2e && npm install && npx playwright install chromium

e2e-test: ## Lance les tests E2E (stack doit être up)
	cd e2e && npm test

e2e-test-ui: ## Lance les tests E2E avec interface Playwright
	cd e2e && npm run test:ui
