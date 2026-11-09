#!/usr/bin/env bash
# Scheduled-publish worker (runs every 5 minutes via cron).
# Publishes posts whose scheduled_at <= now and revalidates via API.
set -euo pipefail
APP_DIR="${APP_DIR:-/var/www/llmreviewpro}"
cd "$APP_DIR"
mkdir -p logs
node scripts/publish-scheduled.mjs >> logs/publish.log 2>&1
# Optional: trigger on-demand ISR refresh (requires admin session cookie).
# Instead of storing a session, rely on ISR revalidate window + admin revalidatePath.
# For immediate refresh after cron publish, uncomment and set a secret:
# curl -s -X POST http://127.0.0.1:3000/api/revalidate \
#   -H 'Content-Type: application/json' \
#   -d '{}' -b /var/www/llmreviewpro/.admin-cookie || true
