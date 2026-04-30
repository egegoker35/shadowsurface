.PHONY: help install dev build start worker db-migrate db-generate db-studio deploy backup logs status stop clean

help:
	@echo "ShadowSurface Makefile Commands:"
	@echo "  install      - Install dependencies"
	@echo "  dev          - Start development server"
	@echo "  worker       - Start worker locally"
	@echo "  build        - Build production app"
	@echo "  db-migrate   - Run database migrations"
	@echo "  db-generate  - Generate Prisma client"
	@echo "  db-studio    - Open Prisma Studio"
	@echo "  deploy       - Deploy to production (Docker)"
	@echo "  backup       - Backup database"
	@echo "  logs         - View logs (usage: make logs SERVICE=app)"
	@echo "  status       - Check service status"
	@echo "  stop         - Stop all services"
	@echo "  clean        - Remove containers and volumes"

install:
	npm install

dev:
	npm run dev

worker:
	npm run worker

build:
	npm run build

db-migrate:
	npx prisma migrate dev

db-generate:
	npx prisma generate

db-studio:
	npx prisma studio

deploy:
	./scripts/deploy.sh

backup:
	./scripts/backup.sh

logs:
	./scripts/logs.sh $(SERVICE)

status:
	docker compose ps

stop:
	docker compose down

clean:
	docker compose down -v
	docker system prune -f
