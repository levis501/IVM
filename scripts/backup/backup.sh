#!/bin/bash
# =============================================================================
# IVM Backup Script
# Creates encrypted backups of database, documents, and logs
# =============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/data/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
POSTGRES_USER="${POSTGRES_USER:-ivm_user}"
POSTGRES_DB="${POSTGRES_DB:-ivm_db}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="ivm_backup_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

echo "========================================="
echo "IVM Backup - ${TIMESTAMP}"
echo "========================================="

# Create backup directory
mkdir -p "${BACKUP_PATH}"

# 1. Database backup
echo "[1/4] Backing up PostgreSQL database..."
PGPASSWORD="${POSTGRES_PASSWORD:-ivm_password}" pg_dump \
  -h "${POSTGRES_HOST}" \
  -p "${POSTGRES_PORT}" \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  --format=custom \
  --file="${BACKUP_PATH}/database.dump"

DB_SIZE=$(du -sh "${BACKUP_PATH}/database.dump" | cut -f1)
echo "  Database backup: ${DB_SIZE}"

# 2. Documents backup
echo "[2/4] Backing up documents..."
if [ -d "/data/documents" ]; then
  tar -czf "${BACKUP_PATH}/documents.tar.gz" -C /data documents 2>/dev/null || true
  DOC_SIZE=$(du -sh "${BACKUP_PATH}/documents.tar.gz" 2>/dev/null | cut -f1 || echo "0")
  echo "  Documents backup: ${DOC_SIZE}"
else
  echo "  No documents directory found, skipping."
fi

# 3. Logs backup
echo "[3/4] Backing up audit logs..."
if [ -d "/data/logs" ]; then
  tar -czf "${BACKUP_PATH}/logs.tar.gz" -C /data logs 2>/dev/null || true
  LOG_SIZE=$(du -sh "${BACKUP_PATH}/logs.tar.gz" 2>/dev/null | cut -f1 || echo "0")
  echo "  Logs backup: ${LOG_SIZE}"
else
  echo "  No logs directory found, skipping."
fi

# 4. Create combined archive
echo "[4/4] Creating combined backup archive..."
ARCHIVE="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
tar -czf "${ARCHIVE}" -C "${BACKUP_DIR}" "${BACKUP_NAME}"

# Encrypt if key is provided
if [ -n "${ENCRYPTION_KEY}" ]; then
  echo "  Encrypting backup..."
  openssl enc -aes-256-cbc -salt -pbkdf2 \
    -in "${ARCHIVE}" \
    -out "${ARCHIVE}.enc" \
    -pass pass:"${ENCRYPTION_KEY}"
  rm "${ARCHIVE}"
  ARCHIVE="${ARCHIVE}.enc"
  echo "  Backup encrypted."
fi

# Cleanup temporary directory
rm -rf "${BACKUP_PATH}"

# Report
TOTAL_SIZE=$(du -sh "${ARCHIVE}" | cut -f1)
echo ""
echo "========================================="
echo "Backup complete!"
echo "  File: ${ARCHIVE}"
echo "  Size: ${TOTAL_SIZE}"
echo "========================================="

# Cleanup old backups
echo ""
echo "Cleaning up backups older than ${BACKUP_RETENTION_DAYS} days..."
DELETED=$(find "${BACKUP_DIR}" -name "ivm_backup_*" -mtime +${BACKUP_RETENTION_DAYS} -type f -delete -print | wc -l)
echo "  Removed ${DELETED} old backup(s)."

echo ""
echo "Backup process finished."
