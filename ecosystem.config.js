/**
 * PM2 ecosystem file — self-managed VPS (Node + PM2 + Nginx).
 * Usage:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 save && pm2 startup
 *
 * Single instance is intentional for SQLite (WAL). Do NOT run
 * cluster mode with multiple instances sharing one .db file.
 */
module.exports = {
  apps: [
    {
      name: "llmreviewpro",
      cwd: "/var/www/llmreviewpro",
      script: "node_modules/.bin/next",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "127.0.0.1",
      },
      // SQLite + ISR: single instance only.
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "600M",
      restart_delay: 3000,
      max_restarts: 10,
      log_date_format: "YYYY-MM-DDTHH:mm:ssZ",
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      merge_logs: true,
      kill_timeout: 5000,
      listen_timeout: 10000,
      // Graceful shutdown so ISR cache flushes.
      shutdown_with_message: true,
      // Backups via cron (see deploy/backup-cron.sh).
      autorestart: true,
      watch: false, // never watch in production
    },
  ],
};
