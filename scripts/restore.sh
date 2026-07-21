#!/usr/bin/env bash
# CodeVault — restore an encrypted backup produced by backup.sh.
# Decrypts, decompresses, and restores into TARGET_DATABASE_URL.
# ALWAYS run a restore drill against a scratch database (DISASTER_RECOVERY.md:
# quarterly restore drills + checksum verification).
#
#   TARGET_DATABASE_URL=postgres://... BACKUP_PASSPHRASE=... \
#     ./scripts/restore.sh ./backups/codevault-20260721T030000Z.sql.gz.enc
set -euo pipefail

FILE="${1:?usage: restore.sh <backup-file.sql.gz.enc>}"
: "${TARGET_DATABASE_URL:?TARGET_DATABASE_URL is required}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE is required}"

echo "[restore] restoring $FILE → $TARGET_DATABASE_URL"
openssl enc -d -aes-256-cbc -pbkdf2 -pass env:BACKUP_PASSPHRASE -in "$FILE" \
  | gunzip \
  | psql "$TARGET_DATABASE_URL"

echo "[restore] done. Verify row counts / checksums before cutover."
