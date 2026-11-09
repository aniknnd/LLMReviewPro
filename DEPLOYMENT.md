# Deployment Guide — Ubuntu VPS (Node + PM2 + Nginx)

Self-managed VPS. No serverless, no paid DB. SQLite + WAL on one instance.

## 0. Prerequisites

- Ubuntu 22.04/24.04, 2 GB RAM, 20 GB disk, 2 vCPU (minimum for Next build)
- Node.js 20 LTS, npm 10+
- Domain (A record → VPS IP) and `www.` subdomain
- Firewall: `ufw allow OpenSSH`, `ufw allow 'Nginx Full'`

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
npm i -g pm2
sudo apt install -y nginx certbot python3-certbot-nginx
```

Install Brotli (optional, for `brotli on` in nginx.conf):
```bash
sudo apt install -y libnginx-mod-brotli
```

## 1. Create the app user & directories

```bash
sudo useradd -m -s /bin/bash llmreviewpro
sudo mkdir -p /var/www/llmreviewpro
sudo chown -R llmreviewpro:llmreviewpro /var/www/llmreviewpro
sudo -u llmreviewpro git clone <your-repo> /var/www/llmreviewpro
cd /var/www/llmreviewpro
```

## 2. Environment

```bash
sudo -u llmreviewpro cp .env.example .env
sudo -u llmreviewpro nano .env
```

Required:
- `NEXT_PUBLIC_SITE_URL=https://example.com` (no trailing slash)
- `SESSION_SECRET=$(openssl rand -base64 32)`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` (≥8 chars)
- `NEXT_PUBLIC_ADSENSE_PUB_ID=pub-...` (or leave placeholder until AdSense approval)
- `NEXT_PUBLIC_ADSENSE_VERIFICATION=...` (Search Console token, optional)

## 3. Install, migrate, seed, build

```bash
sudo -u llmreviewpro npm ci
sudo -u llmreviewpro node scripts/migrate.mjs
sudo -u llmreviewpro ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/seed.mjs
sudo -u llmreviewpro node scripts/hydrate-html.mjs
sudo -u llmreviewpro npm run build
```

> `seed.mjs` creates the admin user from env vars. Change the password after first login (or re-run `scripts/setup-admin.mjs`).

Ensure runtime dirs are writable:
```bash
sudo -u llmreviewpro mkdir -p data backups logs public/uploads
sudo -u llmreviewpro chmod 750 data backups logs public/uploads
```

## 4. PM2 (single instance for SQLite)

```bash
sudo -u llmreviewpro npx pm2 start ecosystem.config.js --env production
# Fix cwd if your path differs (ecosystem.config.js uses /var/www/llmreviewpro)
sudo -u llmreviewpro pm2 save
sudo -u llmreviewpro pm2 startup   # follow the printed command (needs sudo)
sudo -u llmreviewpro pm2 logs
```

Verify:
```bash
curl -s http://127.0.0.1:3000/ | head -c 200
```

## 5. Nginx + HTTPS

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/llmreviewpro
# Edit server_name to your domain in that file
sudo ln -s /etc/nginx/sites-available/llmreviewpro /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d example.com -d www.example.com
sudo systemctl enable --now certbot.timer  # auto-renew
```

## 6. Cron — backups & scheduled publishing

```bash
sudo -u llmreviewpro crontab -e
# Add:
# 30 2 * * * cd /var/www/llmreviewpro && node scripts/backup.mjs >> logs/backup.log 2>&1
# */5 * * * * cd /var/www/llmreviewpro && node scripts/publish-scheduled.mjs >> logs/publish.log 2>&1
```

Manual test:
```bash
node scripts/backup.mjs
node scripts/publish-scheduled.mjs
ls -lh backups/ logs/
```

## 7. Verify production

- `https://example.com/` — 200, fast TTFB
- `https://example.com/sitemap.xml` — includes `lastmod`
- `https://example.com/robots.txt` — disallows `/admin`, `/api`, `/search`
- `https://example.com/feed.xml` — RSS 2.0
- `https://example.com/ads.txt` — shows your `pub-...`
- `https://example.com/blog/<slug>/opengraph-image` — PNG 1200×630
- `https://example.com/admin/login` — 200, noindex
- Lighthouse: target 95+ (images use `next/image`, fonts `display:swap`, ads lazy + reserved height)

## 8. Operations

### Update
```bash
cd /var/www/llmreviewpro
git pull
npm ci
node scripts/migrate.mjs
npm run build
pm2 restart llmreviewpro
```

### Rotate admin password
```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='...' SESSION_SECRET='...' \
  node scripts/setup-admin.mjs
pm2 restart llmreviewpro
```

### Restore backup
```bash
pm2 stop llmreviewpro
cp data/blog.db data/blog.db.bak
sqlite3 data/blog.db ".recover" < backups/blog-YYYY-MM-DD.db  # or replace file directly
cp backups/blog-YYYY-MM-DD.db data/blog.db
pm2 start llmreviewpro
```

### Logs
```bash
pm2 logs llmreviewpro
tail -f logs/backup.log logs/publish.log
```

## 9. Hardening checklist

- [ ] `SESSION_SECRET` is long & unique (not committed)
- [ ] `ADMIN_PASSWORD` changed from seed default
- [ ] Nginx `client_max_body_size 12M` + upload route checks 5 MB + MIME
- [ ] UFW + fail2ban (optional)
- [ ] Daily backups tested (restore drill)
- [ ] AdSense: set real `pub-...`, request approval, then `NEXT_PUBLIC_ADS_ENABLED=true`
- [ ] EEA/UK/CH traffic: set `NEXT_PUBLIC_GOOGLE_CMP_URL` to your CMP script
