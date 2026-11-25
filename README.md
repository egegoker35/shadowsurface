# ShadowSurface

Cloud attack surface management. ShadowSurface discovers an organization's internet-facing
assets, checks them for exposed services and known weaknesses, maps observed software
versions to CVE records, and consolidates the results into a single risk report.

Production: <https://shadowsurface.app> (DigitalOcean App Platform, app `44f41a72-5f62-473b-bed9-bd162a6e1cb0`).

## Capabilities

- **Subdomain discovery** — DNS brute force over a 2,200-entry wordlist plus Certificate
  Transparency logs. Every name is parsed and matched on a label boundary, so lookalike
  domains and email addresses from CT feeds are rejected.
- **Port scanning** — 407 common TCP ports, capped per plan. Banner, service and TLS
  metadata are collected from open ports.
- **Web analysis** — security headers, cookie flags, TLS certificate and protocol grading,
  WAF fingerprinting, technology and version detection, path probes for admin panels and
  exposed configuration/backup files, and bounded injection checks (SQLi, XSS, open
  redirect, LFI) that only report on a demonstrated behavioral difference.
- **CVE mapping** — observed product and version matched against 450+ CVE records that were
  individually checked against their MITRE entries. Components without a detected version
  produce no CVE findings.
- **Cloud storage exposure** — S3, GCS and Azure Blob access checks that confirm a bucket
  actually returns object listings before reporting exposure.
- **DNS hygiene** — SPF, DMARC, DKIM, DNSSEC, CAA, zone-transfer attempts and subdomain
  takeover fingerprints.
- **Findings** — severity, evidence, remediation and a per-asset risk score, consolidated so
  a repeated issue is reported once per asset rather than once per port.
- **Operations** — scheduled scans (in-process scheduler with atomic job claiming), HMAC-SHA256
  signed webhooks for `scan.completed` / `scan.failed`, organization API keys, team invites with
  seat limits, monitoring and per-plan quotas.
- **Admin console** — `/admin-login` → `/admin`. Real counts from aggregate queries, paginated
  search across users/scans/leads/payments, plan assignment with billing periods, temporary
  password issuance, scan detail with assets and findings, read-only payment records linked to
  TronScan, and revenue by month and plan.

## Stack

- Next.js 14 (App Router) + Tailwind CSS
- PostgreSQL + Prisma (`connection_limit` set per instance to protect the database's slots)
- Redis for rate limiting and the scan queue
- DigitalOcean App Platform: two 1-vCPU instances behind the platform load balancer, deployed
  from `main` on push
- Resend for transactional email

Scheduled scans run inside the app process (`instrumentation.ts` → `lib/scheduler.ts`); no
separate worker dyno is required. The queue in Redis remains for scan job bookkeeping.

## Local development

```bash
npm install
cp .env.example .env
npx prisma generate
npm run dev
```

Quality gates:

```bash
npm test          # unit tests (plan windows, hostname scoping)
npx tsc --noEmit  # type check
npm run build     # production build
```

Schema changes are applied with `npx prisma db push` against the target database before
deploying; the build itself only regenerates the client.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL URL. Append `connection_limit=3&pool_timeout=20` (3 per instance, two instances) |
| `REDIS_URL` | Yes | Redis URL for rate limits and queue |
| `JWT_SECRET` | Yes | 32+ character signing secret |
| `APP_URL` | Yes | Public URL, used in emails and links |
| `ADMIN_EMAIL` | Admin | Console login email (`/admin-login`) |
| `ADMIN_PASSWORD` | Admin | Console login password |
| `RESEND_API_KEY` | Optional | Transactional email |
| `EMAIL_FROM` | Optional | Sender address. Must belong to a domain verified in Resend |
| `NEXT_PUBLIC_USDT_TRC20_ADDRESS` | Optional | USDT (TRC20) wallet for plan payments. Validated as Base58Check; checkout is paused when invalid |

## Billing

Plans are sold per month and paid in USDT (TRC20). The recipient wallet is a single
constant (`lib/usdtAddress.ts`, overridable with `NEXT_PUBLIC_USDT_TRC20_ADDRESS`) and is
checked as a Base58Check Tron address before any money is accepted. `POST /api/payments/verify` reads the
transfer from TronScan (`trc20TransferInfo`), checks recipient, amount, token contract and
that the transaction has not been used before, then activates the plan for one 30-day
period. Renewing an active plan extends the current end date. An organization whose paid
period has lapsed keeps its data and falls back to the free tier.

There is no card processor integration.

## Email

Password reset and account emails are sent through Resend. **Customer delivery requires a
verified sending domain in the Resend account**; with the shared `onboarding@resend.dev`
sender, only the account owner receives mail. Until a domain is verified, an administrator
can issue a one-time temporary password from the admin console, which is the supported
recovery path.

## API

All authenticated routes accept `Authorization: Bearer <jwt>`; organization API keys are
accepted as `Authorization: Bearer ss_...` or `X-API-Key` on scan endpoints.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/register` | No | Create account + organization |
| POST | `/api/login` | No | Authenticate |
| POST | `/api/forgot-password` | No | Request a reset link (rate limited) |
| POST | `/api/reset-password` | No | Complete a reset with a token |
| POST | `/api/demo` | No | Public demo scan (rate limited) |
| POST | `/api/scans` | Yes | Create a scan (plan quota) |
| GET | `/api/scans` | Yes | List scans |
| GET | `/api/scans/:id` | Yes | Scan detail |
| GET | `/api/dashboard` | Yes | Dashboard data + effective plan |
| GET | `/api/monitoring` | Yes | Monitored assets |
| GET/POST/DELETE | `/api/scheduled-scans` | Yes | Manage recurring scans |
| GET/POST | `/api/invites` | Yes | Team invites (seat limit per plan) |
| POST | `/api/invites/accept` | No | Accept an invite |
| GET/POST/DELETE | `/api/api-keys` | Yes | Organization API keys |
| POST | `/api/payments/verify` | Yes | Verify a USDT transfer and activate a plan |
| GET | `/api/health` | No | Database, Redis and queue health |
| POST | `/api/admin-login` | No | Admin console token (rate limited) |
| GET | `/api/admin?section=...` | Admin | Console data: overview, users, scans, scan, leads, payments, revenue |
| POST | `/api/admin/upgrade` | Admin | Set plan and billing period |
| POST | `/api/admin/reset-password` | Admin | Issue a temporary password |
| POST | `/api/admin/approve` | Admin | Activate a lead's plan |
| DELETE | `/api/admin/delete-user`, `/api/admin/delete-scan`, `/api/admin/delete-lead` | Admin | Remove records |

## Security notes

- Scan targets are sanitized and SSRF-protected; loopback, private ranges and link-local
  addresses are blocked.
- Passwords are bcrypt-hashed; sessions are stateless JWTs.
- Admin routes use a separate JWT signed with the same secret but carry no user row, so any
  handler that looked up a `User` record rejected every admin call. Admin endpoints now use
  `lib/adminAuth` exclusively.
- Rate limits are enforced per IP and per plan on registration, login, password reset, demo
  scans and scan creation.
- Plan checks use the effective plan, so an expired billing period cannot keep paid quotas.

## License

Proprietary — ShadowSurface Platform
