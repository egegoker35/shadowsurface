#!/usr/bin/env bash
set -e

echo "🚀 ShadowSurface Production Deploy"
echo "==================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Copy .env.example and fill in your values first:"
    echo "  cp .env.example .env"
    exit 1
fi

# Check JWT_SECRET length
JWT_SECRET=$(grep JWT_SECRET .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
if [ ${#JWT_SECRET} -lt 32 ]; then
    echo -e "${RED}❌ JWT_SECRET must be at least 32 characters!${NC}"
    echo "Generate one with: openssl rand -base64 32"
    exit 1
fi

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    exit 1
fi

# Pull latest code if this is a git repo
if [ -d .git ]; then
    echo -e "${YELLOW}📥 Pulling latest code...${NC}"
    git pull origin main || true
fi

# Backup database before migration
echo -e "${YELLOW}💾 Backing up database...${NC}"
mkdir -p backups
docker compose exec -T postgres pg_dump -U shadowuser shadowdb > "backups/backup_$(date +%Y%m%d_%H%M%S).sql" 2>/dev/null || echo "⚠️  Could not backup (DB may not be running yet)"

# Build and start
echo -e "${YELLOW}🔨 Building containers...${NC}"
docker compose -f docker-compose.yml pull
docker compose -f docker-compose.yml build --no-cache

echo -e "${YELLOW}🚀 Starting services...${NC}"
docker compose -f docker-compose.yml up -d

# Wait for health
echo -e "${YELLOW}⏳ Waiting for services...${NC}"
sleep 5

# Check health
if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ App is healthy!${NC}"
else
    echo -e "${RED}⚠️  App health check failed. Check logs:${NC}"
    echo "  docker compose logs -f app"
fi

# Check worker
if docker compose ps | grep -q "worker.*Up"; then
    echo -e "${GREEN}✅ Worker is running!${NC}"
else
    echo -e "${RED}⚠️  Worker is not running!${NC}"
    echo "  docker compose logs -f worker"
fi

echo ""
echo -e "${GREEN}🎉 Deploy complete!${NC}"
echo "  App:    https://yourdomain.com"
echo "  Health: http://localhost:3000/api/health"
echo "  Logs:   docker compose logs -f"
