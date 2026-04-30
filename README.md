# ShadowSurface Next.js

Full-stack Cloud Attack Surface Intelligence platform built with Next.js 14, PostgreSQL, Redis, and Stripe.

## Features

- **Subdomain Enumeration**: DNS brute-force + Certificate Transparency (crt.sh)
- **Async Port Scanning**: TCP connect scan on top 150 ports
- **Web Asset Analysis**: Security header checks, technology fingerprinting, CVE mapping
- **Cloud Misconfiguration Detection**: AWS S3, GCS, Azure Blob public exposure checks
- **Risk Scoring**: Automatic risk calculation per asset
- **SaaS Ready**: Multi-tenant auth, email verification, Stripe billing, dashboard, monitoring
- **Background Workers**: Redis-backed job queue with retry logic
- **Rate Limiting**: Redis-based IP and user rate limits
- **Production Hardened**: Nginx SSL proxy, security headers, health checks, resource limits

## Architecture

- **App**: Next.js 14 (App Router) + Tailwind CSS
- **API**: Next.js API Routes + Zod validation + Redis rate limiting
- **Auth**: bcrypt + JWT (custom, stateless)
- **DB**: PostgreSQL + Prisma ORM (connection pooling)
- **Queue**: Redis + custom worker (Node.js with retries)
- **Billing**: Stripe Checkout + Webhooks
- **Email**: Resend (falls back to console log in dev)
- **Proxy**: Nginx + Let's Encrypt SSL + security headers
- **Process Management**: PM2 ecosystem config included

## Quick Start (Docker Compose)

```bash
# 1. Copy environment
cp .env.example .env
# Edit .env:
#   JWT_SECRET=$(openssl rand -base64 32)
#   APP_URL=https://yourdomain.com

# 2. Start stack
docker compose up -d

# 3. Check health
curl http://localhost/api/health

# 4. Open https://yourdomain.com
```

Services:
- Nginx: ports 80/443 (reverse proxy + SSL)
- App: port 3000 (internal, via nginx)
- Worker: background scan processor
- Postgres: port 5432 (localhost only)
- Redis: port 6379 (localhost only)

## Production Deployment (VPS)

### 1. Server Setup (Ubuntu 22.04)

```bash
# Update
sudo apt update && sudo apt upgrade -y

# Install Docker (follow official docs)
# https://docs.docker.com/engine/install/ubuntu/

# Install certbot for SSL
sudo apt install certbot python3-certbot-nginx -y

# Clone project
git clone <your-repo> shadowsurface
cd shadowsurface/nextjs

# Set environment
cp .env.example .env
nano .env
```

### 2. SSL Certificate

```bash
# Before running docker, get cert (replace with your domain)
sudo certbot certonly --standalone -d shadowsurface.com -d www.shadowsurface.com

# The certs will be at /etc/letsencrypt/live/shadowsurface.com/
# Nginx container mounts this path automatically
```

### 3. Start Production Stack

```bash
docker compose up -d --build

# View logs
docker compose logs -f app
docker compose logs -f worker

# Check status
docker compose ps
```

### 4. Process Manager Alternative (PM2)

If not using Docker for app/worker:

```bash
npm install -g pm2
npm install
npx prisma migrate deploy
npx prisma generate
npm run build

# Start both app and worker
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string with pool settings |
| REDIS_URL | Yes | Redis connection string |
| JWT_SECRET | Yes | 32+ char secret for JWT signing |
| APP_URL | Yes | Public app URL (https://...) |
| STRIPE_SECRET_KEY | No | Stripe secret key |
| STRIPE_WEBHOOK_SECRET | No | Stripe webhook endpoint secret |
| STRIPE_PRICE_* | No | Stripe Price IDs for each plan |
| RESEND_API_KEY | No | Resend API key for emails |

## Pricing Tiers

- **Starter**: $99/mo — basic scans, 1 user
- **Professional**: $499/mo — advanced scans, 5 users, API access
- **Enterprise**: $1,999/mo — unlimited, custom integrations, SLA

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/register | No | Create account + organization |
| POST | /api/login | No | Authenticate |
| GET | /api/verify | No | Verify email |
| POST | /api/demo | No | Public demo scan (rate limited) |
| POST | /api/scans | Yes | Create scan (rate limited: 10/hr) |
| GET | /api/scans | Yes | List scans |
| GET | /api/scans/:id | Yes | Get scan details |
| GET | /api/dashboard | Yes | Dashboard stats |
| GET | /api/monitoring | Yes | Monitoring data |
| POST | /api/checkout | Yes | Stripe checkout |
| GET | /api/billing | Yes | Billing info |
| POST | /api/webhooks/stripe | No | Stripe webhooks |
| GET | /api/health | No | Health check (DB + Redis) |

## Rate Limits

- **Demo scans**: 3 per IP per 5 minutes
- **Authenticated scans**: 10 per user per hour
- Returns `429` with `X-RateLimit-*` headers when exceeded

## Security Hardening

- SSRF protection on all scan inputs
- Blocked targets: localhost, 127.x, 10.x, 192.168.x, 172.16.x
- bcrypt password hashing (12 rounds)
- JWT with configurable expiration
- Security headers via Nginx: X-Frame-Options, CSP, HSTS, etc.
- Connection pooling on Prisma to prevent DB overload

## Monitoring

```bash
# Check all services
docker compose ps

# Health endpoint
curl https://yourdomain.com/api/health

# View logs
docker compose logs -f --tail 100

# Restart a service
docker compose restart worker
```

## Troubleshooting

### Worker not picking up jobs
```bash
docker compose logs -f worker
# Ensure Redis is healthy: docker compose ps
```

### Database connection errors
```bash
# Check Postgres is running
docker compose ps postgres
# Test connection from app container
docker compose exec app npx prisma db pull
```

### SSL errors
```bash
# Renew certificate
sudo certbot renew
# Restart nginx
docker compose restart nginx
```

## License

Proprietary — ShadowSurface Platform
