#!/usr/bin/env bash
# Daily SQLite backup + scheduled-publish worker (crontab).
# Install:
#   chmod +x deploy/backup-cron.sh deploy/publish-cron.sh
#   crontab -e
#   30 2 * * * cd /var/www/llmreviewpro && node scripts/backup.mjs >> logs/backup.log 2>&1
#   */5 * * * * cd /var/www/llmreviewpro && node scripts/publish-scheduled.mjs >> logs/publish.log 2>&1
set -euo pipefail
APP_DIR="${APP_DIR:-/var/www/llmreviewpro}"
cd "$APP_DIR"
mkdir -p logs backups
node scripts/backup.mjs
