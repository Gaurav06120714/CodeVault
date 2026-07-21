#!/usr/bin/env bash
# CodeVault — encrypted Postgres backup.
# Creates a compressed pg_dump, encrypts it (AES-256 via openssl), and prunes
# backups older than RETENTION_DAYS. Schedule via cron (e.g. hourly) to approach
# the DISASTER_RECOVERY.md RPO target (<= 15 min → run every 15 min).
#
# Required env:
#   DATABASE_URL        postgres connection string
#   BACKUP_PASSPHRASE   symmetric key for encryption (store OUTSIDE the DB host)
# Optional env:
#   BACKUP_DIR          default ./backups
#   RETENTION_DAYS      default 7
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE is required}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$BACKUP_DIR/codevault-$STAMP.sql.gz.enc"

echo "[backup] dumping database → $OUT"
pg_dump "$DATABASE_URL" --no-owner --no-privileges \
  | gzip -9 \
  | openssl enc -aes-256-cbc -pbkdf2 -salt -pass env:BACKUP_PASSPHRASE \
  > "$OUT"

echo "[backup] pruning backups older than ${RETENTION_DAYS} days"
find "$BACKUP_DIR" -name 'codevault-*.sql.gz.enc' -type f -mtime "+${RETENTION_DAYS}" -delete

echo "[backup] done: $(du -h "$OUT" | cut -f1) → $OUT"
