# ShadowSurface Production Deploy Guide

## Step 1: Buy VPS + Domain

| Service | Provider | Cost |
|---------|----------|------|
| VPS | Hetzner CX21 | $5.35/mo |
| Domain | Cloudflare | ~$10/yr |

## Step 2: Server Setup

```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker (follow official docs)
# https://docs.docker.com/engine/install/ubuntu/

# Install certbot
sudo apt install certbot -y

# Create app user
sudo useradd -m -s /bin/bash shadowsurface
sudo usermod -aG docker shadowsurface
```

## Step 3: SSL Certificate

```bash
# Get certificate BEFORE running docker
sudo certbot certonly --standalone -d shadowsurface.com -d www.shadowsurface.com

# Auto-renew
sudo systemctl enable certbot.timer
```

## Step 4: Deploy App

```bash
# Switch to app user
sudo su - shadowsurface

# Clone repo
git clone https://github.com/YOURUSER/shadowsurface.git
cd shadowsurface/nextjs

# Set environment
cp .env.example .env
nano .env

# IMPORTANT: Set these:
# JWT_SECRET=$(openssl rand -base64 32)
# POSTGRES_PASSWORD=$(openssl rand -base64 16)
# APP_URL=https://shadowsurface.com

# ONE COMMAND DEPLOY
make deploy
```

That's it. The app is running.

## Step 5: Verify

```bash
# Check all services
make status

# Check health
curl https://shadowsurface.com/api/health

# View logs
make logs SERVICE=app
make logs SERVICE=worker

# Backup database
make backup
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `make deploy` | Full production deploy |
| `make backup` | Database backup |
| `make status` | Check running services |
| `make stop` | Stop all services |
| `make logs` | View app logs |
| `make logs SERVICE=worker` | View worker logs |
| `make clean` | Remove everything (danger!) |

## Troubleshooting

### Worker not processing scans
```bash
docker compose logs -f worker
# Check Redis:
docker compose exec redis redis-cli llen scan:queue
```

### Database locked / migration failed
```bash
# Reset migrations (careful - production!)
docker compose exec app npx prisma migrate reset --force
```

### Out of memory
```bash
# Check memory
docker stats
# Increase swap:
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
```

### SSL expired
```bash
sudo certbot renew
docker compose restart nginx
```
